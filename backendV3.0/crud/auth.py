"""
认证相关的 CRUD 操作模块
提供用户认证相关的数据库操作函数
"""

from sqlalchemy.orm import Session
from models.user import User
from core.security import verify_password
from typing import Optional


def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    """
    验证用户身份
    
    Args:
        db: 数据库会话
        username: 用户名
        password: 明文密码
        
    Returns:
        User: 验证成功的用户对象，验证失败返回None
    """
    user = get_user_by_username(db, username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


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


