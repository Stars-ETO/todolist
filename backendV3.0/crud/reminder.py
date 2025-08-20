"""
提醒 CRUD 操作模块
提供提醒相关的数据库操作函数
"""

from sqlalchemy.orm import Session
from models.reminder import Reminder
from schemas.reminder import ReminderCreate, ReminderUpdate
from typing import Optional, List


def get_reminder(db: Session, reminder_id: int, user_id: int) -> Optional[Reminder]:
    """
    根据提醒ID获取提醒信息（需要通过任务关联检查用户权限）
    
    Args:
        db: 数据库会话
        reminder_id: 提醒ID
        user_id: 用户ID
        
    Returns:
        Reminder: 提醒对象或None
    """
    return db.query(Reminder).join(Reminder.task).filter(
        Reminder.id == reminder_id,
        Reminder.task.has(owner_id=user_id)
    ).first()


def get_reminders(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Reminder]:
    """
    获取用户提醒列表
    
    Args:
        db: 数据库会话
        user_id: 用户ID
        skip: 跳过的记录数
        limit: 返回的记录数限制
        
    Returns:
        List[Reminder]: 提醒对象列表
    """
    return db.query(Reminder).join(Reminder.task).filter(
        Reminder.task.has(owner_id=user_id)
    ).offset(skip).limit(limit).all()


def get_reminders_by_task(db: Session, task_id: int, user_id: int, skip: int = 0, limit: int = 100) -> List[Reminder]:
    """
    获取指定任务的提醒列表
    
    Args:
        db: 数据库会话
        task_id: 任务ID
        user_id: 用户ID
        skip: 跳过的记录数
        limit: 返回的记录数限制
        
    Returns:
        List[Reminder]: 提醒对象列表
    """
    return db.query(Reminder).join(Reminder.task).filter(
        Reminder.task_id == task_id,
        Reminder.task.has(owner_id=user_id)
    ).offset(skip).limit(limit).all()


def create_reminder(db: Session, reminder: ReminderCreate, user_id: int) -> Reminder:
    """
    创建新提醒
    
    Args:
        db: 数据库会话
        reminder: 提醒创建信息
        user_id: 用户ID
        
    Returns:
        Reminder: 新创建的提醒对象
        
    Raises:
        ValueError: 当任务不属于当前用户时抛出异常
    """
    # 检查任务是否属于当前用户
    from crud.task import get_task
    task = get_task(db, reminder.task_id, user_id)
    if not task:
        raise ValueError("Task not found or not owned by user")
    
    db_reminder = Reminder(
        task_id=reminder.task_id,
        reminder_time=reminder.reminder_time,
        reminder_type=reminder.reminder_type,
        method=reminder.method
    )
    db.add(db_reminder)
    db.commit()
    db.refresh(db_reminder)
    return db_reminder


def update_reminder(db: Session, db_reminder: Reminder, reminder_update: ReminderUpdate) -> Reminder:
    """
    更新提醒信息
    
    Args:
        db: 数据库会话
        db_reminder: 数据库中的提醒对象
        reminder_update: 提醒更新信息
        
    Returns:
        Reminder: 更新后的提醒对象
    """
    update_data = reminder_update.dict(exclude_unset=True)
        
    for field, value in update_data.items():
        setattr(db_reminder, field, value)
        
    db.commit()
    db.refresh(db_reminder)
    return db_reminder


def delete_reminder(db: Session, reminder_id: int, user_id: int) -> bool:
    """
    删除提醒
    
    Args:
        db: 数据库会话
        reminder_id: 提醒ID
        user_id: 用户ID
        
    Returns:
        bool: 删除成功返回True，否则返回False
    """
    db_reminder = db.query(Reminder).join(Reminder.task).filter(
        Reminder.id == reminder_id,
        Reminder.task.has(owner_id=user_id)
    ).first()
    
    if db_reminder:
        db.delete(db_reminder)
        db.commit()
        return True
    return False


def get_active_reminders(db: Session, user_id: int) -> List[Reminder]:
    """
    获取用户所有激活的提醒
    
    Args:
        db: 数据库会话
        user_id: 用户ID
        
    Returns:
        List[Reminder]: 激活的提醒对象列表
    """
    return db.query(Reminder).join(Reminder.task).filter(
        Reminder.task.has(owner_id=user_id),
        Reminder.is_active == True
    ).all()


def get_due_reminders(db: Session, user_id: int, current_time) -> List[Reminder]:
    """
    获取到期的提醒
    
    Args:
        db: 数据库会话
        user_id: 用户ID
        current_time: 当前时间
        
    Returns:
        List[Reminder]: 到期的提醒对象列表
    """
    return db.query(Reminder).join(Reminder.task).filter(
        Reminder.task.has(owner_id=user_id),
        Reminder.is_active == True,
        Reminder.reminder_time <= current_time
    ).all()