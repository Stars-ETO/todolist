from pydantic import BaseModel, ConfigDict
from typing import Optional
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"

class UserBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    username: str
    email: str
    role: UserRole = UserRole.USER

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    username: Optional[str] = None
    email: Optional[str] = None
    role: Optional[UserRole] = None

class UserInDBBase(UserBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    is_active: bool = True
    # 个人设置相关字段
    nickname: Optional[str] = None
    avatar_url: Optional[str] = None
    theme: str = "light"  # 主题模式: light, dark, auto
    theme_color: str = "#ffffff"  # 主题颜色
    night_mode_brightness: str = "normal"  # 夜间模式亮度: normal, dim, dark
    notification_enabled: bool = True
    default_reminder_method: str = "popup"

class User(UserInDBBase):
    pass

class UserInDB(UserInDBBase):
    hashed_password: str


class UserSettingsUpdate(BaseModel):
    """用户个人设置更新模型"""
    model_config = ConfigDict(from_attributes=True)
    
    nickname: Optional[str] = None
    avatar_url: Optional[str] = None
    theme: Optional[str] = None  # 主题模式: light, dark, auto
    theme_color: Optional[str] = None  # 主题颜色
    night_mode_brightness: Optional[str] = None  # 夜间模式亮度: normal, dim, dark
    notification_enabled: Optional[bool] = None
    default_reminder_method: Optional[str] = None


class PasswordChange(BaseModel):
    """密码修改模型"""
    model_config = ConfigDict(from_attributes=True)
    
    current_password: str
    new_password: str