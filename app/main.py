import json
import os 
import shutil 
import re
from uuid import uuid4
import traceback
from typing import Optional 
from uuid import UUID
from datetime import datetime, timedelta

from fastapi import FastAPI, Depends, HTTPException, Form, File, UploadFile, Header, Request, Body, Query
from fastapi.responses import StreamingResponse
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
from db.schemas import (
    ChatRequest,
    ChatResponse,
    GoogleAuthRequest,
    RefreshTokenRequest,
    TokenResponse,
    UserPublic,
    ValidatedInfo,
)
from db.migrations import run_migrations
from services.auth.google_signin import verify_google_id_token
from utils.security import (
    hash_refresh_token,
    verify_password,
    hash_password,
    create_refresh_token,
    create_access_token,
    verify_token,
)
from services.calendar.google_calendar import create_event

from core.config import settings
from services.chat.chat_service import get_chat_service
from services.document_ai.analyzer import get_document_analyzer
from services.chroma_db.db import get_chroma_db, get_chroma_db_json, text_splitter
from services.llm.base import LLMError
from utils.date_fmt import convert_date_format
from utils.pdf_text import extract_pdf_text

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
DEV_MODE = settings.MAYA_DEV_MODE
BASE_DIR = Path(__file__).parent
image_dir = os.path.join(BASE_DIR, "storage")
app.mount("/storage", StaticFiles(directory=image_dir), name="storage")

limiter = Limiter(key_func = get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.on_event("startup")
def on_startup():
    run_migrations()

# Dependency 
def get_db():
    db = SessionLocal()
    try: 
        yield db 
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db : Session = Depends(get_db)):
    payload = verify_token(token)
    try:
        user_id = UUID(payload["sub"])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail = "Invalid token")
    return user


def generate_unique_username(email: str, db: Session) -> str:
    base = email.split("@", 1)[0].strip().lower()
    base = re.sub(r"[^a-z0-9._-]", "", base)[:24] or "user"

    candidate = base
    suffix = 0
    while db.query(User).filter(User.username == candidate).first():
        suffix += 1
        candidate = f"{base}{suffix}"
    return candidate


def issue_tokens_for_user(user: User, db: Session) -> TokenResponse:
    refresh_token = create_refresh_token()
    user.refresh_token = hash_refresh_token(refresh_token)
    user.refresh_token_expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    access_token = create_access_token(str(user.id))
    db.commit()
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)

@app.post("/register", response_model=TokenResponse)
def register_user(
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db),
):
    username = username.strip()
    email = email.strip().lower()

    user = db.query(User).filter(User.username == username).first()
    if user: 
        raise HTTPException(status_code = 400, detail = "User is already registered")
    
    user = db.query(User).filter(User.email == email).first()
    if user:
        raise HTTPException(status_code = 400, detail = "Email is already registered")
    

    hashed_password = hash_password(password)
    new_user = User(username=username, email=email, hashed_password=hashed_password)
    db.add(new_user)
    db.flush()
    return issue_tokens_for_user(new_user, db)

