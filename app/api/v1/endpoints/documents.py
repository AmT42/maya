import json
import os
import shutil
import logging
import traceback
from typing import Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Request, Query
from sqlalchemy.orm import Session
from langchain.docstore.document import Document as ChromaDocument

from db.models import Document, User
from db.schemas import ValidatedInfo
from services.calendar.google_calendar import create_event
from services.chatgpt.llm import chatgpt
from services.ocr import ocr
from services.chroma_db.db import get_chroma_db, get_chroma_db_json, text_splitter
from utils.date_fmt import convert_date_format
from core.config import settings
from app.main import get_db, get_current_user, limiter

router = APIRouter()

TEMP_STORAGE = settings.TEMP_STORAGE
logger = logging.getLogger(__name__)

@router.post("/upload")
@limiter.limit("5/minute")
def upload_document(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    chroma_db = Depends(get_chroma_db),
    User: User = Depends(get_current_user),
):
    try:
        content_type = file.content_type
        doc_id = uuid4()
        logger.info(f"CONTENT TYPE {content_type}")
        if content_type.startswith("image/"):
            file_path = f"storage/{TEMP_STORAGE}/{doc_id}.jpg"
            logger.info("Saving")
            with open(file_path, "wb") as f:
                f.write(file.file.read())
                logger.info("SAVED")
            ocr_text = ocr.call_ocr(file_path, client=ocr.client)
        else:
            ocr_text = file.file.read().decode()
        logger.info(f"OCR TEXT {ocr_text}")
        file.file.close()

        extracted_info = chatgpt.call_gpt(text=ocr_text)
        logger.info(extracted_info)
        new_document = Document(
            id=doc_id,
            file_path=file_path if content_type.startswith("image") else None,
            doctype=extracted_info["doctype"].lower().strip(),
            date=convert_date_format(extracted_info["date"]),
            expediteur=extracted_info["expediteur"].lower().strip(),
            recapitulatif=extracted_info["recapitulatif"].lower().strip(),
            google_calendar=extracted_info["google_calendar"],
            user_id=User.id,
        )
        db.add(new_document)
        db.commit()

        doc_id = str(doc_id)
        raw_docs = [ChromaDocument(page_content=ocr_text, metadata={"type": "ocr", "id": doc_id})]
        docs = text_splitter.split_documents(raw_docs)
        ids = [f"{doc_id}-{i}" for i in range(len(docs))]
        logger.info(f"IDS {ids} doc_id {doc_id}")
        logger.info(docs)
        chroma_db.add_documents(docs, ids=ids)

        logger.info("DOCUMENT ADDED TO CHROMA")
        return {"doc_id": doc_id, "extracted_info": extracted_info}
    except ValueError as ve:
        logger.error(f"Value error: {ve}")
        db.rollback()
        raise HTTPException(status_code=400, detail=str(ve))
    except IOError as ioe:
        logger.error(f"I/O error {ioe}")
        db.rollback()
        raise HTTPException(status_code=500, detail="File processing error")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="An unexpected error occurred")
    finally:
        db.close()

@router.post("/validate")
@limiter.limit("5/minute")
def validate(
    request: Request,
    validated_info: ValidatedInfo,
    db: Session = Depends(get_db),
    chroma_db = Depends(get_chroma_db_json),
):
    try:
        doc_id = validated_info.doc_id
        info = validated_info.extracted_info

        document_to_update = db.query(Document).filter_by(id=doc_id).first()

        if not document_to_update:
            raise HTTPException(status_code=400, detail=f"Document with id {doc_id} not found!")

        document_to_update.doctype = info["doctype"].lower().strip()
        document_to_update.date = convert_date_format(info["date"])
        document_to_update.expediteur = info["expediteur"].lower().strip()
        document_to_update.recapitulatif = info["recapitulatif"].lower().strip()
        document_to_update.google_calendar = info["google_calendar"]
        db.commit()
        user_id = document_to_update.user_id
        logger.info(f"document_to_update.file_path {document_to_update.file_path}")
        if document_to_update.file_path:
            directory = f"storage/{user_id}/{info['doctype']}/{info['expediteur'].replace('/', '-')}/"
            if not os.path.exists(directory):
                os.makedirs(directory)
            final_file_path = f"{directory}{info['date'].replace('/', '-')}.jpg"
            shutil.move(document_to_update.file_path, final_file_path)

        json_docs = [ChromaDocument(page_content=json.dumps(info), metadata={"type": "chatgpt", "id": doc_id})]
        docs = text_splitter.split_documents(json_docs)
        ids = [f"{doc_id}-{i}" for i in range(len(docs))]
        chroma_db.add_documents(docs, ids=ids)
        create_event(info)

        return {"doc_id": doc_id, "validated_info": info}
    except ValueError as ve:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(ve))
    except IOError as ioe:
        logger.error(f"I/O error {ioe}")
        db.rollback()
        raise HTTPException(status_code=500, detail="File processing error")
    except Exception as e:
        logger.error(f"Unexpected error {e}")
        logger.error(traceback.format_exc())
        db.rollback()
        raise HTTPException(status_code=500, detail="An unexpected error occurred")
    finally:
        db.close()

