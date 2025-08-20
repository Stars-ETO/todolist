"""
个人设置路由模块
处理用户个人设置相关的API端点
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any

import crud.user as crud_user
from core.deps import get_current_active_user
from core.security import get_password_hash
from database.database import get_db
from schemas.user import User, UserSettingsUpdate, PasswordChange
from models.user import User as UserModel

router = APIRouter()

@router.get("/profile", response_model=User)
def get_user_profile(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
) -> UserModel:
    """
    获取当前用户个人信息
    
    Args:
        db: 数据库会话
        current_user: 当前认证用户
        
    Returns:
        User: 用户信息
    """
    return current_user


@router.put("/profile", response_model=User)
def update_user_profile(
    user_update: UserSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
) -> UserModel:
    """
    更新用户个人信息
    
    Args:
        user_update: 用户信息更新数据
        db: 数据库会话
        current_user: 当前认证用户
        
    Returns:
        User: 更新后的用户信息
    """
    updated_user = crud_user.update_user_settings(db=db, db_user=current_user, settings_update=user_update)
    return updated_user


@router.put("/password", response_model=Dict[str, Any])
def change_password(
    password_change: PasswordChange,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    修改用户密码
    
    Args:
        password_change: 密码修改数据
        db: 数据库会话
        current_user: 当前认证用户
        
    Returns:
        Dict[str, Any]: 操作结果
        
    Raises:
        HTTPException: 当当前密码错误时抛出400异常
    """
    success = crud_user.change_user_password(db=db, db_user=current_user, password_change=password_change)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    return {"message": "Password updated successfully"}


@router.delete("/account", response_model=Dict[str, Any])
def delete_account(
    password: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    删除用户账户
    
    Args:
        password: 用户当前密码
        db: 数据库会话
        current_user: 当前认证用户
        
    Returns:
        Dict[str, Any]: 操作结果
        
    Raises:
        HTTPException: 当密码错误时抛出400异常
    """
    # 验证密码
    from core.security import verify_password
    if not verify_password(password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect password"
        )
    
    # 删除用户
    crud_user.delete_user(db=db, user_id=current_user.id)
    
    return {"message": "Account deleted successfully"}