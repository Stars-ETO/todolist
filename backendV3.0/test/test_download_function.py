"""
简单的附件下载功能测试脚本
用于验证新添加的附件下载API端点
"""

import requests
import os

def test_attachment_download_endpoint():
    """
    测试附件下载端点是否存在
    """
    try:
        # 发送OPTIONS请求来检查端点是否存在
        response = requests.options("http://localhost:8000/tasks/1/attachments/1")
        print(f"附件下载端点状态码: {response.status_code}")
        print(f"允许的请求方法: {response.headers.get('Allow', '未知')}")
        return True
    except requests.exceptions.RequestException as e:
        print(f"测试附件下载端点时出错: {e}")
        return False

def check_api_docs():
    """
    检查API文档中是否包含附件下载端点
    """
    try:
        response = requests.get("http://localhost:8000/openapi.json")
        if response.status_code == 200:
            api_spec = response.json()
            paths = api_spec.get("paths", {})
            
            # 检查是否存在附件下载路径
            attachment_paths = [path for path in paths.keys() if "attachments" in path]
            print(f"API中包含'attachments'的路径: {attachment_paths}")
            
            # 特别检查下载端点
            download_path = "/tasks/{task_id}/attachments/{attachment_id}"
            if download_path in paths:
                print(f"✅ 找到附件下载端点: {download_path}")
                methods = paths[download_path]
                print(f"支持的HTTP方法: {list(methods.keys())}")
                return True
            else:
                print(f"❌ 未找到附件下载端点: {download_path}")
                return False
        else:
            print(f"无法获取API文档，状态码: {response.status_code}")
            return False
    except Exception as e:
        print(f"检查API文档时出错: {e}")
        return False

if __name__ == "__main__":
    print("=== 测试附件下载功能 ===")
    
    print("\n1. 检查API文档中的附件下载端点:")
    check_api_docs()
    
    print("\n2. 测试附件下载端点:")
    test_attachment_download_endpoint()
    
    print("\n=== 测试完成 ===")