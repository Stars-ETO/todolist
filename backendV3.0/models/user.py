from sqlalchemy import Column, Integer, String, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
from database.database import Base
from enum import Enum as PyEnum

class UserRole(str, PyEnum):
    ADMIN = "admin"
    USER = "user"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    role = Column(SQLEnum(UserRole), default=UserRole.USER)
    
    # 个人设置相关字段，添加server_default以确保数据库层面也有默认值
    nickname = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    theme = Column(String, default="light", server_default="light")  # 主题设置: light, dark, auto
    # 添加更多主题设置选项
    theme_color = Column(String, default="#ffffff", server_default="#ffffff")  # 主题颜色
    night_mode_brightness = Column(String, default="normal", server_default="normal")  # 夜间模式亮度: normal, dim, dark
    notification_enabled = Column(Boolean, default=True, server_default="1")  # 通知设置
    # 默认提醒方式
    default_reminder_method = Column(String, default="popup", server_default="popup")
    
    # 关系
    comments = relationship("Comment", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', role='{self.role}')>"