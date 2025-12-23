from .singleton import SingletonMeta
from chromadb.config import Settings as ChromaSettings
import chromadb 
from base64 import b64encode
from core.config import settings

from langchain.vectorstores import Chroma 
from langchain.text_splitter import CharacterTextSplitter
from langchain.embeddings.openai import OpenAIEmbeddings


class ChromaDBService(metaclass = SingletonMeta):
    def __init__(self, name):
        credentials = b64encode(f'admin:{settings.ADMIN}'.encode("utf-8")).decode("utf-8")
        headers = {
            "Authorization" : f"Basic {credentials}"
        }
        self.name = name
        self.client = chromadb.HttpClient(settings = ChromaSettings(allow_reset = True), 
                                          host = "server", port = 8000, headers=headers)
        
        self.chroma_db = Chroma(client = self.client, embedding_function=OpenAIEmbeddings(),
                                collection_name = self.name)
        
class DummyChromaDB:
    def add_documents(self, docs, ids=None):
        return None

    def similarity_search(self, query):
        return []

    def delete(self, ids):
        return None

chroma_db_service = None
chroma_db_service_json = None

def get_chroma_db():
    if settings.MAYA_DEV_MODE:
        return DummyChromaDB()
    global chroma_db_service
    if chroma_db_service is None:
        chroma_db_service = ChromaDBService("smart_maya")
    return chroma_db_service.chroma_db
def get_chroma_db_json():
    if settings.MAYA_DEV_MODE:
        return DummyChromaDB()
    global chroma_db_service_json
    if chroma_db_service_json is None:
        chroma_db_service_json = ChromaDBService("smart_maya_json")
    return chroma_db_service_json.chroma_db

text_splitter = CharacterTextSplitter(chunk_size = 1000, chunk_overlap = 100)
