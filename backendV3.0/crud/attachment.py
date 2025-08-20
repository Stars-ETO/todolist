"""
附件 CRUD 操作模块
提供附件相关的数据库操作函数
"""

from sqlalchemy.orm import Session
from models.attachment import Attachment
from schemas.attachment import AttachmentCreate, AttachmentUpdate
from typing import Optional, List
import os


def get_attachment(db: Session, attachment_id: int) -> Optional[Attachment]:
    """
    根据附件ID获取附件信息
    
    Args:
        db: 数据库会话
        attachment_id: 附件ID
        
    Returns:
        Attachment: 附件对象或None
    """
    return db.query(Attachment).filter(Attachment.id == attachment_id).first()


def get_attachments_by_task(db: Session, task_id: int, skip: int = 0, limit: int = 100) -> List[Attachment]:
    """
    根据任务ID获取附件列表
    
    Args:
        db: 数据库会话
        task_id: 任务ID
        skip: 跳过的记录数
        limit: 返回的记录数限制
        
    Returns:
        List[Attachment]: 附件对象列表
    """
    return db.query(Attachment).filter(Attachment.task_id == task_id).offset(skip).limit(limit).all()


def create_attachment(db: Session, attachment: AttachmentCreate) -> Attachment:
    """
    创建新附件记录
    
    Args:
        db: 数据库会话
        attachment: 附件创建信息
        
    Returns:
        Attachment: 新创建的附件对象
    """
    db_attachment = Attachment(
        filename=attachment.filename,
        file_path=attachment.file_path,
        task_id=attachment.task_id
    )
    db.add(db_attachment)
    db.commit()
    db.refresh(db_attachment)
    return db_attachment


def update_attachment(db: Session, db_attachment: Attachment, attachment_update: AttachmentUpdate) -> Attachment:
    """
    更新附件信息
    
    Args:
        db: 数据库会话
        db_attachment: 数据库中的附件对象
        attachment_update: 附件更新信息
        
    Returns:
        Attachment: 更新后的附件对象
    """
    update_data = attachment_update.dict(exclude_unset=True)
        
    for field, value in update_data.items():
        setattr(db_attachment, field, value)
        
    db.commit()
    db.refresh(db_attachment)
    return db_attachment


def delete_attachment(db: Session, attachment_id: int) -> bool:
    """
    删除附件记录和文件
    
    Args:
        db: 数据库会话
        attachment_id: 附件ID
        
    Returns:
        bool: 删除成功返回True，否则返回False
    """
    db_attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    
    if db_attachment:
        # 删除文件系统中的实际文件
        if os.path.exists(db_attachment.file_path):
            try:
                os.remove(db_attachment.file_path)
            except OSError:
                pass  # 文件可能已被删除
        
        # 删除数据库记录
        db.delete(db_attachment)
        db.commit()
        return True
    return False