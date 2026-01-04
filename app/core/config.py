from pydantic import BaseSettings
from decouple import config 

class Settings(BaseSettings):
    DATABASE_URL: str  = config("DATABASE_URL")
    SECRET_KEY: str = config("SECRET_KEY")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = config("ACCESS_TOKEN_EXPIRE_MINUTES", default=15, cast=int)
    REFRESH_TOKEN_EXPIRE_DAYS: int = config("REFRESH_TOKEN_EXPIRE_DAYS", default=30, cast=int)
    GOOGLE_CREDENTIALS_PATH = config("GOOGLE_CREDENTIALS_PATH", default="")
    OPENAI_API_KEY = config("OPENAI_API_KEY", default="")
    ADMIN = config('ADMIN', default="")
    MAYA_DEV_MODE: bool = config("MAYA_DEV_MODE", default=False, cast=bool)
    TEMP_STORAGE = "temp_storage"
    # Google Sign-In audiences (OAuth client IDs). Any of these can be used.
    # - `GOOGLE_WEB_CLIENT_ID`: OAuth client of type "Web application" (recommended primary)
    # - `GOOGLE_IOS_CLIENT_ID`: OAuth client of type "iOS"
    # - `GOOGLE_ID`: legacy comma-separated list (still supported)
    GOOGLE_WEB_CLIENT_ID: str = config("GOOGLE_WEB_CLIENT_ID", default="")
    GOOGLE_IOS_CLIENT_ID: str = config("GOOGLE_IOS_CLIENT_ID", default="")
    GOOGLE_ID: str = config("GOOGLE_ID", default="")

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
