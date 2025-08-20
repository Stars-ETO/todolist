"""
协作功能测试文件
用于测试任务协作相关的功能，如公开任务查看和任务分享
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
from crud import task

class CollaborationTestCase(unittest.TestCase):
    """协作功能测试用例"""
    
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
        
        # 创建另一个用户用于测试协作功能
        another_unique_id = str(uuid.uuid4())[:8]
        self.other_user = User(
            username=f"otheruser_{another_unique_id}",
            email=f"other_{another_unique_id}@example.com",
            hashed_password="hashed_password"
        )
        self.db.add(self.other_user)
        self.db.commit()
        self.db.refresh(self.other_user)
        
        # 创建测试分类
        self.test_category = Category(
            name="工作",
            owner_id=self.test_user.id
        )
        self.db.add(self.test_category)
        self.db.commit()
        self.db.refresh(self.test_category)
        
        # 创建公开测试任务
        self.public_task1 = Task(
            title="公开任务1",
            description="这是一个公开的任务",
            status=TaskStatus.PENDING,
            priority=Priority.MEDIUM,
            owner_id=self.test_user.id,
            category_id=self.test_category.id,
            created_at=datetime.utcnow() - timedelta(days=1),
            updated_at=datetime.utcnow() - timedelta(days=1),
            due_date=datetime.utcnow() + timedelta(days=2),
            is_public=True
        )
        self.db.add(self.public_task1)
        
        self.public_task2 = Task(
            title="公开任务2",
            description="这是另一个公开的任务",
            status=TaskStatus.COMPLETED,
            priority=Priority.HIGH,
            owner_id=self.test_user.id,
            category_id=self.test_category.id,
            created_at=datetime.utcnow() - timedelta(days=2),
            updated_at=datetime.utcnow() - timedelta(days=1),
            due_date=datetime.utcnow() + timedelta(days=1),
            is_public=True
        )
        self.db.add(self.public_task2)
        
        # 创建私有测试任务
        self.private_task = Task(
            title="私有任务",
            description="这是一个私有的任务",
            status=TaskStatus.PENDING,
            priority=Priority.HIGH,
            owner_id=self.test_user.id,
            category_id=self.test_category.id,
            created_at=datetime.utcnow() - timedelta(days=1),
            updated_at=datetime.utcnow() - timedelta(days=1),
            due_date=datetime.utcnow() + timedelta(days=2),
            is_public=False
        )
        self.db.add(self.private_task)
        
        self.db.commit()
        self.db.refresh(self.public_task1)
        self.db.refresh(self.public_task2)
        self.db.refresh(self.private_task)
    
    def tearDown(self):
        """测试后清理"""
        # 删除测试数据
        self.db.delete(self.public_task1)
        self.db.delete(self.public_task2)
        self.db.delete(self.private_task)
        self.db.delete(self.test_category)
        self.db.delete(self.other_user)
        self.db.delete(self.test_user)
        self.db.commit()
        
        # 关闭数据库连接
        try:
            next(self.db_generator)
        except StopIteration:
            pass
    
    def test_get_public_tasks(self):
        """测试获取公开任务列表"""
        # 获取公开任务列表
        public_tasks = task.get_public_tasks(self.db, skip=0, limit=100)
        
        # 验证我们创建的两个任务在列表中
        public_task_titles = [t.title for t in public_tasks]
        self.assertIn("公开任务1", public_task_titles)
        self.assertIn("公开任务2", public_task_titles)
        
        # 验证返回的任务确实是公开的且未删除
        test_tasks = [t for t in public_tasks if t.title in ["公开任务1", "公开任务2"]]
        for task_item in test_tasks:
            self.assertTrue(task_item.is_public)
            self.assertNotEqual(task_item.status, TaskStatus.DELETED)
    
    def test_public_task_visibility(self):
        """测试公开任务对其他用户的可见性"""
        # 模拟其他用户获取任务列表
        user_tasks = task.get_tasks(self.db, user_id=self.other_user.id)
        public_tasks = task.get_public_tasks(self.db)
        
        # 验证普通任务列表不包含其他用户的公开任务
        self.assertEqual(len(user_tasks), 0)
        
        # 验证公开任务列表包含我们创建的任务
        public_task_titles = [t.title for t in public_tasks]
        self.assertIn("公开任务1", public_task_titles)
        self.assertIn("公开任务2", public_task_titles)
    
    def test_private_task_not_in_public_list(self):
        """测试私有任务不会出现在公开任务列表中"""
        # 获取公开任务列表
        public_tasks = task.get_public_tasks(self.db, skip=0, limit=100)
        
        # 验证私有任务不在公开任务列表中
        public_task_ids = [t.id for t in public_tasks]
        self.assertNotIn(self.private_task.id, public_task_ids)
    
    def test_deleted_public_task_not_in_public_list(self):
        """测试已删除的公开任务不会出现在公开任务列表中"""
        # 创建一个已删除的公开任务
        deleted_public_task = Task(
            title="已删除的公开任务",
            description="这是一个已删除的公开任务",
            status=TaskStatus.DELETED,
            priority=Priority.LOW,
            owner_id=self.test_user.id,
            category_id=self.test_category.id,
            created_at=datetime.utcnow() - timedelta(days=3),
            updated_at=datetime.utcnow() - timedelta(days=1),
            due_date=datetime.utcnow() + timedelta(days=3),
            is_public=True
        )
        self.db.add(deleted_public_task)
        self.db.commit()
        
        # 获取公开任务列表
        public_tasks = task.get_public_tasks(self.db, skip=0, limit=100)
        
        # 验证已删除的公开任务不在列表中
        public_task_ids = [t.id for t in public_tasks]
        self.assertNotIn(deleted_public_task.id, public_task_ids)
        
        # 清理测试数据
        self.db.delete(deleted_public_task)
        self.db.commit()

if __name__ == "__main__":
    unittest.main()