"""
分类 CRUD 操作模块
提供分类相关的数据库操作函数
"""

from sqlalchemy.orm import Session
from models.category import Category
from schemas.category import CategoryCreate, CategoryUpdate
from typing import Optional, List


def get_category(db: Session, category_id: int, user_id: int) -> Optional[Category]:
    """
    根据分类ID获取分类信息
    
    Args:
        db: 数据库会话
        category_id: 分类ID
        user_id: 用户ID
        
    Returns:
        Category: 分类对象或None
    """
    return db.query(Category).filter(
        Category.id == category_id,
        Category.owner_id == user_id
    ).first()


def get_categories(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Category]:
    """
    获取用户分类列表
    
    Args:
        db: 数据库会话
        user_id: 用户ID
        skip: 跳过的记录数
        limit: 返回的记录数限制
        
    Returns:
        List[Category]: 分类对象列表
    """
    return db.query(Category).filter(Category.owner_id == user_id).offset(skip).limit(limit).all()


def create_category(db: Session, category: CategoryCreate, owner_id: int) -> Category:
    """
    创建新分类
    
    Args:
        db: 数据库会话
        category: 分类创建信息
        owner_id: 分类所有者ID
        
    Returns:
        Category: 新创建的分类对象
    """
    db_category = Category(
        name=category.name,
        owner_id=owner_id
    )
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


def update_category(db: Session, db_category: Category, category_update: CategoryUpdate) -> Category:
    """
    更新分类信息
    
    Args:
        db: 数据库会话
        db_category: 数据库中的分类对象
        category_update: 分类更新信息
        
    Returns:
        Category: 更新后的分类对象
    """
    update_data = category_update.dict(exclude_unset=True)
        
    for field, value in update_data.items():
        setattr(db_category, field, value)
        
    db.commit()
    db.refresh(db_category)
    return db_category


def delete_category(db: Session, category_id: int, user_id: int) -> bool:
    """
    删除分类（会同时将该分类下的所有任务的分类设置为NULL）
    
    Args:
        db: 数据库会话
        category_id: 分类ID
        user_id: 用户ID
        
    Returns:
        bool: 删除成功返回True，否则返回False
    """
    db_category = db.query(Category).filter(
        Category.id == category_id,
        Category.owner_id == user_id
    ).first()
    
    if db_category:
        # 将该分类下的所有任务的category_id设置为NULL
        db.query(Task).filter(
            Task.category_id == category_id,
            Task.owner_id == user_id
        ).update({Task.category_id: None})
        
        # 删除分类
        db.delete(db_category)
        db.commit()
        return True
    return False
