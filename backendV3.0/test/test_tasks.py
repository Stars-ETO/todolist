"""
任务管理功能测试文件
用于测试任务管理相关功能，包括批量操作等
"""

import unittest
import sys
import os
import uuid
from datetime import datetime, timedelta

# 添加项目根目录到路径中
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database.database import get_db
from models.user import User
from models.task import Task, Priority, TaskStatus
from models.category import Category
from crud import task as crud_task

class TasksTestCase(unittest.TestCase):
    """任务管理功能测试用例"""
    
    def setUp(self):
        """测试前准备"""
        self.db_generator = get_db()
        self.db = next(self.db_generator)
        
        # 创建唯一标识的测试用户
        unique_id = str(uuid.uuid4())[:8]
        self.test_user = User(
            username=f"testuser_{unique_id}",
            email=f"test_{unique_id}@example.com",
            hashed_password="hashed_password"
        )
        self.db.add(self.test_user)
        self.db.commit()
        self.db.refresh(self.test_user)
        
        # 创建测试分类
        self.test_category = Category(
            name="工作",
            owner_id=self.test_user.id
        )
        self.db.add(self.test_category)
        self.db.commit()
        self.db.refresh(self.test_category)
        
        # 创建另一个测试分类用于更新测试
        self.update_category = Category(
            name="学习",
            owner_id=self.test_user.id
        )
        self.db.add(self.update_category)
        self.db.commit()
        self.db.refresh(self.update_category)
        
        # 创建测试任务
        self.create_test_tasks()
    
    def create_test_tasks(self):
        """创建测试任务"""
        tasks = []
        for i in range(5):
            task = Task(
                title=f"测试任务{i}",
                description=f"这是一个测试任务{i}",
                status=TaskStatus.PENDING,
                priority=Priority.MEDIUM,
                owner_id=self.test_user.id,
                category_id=self.test_category.id,
                created_at=datetime.utcnow() - timedelta(days=1),
                updated_at=datetime.utcnow() - timedelta(days=1),
                due_date=datetime.utcnow() + timedelta(days=2),
                is_public=False
            )
            self.db.add(task)
            tasks.append(task)
        self.db.commit()
        for task in tasks:
            self.db.refresh(task)
        self.test_tasks = tasks
    
    def tearDown(self):
        """测试后清理"""
        # 删除测试数据
        tasks = self.db.query(Task).filter(Task.owner_id == self.test_user.id).all()
        for task in tasks:
            self.db.delete(task)
            
        categories = self.db.query(Category).filter(Category.owner_id == self.test_user.id).all()
        for category in categories:
            self.db.delete(category)
            
        self.db.delete(self.test_user)
        self.db.commit()
        
        # 关闭数据库连接
        try:
            next(self.db_generator)
        except StopIteration:
            pass
    
    
    def test_batch_delete_tasks(self):
        """测试批量删除任务"""
        # 获取所有测试任务的ID
        task_ids = [task.id for task in self.test_tasks]
        
        # 执行批量删除
        deleted_count = crud_task.batch_delete_tasks(self.db, self.test_user.id, task_ids)
        
        # 验证删除成功的任务数量
        self.assertEqual(deleted_count, len(task_ids))
        
        # 验证这些任务已被标记为已删除
        for task_id in task_ids:
            db_task = crud_task.get_task(self.db, task_id, self.test_user.id)
            # 由于get_task不返回已删除的任务，我们需要直接查询数据库
            task_in_db = self.db.query(Task).filter(Task.id == task_id).first()
            self.assertIsNotNone(task_in_db)
            self.assertEqual(task_in_db.status, TaskStatus.DELETED)
            
    def test_batch_update_tasks(self):
        """测试批量更新任务"""
        # 获取所有测试任务的ID
        task_ids = [task.id for task in self.test_tasks]
        
        # 执行批量更新 - 更新优先级和分类
        updated_count = crud_task.batch_update_tasks(
            self.db, 
            self.test_user.id, 
            task_ids, 
            priority=Priority.HIGH,
            category_id=self.update_category.id
        )
        
        # 验证更新成功的任务数量
        self.assertEqual(updated_count, len(task_ids))
        
        # 验证这些任务已被正确更新
        for task_id in task_ids:
            db_task = crud_task.get_task(self.db, task_id, self.test_user.id)
            self.assertIsNotNone(db_task)
            self.assertEqual(db_task.priority, Priority.HIGH)
            self.assertEqual(db_task.category_id, self.update_category.id)
            
    def test_get_deleted_tasks(self):
        """测试获取已删除任务列表"""
        # 先删除一些任务
        task_ids = [task.id for task in self.test_tasks[:3]]  # 删除前3个任务
        deleted_count = crud_task.batch_delete_tasks(self.db, self.test_user.id, task_ids)
        
        # 验证删除成功
        self.assertEqual(deleted_count, 3)
        
        # 获取已删除的任务列表
        deleted_tasks = crud_task.get_deleted_tasks(self.db, self.test_user.id)
        
        # 验证返回的已删除任务数量
        self.assertEqual(len(deleted_tasks), 3)
        
        # 验证返回的任务都是已删除状态
        for task in deleted_tasks:
            self.assertEqual(task.status, TaskStatus.DELETED)

if __name__ == "__main__":
    unittest.main()