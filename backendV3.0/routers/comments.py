"""
评论管理路由模块
处理评论管理相关的API端点
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import crud.comment as crud_comment
from core.deps import get_current_active_user
from database.database import get_db
from schemas.comment import Comment, CommentCreate, CommentUpdate
from models.user import User as UserModel

router = APIRouter()

@router.get("/task/{task_id}", response_model=List[Comment])
def read_task_comments(
    task_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
) -> List[Comment]:
    """
    获取指定任务的评论列表
    
    Args:
        task_id: 任务ID
        skip: 跳过的记录数
        limit: 返回的记录数限制
        db: 数据库会话
        current_user: 当前认证用户
        
    Returns:
        List[Comment]: 评论对象列表
    """
    comments = crud_comment.get_comments_by_task(db, task_id=task_id, skip=skip, limit=limit)
    return comments


@router.post("/", response_model=Comment)
def create_comment(
    comment: CommentCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
) -> Comment:
    """
    创建新评论
    
    Args:
        comment: 评论创建信息
        db: 数据库会话
        current_user: 当前认证用户
        
    Returns:
        Comment: 新创建的评论对象
        
    Raises:
        HTTPException: 当任务不存在或不是公开任务时抛出400异常
    """
    db_comment = crud_comment.create_comment(db=db, comment=comment, user_id=current_user.id)
    if db_comment is None:
        raise HTTPException(
            status_code=400,
            detail="Task not found or not public"
        )
    return db_comment


@router.put("/{comment_id}", response_model=Comment)
def update_comment(
    comment_id: int,
    comment_update: CommentUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
) -> Comment:
    """
    更新评论信息（仅评论创建者可以更新）
    
    Args:
        comment_id: 评论ID
        comment_update: 评论更新信息
        db: 数据库会话
        current_user: 当前认证用户
        
    Returns:
        Comment: 更新后的评论对象
        
    Raises:
        HTTPException: 当评论不存在或用户无权限时抛出404异常
    """
    db_comment = crud_comment.get_comment(db, comment_id=comment_id)
    if db_comment is None:
        raise HTTPException(
            status_code=404,
            detail="Comment not found"
        )
    
    updated_comment = crud_comment.update_comment(
        db=db, 
        db_comment=db_comment, 
        comment_update=comment_update,
        user_id=current_user.id
    )
    
    if updated_comment is None:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to update this comment"
        )
        
    return updated_comment


@router.delete("/{comment_id}", response_model=bool)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
) -> bool:
    """
    删除评论（仅评论创建者可以删除）
    
    Args:
        comment_id: 评论ID
        db: 数据库会话
        current_user: 当前认证用户
        
    Returns:
        bool: 删除成功返回True，否则返回False
        
    Raises:
        HTTPException: 当评论不存在或用户无权限时抛出404异常
    """
    db_comment = crud_comment.get_comment(db, comment_id=comment_id)
    if db_comment is None:
        raise HTTPException(
            status_code=404,
            detail="Comment not found"
        )
    
    if not crud_comment.delete_comment(db=db, comment_id=comment_id, user_id=current_user.id):
        raise HTTPException(
            status_code=403,
            detail="Not authorized to delete this comment"
        )
        
    return True