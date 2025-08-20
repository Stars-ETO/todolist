"""
附件功能测试文件
用于测试任务附件相关的功能，包括上传和访问
"""

import unittest
import sys
import os
import uuid
from datetime import datetime, timedelta
from io import BytesIO

# 添加项目根目录到路径中
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database.database import get_db
from models.user import User
from models.task import Task, Priority, TaskStatus
from models.category import Category
from models.attachment import Attachment
from crud import task, attachment
from schemas.attachment import AttachmentCreate

class AttachmentsTestCase(unittest.TestCase):
    """附件功能测试用例"""
    
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
        self.test_task = Task(
            title="测试任务",
            description="这是一个测试任务",
            status=TaskStatus.PENDING,
            priority=Priority.MEDIUM,
            owner_id=self.test_user.id,
            category_id=self.test_category.id,
            created_at=datetime.utcnow() - timedelta(days=1),
            updated_at=datetime.utcnow() - timedelta(days=1),
            due_date=datetime.utcnow() + timedelta(days=2),
            is_public=False
        )
        self.db.add(self.test_task)
        self.db.commit()
        self.db.refresh(self.test_task)
        
        # 确保上传目录存在
        self.upload_dir = "uploads"
        if not os.path.exists(self.upload_dir):
            os.makedirs(self.upload_dir)
    
    def tearDown(self):
        """测试后清理"""
        # 删除测试数据
        # 删除附件文件和记录
        attachments = self.db.query(Attachment).filter(Attachment.task_id == self.test_task.id).all()
        for att in attachments:
            if os.path.exists(att.file_path):
                os.remove(att.file_path)
            self.db.delete(att)
            
        self.db.delete(self.test_task)
        self.db.delete(self.test_category)
        self.db.delete(self.test_user)
        self.db.commit()
        
        # 关闭数据库连接
        try:
            next(self.db_generator)
        except StopIteration:
            pass
    
    def test_upload_attachment(self):
        """测试上传附件功能"""
        # 创建测试文件内容
        test_content = b"This is a test file content"
        test_filename = "test_file.txt"
        
        # 生成文件路径
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        unique_filename = f"{timestamp}_{test_filename}"
        file_path = os.path.join(self.upload_dir, unique_filename)
        
        # 保存文件
        with open(file_path, "wb") as f:
            f.write(test_content)
        
        # 创建附件记录
        attachment_data = AttachmentCreate(
            filename=test_filename,
            file_path=file_path,
            task_id=self.test_task.id
        )
        
        # 创建附件
        created_attachment = attachment.create_attachment(self.db, attachment_data)
        
        # 验证附件创建成功
        self.assertIsNotNone(created_attachment)
        self.assertEqual(created_attachment.filename, test_filename)
        self.assertEqual(created_attachment.task_id, self.test_task.id)
        self.assertTrue(os.path.exists(file_path))
        
        # 验证可以通过任务获取附件
        task_with_attachments = task.get_task(self.db, self.test_task.id, self.test_user.id)
        self.assertIsNotNone(task_with_attachments)
        
        # 清理测试文件
        os.remove(file_path)
    
    def test_get_attachments_by_task(self):
        """测试根据任务获取附件列表"""
        # 创建测试文件内容
        test_content = b"This is another test file content"
        test_filename = "test_file2.txt"
        
        # 生成文件路径
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        unique_filename = f"{timestamp}_{test_filename}"
        file_path = os.path.join(self.upload_dir, unique_filename)
        
        # 保存文件
        with open(file_path, "wb") as f:
            f.write(test_content)
        
        # 创建附件记录
        attachment_data = AttachmentCreate(
            filename=test_filename,
            file_path=file_path,
            task_id=self.test_task.id
        )
        
        # 创建附件
        created_attachment = attachment.create_attachment(self.db, attachment_data)
        
        # 获取任务的附件列表
        attachments = attachment.get_attachments_by_task(self.db, self.test_task.id)
        
        # 验证附件列表
        self.assertEqual(len(attachments), 1)
        self.assertEqual(attachments[0].filename, test_filename)
        self.assertEqual(attachments[0].task_id, self.test_task.id)
        
        # 清理测试文件
        os.remove(file_path)
    
    def test_delete_attachment(self):
        """测试删除附件功能"""
        # 创建测试文件内容
        test_content = b"This is a test file content to be deleted"
        test_filename = "test_file_to_delete.txt"
        
        # 生成文件路径
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        unique_filename = f"{timestamp}_{test_filename}"
        file_path = os.path.join(self.upload_dir, unique_filename)
        
        # 保存文件
        with open(file_path, "wb") as f:
            f.write(test_content)
        
        # 创建附件记录
        attachment_data = AttachmentCreate(
            filename=test_filename,
            file_path=file_path,
            task_id=self.test_task.id
        )
        
        # 创建附件
        created_attachment = attachment.create_attachment(self.db, attachment_data)
        attachment_id = created_attachment.id
        
        # 验证文件存在
        self.assertTrue(os.path.exists(file_path))
        
        # 删除附件
        result = attachment.delete_attachment(self.db, attachment_id)
        
        # 验证删除成功
        self.assertTrue(result)
        
        # 验证文件已被删除
        self.assertFalse(os.path.exists(file_path))
        
        # 验证数据库记录已被删除
        db_attachment = attachment.get_attachment(self.db, attachment_id)
        self.assertIsNone(db_attachment)

if __name__ == "__main__":
    unittest.main()