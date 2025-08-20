from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class CategoryBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    name: str

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(CategoryBase):
    model_config = ConfigDict(from_attributes=True)
    
    name: Optional[str] = None

class CategoryInDBBase(CategoryBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    owner_id: int
    created_at: datetime

class Category(CategoryInDBBase):
    pass