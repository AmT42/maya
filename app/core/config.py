from pydantic import BaseSettings
from decouple import config 

class Settings(BaseSettings):
    DATABASE_URL: str  = config("DATABASE_URL")
    GOOGLE_CREDENTIALS_PATH = config("GOOGLE_CREDENTIALS_PATH")
    OPENAI_API_KEY = config("OPENAI_API_KEY")
    ADMIN = config('ADMIN')
    TEMP_STORAGE = "temp_storage"
    
settings = Settings()
