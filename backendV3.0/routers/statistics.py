"""
统计数据路由模块
处理统计数据相关的API端点
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, List, Any

import crud.statistics as crud_statistics
from core.deps import get_current_active_user
from database.database import get_db
from models.user import User as UserModel

router = APIRouter()

@router.get("/tasks/completion")
def get_task_completion_stats(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    获取任务完成情况统计
    
    Args:
        db: 数据库会话
        current_user: 当前认证用户
        
    Returns:
        Dict[str, Any]: 任务完成情况统计信息
    """
    return crud_statistics.get_task_completion_stats(db, user_id=current_user.id)


@router.get("/tasks/daily")
def get_daily_task_stats(
    days: int = 7,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
) -> List[Dict[str, Any]]:
    """
    获取每日任务统计
    
    Args:
        days: 天数范围，默认7天
        db: 数据库会话
        current_user: 当前认证用户
        
    Returns:
        List[Dict[str, Any]]: 每日任务统计数据列表
    """
    return crud_statistics.get_daily_task_stats(db, user_id=current_user.id, days=days)


@router.get("/tasks/category")
def get_category_task_stats(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
) -> List[Dict[str, Any]]:
    """
    获取各分类任务统计
    
    Args:
        db: 数据库会话
        current_user: 当前认证用户
        
    Returns:
        List[Dict[str, Any]]: 各分类任务统计数据列表
    """
    return crud_statistics.get_category_task_stats(db, user_id=current_user.id)


@router.get("/tasks/priority")
def get_priority_task_stats(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
) -> Dict[str, int]:
    """
    获取各优先级任务统计
    
    Args:
        db: 数据库会话
        current_user: 当前认证用户
        
    Returns:
        Dict[str, int]: 各优先级任务统计数据
    """
    return crud_statistics.get_priority_task_stats(db, user_id=current_user.id)


@router.get("/tasks/overdue")
def get_overdue_task_stats(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    获取逾期任务统计
    
    Args:
        db: 数据库会话
        current_user: 当前认证用户
        
    Returns:
        Dict[str, Any]: 逾期任务统计数据
    """
    return crud_statistics.get_overdue_task_stats(db, user_id=current_user.id)


@router.get("/summary")
def get_statistics_summary(
    days: int = 7,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    获取统计数据总览
    
    Args:
        days: 天数范围，默认7天
        db: 数据库会话
        current_user: 当前认证用户
        
    Returns:
        Dict[str, Any]: 统计数据总览
    """
    summary = {
        "task_completion": crud_statistics.get_task_completion_stats(db, user_id=current_user.id),
        "daily_stats": crud_statistics.get_daily_task_stats(db, user_id=current_user.id, days=days),
        "category_stats": crud_statistics.get_category_task_stats(db, user_id=current_user.id),
        "priority_stats": crud_statistics.get_priority_task_stats(db, user_id=current_user.id),
        "overdue_stats": crud_statistics.get_overdue_task_stats(db, user_id=current_user.id)
    }
    
    return summary