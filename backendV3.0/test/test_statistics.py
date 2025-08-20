"""
统计功能测试文件
用于测试统计数据相关功能
"""

import unittest
import sys
import os
import uuid
from datetime import datetime, timedelta

# 添加项目根目录到路径中
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main import app
from database.database import get_db
from models.user import User
from models.task import Task, Priority
from models.category import Category
from crud import statistics

class StatisticsTestCase(unittest.TestCase):
    """统计功能测试用例"""
    
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
        
        # 创建测试任务
        self.create_test_tasks()
    
    def create_test_tasks(self):
        """创建测试任务"""
        # 创建已完成任务
        completed_task = Task(
            title="已完成任务",
            description="这是一个已完成的任务",
            status="completed",
            priority=Priority.HIGH,
            owner_id=self.test_user.id,
            category_id=self.test_category.id,
            created_at=datetime.utcnow() - timedelta(days=2),
            updated_at=datetime.utcnow() - timedelta(days=1),
            due_date=datetime.utcnow() + timedelta(days=1)
        )
        self.db.add(completed_task)
        
        # 创建待办任务
        pending_task = Task(
            title="待办任务",
            description="这是一个待办的任务",
            status="pending",
            priority=Priority.MEDIUM,
            owner_id=self.test_user.id,
            category_id=self.test_category.id,
            created_at=datetime.utcnow() - timedelta(days=1),
            updated_at=datetime.utcnow() - timedelta(days=1),
            due_date=datetime.utcnow() + timedelta(days=2)
        )
        self.db.add(pending_task)
        
        # 创建逾期任务
        overdue_task = Task(
            title="逾期任务",
            description="这是一个逾期的任务",
            status="pending",
            priority=Priority.LOW,
            owner_id=self.test_user.id,
            category_id=self.test_category.id,
            created_at=datetime.utcnow() - timedelta(days=5),
            updated_at=datetime.utcnow() - timedelta(days=5),
            due_date=datetime.utcnow() - timedelta(days=2)
        )
        self.db.add(overdue_task)
        
        # 创建今日到期任务
        due_today_task = Task(
            title="今日到期任务",
            description="这是今日到期的任务",
            status="pending",
            priority=Priority.HIGH,
            owner_id=self.test_user.id,
            category_id=self.test_category.id,
            created_at=datetime.utcnow() - timedelta(hours=2),
            updated_at=datetime.utcnow() - timedelta(hours=2),
            due_date=datetime.utcnow().replace(hour=23, minute=59, second=59, microsecond=0)
        )
        self.db.add(due_today_task)
        
        # 创建未分类任务
        uncategorized_task = Task(
            title="未分类任务",
            description="这是一个未分类的任务",
            status="pending",
            priority=Priority.MEDIUM,
            owner_id=self.test_user.id,
            category_id=None,
            created_at=datetime.utcnow() - timedelta(hours=1),
            updated_at=datetime.utcnow() - timedelta(hours=1),
            due_date=datetime.utcnow() + timedelta(days=3)
        )
        self.db.add(uncategorized_task)
        
        self.db.commit()
    
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
    
    def test_get_task_completion_stats(self):
        """测试获取任务完成情况统计"""
        stats = statistics.get_task_completion_stats(self.db, self.test_user.id)
        
        # 验证统计结果
        self.assertEqual(stats["total_tasks"], 5)
        self.assertEqual(stats["completed_tasks"], 1)
        self.assertEqual(stats["pending_tasks"], 4)
        self.assertEqual(stats["deleted_tasks"], 0)
        self.assertEqual(stats["completion_rate"], 20.0)
    
    def test_get_daily_task_stats(self):
        """测试获取每日任务统计"""
        stats = statistics.get_daily_task_stats(self.db, self.test_user.id, days=7)
        
        # 验证返回结果
        self.assertIsInstance(stats, list)
        self.assertGreater(len(stats), 0)
        
        # 检查数据结构
        for stat in stats:
            self.assertIn("date", stat)
            self.assertIn("created_count", stat)
            self.assertIn("completed_count", stat)
    
    def test_get_category_task_stats(self):
        """测试获取分类任务统计"""
        stats = statistics.get_category_task_stats(self.db, self.test_user.id)
        
        # 验证统计结果
        self.assertIsInstance(stats, list)
        self.assertGreater(len(stats), 0)
        
        # 查找特定分类
        work_category = None
        uncategorized = None
        
        for stat in stats:
            if stat["category_name"] == "工作":
                work_category = stat
            elif stat["category_name"] == "未分类":
                uncategorized = stat
        
        self.assertIsNotNone(work_category)
        self.assertIsNotNone(uncategorized)
        self.assertEqual(work_category["task_count"], 4)
        self.assertEqual(uncategorized["task_count"], 1)
    
    def test_get_priority_task_stats(self):
        """测试获取优先级任务统计"""
        stats = statistics.get_priority_task_stats(self.db, self.test_user.id)
        
        # 验证统计结果
        self.assertIsInstance(stats, dict)
        self.assertIn("Priority.HIGH", stats)
        self.assertIn("Priority.MEDIUM", stats)
        self.assertIn("Priority.LOW", stats)
    
    def test_get_overdue_task_stats(self):
        """测试获取逾期任务统计"""
        stats = statistics.get_overdue_task_stats(self.db, self.test_user.id)
        
        # 验证统计结果
        self.assertEqual(stats["overdue_count"], 1)
        self.assertEqual(stats["due_today_count"], 1)

if __name__ == "__main__":
    unittest.main()