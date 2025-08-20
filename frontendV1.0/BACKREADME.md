# TodoList 后端 API

## 项目概述

这是一个功能完整的TodoList应用程序后端，基于FastAPI构建，提供用户管理、任务管理、提醒设置、数据统计等功能。

## 功能特性

1. **用户管理**
   - 用户注册和登录
   - 用户信息管理
   - 用户个人设置
   - 密码修改
   - 管理员用户管理（仅管理员可访问）

2. **任务管理**
   - 创建、查看、更新、删除任务
   - 任务优先级设置（高、中、低）
   - 任务状态管理（待处理、进行中、已完成、已删除）
   - 任务分类
   - 任务回收站功能

3. **任务提醒**
   - 设置任务提醒时间
   - 多种提醒方式（弹窗、声音、标记）
   - 不同提醒类型（一次性、每日、每周、每月）

4. **任务附件**
   - 上传任务附件
   - 下载任务附件
   - 查看任务附件

5. **数据统计**
   - 任务统计
   - 完成率统计
   - 分类统计

## 技术栈

- **框架**: FastAPI
- **数据库**: SQLite (开发环境) / PostgreSQL (生产环境)
- **ORM**: SQLAlchemy
- **认证**: JWT Token
- **密码加密**: Bcrypt
- **日志**: Python logging

## 安装和运行

### 环境要求

- Python 3.8+
- pip

### 安装依赖

```bash
pip install -r requirements.txt
```

### 初始化数据库

```bash
python init_db.py
```

### 运行应用

```bash
uvicorn main:app --reload
```

应用将运行在 `http://localhost:8000`

## API文档

API文档可通过以下URL访问：

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

详细的API文档请查看 [apidoc.md](apidoc.md) 文件。

## 项目结构

```
backend/
├── main.py                 # 应用入口点
├── requirements.txt        # 依赖包列表
├── init_db.py             # 数据库初始化脚本
├── apidoc.md              # API文档
├── README.md              # 项目说明文档
├── core/                  # 核心模块
│   ├── config.py          # 配置文件
│   ├── security.py        # 安全相关功能
│   ├── deps.py            # 依赖项
│   └── logging.py         # 日志配置
├── database/              # 数据库相关
│   └── database.py        # 数据库连接和模型基类
├── models/                # 数据库模型
│   ├── user.py            # 用户模型
│   ├── task.py            # 任务模型
│   ├── category.py        # 分类模型
│   ├── reminder.py        # 提醒模型
│   ├── attachment.py      # 附件模型
│   ├── comment.py         # 评论模型
│   └── settings.py        # 设置模型
├── schemas/               # Pydantic模型（数据验证）
│   ├── user.py            # 用户Schema
│   ├── task.py            # 任务Schema
│   ├── category.py        # 分类Schema
│   ├── reminder.py        # 提醒Schema
│   ├── attachment.py      # 附件Schema
│   ├── comment.py         # 评论Schema
│   └── settings.py        # 设置Schema
├── crud/                  # 数据库操作
│   ├── user.py            # 用户CRUD操作
│   ├── task.py            # 任务CRUD操作
│   ├── category.py        # 分类CRUD操作
│   ├── reminder.py        # 提醒CRUD操作
│   ├── attachment.py      # 附件CRUD操作
│   └── comment.py         # 评论CRUD操作
├── routers/               # API路由
│   ├── auth.py            # 认证路由
│   ├── users.py           # 用户路由
│   ├── tasks.py           # 任务路由
│   ├── reminders.py       # 提醒路由
│   ├── statistics.py      # 统计路由
│   ├── settings.py        # 设置路由
│   └── comments.py        # 评论路由
├── test/                  # 测试集
│   ├── test_tasks.py      # 任务功能测试
│   ├── test_attachments.py # 附件功能测试
│   ├── test_attachment_download.py # 附件下载测试
│   ├── test_comments.py   # 评论功能测试
│   ├── test_statistics.py # 统计功能测试
│   ├── test_collaboration.py # 协作功能测试
│   └── __init__.py        # Python包初始化文件
└── logs/                  # 日志文件目录
```

## 冗余文件说明

在检查项目结构时，我们发现以下冗余文件可以删除：

1. `api_doc.json` 和 `openapi.json` - 这两个文件都是自动生成的OpenAPI规范文件，内容完全相同，保留一个即可
2. `test_download_function.py` 和 `simple_download_test.py` - 这两个测试文件功能重复，可以删除其中一个
3. `nul` - 这是一个空文件，可以删除

## 默认用户

系统初始化时会创建一个默认管理员用户：

- 用户名: `admin`
- 密码: `admin123`

## 开发指南

### 添加新功能

1. 在[models/](file:///c:/Users/HP/Desktop/lingma/todolist/backend/models/)目录下创建对应的数据库模型
2. 在[schemas/](file:///c:/Users/HP/Desktop/lingma/todolist/backend/schemas/)目录下创建对应的Pydantic模型
3. 在[crud/](file:///c:/Users/HP/Desktop/lingma/todolist/backend/crud/)目录下实现数据操作函数
4. 在[routers/](file:///c:/Users/HP/Desktop/lingma/todolist/backend/routers/)目录下创建API路由
5. 在[main.py](file:///c:/Users/HP/Desktop/lingma/todolist/backend/main.py)中注册新路由

### 数据库迁移

当前版本使用简单的初始化脚本。在生产环境中，建议使用Alembic进行数据库迁移管理。

### 运行测试

项目包含完整的测试集，可以使用以下命令运行：

```bash
# 运行所有测试
python -m unittest discover test

# 运行特定测试文件
python -m unittest test.test_tasks

# 运行特定测试类
python -m unittest test.test_tasks.TasksTestCase
```

#### 测试结果

目前测试集包含26个测试用例，涵盖了以下功能模块：
- 附件上传和下载功能
- 评论功能
- 任务管理功能
- 统计功能

所有测试均已通过，表明系统核心功能正常工作。

## 部署

### 生产环境配置

1. 修改[core/config.py](file:///c:/Users/HP/Desktop/lingma/todolist/backend/core/config.py)中的配置项
2. 使用PostgreSQL替换SQLite
3. 配置环境变量

### 使用Docker部署

```dockerfile
# Dockerfile示例
FROM python:3.9

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 贡献

欢迎提交Issue和Pull Request来改进项目。

## 许可证

[MIT License](LICENSE)