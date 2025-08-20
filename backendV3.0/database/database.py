from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# 确保上传目录存在
UPLOAD_DIR = "./uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

# 这里使用 SQLite 作为示例，实际项目中会替换为 PostgreSQL
SQLALCHEMY_DATABASE_URL = "sqlite:///./todo.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# 注意：不要在这里导入模型，避免循环导入
# 模型会在各自文件中导入Base来使用

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    # 在初始化时导入所有模型
    from models.user import User, UserRole
    from models.task import Task
    from models.category import Category
    from models.attachment import Attachment
    from models.reminder import Reminder
    from models.comment import Comment
    from core.security import get_password_hash
    from sqlalchemy.orm import Session
    
    Base.metadata.create_all(bind=engine)
    
    # 创建默认管理员用户
    db = SessionLocal()
    try:
        # 检查是否已存在管理员用户
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            # 创建默认管理员用户
            admin_user = User(
                username="admin",
                email="admin@example.com",
                hashed_password=get_password_hash("admin123"),
                role=UserRole.ADMIN,  # 确保使用枚举值而不是字符串
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            print("Default admin user created successfully.")
        else:
            # 检查现有用户的role是否为admin，如果不是则更新
            if admin_user.role != UserRole.ADMIN:
                admin_user.role = UserRole.ADMIN
                db.commit()
                print("Updated existing admin user to admin role.")
            else:
                print("Admin user already exists with admin role.")
    except Exception as e:
        db.rollback()
        print(f"Error creating default admin user: {e}")
    finally:
        db.close()