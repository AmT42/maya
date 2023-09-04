import json
import os 
import shutil 
from uuid import uuid4
from google.cloud import vision
from decouple import config
import traceback
from typing import Optional 

from fastapi import FastAPI, Depends, HTTPException, Form, File, UploadFile, Header, Request, Body
from fastapi.security import OAuth2PasswordBearer
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from sqlalchemy.orm import Session
from langchain.docstore.document import Document as ChromaDocument

from db.session import SessionLocal
from db.models import Document, User
from db.schemas import ValidatedInfo
from utils.security import verify_password, hash_password, create_refresh_token, create_access_token, verify_token

from core.config import settings
from services.chatgpt.llm import chatgpt
from services.ocr import ocr 
from services.chroma_db.db import get_chroma_db, get_chroma_db_json, text_splitter
from utils.date_fmt import convert_date_format

import logging

logger = logging.getLogger(__name__) 

app = FastAPI()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

TEMP_STORAGE = settings.TEMP_STORAGE

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

@app.post("/register/")
def register_user(username: str, email: str, password: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if user: 
        raise HTTPException(status_code = 400, detail = "User is already registered")
    
    user = db.query(User).filter(User.email == email).first()
    if user:
        raise HTTPException(status_code = 400, detail = "Email is already registered")
    

    hashed_password = hash_password(password)
    new_user = User(username=username, email = email, hashed_password = hashed_password)
    db.add(new_user)
    db.commit()
    return {"message" : "User created successfully!"}

@app.post("/login")
def login(username:str = Form(...), password: str = Form(), db: Session = Depends(get_db)):
    logger.info("LOGS")
    user = db.query(User).filter(User.username == username).first()
    if not user: 
        raise HTTPException(status_code = 400, detail="Invalid username or password")
    
    if not verify_password(password, user.hashed_password):
        raise HTTPException(status_code = 400, detail = "Invalid username or password")
    
    access_token = create_access_token({"sub": user.username})
    refresh_token = create_refresh_token({"sub": user.username})

    # Store refresh token in the database
    user.refresh_token = refresh_token
    db.commit()

    #return token for the user
    return {"access_token": access_token, "refresh_token": refresh_token}

@app.post("/token/refresh")
def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.refresh_token == refresh_token).first()
    if not user:
        raise HTTPException(status_code = 400, detail = "Invalid refresh token")
    
    # Generate a new acess token 
    new_access_token = create_access_token({"sub": user.username})
    return {"access_token" : new_access_token}

@app.get("/users/me")
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

