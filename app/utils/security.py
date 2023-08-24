import bcrypt
from datetime import datetime, timedelta 
from fastapi import HTTPException
import jwt 
import secrets
from decouple import config 
import logging
from fastapi.security import OAuth2PasswordBearer

SECRET_KEY = config("SECRET_KEY")
ALGORITHM = "HS256"
ACCES_TOKEN_EXPIRE_MINUTES = 120

# oauth2_scheme = OAuth2PasswordBearer(tokenUrl = "login")

logging.basicConfig(level = logging.INFO)
logger = logging.getLogger(__name__)

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode('utf-8'))

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
    

def verify_token(token: str):
    try: 
        logging.INFO(f"try to verify token")
        payload = jwt.decode(token, SECRET_KEY, algorithms = {ALGORITHM})
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code = 401, detail = "Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code = 401, detail = "Invalid token")
    except Exception:
        raise Exception(detail = "vas te faire connard")
    
def create_refresh_token(data: dict):
    return secrets.token_urlsafe(32)
