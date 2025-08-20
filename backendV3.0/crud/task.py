"""
任务 CRUD 操作模块
提供任务相关的数据库操作函数，包括创建、查询、更新和删除任务等功能
"""

from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from models.task import Task, TaskStatus
from models.user import User
from schemas.task import TaskCreate, TaskUpdate
from typing import Optional, List
from datetime import datetime


def get_task(db: Session, task_id: int, user_id: int) -> Optional[Task]:
    """
    根据任务ID获取任务信息（不包括已删除的任务）
    
    Args:
        db: 数据库会话
        task_id: 任务ID
        user_id: 用户ID
        
    Returns:
        Task: 任务对象或None
    """
    return db.query(Task).filter(
        and_(
            Task.id == task_id,
            Task.owner_id == user_id,
            Task.status != TaskStatus.DELETED  # 不返回已删除的任务
        )
    ).first()


def get_tasks(
    db: Session, 
    user_id: int, 
    skip: int = 0, 
    limit: int = 100,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    category_id: Optional[int] = None
) -> List[Task]:
    """
    获取用户任务列表，支持筛选和分页
    
    Args:
        db: 数据库会话
        user_id: 用户ID
        skip: 跳过的记录数
        limit: 返回的记录数限制
        status: 任务状态筛选
        priority: 任务优先级筛选
        category_id: 分类ID筛选
        
    Returns:
        List[Task]: 任务对象列表
    """
    query = db.query(Task).filter(
        and_(
            Task.owner_id == user_id,
            Task.status != TaskStatus.DELETED  # 默认不包括已删除的任务
        )
    )
    
    # 如果提供了状态筛选，则使用提供的状态，否则默认排除已删除状态
    if status:
        # 支持多个状态筛选，用逗号分隔
        status_list = status.split(',')
        status_filters = [Task.status == s.strip() for s in status_list]
        query = query.filter(or_(*status_filters))
    
    if priority:
        query = query.filter(Task.priority == priority)
        
    if category_id is not None:
        query = query.filter(Task.category_id == category_id)
        
    return query.offset(skip).limit(limit).all()


def get_public_tasks(db: Session, skip: int = 0, limit: int = 100) -> List[Task]:
    """
    获取公开任务列表
    
    Args:
        db: 数据库会话
        skip: 跳过的记录数
        limit: 返回的记录数限制
        
    Returns:
        List[Task]: 公开任务对象列表
    """
    return db.query(Task).filter(
        and_(
            Task.is_public == True,
            Task.status != "deleted"
        )
    ).offset(skip).limit(limit).all()


def create_task(db: Session, task: TaskCreate, owner_id: int) -> Task:
    """
    创建新任务
    
    Args:
        db: 数据库会话
        task: 任务创建信息
        owner_id: 任务所有者ID
        
    Returns:
        Task: 新创建的任务对象
    """
    db_task = Task(
        title=task.title,
        description=task.description,
        due_date=task.due_date,
        priority=task.priority,
        category_id=task.category_id,
        is_public=task.is_public,
        owner_id=owner_id
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


def update_task(db: Session, db_task: Task, task_update: TaskUpdate) -> Task:
    """
    更新任务信息
    
    Args:
        db: 数据库会话
        db_task: 数据库中的任务对象
        task_update: 任务更新信息
        
    Returns:
        Task: 更新后的任务对象
    """
    update_data = task_update.dict(exclude_unset=True)
        
    for field, value in update_data.items():
        setattr(db_task, field, value)
        
    db_task.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_task)
    return db_task


def delete_task(db: Session, task_id: int, user_id: int) -> bool:
    """
    删除任务（移动到回收站）
    
    Args:
        db: 数据库会话
        task_id: 任务ID
        user_id: 用户ID
        
    Returns:
        bool: 删除成功返回True，否则返回False
    """
    db_task = db.query(Task).filter(
        and_(
            Task.id == task_id,
            Task.owner_id == user_id
        )
    ).first()
    
    if db_task:
        db_task.status = "deleted"
        db.commit()
        return True
    return False


def permanently_delete_task(db: Session, task_id: int, user_id: int) -> bool:
    """
    永久删除任务
    
    Args:
        db: 数据库会话
        task_id: 任务ID
        user_id: 用户ID
        
    Returns:
        bool: 删除成功返回True，否则返回False
    """
    db_task = db.query(Task).filter(
        and_(
            Task.id == task_id,
            Task.owner_id == user_id,
            Task.status == TaskStatus.DELETED  # 确保只永久删除回收站中的任务
        )
    ).first()
    
    if db_task:
        db.delete(db_task)
        db.commit()
        return True
    return False


def restore_task(db: Session, task_id: int, user_id: int) -> Optional[Task]:
    """
    恢复任务（从回收站中恢复）
    
    Args:
        db: 数据库会话
        task_id: 任务ID
        user_id: 用户ID
        
    Returns:
        Task: 恢复后的任务对象，如果任务不存在则返回None
    """
    db_task = db.query(Task).filter(
        and_(
            Task.id == task_id,
            Task.owner_id == user_id,
            Task.status == "deleted"
        )
    ).first()
    
    if db_task:
        db_task.status = "pending"
        db.commit()
        db.refresh(db_task)
        return db_task
    return None


def get_deleted_tasks(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Task]:
    """
    获取用户已删除的任务列表（回收站）
    
    Args:
        db: 数据库会话
        user_id: 用户ID
        skip: 跳过的记录数
        limit: 返回的记录数限制
        
    Returns:
        List[Task]: 已删除的任务对象列表
    """
    return db.query(Task).filter(
        and_(
            Task.owner_id == user_id,
            Task.status == TaskStatus.DELETED
        )
    ).offset(skip).limit(limit).all()


def batch_update_tasks(db: Session, user_id: int, task_ids: List[int], priority: Optional[str] = None, category_id: Optional[int] = None) -> int:
    """
    批量更新任务信息（仅支持更新优先级和分类）
    
    Args:
        db: 数据库会话
        user_id: 用户ID
        task_ids: 任务ID列表
        priority: 新的优先级
        category_id: 新的分类ID
        
    Returns:
        int: 更新的任务数量
    """
    # 查询需要更新的任务（必须属于当前用户）
    query = db.query(Task).filter(
        and_(
            Task.id.in_(task_ids),
            Task.owner_id == user_id
        )
    )
    
    # 执行更新
    update_data = {}
    if priority is not None:
        update_data["priority"] = priority
    if category_id is not None:
        update_data["category_id"] = category_id
    
    if update_data:
        updated_count = query.update(update_data, synchronize_session=False)
        db.commit()
        return updated_count
    else:
        return 0


def batch_delete_tasks(db: Session, user_id: int, task_ids: List[int]) -> int:
    """
    批量删除任务（移动到回收站）
    
    Args:
        db: 数据库会话
        user_id: 用户ID
        task_ids: 任务ID列表
        
    Returns:
        int: 删除的任务数量
    """
    # 查询需要删除的任务（必须属于当前用户且不在回收站中）
    query = db.query(Task).filter(
        and_(
            Task.id.in_(task_ids),
            Task.owner_id == user_id,
            Task.status != "deleted"
        )
    )
    
    # 更新状态为已删除
    updated_count = query.update({"status": "deleted"}, synchronize_session=False)
    db.commit()
    return updated_count