import logging 
@app.post("/upload")
@limiter.limit("5/minute")
def upload_document(request: Request, 
                    file: UploadFile = File(...), 
                    db: Session = Depends(get_db),
                    chroma_db = Depends(get_chroma_db),
                     User = Depends(get_current_user)):
    try: 
        content_type = file.content_type

        # Generate a unique ID for the document
        doc_id = uuid4()
        logger.info(f'CONTENT TYPE {content_type}')
        # Determine if we received an image or text
        if content_type.startswith("image/"):
            file_path =  f'storage/{TEMP_STORAGE}/{doc_id}.jpg'
            logger.info("Saving")
            with open(file_path, "wb") as f:   ## add size checking condition 
                f.write(file.file.read())  
                logger.info("SAVED")
            ocr_text = ocr.call_ocr(file_path, client = ocr.client)
        else:
            ocr_text = file.file.read().decode()

        file.file.close()

        extracted_info = chatgpt.call_gpt(text = ocr_text)
        logger.info(extracted_info['info_supplementaires'])
        # Store the extracted information in the database
        new_document = Document(
            id = doc_id,
            file_path = file_path if content_type.startswith("image") else None, 
            doctype = extracted_info["doctype"].lower().lower().strip(),
            date = convert_date_format(extracted_info["date"]),
            entity_or_reason = extracted_info["entite_ou_raison"].lower().strip(),
            additional_info=json.dumps({key.lower().strip(): val for key, val in eval(extracted_info['info_supplementaires']).items()}),
            user_id = User.id
        )
        db.add(new_document)
        db.commit()
        
        doc_id = str(doc_id)
        # From text to Chroma.Document object
        raw_docs = [ChromaDocument(page_content = ocr_text, metadata = {"type":"ocr", "id":doc_id})]

        # Split document into chunks
        docs = text_splitter.split_documents(raw_docs)

        # Get unique Id per chunk
        ids = [f"{doc_id}_{i}_ocr" for i in range(len(raw_docs))]

        # Add to the chroma vdb with its corresponding ids
        chroma_db.add_documents(docs, id = ids)

        return {
            "doc_id" : doc_id,
            "extracted_info" : extracted_info
        }
    
    except ValueError as ve:
        logger.error(f'Value error: {ve}')
        db.rollback()
        raise HTTPException(status_code = 400, detail = str(ve))
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
             db: Session = Depends(get_db),
             chroma_db = Depends(get_chroma_db_json)):
    try:
        # Read the validated for receiving the validated information
        doc_id = validated_info.doc_id
        info = validated_info.extracted_info

        document_to_update = db.query(Document).filter_by(id = doc_id).first()

        if not document_to_update:
            raise HTTPException(status_code = 400, detail = f"Document with id {doc_id} not found!")
        
        # Update the attributes of the record with validated info
        document_to_update.doctype = info["doctype"].lower().strip()
        document_to_update.date = convert_date_format(info["date"])
        document_to_update.entity_or_reason = info["entite_ou_raison"].lower().strip()
        document_to_update.additional_info = json.dumps({key.lower().strip(): val for key, val in eval(info['info_supplementaires']).items()})

        # Commit the changes
        db.commit()
        user_id = document_to_update.user_id
        logger.info(f"document_to_update.file_path {document_to_update.file_path}")
        if document_to_update.file_path:
            directory = f"storage/{user_id}/{info['doctype']}/{info['entite_ou_raison'].replace('/','-')}/"
            if not os.path.exists(directory):
                os.makedirs(directory)
            final_file_path = f'{directory}{info["date"].replace("/","-")}.jpg'
            shutil.move(document_to_update.file_path, final_file_path)

        # Convert validated info to semantic format and store in Chroma DB (if needed)
        validated_info_semantic = chatgpt.json2semantic(info)
        # From text to document
        json_docs = [ChromaDocument(page_content = json.dumps(validated_info_semantic), metadata = {"type":"chatgpt", "id": doc_id})]

        # Split document into chunks
        docs = text_splitter.split_documents(json_docs)

        # Get unique Id per chunk
        ids = [f'{doc_id}_{i}_gpt' for i in range(len(json_docs))]

        # Add to the chroma vdb with its corresponding ids 
        chroma_db.add_documents(docs, ids = ids) 

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
@app.get("/user/documents")
def get_user_documents(request: Request,
                       current_user = Depends(get_current_user), 
                       doctype: Optional[str] = None,
                       date: Optional[str] = None,
                       entity: Optional[str] = None,
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
        if entity:
            doc_query = doc_query.filter(Document.entity_or_reason == entity)
        
        documents = doc_query.all()
        # Convert the documents to a suitable format for returning as a response
        # This is a list of dictionaries, for example
        response = [{"id": doc.id, "file_path": doc.file_path, "doctype": doc.doctype, "date": doc.date, "entity_or_reason": doc.entity_or_reason, "additional_info": doc.additional_info} for doc in documents]

        return response
    
    except ValueError as ve:
        raise HTTPException(status_code=400, detail = str(ve))
    except Exception:
        logger.error(traceback.format_exc())
        raise HTTPException(status_code = 500, detail = "An unexpected error occured")

@limiter.limit("10/minutes")
@app.get("/user/search")
def search_documents(request: Request,
                     query: str, 
                     top_k: int = 3, 
                     current_user =  Depends(get_current_user),
                     db = Depends(get_db),
                     chroma_db = Depends(get_chroma_db_json)):
    
    doc_query = db.query(Document).filter(Document.user_id == current_user.id)

    if not doc_query:
        raise HTTPException(status_code = 404, detail = "Document not found")
    try: 
        retrieved_info = chroma_db.similarity_search(query)[:top_k]
        retrieved_ids = [doc.metadata["id"] for doc in retrieved_info]
        documents = doc_query.filter(Document.id.in_(retrieved_ids)).all()

        if not documents:
            raise HTTPException(status_code=404, detail = "Search not found")
        
        response = [{"id": doc.id, "file_path": doc.file_path, "doctype": doc.doctype, "date": doc.date, "entity_or_reason": doc.entity_or_reason, "additional_info": doc.additional_info} for doc in documents]

        return response
    
    except ValueError as ve:
        raise HTTPException(status_code = 400, detail = str(ve))
    except Exception:
        logging.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail = "An unexpected error occured")




## later
## from app.api.v1.routers import router as api_router
## app.include_router(api_router, prefix = "api/v1")