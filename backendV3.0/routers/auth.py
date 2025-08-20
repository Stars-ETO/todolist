"""
认证路由模块
处理用户认证相关的API端点，包括登录、注册、令牌获取等
"""

import logging
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Any

import crud.auth as crud_auth
import crud.user as crud_user
from core.config import settings
from core.deps import get_current_active_user, oauth2_scheme
from core.security import create_access_token
from database.database import get_db
from schemas.auth import Token, LoginRequest, RegisterRequest
from schemas.user import User, UserCreate, UserRole
# 删除了对SQLAlchemy模型的导入，改用Pydantic模型

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/token", response_model=Token)
def login_for_access_token(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2兼容的令牌端点，用于处理用户登录并返回JWT令牌
    
    Args:
        db: 数据库会话
        form_data: OAuth2表单数据，包含用户名和密码
        
    Returns:
        Token: 包含访问令牌和令牌类型的对象
        
    Raises:
        HTTPException: 当用户名或密码错误时抛出401异常
    """
    logger.info(f"Login attempt for user: {form_data.username}")
    user = crud_auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        logger.warning(f"Failed login attempt for user: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    logger.info(f"Successful login for user: {user.username}")
    logger.info(f"Successful login for user: {user.username}")
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/login", response_model=Token)
def login(
    login_request: LoginRequest,
    db: Session = Depends(get_db)
) -> Any:
    """
    用户登录端点，使用JSON格式的登录请求
    
    Args:
        login_request: 登录请求数据，包含用户名和密码
        db: 数据库会话
        
    Returns:
        Token: 包含访问令牌和令牌类型的对象
        
    Raises:
        HTTPException: 当用户名或密码错误时抛出401异常
    """
    logger.info(f"Login attempt for user: {login_request.username}")
    user = crud_auth.authenticate_user(db, login_request.username, login_request.password)
    if not user:
        logger.warning(f"Failed login attempt for user: {login_request.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register", response_model=User)
def register(
    register_request: RegisterRequest,
    db: Session = Depends(get_db)
) -> User:
    """
    用户注册端点
    
    Args:
        register_request: 注册请求数据，包含用户名、邮箱和密码
        db: 数据库会话
        
    Returns:
        User: 新创建的用户对象
    """
    logger.info(f"Registration attempt for username: {register_request.username}, email: {register_request.email}")
    
    # 检查用户名是否已存在
    db_user = crud_user.get_user_by_username(db, username=register_request.username)
    if db_user:
        logger.warning(f"Registration failed: username already exists: {register_request.username}")
        raise HTTPException(
            status_code=400,
            detail="Username already registered"
        )
    
    # 检查邮箱是否已存在
    db_user = crud_user.get_user_by_email(db, email=register_request.email)
    if db_user:
        logger.warning(f"Registration failed: email already exists: {register_request.email}")
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # 创建新用户
    new_user = crud_user.create_user(db=db, user=register_request)
    logger.info(f"New user registered: {new_user.username} with ID {new_user.id}")
    return new_user


@router.get("/users/me", response_model=User)
def read_users_me(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    获取当前登录用户的信息
    
    Args:
        current_user: 当前认证用户依赖
        
    Returns:
        User: 当前用户对象
    """
    return current_user