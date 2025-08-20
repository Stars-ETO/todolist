from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from enum import Enum

class Priority(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class TaskStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    DELETED = "deleted"

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: Priority = Priority.MEDIUM
    category_id: Optional[int] = None
    is_public: bool = False

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: Optional[Priority] = None
    category_id: Optional[int] = None
    is_public: Optional[bool] = None
    status: Optional[TaskStatus] = None

class TaskInDBBase(TaskBase):
    id: int
    status: TaskStatus = TaskStatus.PENDING
    owner_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class Task(TaskInDBBase):
    pass

class TaskWithAttachments(Task):
    attachments: List['Attachment'] = []

class TaskWithCategory(Task):
    category: Optional['Category'] = None

class TaskWithComments(Task):
    comments: List['Comment'] = []

# 添加批量操作的数据模型
class TaskBatchUpdate(BaseModel):
    """批量更新任务请求模型"""
    model_config = ConfigDict(from_attributes=True)
    
    task_ids: List[int] = []
    priority: Optional[Priority] = None
    category_id: Optional[int] = None

class TaskBatchDelete(BaseModel):
    """批量删除任务请求模型"""
    model_config = ConfigDict(from_attributes=True)
    
    task_ids: List[int] = []

from .attachment import Attachment
from .category import Category
from .comment import Comment

TaskWithAttachments.model_rebuild()
TaskWithCategory.model_rebuild()
TaskWithComments.model_rebuild()