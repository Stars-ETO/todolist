from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class AttachmentBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    filename: str
    file_path: str

class AttachmentCreate(AttachmentBase):
    task_id: int

class AttachmentUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    filename: Optional[str] = None
    file_path: Optional[str] = None

class AttachmentInDBBase(AttachmentBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    task_id: int
    uploaded_at: datetime

class Attachment(AttachmentInDBBase):
    pass