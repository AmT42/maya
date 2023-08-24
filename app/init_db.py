from sqlalchemy import create_engine
from db.models import Base
from core.config import settings

engine = create_engine(settings.DATABASE_URL)
Base.metadata.create_all(bind = engine)