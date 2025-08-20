from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from enum import Enum

class ReminderType(str, Enum):
    ONCE = "once"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"

class ReminderMethod(str, Enum):
    """提醒方式枚举"""
    POPUP = "popup"      # 弹窗提醒
    SOUND = "sound"      # 声音提醒
    INDICATOR = "indicator"  # 标记提醒

class ReminderBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    task_id: int
    reminder_time: datetime
    reminder_type: ReminderType = ReminderType.ONCE
    method: ReminderMethod = ReminderMethod.POPUP

class ReminderCreate(ReminderBase):
    pass

class ReminderUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    task_id: Optional[int] = None
    reminder_time: Optional[datetime] = None
    reminder_type: Optional[ReminderType] = None
    is_active: Optional[bool] = None
    method: Optional[ReminderMethod] = None

class ReminderInDBBase(ReminderBase):
    id: int
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class Reminder(ReminderInDBBase):
    pass