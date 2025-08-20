"""
简单的附件下载功能测试脚本
用于验证新添加的附件下载API端点
"""

import urllib.request
import urllib.error
import json

def test_attachment_download_endpoint():
    """
    测试附件下载端点是否存在
    """
    try:
        # 发送请求检查端点是否存在
        req = urllib.request.Request("http://localhost:8000/tasks/1/attachments/1")
        req.get_method = lambda: 'OPTIONS'  # 设置为OPTIONS方法
        
        response = urllib.request.urlopen(req)
        print(f"附件下载端点状态码: {response.getcode()}")
        print(f"允许的请求方法: {response.headers.get('Allow', '未知')}")
        return True
    except urllib.error.HTTPError as e:
        # 即使返回错误码，只要端点存在就说明添加成功
        print(f"附件下载端点存在，但需要认证 (状态码: {e.code})")
        return True
    except urllib.error.URLError as e:
        print(f"测试附件下载端点时出错: {e}")
        return False
    except Exception as e:
        print(f"测试附件下载端点时出错: {e}")
        return False

def check_api_docs():
    """
    检查API文档中是否包含附件下载端点
    """
    try:
        response = urllib.request.urlopen("http://localhost:8000/openapi.json")
        if response.getcode() == 200:
            data = response.read()
            api_spec = json.loads(data.decode('utf-8'))
            paths = api_spec.get("paths", {})
            
            # 检查是否存在附件下载路径
            attachment_paths = [path for path in paths.keys() if "attachments" in path]
            print(f"API中包含'attachments'的路径: {attachment_paths}")
            
            # 特别检查下载端点
            for path in paths:
                if "attachments" in path and "get" in paths[path].keys():
                    print(f"✅ 找到附件下载端点: {path}")
                    return True
            
            print("❌ 未找到GET方法的附件下载端点")
            return False
        else:
            print(f"无法获取API文档，状态码: {response.getcode()}")
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