# TodoList 应用

## 项目概述

### 选择赛道
智享生活

### 项目创意
大部分的计划待做todolist网站基本上只包含创建任务，创建时间和截止时间，但是并没有很好的对任务进行细化，比如任务分类，任务优先级，任务提醒，以及任务协作、上传附件、任务统计等功能。我们实现了这些功能。除此之外，我们设计了回收站系统，防止用户误操作直接删除无法挽回。

## 网站功能

### 登录界面
- 提供用户和管理员两种角色登录
- 管理员具备完整的用户管理权限：
  - 管理用户账号和密码
  - 添加新用户
  - 删除现有用户

### 用户主页功能

#### 1. 任务添加
- 用户可以输入任务名称、描述、截止时间、优先级（高 / 中 / 低）和所属分类（如工作、生活、学习等自定义分类）

#### 2. 任务查看
- 默认按截止时间排序展示所有任务
- 支持多种排序方式切换（按优先级、按分类等）
- 提供完成状态筛选功能（全部 / 未完成 / 已完成）

#### 3. 任务编辑
- 用户可以修改任务的各项信息（名称、描述、时间等）
- 系统自动记录每次修改的时间和内容
- 提供批量编辑功能，可同时修改多个任务的分类或优先级

#### 4. 任务删除
- 支持单个或批量删除任务
- 删除的任务会移至回收站，用户可随时恢复或彻底删除

#### 5. 任务完成
- 用户可通过点击任务前的复选框将任务标记为已完成
- 已完成任务会以特殊样式显示（如划线、灰色字体）以便区分
- 提供历史完成任务列表，并支持按完成时间进行筛选

#### 6. 任务提醒
- 支持设置任务提醒时间（提前 10 分钟、30 分钟、1 小时等）
- 到达提醒时间时，系统会在页面弹出提醒弹窗并伴有提示音
- 支持设置重复提醒任务（如每天、每周、每月）

#### 7. 数据统计
- 直观展示用户任务完成情况的统计图表
- 包含每日 / 每周 / 每月完成任务数量、各分类任务占比等数据
- 支持查看历史统计数据并导出统计报告

#### 8. 个人设置
- 用户可以自定义个人信息
- 支持修改登录密码
- 可配置提醒方式（弹窗 / 声音 / 仅标记）

## 应用部署指南

本文档详细介绍了如何部署 TodoList 应用程序，包括后端 API 和前端界面。

### 系统架构概述

TodoList 是一个前后端分离的应用程序：

- **前端**: 基于 Vue.js 构建，使用 Element Plus UI 框架
- **后端**: 基于 FastAPI 构建的 RESTful API 服务
- **数据库**: 默认使用 SQLite（开发环境），支持 PostgreSQL（生产环境）

### 部署环境要求

#### 后端要求
- Python 3.8 或更高版本
- pip 包管理器
- （生产环境）PostgreSQL 数据库（可选但推荐）

#### 前端要求
- Node.js 14 或更高版本
- npm 或 yarn 包管理器

### 后端部署步骤

#### 1. 环境准备

```bash
# 进入后端目录
cd backendV3.0

# 创建虚拟环境（推荐）
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# Linux/Mac:
# source venv/bin/activate

# 安装依赖包
pip install fastapi uvicorn sqlalchemy psycopg2 pydantic bcrypt passlib python-jose python-multipart pydantic-settings
```

#### 2. 配置环境变量

创建 `.env` 文件并配置以下变量：

```env
# 数据库配置（SQLite 用于开发，PostgreSQL 用于生产）
DATABASE_URL=sqlite:///./todo.db
# DATABASE_URL=postgresql://user:password@localhost/todo_db

# JWT 密钥和配置
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# 文件上传目录
UPLOAD_DIR=./uploads
```

#### 3. 初始化数据库

```bash
# 数据库将在应用首次启动时自动初始化
```

#### 4. 启动后端服务

开发环境：
```bash
uvicorn main:app --reload
```

生产环境：
```bash
# 使用 Gunicorn 运行（需要先安装 gunicorn）
pip install gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
```

后端服务默认运行在 `http://localhost:8000`

#### 5. 验证后端部署

访问以下地址验证后端是否正常运行：
- API 文档: `http://localhost:8000/docs`
- 根路径: `http://localhost:8000`

### 前端部署步骤

#### 1. 环境准备

```bash
# 进入前端目录
cd frontendV1.0

# 安装依赖
npm install
```

#### 2. 配置后端 API 地址

前端通过 Vite 代理将 API 请求转发到后端。默认配置在 vite.config.js 中：

```javascript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, '')
    }
  }
}
```

如果后端部署在其他地址，请相应修改 `target` 字段。

#### 3. 启动前端开发服务器

```bash
npm run dev
```

前端开发服务器默认运行在 `http://localhost:3000`

#### 4. 构建生产版本

```bash
npm run build
```

构建后的文件将位于 `dist/` 目录中，可以部署到任何静态文件服务器上。

### 生产环境部署建议

#### 1. 使用 Nginx 作为反向代理

创建 Nginx 配置文件：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API 请求代理到后端
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

#### 2. 使用 PostgreSQL 数据库（生产环境）

1. 安装 PostgreSQL 数据库
2. 创建数据库和用户
3. 更新 `.env` 文件中的 `DATABASE_URL`：
   ```
   DATABASE_URL=postgresql://username:password@localhost/dbname
   ```

#### 3. 使用 Systemd 管理后端服务（Linux）

创建 systemd 服务文件 `/etc/systemd/system/todolist.service`：

```ini
[Unit]
Description=TodoList API
After=network.target

[Service]
User=www-data
WorkingDirectory=/path/to/backendV3.0
ExecStart=/path/to/venv/bin/gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
Restart=always

[Install]
WantedBy=multi-user.target
```

启动服务：
```bash
sudo systemctl start todolist
sudo systemctl enable todolist
```

### 默认管理员账户

系统初始化时会创建一个默认管理员账户：
- 用户名: `admin`
- 密码: `admin123`

建议在首次登录后立即修改密码。

### 故障排除

#### 1. 前端无法连接到后端 API

检查：
- 后端服务是否正在运行
- vite.config.js 中的代理配置是否正确
- 防火墙设置是否阻止了连接

#### 2. 数据库连接错误

检查：
- `.env` 文件中的 `DATABASE_URL` 是否正确
- 数据库服务是否正在运行
- 数据库用户权限是否正确

#### 3. 文件上传失败

检查：
- `UPLOAD_DIR` 目录是否存在且具有写权限
- 服务器磁盘空间是否充足