from pydantic import BaseSettings
from decouple import config 

class Settings(BaseSettings):
    DATABASE_URL: str  = config("DATABASE_URL")
    SECRET_KEY: str = config("SECRET_KEY")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = config("ACCESS_TOKEN_EXPIRE_MINUTES", default=15, cast=int)
    REFRESH_TOKEN_EXPIRE_DAYS: int = config("REFRESH_TOKEN_EXPIRE_DAYS", default=30, cast=int)
    # Legacy (deprecated): previously used for Google Vision OCR.
    GOOGLE_CREDENTIALS_PATH = config("GOOGLE_CREDENTIALS_PATH", default="")
    OPENAI_API_KEY = config("OPENAI_API_KEY", default="")
    OPENROUTER_API_KEY: str = config("OPENROUTER_API_KEY", default="")
    OPENROUTER_BASE_URL: str = config("OPENROUTER_BASE_URL", default="https://openrouter.ai/api/v1")
    OPENROUTER_MODEL_DOC: str = config("OPENROUTER_MODEL_DOC", default="google/gemini-3-flash-preview")
    OPENROUTER_MODEL_CHAT: str = config("OPENROUTER_MODEL_CHAT", default="google/gemini-3-flash-preview")
    OPENROUTER_HTTP_REFERER: str = config("OPENROUTER_HTTP_REFERER", default="")
    OPENROUTER_X_TITLE: str = config("OPENROUTER_X_TITLE", default="Maya")
    OPENROUTER_ZDR: bool = config("OPENROUTER_ZDR", default=True, cast=bool)
    OPENROUTER_DATA_COLLECTION: str = config("OPENROUTER_DATA_COLLECTION", default="deny")
    DOCUMENT_AI_ENGINE: str = config("DOCUMENT_AI_ENGINE", default="openrouter_gemini")
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
        if not self.OPENAI_API_KEY:
            missing.append("OPENAI_API_KEY")
        if not self.OPENROUTER_API_KEY:
            missing.append("OPENROUTER_API_KEY")
        if not self.ADMIN:
            missing.append("ADMIN")
        if missing:
            raise RuntimeError(f"Missing required settings: {', '.join(missing)}")
    
settings = Settings()
