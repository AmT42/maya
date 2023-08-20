from sqlalchemy import create_engine, Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship


Base = declarative_base()

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(String, primary_key = True, index = True)
    file_path = Column(String)
    doctype = Column(String)
    date = Column(DateTime)
    entity_or_reason = Column(String)
    additional_info = Column(String)

