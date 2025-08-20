"""
评论功能测试文件
用于测试任务评论相关的功能
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
from models.comment import Comment
from crud import comment
from schemas.comment import CommentCreate, CommentUpdate

class CommentsTestCase(unittest.TestCase):
    """评论功能测试用例"""
    
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
        
        # 创建另一个用户用于测试权限
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
        self.public_task = Task(
            title="公开任务",
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
        self.db.add(self.public_task)
        self.db.commit()
        self.db.refresh(self.public_task)
        
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
        self.db.refresh(self.private_task)
    
    def tearDown(self):
        """测试后清理"""
        # 删除测试数据
        comments = self.db.query(Comment).all()
        for comment in comments:
            self.db.delete(comment)
            
        self.db.delete(self.public_task)
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
    
    def test_create_comment_on_public_task(self):
        """测试在公开任务上创建评论"""
        comment_data = CommentCreate(
            content="这是一个测试评论",
            task_id=self.public_task.id
        )
        
        # 创建评论
        created_comment = comment.create_comment(self.db, comment_data, self.test_user.id)
        
        # 验证评论创建成功
        self.assertIsNotNone(created_comment)
        self.assertEqual(created_comment.content, "这是一个测试评论")
        self.assertEqual(created_comment.task_id, self.public_task.id)
        self.assertEqual(created_comment.user_id, self.test_user.id)
        self.comment_id = created_comment.id
    
    def test_create_comment_on_private_task(self):
        """测试在私有任务上创建评论"""
        comment_data = CommentCreate(
            content="这是一个测试评论",
            task_id=self.private_task.id
        )
        
        # 尝试创建评论
        created_comment = comment.create_comment(self.db, comment_data, self.test_user.id)
        
        # 验证评论创建失败
        self.assertIsNone(created_comment)
    
    def test_create_comment_on_nonexistent_task(self):
        """测试在不存在的任务上创建评论"""
        comment_data = CommentCreate(
            content="这是一个测试评论",
            task_id=99999  # 不存在的任务ID
        )
        
        # 尝试创建评论
        created_comment = comment.create_comment(self.db, comment_data, self.test_user.id)
        
        # 验证评论创建失败
        self.assertIsNone(created_comment)
    
    def test_get_task_comments(self):
        """测试获取任务评论列表"""
        # 先创建几个评论
        comment1 = Comment(
            content="第一个评论",
            task_id=self.public_task.id,
            user_id=self.test_user.id
        )
        self.db.add(comment1)
        
        comment2 = Comment(
            content="第二个评论",
            task_id=self.public_task.id,
            user_id=self.test_user.id
        )
        self.db.add(comment2)
        self.db.commit()
        
        # 获取评论列表
        comments = comment.get_comments_by_task(self.db, self.public_task.id)
        
        # 验证评论列表
        self.assertEqual(len(comments), 2)
        self.assertEqual(comments[0].content, "第一个评论")
        self.assertEqual(comments[1].content, "第二个评论")
    
    def test_update_comment_by_owner(self):
        """测试评论创建者更新评论"""
        # 先创建一个评论
        db_comment = Comment(
            content="原始评论内容",
            task_id=self.public_task.id,
            user_id=self.test_user.id
        )
        self.db.add(db_comment)
        self.db.commit()
        self.db.refresh(db_comment)
        
        # 更新评论
        comment_update = CommentUpdate(content="更新后的评论内容")
        updated_comment = comment.update_comment(self.db, db_comment, comment_update, self.test_user.id)
        
        # 验证更新成功
        self.assertIsNotNone(updated_comment)
        self.assertEqual(updated_comment.content, "更新后的评论内容")
        self.assertIsNotNone(updated_comment.updated_at)
    
    def test_update_comment_by_non_owner(self):
        """测试非评论创建者尝试更新评论"""
        # 先创建一个评论
        db_comment = Comment(
            content="原始评论内容",
            task_id=self.public_task.id,
            user_id=self.test_user.id
        )
        self.db.add(db_comment)
        self.db.commit()
        self.db.refresh(db_comment)
        
        # 尝试更新评论（由其他用户操作）
        comment_update = CommentUpdate(content="更新后的评论内容")
        updated_comment = comment.update_comment(self.db, db_comment, comment_update, self.other_user.id)
        
        # 验证更新失败
        self.assertIsNone(updated_comment)
    
    def test_delete_comment_by_owner(self):
        """测试评论创建者删除评论"""
        # 先创建一个评论
        db_comment = Comment(
            content="待删除的评论",
            task_id=self.public_task.id,
            user_id=self.test_user.id
        )
        self.db.add(db_comment)
        self.db.commit()
        self.db.refresh(db_comment)
        
        # 删除评论
        result = comment.delete_comment(self.db, db_comment.id, self.test_user.id)
        
        # 验证删除成功
        self.assertTrue(result)
        
        # 验证评论已删除
        deleted_comment = comment.get_comment(self.db, db_comment.id)
        self.assertIsNone(deleted_comment)
    
    def test_delete_comment_by_non_owner(self):
        """测试非评论创建者尝试删除评论"""
        # 先创建一个评论
        db_comment = Comment(
            content="待删除的评论",
            task_id=self.public_task.id,
            user_id=self.test_user.id
        )
        self.db.add(db_comment)
        self.db.commit()
        self.db.refresh(db_comment)
        
        # 尝试删除评论（由其他用户操作）
        result = comment.delete_comment(self.db, db_comment.id, self.other_user.id)
        
        # 验证删除失败
        self.assertFalse(result)
        
        # 验证评论仍然存在
        existing_comment = comment.get_comment(self.db, db_comment.id)
        self.assertIsNotNone(existing_comment)

if __name__ == "__main__":
    unittest.main()