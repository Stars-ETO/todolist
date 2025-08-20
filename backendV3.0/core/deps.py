"""
依赖注入模块
提供FastAPI路由处理函数所需的依赖项
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from typing import Optional
import crud.user as crud_user
from core.config import settings
from database.database import get_db
from schemas.auth import TokenData
from models.user import User

# 配置OAuth2密码流
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")


def get_current_user(
    db: Session = Depends(get_db), 
    token: str = Depends(oauth2_scheme)
) -> User:
    """
    获取当前认证用户
    
    Args:
        db: 数据库会话依赖
        token: JWT令牌依赖
        
    Returns:
        User: 当前认证用户对象
        
    Raises:
        HTTPException: 当令牌无效或用户不存在时抛出401异常
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = crud_user.get_user_by_username(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    获取当前活跃用户
    
    Args:
        current_user: 当前认证用户依赖
        
    Returns:
        User: 当前活跃用户对象
        
    Raises:
        HTTPException: 当用户被禁用时抛出400异常
    """
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def get_current_active_admin(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    获取当前活跃管理员用户
    
    Args:
        current_user: 当前活跃用户依赖
        
    Returns:
        User: 当前活跃管理员用户对象
        
    Raises:
        HTTPException: 当用户不是管理员时抛出400异常
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=400, 
            detail="The user doesn't have enough privileges"
        )
    return current_user