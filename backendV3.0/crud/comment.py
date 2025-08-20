"""
评论 CRUD 操作模块
提供评论相关的数据库操作函数，包括创建、查询、更新和删除评论等功能
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_
from models.comment import Comment
from models.task import Task
from schemas.comment import CommentCreate, CommentUpdate
from typing import Optional, List
from datetime import datetime


def get_comment(db: Session, comment_id: int) -> Optional[Comment]:
    """
    根据评论ID获取评论信息
    
    Args:
        db: 数据库会话
        comment_id: 评论ID
        
    Returns:
        Comment: 评论对象或None
    """
    return db.query(Comment).filter(Comment.id == comment_id).first()


def get_comments_by_task(db: Session, task_id: int, skip: int = 0, limit: int = 100) -> List[Comment]:
    """
    获取指定任务的评论列表
    
    Args:
        db: 数据库会话
        task_id: 任务ID
        skip: 跳过的记录数
        limit: 返回的记录数限制
        
    Returns:
        List[Comment]: 评论对象列表
    """
    return db.query(Comment).filter(Comment.task_id == task_id).offset(skip).limit(limit).all()


def create_comment(db: Session, comment: CommentCreate, user_id: int) -> Optional[Comment]:
    """
    创建新评论
    
    Args:
        db: 数据库会话
        comment: 评论创建信息
        user_id: 评论创建者ID
        
    Returns:
        Comment: 新创建的评论对象，如果任务不存在或不是公开的则返回None
    """
    # 检查任务是否存在且是公开的
    task = db.query(Task).filter(
        and_(
            Task.id == comment.task_id,
            Task.is_public == True,
            Task.status != "deleted"
        )
    ).first()
    
    if not task:
        return None
    
    db_comment = Comment(
        content=comment.content,
        task_id=comment.task_id,
        user_id=user_id
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment


def update_comment(db: Session, db_comment: Comment, comment_update: CommentUpdate, user_id: int) -> Optional[Comment]:
    """
    更新评论信息（仅评论创建者可以更新）
    
    Args:
        db: 数据库会话
        db_comment: 数据库中的评论对象
        comment_update: 评论更新信息
        user_id: 用户ID
        
    Returns:
        Comment: 更新后的评论对象，如果不是评论创建者则返回None
    """
    # 检查是否是评论创建者
    if db_comment.user_id != user_id:
        return None
    
    update_data = comment_update.dict(exclude_unset=True)
        
    for field, value in update_data.items():
        setattr(db_comment, field, value)
        
    db_comment.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_comment)
    return db_comment


def delete_comment(db: Session, comment_id: int, user_id: int) -> bool:
    """
    删除评论（仅评论创建者可以删除）
    
    Args:
        db: 数据库会话
        comment_id: 评论ID
        user_id: 用户ID
        
    Returns:
        bool: 删除成功返回True，否则返回False
    """
    db_comment = db.query(Comment).filter(
        and_(
            Comment.id == comment_id,
            Comment.user_id == user_id
        )
    ).first()
    
    if db_comment:
        db.delete(db_comment)
        db.commit()
        return True
    return False