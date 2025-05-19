from fastapi import APIRouter, Depends, HTTPException, Form
from sqlalchemy.orm import Session

from db.models import User
from utils.security import (
    verify_password,
    hash_password,
    create_refresh_token,
    create_access_token,
)
from app.main import get_db, get_current_user

router = APIRouter()

@router.post("/register")
def register_user(
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.username == username).first()
    if user:
        raise HTTPException(status_code=400, detail="User is already registered")

    user = db.query(User).filter(User.email == email).first()
    if user:
        raise HTTPException(status_code=400, detail="Email is already registered")

    hashed_password = hash_password(password)
    new_user = User(username=username, email=email, hashed_password=hashed_password)
    db.add(new_user)

    access_token = create_access_token({"sub": username})
    refresh_token = create_refresh_token({"sub": username})

    new_user.refresh_token = refresh_token

    db.commit()
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "message": "User created successfully!",
    }


@router.post("/login")
def login(
    username: str = Form(...),
    password: str = Form(),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid username or password")

    if not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid username or password")

    access_token = create_access_token({"sub": user.username})
    refresh_token = create_refresh_token({"sub": user.username})

    # Store refresh token in the database
    user.refresh_token = refresh_token
    db.commit()

    return {"access_token": access_token, "refresh_token": refresh_token}


@router.post("/token/refresh")
def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.refresh_token == refresh_token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid refresh token")

    new_access_token = create_access_token({"sub": user.username})
    return {"access_token": new_access_token}


@router.get("/users/me")
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
