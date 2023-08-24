from fastapi import FastAPI, Depends, HTTPException 
from sqlalchemy.orm import Session
from db.session import SessionLocal
from db.models import Document, User
from utils.security import verify_password, hash_password, create_refresh_token, create_access_token, verify_token
from fastapi.security import OAuth2PasswordBearer

app = FastAPI()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


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

@app.post("/loging")
def login(username: str, password: str, db: Session = Depends(get_db)):

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
    user = db.query(User).filter(User.refresh_token == refresh_token)
    if not user:
        raise HTTPException(status_code = 400, detail = "Invalid refresh token")
    
    # Generate a new acess token 
    new_access_token = create_access_token({"sub": user.username})
    return {"access_token" : new_access_token}



@app.get("/users/me")
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

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