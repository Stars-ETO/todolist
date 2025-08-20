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

使用OAuth2表单格式登录，返回访问令牌。

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
```

在后续请求中，需要在HTTP头中添加Authorization字段：
```
Authorization: Bearer <access_token>
```

### 用户登录（JSON格式）

**POST** `/auth/login`

使用JSON格式登录，返回访问令牌。

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

### 用户注册

**POST** `/auth/register`

创建新用户账户。

请求体:
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

响应:
```json
{
  "id": 0,
  "username": "string",
  "email": "string",
  "is_active": true,
  "is_admin": false,
  "created_at": "2025-08-13T03:51:19.894Z"
}
```

### 获取当前用户信息

**GET** `/auth/users/me`

获取当前登录用户的信息。

响应:
```json
{
  "id": 0,
  "username": "string",
  "email": "string",
  "is_active": true,
  "is_admin": false,
  "created_at": "2025-08-13T03:51:19.894Z"
}
```

## 用户管理（管理员权限）

### 获取用户列表

**GET** `/users/`

仅管理员可访问，获取用户列表。

查询参数:
- skip: 跳过的记录数 (默认: 0)
- limit: 返回的记录数限制 (默认: 100)

响应:
```json
[
  {
    "id": 0,
    "username": "string",
    "email": "string",
    "is_active": true,
    "is_admin": false,
    "created_at": "2025-08-13T03:51:19.894Z"
  }
]
```

### 创建用户

**POST** `/users/`

仅管理员可访问，创建新用户。

请求体:
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "is_active": true,
  "is_admin": false
}
```

响应:
```json
{
  "id": 0,
  "username": "string",
  "email": "string",
  "is_active": true,
  "is_admin": false,
  "created_at": "2025-08-13T03:51:19.894Z"
}
```

### 获取指定用户信息

**GET** `/users/{user_id}`

仅管理员可访问，获取指定用户的信息。

响应:
```json
{
  "id": 0,
  "username": "string",
  "email": "string",
  "is_active": true,
  "is_admin": false,
  "created_at": "2025-08-13T03:51:19.894Z"
}
```

### 更新用户信息

**PUT** `/users/{user_id}`

仅管理员可访问，更新指定用户的信息。

请求体:
```json
{
  "username": "string",
  "email": "string",
  "is_active": true,
  "is_admin": false
}
```

响应:
```json
{
  "id": 0,
  "username": "string",
  "email": "string",
  "is_active": true,
  "is_admin": false,
  "created_at": "2025-08-13T03:51:19.894Z"
}
```

### 重置用户密码

**PUT** `/users/{user_id}/password`

仅管理员可访问，重置指定用户的密码。

请求体:
```json
{
  "current_password": "string",
  "new_password": "string"
}
```

响应:
```json
{
  "id": 0,
  "username": "string",
  "email": "string",
  "is_active": true,
  "is_admin": false,
  "created_at": "2025-08-13T03:51:19.894Z"
}
```

### 删除用户

**DELETE** `/users/{user_id}`

仅管理员可访问，删除指定用户。

响应:
```json
{
  "id": 0,
  "username": "string",
  "email": "string",
  "is_active": true,
  "is_admin": false,
  "created_at": "2025-08-13T03:51:19.894Z"
}
```

## 个人设置

### 获取当前用户个人信息

**GET** `/settings/profile`

获取当前用户的个人信息。

响应:
```json
{
  "id": 0,
  "username": "string",
  "email": "string",
  "is_active": true,
  "is_admin": false,
  "created_at": "2025-08-13T03:51:19.894Z"
}
```

### 更新用户个人信息

**PUT** `/settings/profile`

更新当前用户的个人信息。