@router.get("/user/documents_filter")
@limiter.limit("30/minute")
def get_user_documents_filter(
    request: Request,
    current_user: User = Depends(get_current_user),
    doctype: Optional[str] = None,
    date: Optional[str] = None,
    expediteur: Optional[str] = None,
    db: Session = Depends(get_db),
):
    doc_query = db.query(Document).filter(Document.user_id == current_user.id)

    if not doc_query:
        raise HTTPException(status_code=404, detail="Document not found")
    try:
        if doctype:
            doc_query = doc_query.filter(Document.doctype == doctype)
        if date:
            doc_query = doc_query.filter(Document.date == date)
        if expediteur:
            doc_query = doc_query.filter(Document.expediteur == expediteur)

        documents = doc_query.all()
        response = [
            {
                "id": doc.id,
                "file_path": doc.file_path,
                "doctype": doc.doctype,
                "date": doc.date,
                "expediteur": doc.expediteur,
                "recapitulatif": doc.recapitulatif,
                "google_calendar": doc.recapitulatif,
            }
            for doc in documents
        ]

        return response
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception:
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="An unexpected error occurred")

@router.get("/user/documents")
async def get_user_documents(
    request: Request,
    current_user: User = Depends(get_current_user),
    path: Optional[str] = Query(None, alias="path"),
    db: Session = Depends(get_db),
):
    path_components = path.split("/") if path else []
    doc_query = db.query(Document).filter(Document.user_id == current_user.id)
    if len(path_components) > 0:
        doc_query = doc_query.filter(Document.doctype == path_components[0])
    if len(path_components) > 1:
        doc_query = doc_query.filter(Document.expediteur == path_components[1])

    if len(path_components) == 2:
        documents = doc_query.all()
        response = [
            {
                "id": doc.id,
                "file_path": doc.file_path,
                "doctype": doc.doctype,
                "date": doc.date,
                "expediteur": doc.expediteur,
                "recapitulatif": doc.recapitulatif,
                "google_calendar": doc.google_calendar,
            }
            for doc in documents
        ]
        return response
    elif len(path_components) == 3:
        documents = doc_query.filter(Document.date == path_components[2]).all()
        response = [
            {
                "id": doc.id,
                "file_path": doc.file_path,
                "doctype": doc.doctype,
                "date": doc.date,
                "expediteur": doc.expediteur,
                "recapitulatif": doc.recapitulatif,
                "google_calendar": doc.google_calendar,
            }
            for doc in documents
        ]
        return response
    else:
        folder_data = {}
        if len(path_components) < 1:
            folder_data = db.query(Document.doctype).distinct().all()
        elif len(path_components) < 2:
            folder_data = doc_query.with_entities(Document.expediteur).distinct().all()

        response = [item[0] for item in folder_data]
        return response

@router.get("/user/document_ids")
def get_user_document_ids(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc_ids = db.query(Document.id).filter(Document.user_id == current_user.id).distinct().all()
    return [doc_id[0] for doc_id in doc_ids]

@router.get("/user/doctypes")
def get_user_doctypes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doctypes = db.query(Document.doctype).filter(Document.user_id == current_user.id).distinct().all()
    return [doctype[0] for doctype in doctypes]

@router.get("/user/expediteurs")
def get_user_expediteurs(
    doctype: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    expediteurs = (
        db.query(Document.expediteur)
        .filter(Document.user_id == current_user.id, Document.doctype == doctype)
        .distinct()
        .all()
    )
    return [expediteur[0] for expediteur in expediteurs]

@router.delete("/user/documents/{doc_id}")
def delete_document(
    doc_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    chroma_db_json = Depends(get_chroma_db_json),
    chroma_db_raw = Depends(get_chroma_db),
):
    doc_to_delete = db.query(Document).filter(Document.user_id == current_user.id, Document.id == doc_id).first()
    if not doc_to_delete:
        raise HTTPException(status_code=404, detail="Document to delete not found")
    try:
        db.delete(doc_to_delete)
        db.commit()
        chroma_db_json.delete(ids=str(doc_id) + "-0")
        chroma_db_raw.delete(ids=str(doc_id) + "-0")
        file_path = doc_to_delete.file_path
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
        return {"detail": "Document deleted successfully"}
    except ValueError as ve:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception:
        db.rollback()
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="An unexpected error occurred")
    finally:
        db.close()

@router.get("/user/search")
@limiter.limit("10/minutes")
def search_documents(
    request: Request,
    query: str,
    top_k: int = 3,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    chroma_db = Depends(get_chroma_db_json),
):
    doc_query = db.query(Document).filter(Document.user_id == current_user.id)
    if not doc_query:
        raise HTTPException(status_code=404, detail="Document not found")
    try:
        retrieved_info = chroma_db.similarity_search(query)[:top_k]
        logging.info("retrieved_info %s", retrieved_info)
        retrieved_ids = [doc.metadata["id"] for doc in retrieved_info]
        logging.info("retrieved_ids %s", retrieved_ids)
        documents = doc_query.filter(Document.id.in_(retrieved_ids)).all()
        if not documents:
            raise HTTPException(status_code=404, detail="Search not found")
        response = [
            {
                "id": doc.id,
                "file_path": doc.file_path,
                "doctype": doc.doctype,
                "date": doc.date,
                "expediteur": doc.expediteur,
                "recapitulatif": doc.recapitulatif,
                "google_calendar": doc.google_calendar,
            }
            for doc in documents
        ]
        return response
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception:
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="An unexpected error occurred")

@router.post("/delete_all_data")
async def delete_all_data(db: Session = Depends(get_db)):
    try:
        db.query(Document).delete()
        db.query(User).delete()
        db.commit()
        return {"message": "All data deleted successfully"}
    except Exception as e:
        db.rollback()
        logger.error(f"An error occurred while deleting data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

