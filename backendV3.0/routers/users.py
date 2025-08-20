"""
用户管理路由模块
处理用户管理相关的API端点，仅管理员可访问
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import crud.user as crud_user
from core.deps import get_current_active_admin, get_current_active_user
from database.database import get_db
from schemas.user import User, UserCreate, UserUpdate, PasswordChange
from models.user import User as UserModel

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/me", response_model=User)
def read_user_me(
    current_user: UserModel = Depends(get_current_active_user)
) -> UserModel:
    """
    获取当前用户信息
    
    Args:
        current_user: 当前认证用户
        
    Returns:
        User: 当前用户信息
    """
    return current_user


@router.get("/", response_model=List[User])
def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_admin)
) -> List[User]:
    """
    获取用户列表，仅管理员可访问
    
    Args:
        skip: 跳过的记录数
        limit: 返回的记录数限制
        db: 数据库会话
        current_user: 当前认证的管理员用户
        
    Returns:
        List[User]: 用户对象列表
    """
    logger.info(f"Admin {current_user.username} fetching user list (skip={skip}, limit={limit})")
    users = crud_user.get_users(db, skip=skip, limit=limit)
    logger.info(f"Admin {current_user.username} successfully fetched {len(users)} users")
    return users


@router.post("/", response_model=User)
def create_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_admin)
) -> User:
    """
    创建新用户，仅管理员可访问
    
    Args:
        user: 用户创建信息
        db: 数据库会话
        current_user: 当前认证的管理员用户
        
    Returns:
        User: 新创建的用户对象
        
    Raises:
        HTTPException: 当用户名或邮箱已被使用时抛出400异常
    """
    logger.info(f"Admin {current_user.username} attempting to create new user: {user.username}")
    
    # 检查用户名是否已存在
    db_user = crud_user.get_user_by_username(db, username=user.username)
    if db_user:
        logger.warning(f"Admin {current_user.username} failed to create user: username '{user.username}' already exists")
        raise HTTPException(
            status_code=400,
            detail="Username already registered"
        )
    
    # 检查邮箱是否已存在
    db_user = crud_user.get_user_by_email(db, email=user.email)
    if db_user:
        logger.warning(f"Admin {current_user.username} failed to create user: email '{user.email}' already exists")
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # 创建新用户
    new_user = crud_user.create_user(db=db, user=user)
    logger.info(f"Admin {current_user.username} successfully created user: {new_user.username} (ID: {new_user.id})")
    return new_user


@router.get("/{user_id}", response_model=User)
def read_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_admin)
) -> User:
    """
    获取指定用户的信息，仅管理员可访问
    
    Args:
        user_id: 用户ID
        db: 数据库会话
        current_user: 当前认证的管理员用户
        
    Returns:
        User: 用户对象
        
    Raises:
        HTTPException: 当用户不存在时抛出404异常
    """
    logger.info(f"Admin {current_user.username} requesting information for user ID: {user_id}")
    
    db_user = crud_user.get_user(db, user_id=user_id)
    if db_user is None:
        logger.warning(f"Admin {current_user.username} requested non-existent user ID: {user_id}")
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    
    logger.info(f"Admin {current_user.username} successfully fetched information for user: {db_user.username}")
    return db_user


@router.put("/{user_id}", response_model=User)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_admin)
) -> User:
    """
    更新用户信息，仅管理员可访问
    
    Args:
        user_id: 用户ID
        user_update: 用户更新信息
        db: 数据库会话
        current_user: 当前认证的管理员用户
        
    Returns:
        User: 更新后的用户对象
        
    Raises:
        HTTPException: 当用户不存在时抛出404异常
    """
    logger.info(f"Admin {current_user.username} attempting to update user ID: {user_id}")
    
    db_user = crud_user.get_user(db, user_id=user_id)
    if db_user is None:
        logger.warning(f"Admin {current_user.username} attempted to update non-existent user ID: {user_id}")
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    
    updated_user = crud_user.update_user(db=db, db_user=db_user, user_update=user_update)
    logger.info(f"Admin {current_user.username} successfully updated user: {updated_user.username}")
    return updated_user


@router.put("/{user_id}/password", response_model=User)
def reset_user_password(
    user_id: int,
    password_change: PasswordChange,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_admin)
) -> User:
    """
    重置用户密码，仅管理员可访问
    
    Args:
        user_id: 用户ID
        password_change: 密码修改信息（需要提供当前密码和新密码）
        db: 数据库会话
        current_user: 当前认证的管理员用户
        
    Returns:
        User: 更新后的用户对象
        
    Raises:
        HTTPException: 当用户不存在时抛出404异常
        HTTPException: 当当前密码不正确时抛出400异常
    """
    logger.info(f"Admin {current_user.username} attempting to reset password for user ID: {user_id}")
    
    db_user = crud_user.get_user(db, user_id=user_id)
    if db_user is None:
        logger.warning(f"Admin {current_user.username} attempted to reset password for non-existent user ID: {user_id}")
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    
    # 管理员重置密码时不需要验证当前密码
    db_user.hashed_password = crud_user.get_password_hash(password_change.new_password)
    db.commit()
    db.refresh(db_user)
    
    logger.info(f"Admin {current_user.username} successfully reset password for user: {db_user.username}")
    return db_user


@router.delete("/{user_id}", response_model=User)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_admin)
) -> User:
    """
    删除用户，仅管理员可访问
    
    Args:
        user_id: 用户ID
        db: 数据库会话
        current_user: 当前认证的管理员用户
        
    Returns:
        User: 被删除的用户对象
        
    Raises:
        HTTPException: 当用户不存在时抛出404异常
    """
    logger.info(f"Admin {current_user.username} attempting to delete user ID: {user_id}")
    
    deleted_user = crud_user.delete_user(db=db, user_id=user_id)
    if deleted_user is None:
        logger.warning(f"Admin {current_user.username} attempted to delete non-existent user ID: {user_id}")
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    
    logger.info(f"Admin {current_user.username} successfully deleted user: {deleted_user.username}")
    return deleted_user