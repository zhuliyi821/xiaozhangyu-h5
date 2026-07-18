"""
👁️ 小章鱼代码质量自动审查脚本
用法: python3 run-code-review.py
覆盖: TypeScript / Python / PHP / 配置项
"""
import os, re, json, sys, ast
from datetime import datetime

BASE = r'C:\Users\欧\WorkBuddy\2026-07-01-06-01-32\xiaozhangyu-app'
SERVER_CONFIG = r'C:\Users\欧\WorkBuddy\2026-07-01-06-01-32\server-config'  # optional

issues = []
checks_run = 0

def R(level, category, msg): 
    issues.append({"level": level, "category": category, "msg": msg})

def find_files(d, ext):
    for root, dirs, files in os.walk(d):
        if 'node_modules' in root or '.next' in root: continue
        for f in files:
            if f.endswith(ext):
                yield os.path.join(root, f)

print("=" * 60)
print("👁️  小章鱼 代码质量自动审查")
print(f"   时间: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
print("=" * 60)

# ═══ 1. TypeScript 检查 ═══
print("\n📌 1. TypeScript 静态检查")

for path in find_files(BASE, '.tsx'):
    checks_run += 1
    rel = os.path.relpath(path, BASE)
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # 检查静默 catch
    for m in re.finditer(r'\.catch\(\(\)\s*=>\s*\{\}\)', content):
        line = content[:m.start()].count('\n') + 1
        R("P0", "静默catch", f"{rel}:{line}")
    
    # 检查 useState<any>
    for m in re.finditer(r'useState<any', content):
        line = content[:m.start()].count('\n') + 1
        R("P1", "any类型", f"{rel}:{line}")

print(f"   扫描 {checks_run} 个文件")

# ═══ 2. Python 检查 ═══
print("\n📌 2. Python 语法检查")
python_files = [
    r'C:\Users\欧\WorkBuddy\2026-07-01-06-01-32\xiaozhangyu-platform\config.py',
    r'C:\Users\欧\WorkBuddy\2026-07-01-06-01-32\xiaozhangyu-platform\routers\merchant.py',
    r'C:\Users\欧\WorkBuddy\2026-07-01-06-01-32\xiaozhangyu-platform\models.py',
]
for pf in python_files:
    if os.path.exists(pf):
        try:
            with open(pf, 'r', encoding='utf-8') as f:
                ast.parse(f.read())
        except SyntaxError as e:
            R("🔴", "Python语法", f"{os.path.basename(pf)}: {e}")

# ═══ 3. 硬编码密码检查 ═══
print("\n📌 3. 安全扫描")
password_pattern = re.compile(r'password\s*=\s*["\'][^"\']{6,}["\']')
for path in list(find_files(BASE, '.py')) + list(find_files(BASE, '.php')) + list(find_files(BASE, '.tsx')):
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    for m in password_pattern.finditer(content):
        # Exclude env/settings/getenv patterns
        context = content[max(0, m.start()-40):m.start()]
        if not re.search(r'(settings\.|getenv|os\.getenv|\.env|ENV_)', context):
            rel = os.path.relpath(path, BASE)
            line = content[:m.start()].count('\n') + 1
            R("🔴", "硬编码密码", f"{rel}:{line}")

# ═══ 4. 前端 API 路径检查 ═══
print("\n📌 4. API路径一致性")
api_v1_count = 0
api_v2_count = 0
for path in find_files(BASE, '.tsx'):
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    api_v1_count += len(re.findall(r'/api/store-services', content))
    api_v2_count += len(re.findall(r'/api/v2/', content))

# ═══ 5. 汇总报告 ═══
print("\n" + "=" * 60)
print("📋 审查报告")
print("=" * 60)

by_level = {"P0": 0, "P1": 0, "P2": 0, "🔴": 0}
for i in issues:
    by_level[i["level"]] = by_level.get(i["level"], 0) + 1

print(f"\n  P0 (必须修复): {by_level.get('P0', 0)}")
print(f"  P1 (建议修复): {by_level.get('P1', 0)}")
print(f"  安全 (Severe):  {by_level.get('🔴', 0)}")
print(f"  API v1 调用: {api_v1_count} | API v2 调用: {api_v2_count}")

# 输出明细
if issues:
    print(f"\n--- 问题明细 ---")
    for i in issues:
        print(f"  [{i['level']}] {i['category']}: {i['msg']}")

score = max(0, 100 - len(issues) * 3 - by_level.get("P0", 0) * 5 - by_level.get("🔴", 0) * 10)
print(f"\n  质量评分: {score}/100")
print(f"  扫描文件: {checks_run}")
print(f"  发现问题: {len(issues)}")
print()
