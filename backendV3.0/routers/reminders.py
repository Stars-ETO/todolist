"""
提醒管理路由模块
处理提醒管理相关的API端点
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import datetime

import crud.reminder as crud_reminder
import crud.task as crud_task
from core.deps import get_current_active_user
from database.database import get_db
from schemas.reminder import Reminder, ReminderCreate, ReminderUpdate
from models.user import User as UserModel

router = APIRouter()

@router.get("/", response_model=List[Reminder])
def read_reminders(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
) -> List[Reminder]:
    """
    获取当前用户提醒列表
    
    Args:
        skip: 跳过的记录数
        limit: 返回的记录数限制
        db: 数据库会话
        current_user: 当前认证用户
        
    Returns:
        List[Reminder]: 提醒对象列表
    """
    reminders = crud_reminder.get_reminders(db, user_id=current_user.id, skip=skip, limit=limit)
    return reminders


@router.post("/", response_model=Reminder)
def create_reminder(
    reminder: ReminderCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
) -> Reminder:
    """
    创建新提醒
    
    Args:
        reminder: 提醒创建信息
        db: 数据库会话
        current_user: 当前认证用户
        
    Returns:
        Reminder: 新创建的提醒对象
        
    Raises:
        HTTPException: 当任务不存在或不属于当前用户时抛出400异常
    """
    try:
        return crud_reminder.create_reminder(db=db, reminder=reminder, user_id=current_user.id)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@router.get("/{reminder_id}", response_model=Reminder)
def read_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
) -> Reminder:
    """
    获取指定提醒信息
    
    Args:
        reminder_id: 提醒ID
        db: 数据库会话
        current_user: 当前认证用户
        
    Returns:
        Reminder: 提醒对象
        
    Raises:
        HTTPException: 当提醒不存在时抛出404异常
    """
    db_reminder = crud_reminder.get_reminder(db, reminder_id=reminder_id, user_id=current_user.id)
    if db_reminder is None:
        raise HTTPException(
            status_code=404,
            detail="Reminder not found"
        )
    return db_reminder


@router.put("/{reminder_id}", response_model=Reminder)
def update_reminder(
    reminder_id: int,
    reminder_update: ReminderUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
) -> Reminder:
    """
    更新提醒信息
    
    Args:
        reminder_id: 提醒ID
        reminder_update: 提醒更新信息
        db: 数据库会话
        current_user: 当前认证用户
        
    Returns:
        Reminder: 更新后的提醒对象
        
    Raises:
        HTTPException: 当提醒不存在时抛出404异常
    """
    db_reminder = crud_reminder.get_reminder(db, reminder_id=reminder_id, user_id=current_user.id)
    if db_reminder is None:
        raise HTTPException(
            status_code=404,
            detail="Reminder not found"
        )
    
    # 检查任务是否属于当前用户（如果更新了任务ID）
    if reminder_update.task_id and reminder_update.task_id != db_reminder.task_id:
        task = crud_task.get_task(db, task_id=reminder_update.task_id, user_id=current_user.id)
        if not task:
            raise HTTPException(
                status_code=400,
                detail="Task not found or not owned by user"
            )
    
    return crud_reminder.update_reminder(db=db, db_reminder=db_reminder, reminder_update=reminder_update)


@router.delete("/{reminder_id}", response_model=bool)
def delete_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
) -> bool:
    """
    删除提醒
    
    Args:
        reminder_id: 提醒ID
        db: 数据库会话
        current_user: 当前认证用户
        
    Returns:
        bool: 删除成功返回True，否则返回False
        
    Raises:
        HTTPException: 当提醒不存在时抛出404异常
    """
    db_reminder = crud_reminder.get_reminder(db, reminder_id=reminder_id, user_id=current_user.id)
    if db_reminder is None:
        raise HTTPException(
            status_code=404,
            detail="Reminder not found"
        )
    
    return crud_reminder.delete_reminder(db=db, reminder_id=reminder_id, user_id=current_user.id)


@router.get("/tasks/{task_id}", response_model=List[Reminder])
def read_reminders_by_task(
    task_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
) -> List[Reminder]:
    """
    获取指定任务的提醒列表
    
    Args:
        task_id: 任务ID
        skip: 跳过的记录数
        limit: 返回的记录数限制
        db: 数据库会话
        current_user: 当前认证用户
        
    Returns:
        List[Reminder]: 提醒对象列表
        
    Raises:
        HTTPException: 当任务不存在或不属于当前用户时抛出404异常
    """
    # 检查任务是否属于当前用户
    task = crud_task.get_task(db, task_id=task_id, user_id=current_user.id)
    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )
    
    reminders = crud_reminder.get_reminders_by_task(
        db, 
        task_id=task_id, 
        user_id=current_user.id, 
        skip=skip, 
        limit=limit
    )
    return reminders


@router.post("/{reminder_id}/activate", response_model=Reminder)
def activate_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
) -> Reminder:
    """
    激活提醒
    
    Args:
        reminder_id: 提醒ID
        db: 数据库会话
        current_user: 当前认证用户
        
    Returns:
        Reminder: 更新后的提醒对象
        
    Raises:
        HTTPException: 当提醒不存在时抛出404异常
    """
    db_reminder = crud_reminder.get_reminder(db, reminder_id=reminder_id, user_id=current_user.id)
    if db_reminder is None:
        raise HTTPException(
            status_code=404,
            detail="Reminder not found"
        )
    
    reminder_update = ReminderUpdate(is_active=True)
    return crud_reminder.update_reminder(db=db, db_reminder=db_reminder, reminder_update=reminder_update)


@router.post("/{reminder_id}/deactivate", response_model=Reminder)
def deactivate_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
) -> Reminder:
    """
    停用提醒
    
    Args:
        reminder_id: 提醒ID
        db: 数据库会话
        current_user: 当前认证用户
        
    Returns:
        Reminder: 更新后的提醒对象
        
    Raises:
        HTTPException: 当提醒不存在时抛出404异常
    """
    db_reminder = crud_reminder.get_reminder(db, reminder_id=reminder_id, user_id=current_user.id)
    if db_reminder is None:
        raise HTTPException(
            status_code=404,
            detail="Reminder not found"
        )
    
    reminder_update = ReminderUpdate(is_active=False)
    return crud_reminder.update_reminder(db=db, db_reminder=db_reminder, reminder_update=reminder_update)