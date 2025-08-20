from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class CommentBase(BaseModel):
    content: str

class CommentCreate(CommentBase):
    task_id: int

class CommentUpdate(BaseModel):
    content: Optional[str] = None

class CommentInDBBase(CommentBase):
    id: int
    task_id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class Comment(CommentInDBBase):
    pass