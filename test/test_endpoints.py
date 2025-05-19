import os
import types
import pytest
from fastapi.testclient import TestClient

# Fixtures to prepare environment and client
@pytest.fixture(scope="session")
def client(tmp_path_factory, monkeypatch):
    # stub missing modules if not installed
    import sys
    if 'google' not in sys.modules:
        google = types.ModuleType('google')
        cloud = types.ModuleType('google.cloud')
        vision = types.ModuleType('google.cloud.vision')
        class DummyClient:
            @classmethod
            def from_service_account_file(cls, *args, **kwargs):
                return cls()
            def text_detection(self, image):
                class Resp: text_annotations = []
                return Resp()
        vision.ImageAnnotatorClient = DummyClient
        vision.Image = lambda *a, **kw: None
        cloud.vision = vision
        google.cloud = cloud
        sys.modules['google'] = google
        sys.modules['google.cloud'] = cloud
        sys.modules['google.cloud.vision'] = vision
    if 'slowapi' not in sys.modules:
        slowapi = types.ModuleType('slowapi')
        util = types.ModuleType('slowapi.util')
        errors = types.ModuleType('slowapi.errors')
        class Limiter:
            def __init__(self, *a, **kw):
                pass
            def limit(self, *a, **kw):
                def deco(f):
                    return f
                return deco
        slowapi.Limiter = Limiter
        slowapi._rate_limit_exceeded_handler = lambda *a, **k: None
        util.get_remote_address = lambda r: "test"
        errors.RateLimitExceeded = Exception
        sys.modules['slowapi'] = slowapi
        sys.modules['slowapi.util'] = util
        sys.modules['slowapi.errors'] = errors
    # simple decouple.config replacement
    decouple = types.ModuleType('decouple')
    decouple.config = lambda k, default=None: os.environ.get(k, default)
    sys.modules['decouple'] = decouple

    # environment variables for the application
    db_path = tmp_path_factory.mktemp('data') / 'test.db'
    os.environ['DATABASE_URL'] = f'sqlite:///{db_path}'
    os.environ['SECRET_KEY'] = 'secret'
    os.environ['ADMIN'] = 'admin'
    os.environ['OPENAI_API_KEY'] = 'dummy'

    # import application
    from app.main import app
    # patch chatgpt and chromadb services
    from app.services.chatgpt import llm
    monkeypatch.setattr(llm.chatgpt, 'call_gpt', lambda text: {
        'doctype': 'invoice',
        'date': '2023-01-01',
        'expediteur': 'company',
        'recapitulatif': 'info',
        'google_calendar': '2023-01-01'
    })
    from app.services.calendar import google_calendar
    monkeypatch.setattr(google_calendar, 'create_event', lambda info: None)
    from app.services.chroma_db import db as chromadb
    class DummyDB:
        def add_documents(self, docs, ids):
            pass
    monkeypatch.setattr(chromadb, 'get_chroma_db', lambda: DummyDB())
    monkeypatch.setattr(chromadb, 'get_chroma_db_json', lambda: DummyDB())

    return TestClient(app)

def test_register_and_login(client):
    data = {'username': 'user', 'email': 'u@example.com', 'password': 'pass'}
    r = client.post('/register', data=data)
    assert r.status_code == 200
    tokens = r.json()
    assert 'access_token' in tokens
    r2 = client.post('/login', data={'username': 'user', 'password': 'pass'})
    assert r2.status_code == 200
    assert 'access_token' in r2.json()

def test_upload_and_validate(client):
    # register first user
    r = client.post('/register', data={'username':'u2','email':'u2@example.com','password':'pass'})
    token = r.json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}
    files = {'file': ('doc.txt', 'hello world', 'text/plain')}
    up = client.post('/upload', headers=headers, files=files)
    assert up.status_code == 200
    doc_id = up.json()['doc_id']
    payload = {'doc_id': doc_id, 'extracted_info': up.json()['extracted_info']}
    val = client.post('/validate', json=payload)
    assert val.status_code == 200


def test_upload_invalid_token(client):
    files = {'file': ('doc.txt', 'content', 'text/plain')}
    r = client.post('/upload', headers={'Authorization': 'Bearer bad'}, files=files)
    assert r.status_code == 401


def test_validate_bad_payload(client):
    # missing fields
    r = client.post('/validate', json={'doc_id': 'bad'})
    assert r.status_code == 422