@app.post("/login", response_model=TokenResponse)
def login(username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    identifier = username.strip()
    user = (
        db.query(User)
        .filter((User.username == identifier) | (User.email == identifier.lower()))
        .first()
    )
    if not user: 
        raise HTTPException(status_code = 400, detail="Invalid username or password")
    
    if not user.hashed_password:
        raise HTTPException(status_code=400, detail="This account uses Google Sign-In")

    if not verify_password(password, user.hashed_password):
        raise HTTPException(status_code = 400, detail = "Invalid username or password")
    
    return issue_tokens_for_user(user, db)

@app.post("/auth/refresh", response_model=TokenResponse)
def refresh_tokens(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    refresh_token = payload.refresh_token
    token_hash = hash_refresh_token(refresh_token)

    user = db.query(User).filter(User.refresh_token == token_hash).first()
    # Backward-compat: allow legacy plaintext refresh tokens (upgrades on use).
    if not user:
        user = db.query(User).filter(User.refresh_token == refresh_token).first()
        if user:
            user.refresh_token = token_hash

    if not user:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    if user.refresh_token_expires_at and user.refresh_token_expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Refresh token expired")

    return issue_tokens_for_user(user, db)


@app.post("/token/refresh", response_model=TokenResponse, include_in_schema=False)
def refresh_tokens_legacy(refresh_token: str, db: Session = Depends(get_db)):
    return refresh_tokens(RefreshTokenRequest(refresh_token=refresh_token), db)


@app.post("/auth/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    user.refresh_token = None
    user.refresh_token_expires_at = None
    db.commit()
    return {"detail": "Logged out"}


@app.post("/auth/google", response_model=TokenResponse)
def google_auth(payload: GoogleAuthRequest, db: Session = Depends(get_db)):
    claims = verify_google_id_token(payload.id_token)

    google_sub = claims.get("sub")
    email = (claims.get("email") or "").strip().lower()
    full_name = claims.get("name")
    avatar_url = claims.get("picture")

    if not google_sub or not email:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    user = db.query(User).filter(User.google_sub == google_sub).first()
    if not user:
        # Link by email (common & optimal UX). Safe because we enforce email_verified above.
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.google_sub = google_sub
            user.full_name = user.full_name or full_name
            user.avatar_url = user.avatar_url or avatar_url
        else:
            username = generate_unique_username(email, db)
            user = User(
                username=username,
                email=email,
                hashed_password=None,
                google_sub=google_sub,
                full_name=full_name,
                avatar_url=avatar_url,
            )
            db.add(user)
            db.flush()

    return issue_tokens_for_user(user, db)

@app.get("/users/me", response_model=UserPublic)
def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "avatar_url": current_user.avatar_url,
        "created_at": current_user.created_at,
    }


@app.post("/chat", response_model=ChatResponse)
@limiter.limit("30/minute")
def chat(request: Request, payload: ChatRequest, current_user: User = Depends(get_current_user)):
    if DEV_MODE:
        return {"message": {"role": "assistant", "content": "DEV mode: chat disabled"}}
    try:
        message = get_chat_service().complete([m.dict() for m in payload.messages])
        return {"message": message}
    except LLMError:
        logger.error("Chat LLM request failed")
        raise HTTPException(status_code=502, detail="Chat LLM request failed")


@app.post("/chat/stream")
@limiter.limit("30/minute")
def chat_stream(request: Request, payload: ChatRequest, current_user: User = Depends(get_current_user)):
    if DEV_MODE:
        def _dev_stream():
            yield b"data: DEV mode: chat disabled\n\n"
            yield b"data: [DONE]\n\n"

        return StreamingResponse(_dev_stream(), media_type="text/event-stream")
    try:
        stream = get_chat_service().stream([m.dict() for m in payload.messages])
        return StreamingResponse(stream, media_type="text/event-stream")
    except LLMError:
        logger.error("Chat LLM streaming request failed")
        raise HTTPException(status_code=502, detail="Chat LLM streaming request failed")

@app.post("/upload")
@limiter.limit("5/minute")
def upload_document(request: Request, 
                    file: UploadFile = File(...), 
                    db: Session = Depends(get_db),
                    current_user = Depends(get_current_user)):
    try: 
        content_type = (file.content_type or "").lower()
        filename = (file.filename or "").strip()
        suffix = Path(filename).suffix.lower()

        is_pdf = content_type == "application/pdf" or suffix == ".pdf"
        is_image = content_type.startswith("image/") or suffix in {".jpg", ".jpeg", ".png", ".webp"}

        # Generate a unique ID for the document
        doc_id = uuid4()
        logger.info(f"UPLOAD content_type={content_type} filename={filename}")

        file_path = None
        raw_text = ""

        # Determine if we received an image, PDF, or text
        if is_image:
            supported_exts = {".jpg", ".jpeg", ".png", ".webp"}
            ext = suffix if suffix in supported_exts else ""
            if not ext:
                if content_type in {"image/jpeg", "image/jpg"}:
                    ext = ".jpg"
                elif content_type == "image/png":
                    ext = ".png"
                elif content_type == "image/webp":
                    ext = ".webp"

            if ext not in supported_exts:
                raise ValueError("Unsupported image type. Please upload a JPG, PNG, or WebP.")

            if ext == ".jpeg":
                ext = ".jpg"
            file_path = f"storage/{TEMP_STORAGE}/{doc_id}{ext}"
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, "wb") as out:
                shutil.copyfileobj(file.file, out)
        elif is_pdf:
            file_path = f"storage/{TEMP_STORAGE}/{doc_id}.pdf"
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            pdf_bytes = file.file.read()
            with open(file_path, "wb") as out:
                out.write(pdf_bytes)

            if not DEV_MODE:
                raw_text = extract_pdf_text(pdf_bytes)
                if not raw_text:
                    raise ValueError(
                        "PDF contains no extractable text. Try an OCR'd PDF or scan an image instead."
                    )
        else:
            raw_text = file.file.read().decode(errors="ignore")
        file.file.close()

        if DEV_MODE:
            today = datetime.utcnow().strftime("%d/%m/%Y")
            extracted_info = {
                "doctype": "document",
                "date": today,
                "expediteur": "dev",
                "recapitulatif": "dev mode upload",
                "google_calendar": None,
            }
            raw_text_for_chroma = ""
        else:
            analyzer = get_document_analyzer()
            if is_image and file_path:
                analysis = analyzer.analyze_image_paths([file_path])
            else:
                analysis = analyzer.analyze_text(raw_text)

            extracted_info = {
                "doctype": (analysis.get("doctype") or "document"),
                "date": (analysis.get("date") or datetime.utcnow().strftime("%d/%m/%Y")),
                "expediteur": (analysis.get("expediteur") or "unknown"),
                "recapitulatif": (analysis.get("recapitulatif") or ""),
                "google_calendar": analysis.get("google_calendar"),
            }
            raw_text_for_chroma = analysis.get("raw_text") or ""
        logger.info(extracted_info)
        # Store the extracted information in the database
        try:
            stored_date = convert_date_format(extracted_info["date"])
        except Exception:
            stored_date = convert_date_format(datetime.utcnow().strftime("%d/%m/%Y"))
        new_document = Document(
            id = doc_id,
            file_path = file_path, 
            doctype = extracted_info["doctype"].lower().strip(),
            date = stored_date,
            expediteur = extracted_info["expediteur"].lower().strip(),
            recapitulatif=extracted_info['recapitulatif'].lower().strip(),
            google_calendar = extracted_info['google_calendar'],
            user_id = current_user.id
        )
        db.add(new_document)
        db.commit()
        
        doc_id = str(doc_id)
        if not DEV_MODE:
            if raw_text_for_chroma:
                try:
                    chroma_db = get_chroma_db()
                    # From text to Chroma.Document object
                    raw_docs = [ChromaDocument(page_content=raw_text_for_chroma, metadata={"type": "raw_text", "id": doc_id})]

                    # Split document into chunks
                    docs = text_splitter.split_documents(raw_docs)

                    # Get unique Id per chunk
                    ids = [f"{doc_id}-{i}" for i in range(len(docs))]
                    logger.info(f'IDS {ids} doc_id {doc_id}')
                    # Add to the chroma vdb with its corresponding ids
                    chroma_db.add_documents(docs, ids = ids)

                    logger.info("DOCUMENT ADDED TO CHROMA")
                except Exception:
                    logger.error("Chroma ingestion failed (skipping)")
                    logger.error(traceback.format_exc())
        return {
            "doc_id" : doc_id,
            "extracted_info" : extracted_info
        }
    
    except ValueError as ve:
        logger.error(f'Value error: {ve}')
        db.rollback()
        raise HTTPException(status_code = 400, detail = str(ve))
    except LLMError:
        logger.error("Document AI request failed")
        db.rollback()
        raise HTTPException(status_code=502, detail="Document AI request failed")
    except IOError as ioe:
        logger.error(f"I/O error {ioe}")
        db.rollback()
        raise HTTPException(status_code = 500, detail = "File processing error")
    except Exception as e :
        logger.error(f"Unexpected error: {e}")
        db.rollback()
        raise HTTPException(status_code = 500, detail = "An unexpected error occurred")
    finally:
        db.close()

@limiter.limit("5/minute")
@app.post("/validate")
def validate(request: Request, 
             validated_info: ValidatedInfo,
             current_user: User = Depends(get_current_user),
             db: Session = Depends(get_db)):
    try:
        # Read the validated for receiving the validated information
        doc_id = validated_info.doc_id
        info = validated_info.extracted_info

        document_to_update = db.query(Document).filter_by(id = doc_id).first()

        if not document_to_update:
            raise HTTPException(status_code = 400, detail = f"Document with id {doc_id} not found!")
        if document_to_update.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Forbidden")

        # Update the attributes of the record with validated info
        document_to_update.doctype = info["doctype"].lower().strip()
        document_to_update.date = convert_date_format(info["date"])
        document_to_update.expediteur = info["expediteur"].lower().strip()
        document_to_update.recapitulatif = info['recapitulatif'].lower().strip()
        document_to_update.google_calendar = info['google_calendar']
        user_id = document_to_update.user_id
        logger.info(f"document_to_update.file_path {document_to_update.file_path}")
        if document_to_update.file_path:
            directory = f"storage/{user_id}/{info['doctype']}/{info['expediteur'].replace('/','-')}/"
            if not os.path.exists(directory):
                os.makedirs(directory)
            ext = os.path.splitext(document_to_update.file_path)[1].lower() or ".jpg"
            final_file_path = f'{directory}{info["date"].replace("/","-")}{ext}'
            shutil.move(document_to_update.file_path, final_file_path)
            document_to_update.file_path = final_file_path
        # Commit the changes
        db.commit()

        if not DEV_MODE:
            try:
                chroma_db = get_chroma_db_json()
                # Convert validated info to semantic format and store in Chroma DB (if needed)
                # validated_info_semantic = chatgpt.json2semantic(info)
                # From text to document
                json_docs = [ChromaDocument(page_content = json.dumps(info), metadata = {"type":"chatgpt", "id": doc_id})]

                # Split document into chunks
                docs = text_splitter.split_documents(json_docs)

                # Get unique Id per chunk
                ids = [f'{doc_id}-{i}' for i in range(len(docs))]

                # Add to the chroma vdb with its corresponding ids 
                chroma_db.add_documents(docs, ids = ids) 
            except Exception:
                logger.error("Chroma ingestion failed (skipping)")
                logger.error(traceback.format_exc())
            # Create a Google Calendar event only when a deadline exists.
            if info.get("google_calendar"):
                try:
                    create_event(info)
                except Exception:
                    logger.error("Google Calendar event creation failed")
                    logger.error(traceback.format_exc())

        return {"doc_id": doc_id,
                "validated_info": info}
    except ValueError as ve:
        db.rollback()
        raise HTTPException(status_code=400, detail = str(ve))
    except IOError as ioe:
        logger.error(f"I/O error {ioe}")
        db.rollback()
        raise HTTPException(status_code=500, detail = "File processing error")
    except Exception as e:
        logger.error(f'Unexpected error {e}')
        logger.error(traceback.format_exc())
        db.rollback()
        raise HTTPException(status_code = 500, detail = "An unexpected error occured")
    finally:
        db.close()

@limiter.limit("30/minute")
@app.get("/user/documents_filter")
def get_user_documents_filter(request: Request,
                       current_user = Depends(get_current_user), 
                       doctype: Optional[str] = None,
                       date: Optional[str] = None,
                       expediteur: Optional[str] = None,
                       db = Depends(get_db)):
    
    # Fetch the user from the database using the provided User object's ID
    doc_query = db.query(Document).filter(Document.user_id == current_user.id)

    if not doc_query:
        raise HTTPException(status_code = 404, detail = "Document not found")
    try: 
        if doctype:
            doc_query = doc_query.filter(Document.doctype == doctype)
        if date:
            doc_query = doc_query.filter(Document.date == date)
        if expediteur:
            doc_query = doc_query.filter(Document.expediteur == expediteur)
        
        documents = doc_query.all()
        # Convert the documents to a suitable format for returning as a response
        # This is a list of dictionaries, for example
        response = [{"id": doc.id, "file_path": doc.file_path, "doctype": doc.doctype, "date": doc.date, "expediteur": doc.expediteur, "recapitulatif": doc.recapitulatif, "google_calendar":doc.recapitulatif} for doc in documents]

        return response
    
    except ValueError as ve:
        raise HTTPException(status_code=400, detail = str(ve))
    except Exception:
        logger.error(traceback.format_exc())
        raise HTTPException(status_code = 500, detail = "An unexpected error occured")

@app.get("/user/documents")
async def get_user_documents(
        request: Request,
        current_user: User = Depends(get_current_user),
        path: Optional[str] = Query(None, alias="path"),
        db: Session = Depends(get_db)):

    # Split the provided path into its components
    path_components = path.split('/') if path else []
    # Query based on the number of path components
    doc_query = db.query(Document).filter(Document.user_id == current_user.id)
    if len(path_components) > 0:
        doc_query = doc_query.filter(Document.doctype == path_components[0])
    if len(path_components) > 1:
        doc_query = doc_query.filter(Document.expediteur == path_components[1])

    # If we have two components (doctype, expediteur), we're at the document level
    if len(path_components) == 2:
        documents = doc_query.all()  # Get all documents for the specified doctype and expediteur
        response = [{
            "id": doc.id,
            "file_path": doc.file_path,
            "doctype": doc.doctype,
            "date": doc.date,
            "expediteur": doc.expediteur,
            "recapitulatif": doc.recapitulatif,
            "google_calendar": doc.google_calendar
        } for doc in documents]
        return response

    # If we have three components (doctype, expediteur, date), we're looking for a specific document
    elif len(path_components) == 3:
        documents = doc_query.filter(Document.date == path_components[2]).all()
        response = [{
            "id": doc.id,
            "file_path": doc.file_path,
            "doctype": doc.doctype,
            "date": doc.date,
            "expediteur": doc.expediteur,
            "recapitulatif": doc.recapitulatif,
            "google_calendar": doc.google_calendar
        } for doc in documents]
        return response

    # Otherwise, we're at a folder level. Aggregate the data accordingly.
    else:
        folder_data = {}
        if len(path_components) < 1:
            # At the root level, aggregate by doctype
            folder_data = db.query(Document.doctype).distinct().all()
        elif len(path_components) < 2:
            # At the doctype level, aggregate by expediteur
            folder_data = doc_query.with_entities(Document.expediteur).distinct().all()

        # Transform folder data into a list of folder names
        response = [item[0] for item in folder_data]
        return response

@app.get("/user/document_ids")
def get_user_document_ids(current_user = Depends(get_current_user), 
                          db = Depends(get_db)):
    # Fetch distinct document IDs for the user
    doc_ids = db.query(Document.id).filter(Document.user_id == current_user.id).distinct().all()
    return [doc_id[0] for doc_id in doc_ids]

@app.get("/user/doctypes")
def get_user_doctypes(current_user = Depends(get_current_user), db = Depends(get_db)):
    # Fetch distinct doctypes for the user
    doctypes = db.query(Document.doctype).filter(Document.user_id == current_user.id).distinct().all()
    return [doctype[0] for doctype in doctypes]

@app.get("/user/expediteurs")
def get_user_expediteurs(doctype: str, current_user = Depends(get_current_user), db = Depends(get_db)):
    # Fetch distinct expediteurs for a specific doctype of the user
    expediteurs = db.query(Document.expediteur).filter(Document.user_id == current_user.id, Document.doctype == doctype).distinct().all()
    return [expediteur[0] for expediteur in expediteurs]
    
@app.delete("/user/documents/{doc_id}")
def delete_document(doc_id: UUID, 
                    current_user = Depends(get_current_user), 
                    db: Session = Depends(get_db), 
                    chroma_db_json: Session = Depends(get_chroma_db_json),
                    chroma_db_raw: Session = Depends(get_chroma_db)):
        
    # Step 1: Fetch the document record from the PostgreSQL database
    doc_to_delete = db.query(Document).filter(Document.user_id == current_user.id, Document.id == doc_id).first()

    if not doc_to_delete:
        raise HTTPException(status_code=404, detail = "Document to delete not found")
    
    try:
        # Step 2: Delete the document record from the PostgreSQL database
        db.delete(doc_to_delete)
        db.commit()

        # Step 4: Remove the document data from the ChromaDB vector database
        chroma_db_json.delete(ids = str(doc_id) + "-0")
        chroma_db_raw.delete(ids =  str(doc_id) + "-0")

        # Step 3: Delete the actual document file from the file system
        file_path = doc_to_delete.file_path 
        if file_path and os.path.exists(file_path):
            os.remove(file_path)

        return {"detail" : "Document deleted successfully"}
    except ValueError as ve:
        db.rollback()
        raise HTTPException(status_code=400, detail = str(ve))
    except Exception:
        db.rollback()
        logging.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail = "An unexpected error occured")
    finally:
        db.close()

