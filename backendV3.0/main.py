"""
主应用文件
FastAPI应用程序入口点，包含应用初始化和路由注册
"""

from fastapi import FastAPI
from fastapi.security import OAuth2PasswordBearer
from database.database import init_db

# 导入日志模块
from core.logging import setup_logging

# 设置日志
setup_logging()
import logging
logger = logging.getLogger(__name__)

# 导入路由
from routers import auth, users, tasks, reminders, statistics, settings, comments

app = FastAPI(
    title="TodoList API",
    description="A TodoList application backend built with FastAPI",
    version="1.0.0",
    # 配置安全方案
    security=[{"OAuth2PasswordBearer": []}]
)

# 配置OAuth2密码流
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

# 初始化数据库
@app.on_event("startup")
async def startup_event():
    """应用启动时初始化数据库"""
    logger.info("Starting up application and initializing database")
    init_db()
    logger.info("Database initialized successfully")

# 注册路由
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
app.include_router(reminders.router, prefix="/reminders", tags=["reminders"])
app.include_router(statistics.router, prefix="/statistics", tags=["statistics"])
app.include_router(settings.router, prefix="/settings", tags=["settings"])
app.include_router(comments.router, prefix="/comments", tags=["comments"])

@app.get("/")
def read_root():
    """根路径，返回欢迎信息"""
    logger.info("Root endpoint accessed")
    return {"Hello": "Welcome to TodoList API"}

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting server with uvicorn")
    uvicorn.run(app, host="0.0.0.0", port=8000)