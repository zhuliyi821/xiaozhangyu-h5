# 👁️ 小章鱼项目代码审查标准

> **版本**: v1.0 | **生效**: 2026-07-18
> 适用所有: xiaozhangyu-app / xiaozhangyu-platform / merchant-gw / PHP API

---

## 目录

1. [审查原则](#1-审查原则)
2. [分级标准](#2-分级标准)
3. [各层专项检查清单](#3-各层专项检查清单)
4. [审查流程](#4-审查流程)
5. [Git Hook 自动化](#5-git-hook-自动化)
6. [常见违规速查](#6-常见违规速查)

---

## 1. 审查原则

### 核心信条

| # | 原则 | 含义 |
|:-:|------|------|
| 1 | **不要破坏现有功能** | 任何变更不能导致已有接口/页面行为变化 |
| 2 | **不要静默失败** | 每个 `catch` 必须有可观测的反馈（toast/日志/兜底 UI） |
| 3 | **类型优先** | TypeScript 禁止 `any`，Python 禁止 `dict` 裸传递 |
| 4 | **连接必归还** | 任何 DB 连接必须在 `finally` 中关闭 |
| 5 | **凭证不入库** | 密码/key 必须从环境变量或 `.env` 读取 |
| 6 | **响应需统一** | API 响应格式必须符合 `ApiResponse` 契约 |

### 审查心态

- 🔴 **Blockers** → 必须修改，否则拒绝合入
- 🟡 **Suggestions** → 建议修改，可合入但需记录
- 💭 **Nits** → 可忽略，值得下次改进
- ✅ **Praise** → 好的设计，值得保持

---

## 2. 分级标准

### 🔴 P0 — Blocker（拦路虎）

以下任何一条出现，**代码不得合入**：

```
□ SQL 注入风险（拼接字符串查询）
□ 硬编码数据库密码或 API Key
□ 静默 catch（catch() {} / catch { showMsg("❌ 网络错误") }）
□ DB 连接未在 finally 中归还
□ 事务未正确处理回滚
□ API 返回格式与现有契约不一致
□ 暴露用户敏感数据（手机号/密码明文）
```

### 🟡 P1 — 严重（必须修）

```
□ TypeScript 新增 `any` 类型
□ 输入验证缺失（Field(max_length=) / 前端表单校验）
□ 错误的 HTTP 方法（应为 DELETE 却用 GET）
□ N+1 查询（循环内执行 SQL）
□ 缺失错误状态 UI（加载中/错误/空态三态）
□ 前端硬编码 API URL 而非使用 API_BASE
□ 函数超过 200 行
```

### 💭 P2 — 建议

```
□ 变量命名不清晰（a/b/c/tmp 等）
□ 重复代码 > 3 处应提取
□ 缺少注释说明复杂逻辑
□ 组件缺少 key prop 或 key 使用 index
□ useEffect 遗漏依赖项
```

---

## 3. 各层专项检查清单

### 3.1 前端 TypeScript（xiaozhangyu-app）

```typescript
// ✅ GOOD — 有类型、有错误处理、有加载状态
interface StaffMember {
  id: number; name: string; role: string; mobile: string; status: string;
}
const [staff, setStaff] = useState<StaffMember[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  setLoading(true);
  fetch(`/api/v2/merchant/staff?member_id=${user.uid}`)
    .then(r => r.json())
    .then(d => {
      if (d.code !== 0) throw new Error(d.msg || "加载失败");
      setStaff(d.data);
    })
    .catch(e => setError(e.message))
    .finally(() => setLoading(false));
}, [user.uid]);

// ❌ BAD — 无类型、静默失败
const [staff, setStaff] = useState<any[]>([]);
fetch(`...`).then(r => r.json()).then(d => { if (d.code === 0) setStaff(d.data); }).catch(() => {});
```

**前端检查项：**

| # | 检查项 | 等级 |
|:-:|--------|:----:|
| F1 | 组件文件名和导出名一致 | 💭 |
| F2 | 所有 API 调用有 `.catch()` **且非空实现** | 🔴 |
| F3 | 所有 `useState` 使用具体类型而非 `any` | 🟡 |
| F4 | 列表渲染有唯一 `key`（非 index） | 🟡 |
| F5 | 图片有 `alt` 文本 | 💭 |
| F6 | 表单输入有校验（非空/格式/长度） | 🟡 |
| F7 | 使用 `API_BASE` 而非硬编码 | 🟡 |
| F8 | 页面有加载态/空态/错误态三态 | 🟡 |
| F9 | `useEffect` 依赖列完整 | 🟡 |

### 3.2 Python FastAPI（xiaozhangyu-platform）

```python
# ✅ GOOD
@router.post("/merchant/staff", response_model=ApiResponse)
async def add_staff(req: StaffRequest):
    """添加店员"""
    conn = _db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO ims_xiaozhangyu_merchant_staff (...) VALUES (%s, %s, %s, %s, NOW())",
                (req.member_id, req.member_id, req.role or "staff", req.mobile or "")
            )
            conn.commit()
            return ApiResponse(data={"id": cur.lastrowid})
    except Exception as e:
        logger.error(f"add_staff failed: {e}")
        return ApiResponse(code=-1, message=str(e))
    finally:
        conn.close()

# ❌ BAD
def do_staff():
    conn = _db()  # 无 finally
    cur = conn.cursor()
    cur.execute("...")
    return {"data": cur.fetchall()}  # 连接泄漏
```

**Python 检查项：**

| # | 检查项 | 等级 |
|:-:|--------|:----:|
| P1 | DB 连接 `try/finally` 或 `with` 上下文 | 🔴 |
| P2 | Pydantic 模型输入验证（Field 约束） | 🟡 |
| P3 | 日志记录关键操作（创建/删除/支付） | 🟡 |
| P4 | 异常不暴露内部路径给客户端 | 🟡 |
| P5 | 响应统一使用 `ApiResponse` 模型 | 🟡 |
| P6 | 数据库密码从 `settings` 读取，非硬编码 | 🔴 |

### 3.3 商户网关 merchant-gw

```python
# ✅ GOOD — 连接池 + finally
def q1(sql, params=None):
    pool = get_pool()
    conn = pool.connection()
    try:
        with conn.cursor(pymysql.cursors.DictCursor) as cur:
            cur.execute(sql, params or ())
            return cur.fetchone()
    finally:
        conn.close()

# ❌ BAD
DB_CFG = dict(host="127.0.0.1", user="root", password="123456")  # 硬编码密码
conn = pymysql.connect(**DB_CFG)  # 每次都新建连接
```

| # | 检查项 | 等级 |
|:-:|--------|:----:|
| G1 | 数据库密码从 `.env` 或环境变量读取 | 🔴 |
| G2 | 使用连接池（`PooledDB`） | 🟡 |
| G3 | `finally` 归还连接 | 🔴 |
| G4 | 写操作有 `try/except rollback` | 🔴 |
| G5 | 避免 `die()` 直接退出（改用 return） | 🟡 |

### 3.4 PHP API

| # | 检查项 | 等级 |
|:-:|--------|:----:|
| H1 | 所有 SQL 使用 prepared statement（`?` 占位符） | 🔴 |
| H2 | 事务有 beginTransaction/commit/rollback | 🔴 |
| H3 | 密码从 `.env` 读取，非硬编码 | 🔴 |
| H4 | `json_decode` 后检查 `null` 避免崩溃 | 🟡 |
| H5 | 不使用 `die()` 退出（用 echo + return） | 🟡 |

---

## 4. 审查流程

### 4.1 日常审查（小型改动 < 50 行）

```
[开发者] → 自检 checklist → [审查者] → 通过/驳回 → 合入
```

1. **开发者自检**（5 分钟）：
   - [ ] 代码编译通过（`npm run build` / `python3 -c "import ast; ast.parse(...)"`）
   - [ ] API 端点测试 200（`curl` 或测试脚本）
   - [ ] 无新增 `any` 类型
   - [ ] 无静默 `catch`
   - [ ] DB 连接有 `finally` 关闭

2. **审查者检查**（10 分钟）：
   - 对照上面的层级检查清单逐项过
   - 关注 P0/P1 项
   - 用评论格式标注：`🔴 行42: 静默 catch` + 原因 + 建议

### 4.2 变更审查（中等改动 50-300 行）

```
[开发者] → 自检 + 运行测试脚本 → [审查者] → 修正 → 合入
```

额外步骤：
- 运行对应模块的测试脚本（`bash /tmp/test-staff-api.sh`）
- 运行 `tsc --noEmit` 类型检查
- 审查者关注：逻辑正确性、边界情况、性能

### 4.3 架构审查（大型改动 > 300 行）

```
[开发者] → 设计文档 → 架构评审 → 实现 → 全量测试 → 审查 → 合入
```

额外步骤：
- 编写简要设计文档（< 1 页，说明变更原因 + 方案 + API 契约）
- 架构师/负责人审批设计方案
- 全量回归测试
- 部署后观察 24 小时

---

## 5. Git Hook 自动化

### 5.1 pre-commit hook（本地提交前检查）

```bash
#!/bin/bash
# .git/hooks/pre-commit

# 1. 检查静默 catch
if grep -rn '\.catch(()\s*=>\s*{})' src/ --include='*.tsx' --include='*.ts'; then
  echo "🔴 ERROR: 发现静默 catch，请添加错误处理"
  exit 1
fi

# 2. 检查 any 类型
if grep -rn 'useState<any' src/ --include='*.tsx' --include='*.ts'; then
  echo "🟡 WARNING: 发现 useState<any>，请使用具体类型"
  exit 1
fi

# 3. 检查硬编码密码
if grep -rn 'password.*=' --include='*.py' --include='*.php' | grep -v '.env\|settings\|getenv'; then
  echo "🔴 ERROR: 发现疑似硬编码密码"
  exit 1
fi

# 4. Python 语法检查
for f in $(git diff --cached --name-only -- '*.py'); do
  python3 -c "import ast; ast.parse(open('$f').read())" 2>/dev/null || {
    echo "🔴 ERROR: $f 语法错误"
    exit 1
  }
done
```

### 5.2 安装方式

```bash
cp scripts/hooks/pre-commit .git/hooks/ && chmod +x .git/hooks/pre-commit
```

---

## 6. 常见违规速查

| 违规代码 | 问题 | 正确的做法 |
|----------|------|------------|
| `.catch(() => {})` | 静默吞异常 | `.catch(e => setError(e.message))` 或 `showMsg("❌ 加载失败")` |
| `useState<any>([])` | 放弃类型安全 | 定义 interface/type |
| `password="4PaB1bq..."` | 硬编码密码 | `password=settings.db_password` 或 `getenv('DB_PASS')` |
| `const conn = _db()` 无 finally | DB 连接泄漏 | `try { ... } finally { conn.close() }` |
| `die(json_encode(...))` | 粗暴退出 | `echo json_encode(...); return;` |
| `<div key={index}>` | 索引作 key 不稳定 | 使用唯一 ID |
| `fetch('/api/xxx')` | 硬编码路径 | `fetch(API_BASE + '/api/xxx')` |
| `DELETE` 用 `GET` | 方法错误 | `method: 'DELETE'` |

---

## 附录：PR 模板

在 GitHub/仓库创建 PR 时使用：

```markdown
## 变更说明
<!-- 简述做了什么，为什么 -->

## 影响范围
- [ ] 前端 (xiaozhangyu-app)
- [ ] 平台 API (xiaozhangyu-platform)
- [ ] 商户网关 (merchant-gw)
- [ ] PHP API
- [ ] 数据库 (DDL变更)
- [ ] Nginx 配置

## 自检清单
- [ ] 编译通过（`npm run build` / Python 语法检查）
- [ ] 无新增 `any` 类型
- [ ] 无静默 `catch`
- [ ] DB 连接有 `finally` 关闭
- [ ] 密码从环境变量读取
- [ ] API 响应格式统一
- [ ] 测试脚本已运行：`bash scripts/test-xxx.sh`

## 测试验证
<!-- 粘贴关键测试输出 -->

## 截图（前端变更时）
<!-- Before/After 截图 -->
```

---

> **最后**: 代码审查不是为了找茬，是为了让团队写出更好的代码。
> 每个评论都应该教会点什么，而不只是指出问题。
