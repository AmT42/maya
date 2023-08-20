from fastapi import FastAPI, Depends, HTTPException 
from sqlalchemy.orm import Session
from db.session import SessionLocal
from db.models import Document


app = FastAPI()



# Dependency 
def get_db():
    db = SessionLocal()
    try: 
        yield db 
    finally:
        db.close()

@app.post("/upload")
def upload_document(db: Session = Depends(get_db)):
    pass

@app.post("/validate")
def validate_information(db: Session = Depends(get_db)):
    pass 

@app.get("/info")
def get_info(db: Session = Depends(get_db)):
    pass


@app.get("/")
def read_root():
    return {"Hello":"Word"}