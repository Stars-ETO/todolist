from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class Token(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    access_token: str
    token_type: str

class TokenData(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    username: Optional[str] = None

class LoginRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    username: str
    password: str

class RegisterRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    username: str
    email: str
    password: str