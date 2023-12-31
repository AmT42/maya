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

@app.post("/register")
def register_user(username: str = Form(...), email: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if user: 
        raise HTTPException(status_code = 400, detail = "User is already registered")
    
    user = db.query(User).filter(User.email == email).first()
    if user:
        raise HTTPException(status_code = 400, detail = "Email is already registered")
    

    hashed_password = hash_password(password)
    new_user = User(username=username, email = email, hashed_password = hashed_password)
    db.add(new_user)

    access_token = create_access_token({"sub": username})
    refresh_token = create_refresh_token({"sub": username})

    new_user.refresh_token = refresh_token

    db.commit()
    return {"access_token": access_token, "refresh_token": refresh_token, "message": "User created successfully!"}

@app.post("/login")
def login(username:str = Form(...), password: str = Form(), db: Session = Depends(get_db)):
    logger.info("LOGS")
    logger.info(f"Username: {username}, Password: {password}")
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
        logger.info(f'OCR TEXT {ocr_text}')
        file.file.close()

        extracted_info = chatgpt.call_gpt(text = ocr_text)
        logger.info(extracted_info)
        # Store the extracted information in the database
        new_document = Document(
            id = doc_id,
            file_path = file_path if content_type.startswith("image") else None, 
            doctype = extracted_info["doctype"].lower().strip(),
            date = convert_date_format(extracted_info["date"]),
            expediteur = extracted_info["expediteur"].lower().strip(),
            recapitulatif=extracted_info['recapitulatif'].lower().strip(),
            google_calendar = extracted_info['google_calendar'],
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
        ids = [f"{doc_id}-{i}" for i in range(len(docs))]
        logger.info(f'IDS {ids} doc_id {doc_id}')
        logger.info(docs)
        # Add to the chroma vdb with its corresponding ids
        chroma_db.add_documents(docs, ids = ids)

        logger.info("DOCUMENT ADDED TO CHROMA")
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
        document_to_update.expediteur = info["expediteur"].lower().strip()
        document_to_update.recapitulatif = info['recapitulatif'].lower().strip()
        document_to_update.google_calendar = info['google_calendar']
        # Commit the changes
        db.commit()
        user_id = document_to_update.user_id
        logger.info(f"document_to_update.file_path {document_to_update.file_path}")
        if document_to_update.file_path:
            directory = f"storage/{user_id}/{info['doctype']}/{info['expediteur'].replace('/','-')}/"
            if not os.path.exists(directory):
                os.makedirs(directory)
            final_file_path = f'{directory}{info["date"].replace("/","-")}.jpg'
            shutil.move(document_to_update.file_path, final_file_path)

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
        #create event in google calendar
        create_event(info)

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
async def delete_all_data(db: Session = Depends(get_db)):
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


