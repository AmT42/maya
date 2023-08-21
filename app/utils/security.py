import bcrypt
from datetime import datetime, timedelta 
from fastapi import HTTPException
import jwt 
import secrets
from decouple import config 
import logging

logging.basicConfig(level = logging.INFO)
logger = logging.getLogger(__name__)

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode('utf-8'))

SECRET_KEY = config("SECRET_KEY")
ALGORITHM = "HS256"
ACCES_TOKEN_EXPIRE_MINUTES = 120

def create_access_token(data: dict):
    try: 
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes = ACCES_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm = ALGORITHM)
        return encoded_jwt
    except Exception as e:
        logging.error(f"Error encoding JWT: {e}")
        raise HTTPException(status_code = 500, detail = "Error encoding JWT token")