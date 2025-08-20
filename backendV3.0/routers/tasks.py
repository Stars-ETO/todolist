"""
任务管理路由模块
处理任务管理相关的API端点
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
import os
from datetime import datetime

import crud.task as crud_task
import crud.category as crud_category
import crud.attachment as crud_attachment
import crud.reminder as crud_reminder
from core.deps import get_current_active_user
from core.config import settings
from database.database import get_db
from schemas.task import Task, TaskCreate, TaskUpdate, TaskWithAttachments, TaskWithCategory, TaskBatchUpdate, TaskBatchDelete
from schemas.category import Category, CategoryCreate, CategoryUpdate
from schemas.attachment import Attachment, AttachmentCreate
from schemas.reminder import Reminder
from models.user import User as UserModel
from models.task import Task as TaskModel, TaskStatus
import csv
import io

router = APIRouter()
logger = logging.getLogger(__name__)

# 重要：将特殊路径路由放在通用路径路由之前，避免路由冲突

# 批量操作端点
@router.put("/batch", response_model=int)
def batch_update_tasks(
    batch_update: TaskBatchUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
) -> int:
    """
    批量更新任务信息（仅支持优先级和分类）
    
    Args:
        batch_update: 批量更新请求信息
        db: 数据库会话
        current_user: 当前认证用户
        
    Returns:
        int: 更新成功的任务数量
    """
    logger.info(f"User {current_user.username} attempting to batch update tasks: {batch_update.task_ids}")
    
    # 检查所有任务是否存在且属于当前用户
    tasks = crud_task.get_tasks_by_ids(db, task_ids=batch_update.task_ids, user_id=current_user.id)
    if len(tasks) != len(batch_update.task_ids):
        raise HTTPException(
            status_code=400,
            detail="Some tasks not found or do not belong to the current user"
        )
    
    # 执行批量更新
    updated_count = crud_task.batch_update_tasks(
        db=db,
        task_ids=batch_update.task_ids,
        priority=batch_update.priority,
        category_id=batch_update.category_id
    )
    
    logger.info(f"User {current_user.username} successfully batch updated {updated_count} tasks")
    return updated_count


@router.delete("/batch", response_model=int)
def batch_delete_tasks(
    batch_delete: TaskBatchDelete,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
) -> int:
    """
    批量删除任务（移动到回收站）
    
    Args:
        batch_delete: 批量删除请求信息
        db: 数据库会话
        current_user: 当前认证用户
        
    Returns:
        int: 删除成功的任务数量
    """
    logger.info(f"User {current_user.username} attempting to batch delete tasks: {batch_delete.task_ids}")
    
    # 检查所有任务是否存在且属于当前用户
    tasks = crud_task.get_tasks_by_ids(db, task_ids=batch_delete.task_ids, user_id=current_user.id)
    if len(tasks) != len(batch_delete.task_ids):
        raise HTTPException(
            status_code=400,
            detail="Some tasks not found or do not belong to the current user"
        )
    
    # 执行批量删除
    deleted_count = crud_task.batch_delete_tasks(db=db, task_ids=batch_delete.task_ids)
    
    logger.info(f"User {current_user.username} successfully batch deleted {deleted_count} tasks")
    return deleted_count


# 回收站相关端点（需要放在/{task_id}路由之前）
@router.get("/deleted", response_model=List[Task])
def read_deleted_tasks(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
) -> List[Task]:
    """
    获取当前用户已删除的任务列表（回收站）
    
    Args:
        skip: 跳过的记录数
        limit: 返回的记录数限制
        db: 数据库会话
        current_user: 当前认证用户
        
    Returns:
        List[Task]: 已删除的任务对象列表
    """
    tasks = crud_task.get_deleted_tasks(db, user_id=current_user.id, skip=skip, limit=limit)
    return tasks


@router.post("/deleted/{task_id}/restore", response_model=Task)
def restore_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
) -> Task:
    """
    恢复已删除的任务
    
    Args:
        task_id: 任务ID
        db: 数据库会话
        current_user: 当前认证用户
        
    Returns:
        Task: 恢复后的任务对象
        
    Raises:
        HTTPException: 当任务不存在时抛出404异常
    """
    task = crud_task.restore_task(db=db, task_id=task_id, user_id=current_user.id)
    if task is None:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )
    return task


@router.delete("/deleted/{task_id}", response_model=bool)
def permanently_delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
) -> bool:
    """
    永久删除任务（从回收站中彻底删除）
    
    Args:
        task_id: 任务ID
        db: 数据库会话
        current_user: 当前认证用户
        
    Returns:
        bool: 删除成功返回True，否则返回False
        
    Raises:
        HTTPException: 当任务不存在时抛出404异常
    """
    # 检查要永久删除的任务是否确实存在于回收站中
    db_task = db.query(TaskModel).filter(
        and_(
            TaskModel.id == task_id,
            TaskModel.owner_id == current_user.id,
            TaskModel.status == TaskStatus.DELETED
        )
    ).first()
    
    if db_task is None:
        raise HTTPException(
            status_code=404,
            detail="Task not found in recycle bin"
        )
    
    result = crud_task.permanently_delete_task(db=db, task_id=task_id, user_id=current_user.id)
    if not result:
        # 如果永久删除失败，抛出异常
        raise HTTPException(
            status_code=500,
            detail="Failed to permanently delete task"
        )
    return result


# 任务分类管理端点
@router.post("/categories", response_model=Category)
def create_category(
    category: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
) -> Category:
    """
    创建新任务分类
    
    Args:
        category: 分类创建信息
        db: 数据库会话
        current_user: 当前认证用户
        
    Returns:
        Category: 新创建的分类对象
    """
    logger.info(f"User {current_user.username} creating new category: {category.name}")
    return crud_category.create_category(db=db, category=category, owner_id=current_user.id)


@router.get("/categories", response_model=List[Category])
def read_categories(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
) -> List[Category]:
    """
    获取当前用户的所有任务分类
    
    Args:
        skip: 跳过的记录数
        limit: 返回的记录数限制
        db: 数据库会话
        current_user: 当前认证用户
        
    Returns:
        List[Category]: 分类对象列表
    """
    categories = crud_category.get_categories(db, user_id=current_user.id, skip=skip, limit=limit)
    return categories


@router.put("/categories/{category_id}", response_model=Category)
def update_category(
    category_id: int,
    category_update: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
) -> Category:
    """
    更新任务分类信息
    
    Args:
        category_id: 分类ID
        category_update: 分类更新信息
        db: 数据库会话
        current_user: 当前认证用户
        
    Returns:
        Category: 更新后的分类对象
        
    Raises:
        HTTPException: 当分类不存在时抛出404异常
    """
    db_category = crud_category.get_category(db, category_id=category_id, owner_id=current_user.id)
    if db_category is None:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )
    return crud_category.update_category(db=db, db_category=db_category, category_update=category_update)


@router.delete("/categories/{category_id}", response_model=bool)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
) -> bool:
    """
    删除任务分类
    
    Args:
        category_id: 分类ID
        db: 数据库会话
        current_user: 当前认证用户
        
    Returns:
        bool: 删除成功返回True，否则返回False
        
    Raises:
        HTTPException: 当分类不存在时抛出404异常
    """
    db_category = crud_category.get_category(db, category_id=category_id, owner_id=current_user.id)
    if db_category is None:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )
    result = crud_category.delete_category(db=db, category_id=category_id, user_id=current_user.id)
    # 确保返回正确的响应
    return result


# 任务管理端点
@router.get("/", response_model=List[TaskWithCategory])
def read_tasks(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    category_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
) -> List[TaskWithCategory]:
    """
    获取当前用户的所有任务，支持筛选和分页
    
    Args:
        skip: 跳过的记录数
        limit: 返回的记录数限制
        status: 任务状态筛选
        priority: 任务优先级筛选
        category_id: 分类ID筛选
        db: 数据库会话
        current_user: 当前认证用户
        
    Returns:
        List[TaskWithCategory]: 任务对象列表（包含分类信息）
    """
    # 默认不显示已删除的任务
    if status is None:
        status = "pending,in_progress,completed"  # 不包括deleted状态
    
    tasks = crud_task.get_tasks(
        db, 
        user_id=current_user.id, 
        skip=skip, 
        limit=limit,
        status=status,
        priority=priority,
        category_id=category_id
    )
    return tasks


@router.post("/", response_model=Task)
def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
) -> Task:
    """
    创建新任务
    
    Args:
        task: 任务创建信息
        db: 数据库会话
        current_user: 当前认证用户
        
    Returns:
        Task: 新创建的任务对象
        
    Raises:
        HTTPException: 当分类不存在时抛出400异常
    """
    # 检查分类是否存在且属于当前用户
    if task.category_id:
        category = crud_category.get_category(db, task.category_id, current_user.id)
        if not category:
            raise HTTPException(
                status_code=400,
                detail="Category not found"
            )
    
    return crud_task.create_task(db=db, task=task, owner_id=current_user.id)


@router.get("/{task_id}", response_model=TaskWithAttachments)
def read_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
) -> TaskWithAttachments:
    """
    获取指定任务的详细信息
    
    Args:
        task_id: 任务ID
        db: 数据库会话
        current_user: 当前认证用户
        
    Returns:
        TaskWithAttachments: 任务对象（包含附件信息）
        
    Raises:
        HTTPException: 当任务不存在时抛出404异常
    """
    task = crud_task.get_task(db, task_id=task_id, user_id=current_user.id)
    if task is None:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )
    return task


@router.put("/{task_id}", response_model=Task)
def update_task(
    task_id: int,
    task_update: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
) -> Task:
    """
    更新任务信息
    
    Args:
        task_id: 任务ID
        task_update: 任务更新信息
        db: 数据库会话
        current_user: 当前认证用户
        
    Returns:
        Task: 更新后的任务对象
        
    Raises:
        HTTPException: 当任务不存在时抛出404异常
    """
    db_task = crud_task.get_task(db, task_id=task_id, user_id=current_user.id)
    if db_task is None:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )
    
    # 检查分类是否存在且属于当前用户
    if task_update.category_id:
        category = crud_category.get_category(db, task_update.category_id, current_user.id)
        if not category:
            raise HTTPException(
                status_code=400,
                detail="Category not found"
            )
    
    return crud_task.update_task(db=db, db_task=db_task, task_update=task_update)


@router.delete("/{task_id}", response_model=bool)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
) -> bool:
    """
    删除任务（移动到回收站）
    
    Args:
        task_id: 任务ID
        db: 数据库会话
        current_user: 当前认证用户
        
    Returns:
        bool: 删除成功返回True，否则返回False
        
    Raises:
        HTTPException: 当任务不存在时抛出404异常
    """
    db_task = crud_task.get_task(db, task_id=task_id, user_id=current_user.id)
    if db_task is None:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )
    
    return crud_task.delete_task(db=db, task_id=task_id, user_id=current_user.id)


@router.post("/{task_id}/attachments", response_model=Attachment)
def upload_attachment(
    task_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
) -> Attachment:
    """
    上传任务附件
    
    Args:
        task_id: 任务ID
        file: 上传的文件
        db: 数据库会话
        current_user: 当前认证用户
        
    Returns:
        Attachment: 新创建的附件对象
        
    Raises:
        HTTPException: 当任务不存在时抛出404异常
    """
    # 检查任务是否存在且属于当前用户
    task = crud_task.get_task(db, task_id=task_id, user_id=current_user.id)
    if task is None:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )
    
    # 确保上传目录存在
    upload_dir = settings.UPLOAD_DIR
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)
    
    # 生成唯一文件名
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    unique_filename = f"{timestamp}_{file.filename}"
    file_path = os.path.join(upload_dir, unique_filename)
    
    # 保存文件
    with open(file_path, "wb") as buffer:
        content = file.file.read()
        buffer.write(content)
    
    # 创建附件记录
    attachment_create = AttachmentCreate(
        filename=file.filename,
        file_path=file_path,
        task_id=task_id
    )
    
    return crud_attachment.create_attachment(db=db, attachment=attachment_create)


@router.get("/{task_id}/attachments/{attachment_id}")
def download_attachment(
    task_id: int,
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    下载任务附件
    
    Args:
        task_id: 任务ID
        attachment_id: 附件ID
        db: 数据库会话
        current_user: 当前认证用户
        
    Returns:
        FileResponse: 附件文件下载响应
        
    Raises:
        HTTPException: 当任务或附件不存在，或用户无权限时抛出相应异常
    """
    # 检查任务是否存在且属于当前用户
    task = crud_task.get_task(db, task_id=task_id, user_id=current_user.id)
    if task is None:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )
    
    # 检查附件是否存在且属于该任务
    attachment = crud_attachment.get_attachment(db, attachment_id=attachment_id)
    if attachment is None or attachment.task_id != task_id:
        raise HTTPException(
            status_code=404,
            detail="Attachment not found"
        )
    
    # 检查文件是否存在
    if not os.path.exists(attachment.file_path):
        raise HTTPException(
            status_code=404,
            detail="Attachment file not found"
        )
    
    # 返回文件响应
    from fastapi.responses import FileResponse
    return FileResponse(
        path=attachment.file_path,
        filename=attachment.filename,
        media_type="application/octet-stream"
    )


