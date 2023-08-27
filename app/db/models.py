from sqlalchemy import create_engine, Column, String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
import datetime


Base = declarative_base()

class User(Base):
    __tablename__ = "user"
    
    id = Column(UUID(as_uuid=True), primary_key = True, index = True, default=uuid.uuid4)
    username = Column(String, unique = True, index = True)
    email = Column(String, unique = True, index = True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default = True)
    created_at = Column(DateTime, default = datetime.datetime.utcnow)
    refresh_token = Column(String, index = True, nullable = True)

    # relationship with document
    documents = relationship("Document", back_populates = "owner")

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(UUID(as_uuid = True), primary_key = True, index = True, default = uuid.uuid4)
    file_path = Column(String)
    doctype = Column(String)
    date = Column(DateTime)
    entity_or_reason = Column(String)
    additional_info = Column(String)

    # Foreign key to User
    user_id = Column(UUID(as_uuid=True), ForeignKey("user.id"))

    # Relationship with User 
    owner = relationship("User", back_populates = "documents")



