import json
import os 
import shutil 
from uuid import uuid4
from google.cloud import vision
from decouple import config
import traceback
from typing import Optional 
from uuid import UUID

from fastapi import FastAPI, Depends, HTTPException, Form, File, UploadFile, Header, Request, Body,Query
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from sqlalchemy.orm import Session
from langchain.docstore.document import Document as ChromaDocument

from db.session import SessionLocal
from db.models import Document, User
from db.schemas import ValidatedInfo
from utils.security import verify_password, hash_password, create_refresh_token, create_access_token, verify_token
from services.calendar.google_calendar import create_event

from core.config import settings
from services.chatgpt.llm import chatgpt
from services.ocr import ocr 
from services.chroma_db.db import get_chroma_db, get_chroma_db_json, text_splitter
from utils.date_fmt import convert_date_format

import logging
from pathlib import Path
import os 

logger = logging.getLogger(__name__) 

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins = ["*"],
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"]
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

TEMP_STORAGE = settings.TEMP_STORAGE
BASE_DIR = Path(__file__).parent
image_dir = os.path.join(BASE_DIR, "storage")
app.mount("/storage", StaticFiles(directory=image_dir), name="storage")

limiter = Limiter(key_func = get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Dependency 
def get_db():
    db = SessionLocal()
    try: 
        yield db 
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db : Session = Depends(get_db)):
    payload = verify_token(token)
    user = db.query(User).filter(User.username == payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=401, detail = "Invalid token")
    return user

from api.v1.endpoints.auth import router as auth_router
from api.v1.endpoints.documents import router as documents_router

app.include_router(auth_router)
app.include_router(documents_router)
