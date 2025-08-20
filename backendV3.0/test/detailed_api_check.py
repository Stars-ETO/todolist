"""
详细的API端点信息检查脚本
用于查看附件下载端点的详细信息
"""

import urllib.request
import urllib.error
import json

def detailed_api_check():
    """
    详细检查附件下载API端点的信息
    """
    try:
        response = urllib.request.urlopen("http://localhost:8000/openapi.json")
        if response.getcode() == 200:
            data = response.read()
            api_spec = json.loads(data.decode('utf-8'))
            paths = api_spec.get("paths", {})
            
            # 查找附件下载端点
            download_path = "/tasks/{task_id}/attachments/{attachment_id}"
            if download_path in paths:
                endpoint_info = paths[download_path]
                print(f"附件下载端点详细信息:")
                print(f"路径: {download_path}")
                
                for method, details in endpoint_info.items():
                    print(f"\n方法: {method.upper()}")
                    print(f"  摘要: {details.get('summary', '无')}")
                    print(f"  描述: {details.get('description', '无')}")
                    
                    # 显示参数
                    parameters = details.get('parameters', [])
                    if parameters:
                        print(f"  参数:")
                        for param in parameters:
                            print(f"    - {param.get('name', '未知')}: {param.get('description', '无描述')}")
                    
                    # 显示响应
                    responses = details.get('responses', {})
                    if responses:
                        print(f"  响应:")
                        for code, resp in responses.items():
                            print(f"    {code}: {resp.get('description', '无描述')}")
                
                return True
            else:
                print("未找到附件下载端点")
                return False
        else:
            print(f"无法获取API文档，状态码: {response.getcode()}")
            return False
    except Exception as e:
        print(f"检查API文档时出错: {e}")
        return False

if __name__ == "__main__":
    print("=== 详细检查附件下载API端点 ===")
    detailed_api_check()
    print("=== 检查完成 ===")