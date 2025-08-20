"""
用户 CRUD 操作模块
提供用户相关的数据库操作函数，包括创建、查询、更新和删除用户等功能
"""

from sqlalchemy.orm import Session
from models.user import User, UserRole
from schemas.user import UserCreate, UserUpdate, UserSettingsUpdate, PasswordChange
from core.security import get_password_hash, verify_password
from typing import Optional, List


def get_user(db: Session, user_id: int) -> Optional[User]:
    """
    根据用户ID获取用户信息
    
    Args:
        db: 数据库会话
        user_id: 用户ID
        
    Returns:
        User: 用户对象或None
    """
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    """
    根据用户名获取用户信息
    
    Args:
        db: 数据库会话
        username: 用户名
        
    Returns:
        User: 用户对象或None
    """
    return db.query(User).filter(User.username == username).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """
    根据邮箱获取用户信息
    
    Args:
        db: 数据库会话
        email: 邮箱地址
        
    Returns:
        User: 用户对象或None
    """
    return db.query(User).filter(User.email == email).first()


def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    """
    获取用户列表
    
    Args:
        db: 数据库会话
        skip: 跳过的记录数
        limit: 返回的记录数限制
        
    Returns:
        List[User]: 用户对象列表
    """
    return db.query(User).offset(skip).limit(limit).all()


def create_user(db: Session, user: UserCreate) -> User:
    """
    创建新用户
    
    Args:
        db: 数据库会话
        user: 用户创建信息
        
    Returns:
        User: 新创建的用户对象
    """
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=get_password_hash(user.password),
        role=getattr(user, 'role', UserRole.USER) if hasattr(user, 'role') else UserRole.USER  # 确保有默认角色
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user(db: Session, db_user: User, user_update: UserUpdate) -> User:
    """
    更新用户信息
    
    Args:
        db: 数据库会话
        db_user: 数据库中的用户对象
        user_update: 用户更新信息
        
    Returns:
        User: 更新后的用户对象
    """
    update_data = user_update.dict(exclude_unset=True)
    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
    else:
        update_data.pop("password", None)
        
    for field, value in update_data.items():
        setattr(db_user, field, value)
        
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user_settings(db: Session, db_user: User, settings_update: UserSettingsUpdate) -> User:
    """
    更新用户个人设置
    
    Args:
        db: 数据库会话
        db_user: 数据库中的用户对象
        settings_update: 用户设置更新信息
        
    Returns:
        User: 更新后的用户对象
    """
    update_data = settings_update.dict(exclude_unset=True)
        
    for field, value in update_data.items():
        setattr(db_user, field, value)
        
    db.commit()
    db.refresh(db_user)
    return db_user


def change_user_password(db: Session, db_user: User, password_change: PasswordChange) -> bool:
    """
    修改用户密码
    
    Args:
        db: 数据库会话
        db_user: 数据库中的用户对象
        password_change: 密码修改信息
        
    Returns:
        bool: 修改成功返回True，否则返回False
    """
    # 验证当前密码
    if not verify_password(password_change.current_password, db_user.hashed_password):
        return False
    
    # 更新密码
    db_user.hashed_password = get_password_hash(password_change.new_password)
    db.commit()
    return True


def delete_user(db: Session, user_id: int) -> User:
    """
    删除用户
    
    Args:
        db: 数据库会话
        user_id: 用户ID
        
    Returns:
        User: 被删除的用户对象
    """
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user:
        # 在删除前先获取用户信息用于返回
        deleted_user_data = User(
            id=db_user.id,
            username=db_user.username,
            email=db_user.email,
            role=db_user.role,
            is_active=db_user.is_active,
            nickname=db_user.nickname,
            avatar_url=db_user.avatar_url,
            theme=db_user.theme,
            theme_color=db_user.theme_color,
            night_mode_brightness=db_user.night_mode_brightness,
            notification_enabled=db_user.notification_enabled,
            default_reminder_method=db_user.default_reminder_method
        )
        db.delete(db_user)
        db.commit()
        return deleted_user_data
    return None