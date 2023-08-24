from sqlalchemy import create_engine 
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker 
from core.config import settings
from db.models import Base

DATABASE_URL = settings.DATABASE_URL
engine = create_engine(DATABASE_URL)

Base.metadata.create_all(bind=engine)
SessionLocal = sessionmaker(autocommit = False, autoflush = False, bind = engine)


