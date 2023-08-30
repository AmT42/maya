from pydantic import BaseModel

class LoginRequest(BaseModel):
    username: str
    password: str

class ValidatedInfo(BaseModel):
    doc_id: str
    extracted_info: dict

