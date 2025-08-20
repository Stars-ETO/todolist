# TodoList API 文档

## 概述

这是一个基于FastAPI构建的TodoList应用程序后端API，提供任务管理、用户认证、提醒设置等功能。

## 基础URL

```
http://localhost:8000
```

## 认证

大多数API端点都需要认证。使用JWT Token进行认证。

### 获取访问令牌

**POST** `/auth/login`

请求体:
```json
{
  "username": "string",
  "password": "string"
}
```

响应:
```json
{
  "access_token": "string",
  "token_type": "string"
}
```

在后续请求中，需要在HTTP头中添加Authorization字段：
```
Authorization: Bearer <access_token>
```

## 用户管理

### 用户注册

**POST** `/auth/register`

请求体:
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

### 获取当前用户信息

**GET** `/users/me`

### 更新当前用户信息

**PUT** `/users/me`

请求体:
```json
{
  "username": "string",
  "email": "string",
  "nickname": "string",
  "avatar_url": "string"
}
```

### 更新当前用户个人设置

**PUT** `/settings/profile`

请求体:
```json
{
  "nickname": "string",
  "avatar_url": "string",
  "bio": "string",
  "theme": "light",
  "theme_color": "#ffffff",
  "night_mode_brightness": "normal",
  "notification_enabled": true,
  "default_reminder_method": "popup"
}
```

### 修改当前用户密码

**PUT** `/settings/password`

请求体:
```json
{
  "current_password": "string",
  "new_password": "string"
}
```

### 删除当前用户账户

**DELETE** `/settings/account`

查询参数:
- password: 当前密码

## 任务管理

### 创建任务

**POST** `/tasks/`

请求体:
```json
{
  "title": "string",
  "description": "string",
  "due_date": "2025-08-13T03:51:19.894Z",
  "priority": "medium",
  "category_id": 0,
  "is_public": false
}
```

### 获取任务列表

**GET** `/tasks/`

查询参数:
- skip: 跳过的记录数 (默认: 0)
- limit: 返回的记录数限制 (默认: 100)
- status: 任务状态 (pending, in_progress, completed, deleted)
- priority: 任务优先级 (high, medium, low)
- category_id: 分类ID

### 获取特定任务

**GET** `/tasks/{task_id}`

### 更新任务

**PUT** `/tasks/{task_id}`

请求体:
```json
{
  "title": "string",
  "description": "string",
  "due_date": "2025-08-13T03:51:19.894Z",
  "priority": "medium",
  "category_id": 0,
  "is_public": false,
  "status": "pending"
}
```

### 删除任务（移至回收站）

**DELETE** `/tasks/{task_id}`

### 获取回收站任务

**GET** `/tasks/deleted`

查询参数:
- skip: 跳过的记录数 (默认: 0)
- limit: 返回的记录数限制 (默认: 100)

### 恢复回收站任务

**POST** `/tasks/deleted/{task_id}/restore`

### 永久删除任务

**DELETE** `/tasks/deleted/{task_id}`

### 批量更新任务

**PUT** `/tasks/batch`

请求体:
```json
{
  "task_ids": [0],
  "priority": "medium",
  "category_id": 0
}
```

### 批量删除任务

**DELETE** `/tasks/batch`

请求体:
```json
{
  "task_ids": [0]
}
```

### 导出任务为CSV格式

**GET** `/tasks/export/csv`

查询参数:
- status: 任务状态筛选
- priority: 任务优先级筛选
- category_id: 分类ID筛选

## 任务分类

### 创建分类

**POST** `/tasks/categories`

请求体:
```json
{
  "name": "string",
  "description": "string"
}
```

### 获取分类列表

**GET** `/tasks/categories`

查询参数:
- skip: 跳过的记录数 (默认: 0)
- limit: 返回的记录数限制 (默认: 100)

### 更新分类

**PUT** `/tasks/categories/{category_id}`

请求体:
```json
{
  "name": "string",
  "description": "string"
}
```

### 删除分类

**DELETE** `/tasks/categories/{category_id}`

## 任务提醒

### 创建提醒

**POST** `/reminders/`

请求体:
```json
{
  "task_id": 0,
  "reminder_time": "2025-08-13T03:51:19.894Z",
  "reminder_type": "once",
  "method": "popup"
}
```

### 获取提醒列表

**GET** `/reminders/`

查询参数:
- skip: 跳过的记录数 (默认: 0)
- limit: 返回的记录数限制 (默认: 100)

### 获取任务的提醒

**GET** `/reminders/tasks/{task_id}`

查询参数:
- skip: 跳过的记录数 (默认: 0)
- limit: 返回的记录数限制 (默认: 100)

### 获取特定提醒

**GET** `/reminders/{reminder_id}`

### 更新提醒

**PUT** `/reminders/{reminder_id}`

请求体:
```json
{
  "reminder_time": "2025-08-13T03:51:19.894Z",
  "reminder_type": "once",
  "method": "popup",
  "is_active": true
}
```

### 删除提醒

**DELETE** `/reminders/{reminder_id}`

### 激活提醒

**POST** `/reminders/{reminder_id}/activate`

### 停用提醒

**POST** `/reminders/{reminder_id}/deactivate`

## 任务附件

### 上传附件

**POST** `/tasks/{task_id}/attachments`

表单数据:
- file: 文件

### 获取任务详情（包含附件）

**GET** `/tasks/{task_id}`

### 下载附件

**GET** `/tasks/{task_id}/attachments/{attachment_id}`

响应:
- 成功: 文件内容（二进制流）
- 失败: 错误信息（JSON格式）

### 删除附件

**DELETE** `/tasks/{task_id}/attachments/{attachment_id}`

## 任务评论

### 创建评论

**POST** `/comments/`

请求体:
```json
{
  "task_id": 0,
  "content": "string"
}
```

### 获取任务的评论

**GET** `/comments/task/{task_id}`

查询参数:
- skip: 跳过的记录数 (默认: 0)
- limit: 返回的记录数限制 (默认: 100)

### 更新评论

**PUT** `/comments/{comment_id}`

请求体:
```json
{
  "content": "string"
}
```

### 删除评论

**DELETE** `/comments/{comment_id}`

## 统计数据

### 获取任务统计总览

**GET** `/statistics/summary`

查询参数:
- days: 天数范围 (默认: 7)

### 获取任务完成情况统计

**GET** `/statistics/tasks/completion`

### 获取每日任务统计

**GET** `/statistics/tasks/daily`

查询参数:
- days: 天数范围 (默认: 7)

### 获取分类任务统计

**GET** `/statistics/tasks/category`

### 获取优先级任务统计

**GET** `/statistics/tasks/priority`

### 获取逾期任务统计

**GET** `/statistics/tasks/overdue`