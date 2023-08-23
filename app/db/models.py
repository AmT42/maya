from fastapi_users_db_sqlalchemy import SQLAlchemyBaseUserTable
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
import datetime

Base = declarative_base()

class User(Base, SQLAlchemyBaseUserTable):
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(String, primary_key = True, index = True)
    file_path = Column(String)
    doctype = Column(String)
    date = Column(DateTime)
    entity_or_reason = Column(String)
    additional_info = Column(String)



