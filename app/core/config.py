from pydantic import BaseSettings
from decouple import config 

class Settings(BaseSettings):
    DATABASE_URL: str  = config("DATABASE_URL")
    GOOGLE_CREDENTIALS_PATH = config("GOOGLE_CREDENTIALS_PATH", default="")
    OPENAI_API_KEY = config("OPENAI_API_KEY", default="")
    ADMIN = config('ADMIN', default="")
    MAYA_DEV_MODE: bool = config("MAYA_DEV_MODE", default=False, cast=bool)
    TEMP_STORAGE = "temp_storage"

    def validate_required(self):
        if self.MAYA_DEV_MODE:
            return
        missing = []
        if not self.GOOGLE_CREDENTIALS_PATH:
            missing.append("GOOGLE_CREDENTIALS_PATH")
        if not self.OPENAI_API_KEY:
            missing.append("OPENAI_API_KEY")
        if not self.ADMIN:
            missing.append("ADMIN")
        if missing:
            raise RuntimeError(f"Missing required settings: {', '.join(missing)}")
    
settings = Settings()
