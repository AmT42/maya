from sqlalchemy import create_engine, Column, String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import datetime


Base = declarative_base()

class User(Base):
    id = Column(String, primary_key = True, index = True)
    username = Column(String, unique = True, index = True)
    email = Column(String, unique = True, index = True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default = True)
    created_at = Column(DateTime, default = datetime.datetime.utcnow)
    refresh_token = Column(String, index = True, nullable = True)

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(String, primary_key = True, index = True)
    file_path = Column(String)
    doctype = Column(String)
    date = Column(DateTime)
    entity_or_reason = Column(String)
    additional_info = Column(String)