请求体:
```json
{
  "username": "string",
  "email": "string",
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

响应:
```json
{
  "id": 0,
  "username": "string",
  "email": "string",
  "is_active": true,
  "is_admin": false,
  "created_at": "2025-08-13T03:51:19.894Z"
}
```

### 修改当前用户密码

**PUT** `/settings/password`

修改当前用户的密码。

请求体:
```json
{
  "current_password": "string",
  "new_password": "string"
}
```

响应:
```json
{
  "message": "Password updated successfully"
}
```

### 删除当前用户账户

**DELETE** `/settings/account`

删除当前用户账户。

查询参数:
- password: 当前密码

响应:
```json
{
  "message": "Account deleted successfully"
}
```

## 任务管理

### 创建任务

**POST** `/tasks/`

创建新任务。

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

响应:
```json
{
  "id": 0,
  "title": "string",
  "description": "string",
  "due_date": "2025-08-13T03:51:19.894Z",
  "priority": "medium",
  "category_id": 0,
  "is_public": false,
  "status": "pending",
  "created_at": "2025-08-13T03:51:19.894Z",
  "updated_at": "2025-08-13T03:51:19.894Z",
  "owner_id": 0
}
```

### 获取任务列表

**GET** `/tasks/`

获取当前用户的所有任务，支持筛选和分页。

查询参数:
- skip: 跳过的记录数 (默认: 0)
- limit: 返回的记录数限制 (默认: 100)
- status: 任务状态 (pending, in_progress, completed, deleted)
- priority: 任务优先级 (high, medium, low)
- category_id: 分类ID

响应:
```json
[
  {
    "id": 0,
    "title": "string",
    "description": "string",
    "due_date": "2025-08-13T03:51:19.894Z",
    "priority": "medium",
    "category_id": 0,
    "is_public": false,
    "status": "pending",
    "created_at": "2025-08-13T03:51:19.894Z",
    "updated_at": "2025-08-13T03:51:19.894Z",
    "owner_id": 0,
    "category": {
      "id": 0,
      "name": "string",
      "description": "string",
      "created_at": "2025-08-13T03:51:19.894Z",
      "updated_at": "2025-08-13T03:51:19.894Z",
      "owner_id": 0
    }
  }
]
```

### 获取特定任务

**GET** `/tasks/{task_id}`

获取指定任务的详细信息，包括附件。

响应:
```json
{
  "id": 0,
  "title": "string",
  "description": "string",
  "due_date": "2025-08-13T03:51:19.894Z",
  "priority": "medium",
  "category_id": 0,
  "is_public": false,
  "status": "pending",
  "created_at": "2025-08-13T03:51:19.894Z",
  "updated_at": "2025-08-13T03:51:19.894Z",
  "owner_id": 0,
  "attachments": [
    {
      "id": 0,
      "filename": "string",
      "file_path": "string",
      "created_at": "2025-08-13T03:51:19.894Z",
      "task_id": 0
    }
  ]
}
```

### 更新任务

**PUT** `/tasks/{task_id}`

更新指定任务的信息。

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

响应:
```json
{
  "id": 0,
  "title": "string",
  "description": "string",
  "due_date": "2025-08-13T03:51:19.894Z",
  "priority": "medium",
  "category_id": 0,
  "is_public": false,
  "status": "pending",
  "created_at": "2025-08-13T03:51:19.894Z",
  "updated_at": "2025-08-13T03:51:19.894Z",
  "owner_id": 0
}
```

### 删除任务（移至回收站）

**DELETE** `/tasks/{task_id}`

将指定任务移至回收站。

响应:
```json
true
```

### 获取回收站任务

**GET** `/tasks/deleted`

获取当前用户已删除的任务列表（回收站）。

查询参数:
- skip: 跳过的记录数 (默认: 0)
- limit: 返回的记录数限制 (默认: 100)

响应:
```json
[
  {
    "id": 0,
    "title": "string",
    "description": "string",
    "due_date": "2025-08-13T03:51:19.894Z",
    "priority": "medium",
    "category_id": 0,
    "is_public": false,
    "status": "pending",
    "created_at": "2025-08-13T03:51:19.894Z",
    "updated_at": "2025-08-13T03:51:19.894Z",
    "owner_id": 0
  }
]
```

### 恢复回收站任务

**POST** `/tasks/deleted/{task_id}/restore`

恢复已删除的任务。

响应:
```json
{
  "id": 0,
  "title": "string",
  "description": "string",
  "due_date": "2025-08-13T03:51:19.894Z",
  "priority": "medium",
  "category_id": 0,
  "is_public": false,
  "status": "pending",
  "created_at": "2025-08-13T03:51:19.894Z",
  "updated_at": "2025-08-13T03:51:19.894Z",
  "owner_id": 0
}
```

### 永久删除任务

**DELETE** `/tasks/deleted/{task_id}`

永久删除任务（从回收站中彻底删除）。

响应:
```json
true
```

### 批量更新任务

**PUT** `/tasks/batch`

批量更新任务信息（仅支持优先级和分类）。

请求体:
```json
{
  "task_ids": [0],
  "priority": "medium",
  "category_id": 0
}
```

响应:
```json
0  // 更新成功的任务数量
```

### 批量删除任务

**DELETE** `/tasks/batch`

批量删除任务（移动到回收站）。

请求体:
```json
{
  "task_ids": [0]
}
```

响应:
```json
0  // 删除成功的任务数量
```

### 导出任务为CSV格式

**GET** `/tasks/export/csv`

导出当前用户任务为CSV格式。

查询参数:
- status: 任务状态筛选
- priority: 任务优先级筛选
- category_id: 分类ID筛选

响应:
CSV格式的文件下载。

## 任务分类

### 创建分类

**POST** `/tasks/categories`

创建新任务分类。

请求体:
```json
{
  "name": "string",
  "description": "string"
}
```

响应:
```json
{
  "id": 0,
  "name": "string",
  "description": "string",
  "created_at": "2025-08-13T03:51:19.894Z",
  "updated_at": "2025-08-13T03:51:19.894Z",
  "owner_id": 0
}
```

### 获取分类列表

**GET** `/tasks/categories`

获取当前用户的所有任务分类。

查询参数:
- skip: 跳过的记录数 (默认: 0)
- limit: 返回的记录数限制 (默认: 100)

响应:
```json
[
  {
    "id": 0,
    "name": "string",
    "description": "string",
    "created_at": "2025-08-13T03:51:19.894Z",
    "updated_at": "2025-08-13T03:51:19.894Z",
    "owner_id": 0
  }
]
```

### 更新分类

**PUT** `/tasks/categories/{category_id}`

更新任务分类信息。

请求体:
```json
{
  "name": "string",
  "description": "string"
}
```

响应:
```json
{
  "id": 0,
  "name": "string",
  "description": "string",
  "created_at": "2025-08-13T03:51:19.894Z",
  "updated_at": "2025-08-13T03:51:19.894Z",
  "owner_id": 0
}
```

### 删除分类

**DELETE** `/tasks/categories/{category_id}`

删除任务分类。

响应:
```json
true
```

## 任务提醒

### 创建提醒

**POST** `/reminders/`

创建新提醒。

请求体:
```json
{
  "task_id": 0,
  "reminder_time": "2025-08-13T03:51:19.894Z",
  "reminder_type": "once",
  "method": "popup"
}
```

响应:
```json
{
  "id": 0,
  "task_id": 0,
  "reminder_time": "2025-08-13T03:51:19.894Z",
  "reminder_type": "once",
  "method": "popup",
  "is_active": true,
  "created_at": "2025-08-13T03:51:19.894Z",
  "updated_at": "2025-08-13T03:51:19.894Z"
}
```

### 获取提醒列表

**GET** `/reminders/`

获取当前用户的所有提醒。

查询参数:
- skip: 跳过的记录数 (默认: 0)
- limit: 返回的记录数限制 (默认: 100)

响应:
```json
[
  {
    "id": 0,
    "task_id": 0,
    "reminder_time": "2025-08-13T03:51:19.894Z",
    "reminder_type": "once",
    "method": "popup",
    "is_active": true,
    "created_at": "2025-08-13T03:51:19.894Z",
    "updated_at": "2025-08-13T03:51:19.894Z"
  }
]
```

### 获取任务的提醒

**GET** `/reminders/tasks/{task_id}`

获取指定任务的所有提醒。

查询参数:
- skip: 跳过的记录数 (默认: 0)
- limit: 返回的记录数限制 (默认: 100)

响应:
```json
[
  {
    "id": 0,
    "task_id": 0,
    "reminder_time": "2025-08-13T03:51:19.894Z",
    "reminder_type": "once",
    "method": "popup",
    "is_active": true,
    "created_at": "2025-08-13T03:51:19.894Z",
    "updated_at": "2025-08-13T03:51:19.894Z"
  }
]
```

### 获取特定提醒

**GET** `/reminders/{reminder_id}`

获取指定提醒的信息。

响应:
```json
{
  "id": 0,
  "task_id": 0,
  "reminder_time": "2025-08-13T03:51:19.894Z",
  "reminder_type": "once",
  "method": "popup",
  "is_active": true,
  "created_at": "2025-08-13T03:51:19.894Z",
  "updated_at": "2025-08-13T03:51:19.894Z"
}
```

### 更新提醒

**PUT** `/reminders/{reminder_id}`

更新提醒信息。

请求体:
```json
{
  "reminder_time": "2025-08-13T03:51:19.894Z",
  "reminder_type": "once",
  "method": "popup",
  "is_active": true
}
```

响应:
```json
{
  "id": 0,
  "task_id": 0,
  "reminder_time": "2025-08-13T03:51:19.894Z",
  "reminder_type": "once",
  "method": "popup",
  "is_active": true,
  "created_at": "2025-08-13T03:51:19.894Z",
  "updated_at": "2025-08-13T03:51:19.894Z"
}
```

### 删除提醒

**DELETE** `/reminders/{reminder_id}`

删除提醒。

响应:
```json
true
```

### 激活提醒

**POST** `/reminders/{reminder_id}/activate`

激活提醒。

响应:
```json
{
  "id": 0,
  "task_id": 0,
  "reminder_time": "2025-08-13T03:51:19.894Z",
  "reminder_type": "once",
  "method": "popup",
  "is_active": true,
  "created_at": "2025-08-13T03:51:19.894Z",
  "updated_at": "2025-08-13T03:51:19.894Z"
}
```

### 停用提醒

**POST** `/reminders/{reminder_id}/deactivate`

停用提醒。

响应:
```json
{
  "id": 0,
  "task_id": 0,
  "reminder_time": "2025-08-13T03:51:19.894Z",
  "reminder_type": "once",
  "method": "popup",
  "is_active": true,
  "created_at": "2025-08-13T03:51:19.894Z",
  "updated_at": "2025-08-13T03:51:19.894Z"
}
```

## 任务附件

### 上传附件

**POST** `/tasks/{task_id}/attachments`

上传任务附件。

表单数据:
- file: 文件

响应:
```json
{
  "id": 0,
  "filename": "string",
  "file_path": "string",
  "created_at": "2025-08-13T03:51:19.894Z",
  "task_id": 0
}
```

### 获取任务详情（包含附件）

**GET** `/tasks/{task_id}`

获取指定任务的详细信息，包括附件（已在任务管理部分描述）。

### 下载附件

**GET** `/tasks/{task_id}/attachments/{attachment_id}`

下载指定附件。

响应:
- 成功: 文件内容（二进制流）
- 失败: 错误信息（JSON格式）

### 删除附件

**DELETE** `/tasks/{task_id}/attachments/{attachment_id}`

删除指定附件。

响应:
```json
true
```

## 任务评论

## 任务评论

### 创建评论

**POST** `/comments/`

创建新评论。

请求体:
```json
{
  "task_id": 0,
  "content": "string"
}
```

响应:
```json
{
  "id": 0,
  "content": "string",
  "created_at": "2025-08-13T03:51:19.894Z",
  "updated_at": "2025-08-13T03:51:19.894Z",
  "task_id": 0,
  "author_id": 0,
  "author": {
    "id": 0,
    "username": "string",
    "email": "string",
    "is_active": true,
    "is_admin": false,
    "created_at": "2025-08-13T03:51:19.894Z"
  }
}
```

### 获取任务的评论

**GET** `/comments/task/{task_id}`

获取指定任务的所有评论。

查询参数:
- skip: 跳过的记录数 (默认: 0)
- limit: 返回的记录数限制 (默认: 100)

响应:
```json
[
  {
    "id": 0,
    "content": "string",
    "created_at": "2025-08-13T03:51:19.894Z",
    "updated_at": "2025-08-13T03:51:19.894Z",
    "task_id": 0,
    "author_id": 0,
    "author": {
      "id": 0,
      "username": "string",
      "email": "string",
      "is_active": true,
      "is_admin": false,
      "created_at": "2025-08-13T03:51:19.894Z"
    }
  }
]
```

### 更新评论

**PUT** `/comments/{comment_id}`

更新评论内容（仅评论创建者可以更新）。

请求体:
```json
{
  "content": "string"
}
```

响应:
```json
{
  "id": 0,
  "content": "string",
  "created_at": "2025-08-13T03:51:19.894Z",
  "updated_at": "2025-08-13T03:51:19.894Z",
  "task_id": 0,
  "author_id": 0,
  "author": {
    "id": 0,
    "username": "string",
    "email": "string",
    "is_active": true,
    "is_admin": false,
    "created_at": "2025-08-13T03:51:19.894Z"
  }
}
```

### 删除评论

**DELETE** `/comments/{comment_id}`

删除评论（仅评论创建者可以删除）。

响应:
```json
true
```

## 统计数据

### 获取任务统计总览

**GET** `/statistics/summary`

获取统计数据总览。

查询参数:
- days: 天数范围 (默认: 7)

响应:
```json
{
  "task_completion": {
    "total": 0,
    "completed": 0,
    "completion_rate": 0
  },
  "daily_stats": [
    {
      "date": "2025-08-13",
      "created": 0,
      "completed": 0
    }
  ],
  "category_stats": [
    {
      "category_id": 0,
      "category_name": "string",
      "task_count": 0
    }
  ],
  "priority_stats": {
    "high": 0,
    "medium": 0,
    "low": 0
  },
  "overdue_stats": {
    "total": 0,
    "completed": 0,
    "overdue_rate": 0
  }
}
```

### 获取任务完成情况统计

**GET** `/statistics/tasks/completion`

获取任务完成情况统计。

响应:
```json
{
  "total": 0,
  "completed": 0,
  "completion_rate": 0
}
```

### 获取每日任务统计

**GET** `/statistics/tasks/daily`

获取每日任务统计。

查询参数:
- days: 天数范围 (默认: 7)

响应:
```json
[
  {
    "date": "2025-08-13",
    "created": 0,
    "completed": 0
  }
]
```

### 获取分类任务统计

**GET** `/statistics/tasks/category`

获取各分类任务统计。

响应:
```json
[
  {
    "category_id": 0,
    "category_name": "string",
    "task_count": 0
  }
]
```

### 获取优先级任务统计

**GET** `/statistics/tasks/priority`

获取各优先级任务统计。

响应:
```json
{
  "high": 0,
  "medium": 0,
  "low": 0
}
```

### 获取逾期任务统计

**GET** `/statistics/tasks/overdue`

获取逾期任务统计。

响应:
```json
{
  "total": 0,
  "completed": 0,
  "overdue_rate": 0
}
```