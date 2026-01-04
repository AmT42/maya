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
    username = Column(String, unique = True, index = True, nullable=False)
    email = Column(String, unique = True, index = True, nullable=False)
    hashed_password = Column(String, nullable=True)
    is_active = Column(Boolean, default = True)
    created_at = Column(DateTime, default = datetime.datetime.utcnow)
    # Store a hash of the refresh token (SHA-256 hex), never store the raw token in DB.
    refresh_token = Column(String, index = True, nullable = True)
    refresh_token_expires_at = Column(DateTime, nullable=True)

    # Google Sign-In (OpenID Connect)
    google_sub = Column(String, unique=True, index=True, nullable=True)
    full_name = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)

    # relationship with document
    documents = relationship("Document", back_populates = "owner")

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(UUID(as_uuid = True), primary_key = True, index = True, default = uuid.uuid4)
    file_path = Column(String, nullable=True)
    doctype = Column(String, nullable=False)
    date = Column(DateTime, nullable=False)
    expediteur = Column(String, nullable=False)
    recapitulatif = Column(String, nullable=False)
    google_calendar = Column(String, nullable=True)

    # Foreign key to User
    user_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False)

    # Relationship with User 
    owner = relationship("User", back_populates = "documents")
