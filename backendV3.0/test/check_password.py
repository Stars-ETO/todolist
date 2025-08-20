#默认管理员密码
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.security import verify_password, get_password_hash

# 测试密码验证
test_password = "admin123"
hashed_password = "$2b$12$5cVzoXlNAIjucmIuirrsrO5g8RNaD.ZXRRQn98JusedGzOPJkk5d/W"

print(f"Testing password: {test_password}")
print(f"Hashed password: {hashed_password}")
print(f"Password verification result: {verify_password(test_password, hashed_password)}")

# 生成新的哈希密码进行比较
new_hashed = get_password_hash(test_password)
print(f"Newly hashed password: {new_hashed}")
print(f"Hashes match: {new_hashed == hashed_password}")