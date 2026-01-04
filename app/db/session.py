from sqlalchemy import create_engine 
from sqlalchemy.orm import sessionmaker 
from core.config import settings
from db.models import Base

DATABASE_URL = settings.DATABASE_URL
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit = False, autoflush = False, bind = engine)

