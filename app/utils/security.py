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

oauth2_scheme = OAuth2PasswordBearer(tokenUrl = "login")

logging.basicConfig(level = logging.INFO)
logger = logging.getLogger(__name__)