@router.delete("/{task_id}/attachments/{attachment_id}", response_model=bool)
def delete_attachment(
    task_id: int,
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
) -> bool:
    """
    删除任务附件
    
    Args:
        task_id: 任务ID
        attachment_id: 附件ID
        db: 数据库会话
        current_user: 当前认证用户
        
    Returns:
        bool: 删除成功返回True，否则返回False
        
    Raises:
        HTTPException: 当任务或附件不存在，或用户无权限时抛出相应异常
    """
    # 检查任务是否存在且属于当前用户
    task = crud_task.get_task(db, task_id=task_id, user_id=current_user.id)
    if task is None:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )
    
    # 检查附件是否存在且属于该任务
    attachment = crud_attachment.get_attachment(db, attachment_id=attachment_id)
    if attachment is None or attachment.task_id != task_id:
        raise HTTPException(
            status_code=404,
            detail="Attachment not found"
        )
    
    # 删除附件记录和文件
    result = crud_attachment.delete_attachment(db=db, attachment_id=attachment_id)
    if not result:
        raise HTTPException(
            status_code=500,
            detail="Failed to delete attachment"
        )
    
    return result


@router.get("/export/csv")
def export_tasks_csv(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    category_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    导出当前用户任务为CSV格式
    
    该接口允许用户将其任务导出为CSV文件，方便在Excel或其他应用程序中查看和分析。
    用户可以通过查询参数筛选要导出的任务。
    
    Args:
        status (Optional[str]): 筛选特定状态的任务 (pending, completed, deleted)
        priority (Optional[str]): 筛选特定优先级的任务 (high, medium, low)
        category_id (Optional[int]): 筛选特定分类的任务
        db (Session): 数据库会话依赖
        current_user (UserModel): 当前认证用户依赖
        
    Returns:
        Response: 包含CSV格式任务数据的文件下载响应
        
    Example:
        GET /tasks/export/csv?status=completed&priority=high
        将返回所有已完成且优先级为高的任务的CSV文件
        
    Response Headers:
        Content-Disposition: attachment; filename=tasks_{username}.csv
        Content-Type: text/csv
    """
    # 获取用户任务
    tasks = crud_task.get_tasks(
        db, 
        user_id=current_user.id,
        status=status,
        priority=priority,
        category_id=category_id
    )
    
    # 创建CSV数据
    output = io.StringIO()
    writer = csv.writer(output)
    
    # 写入表头
    writer.writerow([
        "ID", "标题", "描述", "截止日期", "优先级", 
        "状态", "分类ID", "是否公开", "创建时间", "更新时间"
    ])
    
    # 写入任务数据
    for task in tasks:
        writer.writerow([
            task.id,
            task.title,
            task.description or "",
            task.due_date.strftime("%Y-%m-%d %H:%M:%S") if task.due_date else "",
            task.priority.value if task.priority else "",
            task.status.value if task.status else "",
            task.category_id or "",
            "是" if task.is_public else "否",
            task.created_at.strftime("%Y-%m-%d %H:%M:%S") if task.created_at else "",
            task.updated_at.strftime("%Y-%m-%d %H:%M:%S") if task.updated_at else ""
        ])
    
    # 创建响应
    csv_data = output.getvalue()
    output.close()
    
    # 返回CSV文件响应
    from fastapi.responses import Response
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=tasks_{current_user.username}.csv"}
    )
