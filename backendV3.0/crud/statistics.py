"""
统计数据 CRUD 操作模块
提供统计数据相关的数据库查询函数
"""

from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from models.task import Task
from models.category import Category
from datetime import datetime, timedelta
from typing import List, Dict, Any


def get_task_completion_stats(db: Session, user_id: int) -> Dict[str, Any]:
    """
    获取用户任务完成情况统计
    
    Args:
        db: 数据库会话
        user_id: 用户ID
        
    Returns:
        Dict[str, Any]: 任务完成情况统计信息
    """
    # 总任务数（不包括已删除的任务）
    total_tasks = db.query(Task).filter(
        and_(
            Task.owner_id == user_id,
            Task.status != "deleted"
        )
    ).count()
    
    # 已完成任务数
    completed_tasks = db.query(Task).filter(
        and_(
            Task.owner_id == user_id,
            Task.status == "completed"
        )
    ).count()
    
    # 未完成任务数（待处理和进行中的任务）
    pending_tasks = db.query(Task).filter(
        and_(
            Task.owner_id == user_id,
            Task.status == "pending"
        )
    ).count()
    
    # 进行中任务数
    in_progress_tasks = db.query(Task).filter(
        and_(
            Task.owner_id == user_id,
            Task.status == "in_progress"
        )
    ).count()
    
    # 已删除任务数
    deleted_tasks = db.query(Task).filter(
        and_(
            Task.owner_id == user_id,
            Task.status == "deleted"
        )
    ).count()
    
    # 计算完成率
    completion_rate = 0.0
    if total_tasks > 0:
        completion_rate = round((completed_tasks / total_tasks) * 100, 2)
    
    return {
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "pending_tasks": pending_tasks,
        "in_progress_tasks": in_progress_tasks,
        "deleted_tasks": deleted_tasks,
        "completion_rate": completion_rate
    }


def get_daily_task_stats(db: Session, user_id: int, days: int = 7) -> List[Dict[str, Any]]:
    """
    获取用户每日任务统计（默认最近7天）
    
    Args:
        db: 数据库会话
        user_id: 用户ID
        days: 天数范围，默认7天
        
    Returns:
        List[Dict[str, Any]]: 每日任务统计数据列表
    """
    # 计算起始日期
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # 查询每日创建任务数
    created_stats = db.query(
        func.date(Task.created_at).label('date'),
        func.count(Task.id).label('created_count')
    ).filter(
        and_(
            Task.owner_id == user_id,
            Task.created_at >= start_date
        )
    ).group_by(func.date(Task.created_at)).all()
    
    # 查询每日完成任务数
    completed_stats = db.query(
        func.date(Task.updated_at).label('date'),
        func.count(Task.id).label('completed_count')
    ).filter(
        and_(
            Task.owner_id == user_id,
            Task.status == "completed",
            Task.updated_at >= start_date
        )
    ).group_by(func.date(Task.updated_at)).all()
    
    # 构建日期范围
    date_range = [(start_date + timedelta(days=i)).date() for i in range(days + 1)]
    
    # 整理数据
    result = []
    created_dict = {stat.date: stat.created_count for stat in created_stats}
    completed_dict = {stat.date: stat.completed_count for stat in completed_stats}
    
    for date in date_range:
        result.append({
            "date": date.isoformat(),
            "created_count": created_dict.get(date, 0),
            "completed_count": completed_dict.get(date, 0)
        })
    
    return result


def get_category_task_stats(db: Session, user_id: int) -> List[Dict[str, Any]]:
    """
    获取用户各分类任务统计（仅统计未完成的任务）
    
    Args:
        db: 数据库会话
        user_id: 用户ID
        
    Returns:
        List[Dict[str, Any]]: 各分类任务统计数据列表
    """
    # 查询各分类任务数（仅统计未完成的任务）
    stats = db.query(
        Category.name.label('category_name'),
        func.count(Task.id).label('task_count')
    ).outerjoin(Task, and_(
        Task.category_id == Category.id,
        Task.owner_id == user_id,
        Task.status != "completed",
        Task.status != "deleted"
    )).filter(Category.owner_id == user_id).group_by(Category.id, Category.name).all()
    
    # 查询未分类任务数（仅统计未完成的任务）
    uncategorized_count = db.query(Task).filter(
        and_(
            Task.owner_id == user_id,
            Task.category_id.is_(None),
            Task.status != "completed",
            Task.status != "deleted"
        )
    ).count()
    
    # 整理数据
    result = [{"category_name": stat.category_name, "task_count": stat.task_count} for stat in stats]
    result.append({"category_name": "未分类", "task_count": uncategorized_count})
    
    return result


def get_priority_task_stats(db: Session, user_id: int) -> Dict[str, int]:
    """
    获取用户各优先级任务统计（仅统计未完成的任务）
    
    Args:
        db: 数据库会话
        user_id: 用户ID
        
    Returns:
        Dict[str, int]: 各优先级任务统计数据
    """
    # 查询各优先级任务数（仅统计未完成的任务）
    stats = db.query(
        Task.priority,
        func.count(Task.id).label('count')
    ).filter(
        and_(
            Task.owner_id == user_id,
            Task.status != "completed",
            Task.status != "deleted"
        )
    ).group_by(Task.priority).all()
    
    # 整理数据
    result = {str(stat.priority): stat.count for stat in stats}
    
    # 确保所有优先级都有数据
    from schemas.task import Priority
    for priority in Priority:
        if str(priority) not in result:
            result[str(priority)] = 0
    
    return result


def get_overdue_task_stats(db: Session, user_id: int) -> Dict[str, Any]:
    """
    获取用户逾期任务统计（仅统计未完成且逾期的任务）
    
    Args:
        db: 数据库会话
        user_id: 用户ID
        
    Returns:
        Dict[str, Any]: 逾期任务统计数据
    """
    from datetime import datetime
    
    # 查询逾期任务数（仅统计未完成且逾期的任务）
    overdue_count = db.query(Task).filter(
        and_(
            Task.owner_id == user_id,
            Task.due_date < datetime.utcnow(),
            Task.status != "completed",
            Task.status != "deleted"
        )
    ).count()
    
    # 查询总任务数（仅统计未完成的任务）
    total_count = db.query(Task).filter(
        and_(
            Task.owner_id == user_id,
            Task.status != "completed",
            Task.status != "deleted"
        )
    ).count()
    
    # 计算逾期率
    overdue_rate = 0.0
    if total_count > 0:
        overdue_rate = round((overdue_count / total_count) * 100, 2)
    
    return {
        "overdue_tasks": overdue_count,
        "total_tasks": total_count,
        "overdue_rate": overdue_rate
    }