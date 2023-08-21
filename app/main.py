from fastapi import FastAPI, Depends, HTTPException 
from sqlalchemy.orm import Session
from db.session import SessionLocal
from db.models import Document, User
from utils.security import verify_password, hash_password

app = FastAPI()




# Dependency 
def get_db():
    db = SessionLocal()
    try: 
        yield db 
    finally:
        db.close()

@app.post("/register/")
def register_user(username: str, email: str, password: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if user: 
        raise HTTPException(status_code = 400, detail = "User is already registered")
    
    user = db.query(User).filter(User.email == email).first()
    if user:
        raise HTTPException(status_code = 400, detail = "Email is already registered")
    

    hashed_password = hash_password(password)
    new_user = User(username=username, email = email, hash_password = hashed_password)
    db.add(new_user)
    db.commit()
    return {"message" : "User created successfully!"}

@app.post("/loging")
def login(username: str, password: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user: 
        raise HTTPException(status_code = 400, detail="Invalid username or password")
    
    if not verify_password(password, user.hashed_password):
        raise HTTPException(status_code = 400, detail = "Invalid username or password")
    
    #return token for the user

    return {"message": "Logged in successfuly!"}

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