# Archive Protocol Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将调用方式从“传完整 remote_path”改为“结构化字段”，统一通过 `biz/req/scope/rel_path` 构造 `shared/`（共享）与 `users/<user>/`（约定私有）两类目录。

**Architecture:** 仅改 `mcp-file-adapter`：工具入参改为结构化字段，适配器做确定性路径构造。不改 `file-service` 鉴权模型。`shared token` 仍是唯一访问控制，因此本方案是“约定隔离”，不是“安全隔离”。

**Tech Stack:** TypeScript, Node.js, MCP SDK, node:test + tsx

---

### Task 1: 先锁定结构化路径构造测试（TDD Red）

**Files:**
- Modify: `mcp-file-adapter/test/paths.test.ts`

**Step 1: 写失败测试**

在 `paths.test.ts` 增加/调整用例：
- `{biz:req:scope:rel_path}` 生成 `archive/<biz>/<req>/shared/<rel_path>`
- `{biz:req:scope=user:rel_path}` 生成 `archive/<biz>/<req>/users/<user>/<rel_path>`
- `scope=user` 且未配置 `user` 时报错
- `biz/req/rel_path` 非法值报错（例如包含 `/`、`..`）

**Step 2: 跑测试确认红灯**

Run: `cd mcp-file-adapter && node --import tsx --test test/paths.test.ts`  
Expected: FAIL（至少 1 个新用例失败）

**Step 3: Commit**

```bash
git add mcp-file-adapter/test/paths.test.ts
git commit -m "test: define shared/users protocol without acl semantics"
```

### Task 2: 实现结构化路径构造函数（TDD Green）

**Files:**
- Modify: `mcp-file-adapter/src/paths.ts`
- Test: `mcp-file-adapter/test/paths.test.ts`

**Step 1: 写最小实现**

在 `buildArchivePath` 中实现：
- 输入：`biz`、`req`、`scope(shared|user)`、`relPath`、`user`
- 输出：确定性路径：
  - `shared` -> `archive/<biz>/<req>/shared/<relPath>`
  - `user` -> `archive/<biz>/<req>/users/<user>/<relPath>`

**Step 2: 跑测试确认绿灯**

Run: `cd mcp-file-adapter && node --import tsx --test test/paths.test.ts`  
Expected: PASS

**Step 3: Commit**

```bash
git add mcp-file-adapter/src/paths.ts mcp-file-adapter/test/paths.test.ts
git commit -m "feat: rewrite archive paths to shared/users protocol"
```

### Task 3: 改工具 schema 与文档（明确“约定隔离”）

**Files:**
- Modify: `mcp-file-adapter/src/server.ts`
- Modify: `mcp-file-adapter/README.md`
- Modify: `docs/plans/2026-03-03-archive-protocol-refactor.md`（本文件，如需微调）

**Step 1: 更新 README 协议说明**

新增/调整说明：
- 工具参数改为 `biz`、`req`、`scope`、`rel_path`（不再接受 `remote_path/path`）
- 共享路径：`archive/<biz>/<req>/shared/...`
- 约定私有路径：`archive/<biz>/<req>/users/<user>/...`
- 当前不做用户级安全校验，持有 token 的请求可访问任意路径

**Step 2: Commit**

```bash
git add mcp-file-adapter/README.md docs/plans/2026-03-03-archive-protocol-refactor.md
git commit -m "docs: clarify shared/users protocol and non-security scope"
```

### Task 4: 数据迁移与回归验证

**Files:**
- Create: `docs/plans/2026-03-03-archive-protocol-migration.md`
- Optional Create: `scripts/migrate-archive-layout.ts`

**Step 1: 列出迁移规则**

- 历史共享文档：`archive/<biz>/<req>/<sharedDoc>` -> `archive/<biz>/<req>/shared/<sharedDoc>`
- 历史个人文档：迁移到 `archive/<biz>/<req>/users/<user>/...`

**Step 2: dry-run 检查**

Run: 迁移脚本 dry-run（只输出，不落盘）  
Expected: 输出待迁移清单

**Step 3: 总验证**

Run:
- `cd mcp-file-adapter && npm test && npm run build`

Expected: PASS

**Step 4: Commit**

```bash
git add docs/plans scripts
git commit -m "chore: add migration notes for shared/users protocol"
```

---

## Definition of Done

- 不再存在“猜测式 user 拼接”路径逻辑
- `shared/` 与 `users/<user>/` 协议稳定生效
- README 明确“约定隔离，不是安全隔离”
- `mcp-file-adapter` 测试与构建通过
