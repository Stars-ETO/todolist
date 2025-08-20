from sqlalchemy import Column, Integer, String, Text, DateTime, Enum as SQLEnum, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database.database import Base
from datetime import datetime
from enum import Enum as PyEnum

class Priority(str, PyEnum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class TaskStatus(str, PyEnum):
    PENDING = "pending"
    COMPLETED = "completed"
    DELETED = "deleted"  # 回收站功能支持

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    due_date = Column(DateTime)
    priority = Column(SQLEnum(Priority), default=Priority.MEDIUM)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    status = Column(SQLEnum(TaskStatus), default=TaskStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_public = Column(Boolean, default=False)  # 协同任务公开设置
    
    # 关系
    reminders = relationship("Reminder", back_populates="task", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="task", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="task", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Task(id={self.id}, title='{self.title}', status='{self.status}')>"