@limiter.limit("10/minutes")
@app.get("/user/search")
def search_documents(request: Request,
                     query: str, 
                     top_k: int = 3, 
                     current_user =  Depends(get_current_user),
                     db = Depends(get_db),
                     chroma_db = Depends(get_chroma_db_json)):

    if DEV_MODE:
        return []
    
    doc_query = db.query(Document).filter(Document.user_id == current_user.id)

    if not doc_query:
        raise HTTPException(status_code = 404, detail = "Document not found")
    try: 
        retrieved_info = chroma_db.similarity_search(query)[:top_k]
        logging.info("retrieved_info %s",retrieved_info)
        retrieved_ids = [doc.metadata["id"] for doc in retrieved_info]
        logging.info("retrieved_ids %s",retrieved_ids)
        documents = doc_query.filter(Document.id.in_(retrieved_ids)).all()

        if not documents:
            raise HTTPException(status_code=404, detail = "Search not found")
        
        response = [{"id": doc.id, "file_path": doc.file_path, "doctype": doc.doctype, "date": doc.date, "expediteur": doc.expediteur, "recapitulatif": doc.recapitulatif, "google_calendar": doc.google_calendar} for doc in documents]
        
        return response
    
    except ValueError as ve:
        raise HTTPException(status_code = 400, detail = str(ve))
    except Exception:
        logging.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail = "An unexpected error occured")

@app.post("/delete_all_data")
async def delete_all_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not DEV_MODE:
        raise HTTPException(status_code=404, detail="Not found")
    try: 
        db.query(Document).delete()
        db.query(User).delete()

        db.commit()
        return {"message": "All data deleted successfully"}
    except Exception as e:
        # Rollback the transaction in case of an error
        db.rollback()
        
        # Log the error and return a 500 status code with the error message
        logger.error(f"An error occurred while deleting data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


## later
## from app.api.v1.routers import router as api_router
## app.include_router(api_router, prefix = "api/v1")
