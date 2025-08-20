from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database.database import Base
from datetime import datetime
from enum import Enum as PyEnum

class ReminderType(str, PyEnum):
    ONCE = "once"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"

class ReminderMethod(str, PyEnum):
    """提醒方式枚举"""
    POPUP = "popup"      # 弹窗提醒
    SOUND = "sound"      # 声音提醒
    INDICATOR = "indicator"  # 标记提醒

class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    reminder_time = Column(DateTime)
    reminder_type = Column(String, default="once")
    is_active = Column(Boolean, default=True)
    # 添加提醒方式字段，默认为弹窗提醒
    method = Column(String, default="popup")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 关系
    task = relationship("Task", back_populates="reminders")
    
    def __repr__(self):
        return f"<Reminder(id={self.id}, task_id={self.task_id}, time='{self.reminder_time}', method='{self.method}')>"