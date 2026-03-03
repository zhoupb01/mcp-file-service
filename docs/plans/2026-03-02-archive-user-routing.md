# Archive User Routing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在保持 `archive` 公共区的前提下，引入 `user` 启动参数，并将归档写入路径规范化为 `archive/<bizId>/<user>/...`，让目录创建者可追踪且避免 A/B 写入同一路径。

**Architecture:** `mcp-file-adapter` 新增 `user` 配置来源（`--user` / `REMOTE_USER`），并在写操作（`dir_mkdir`、`upload_file`）阶段对 `archive` 路径做统一重写。读操作保持原语义，避免破坏已有查询行为；上传响应返回实际落盘远程路径，便于调用方后续读取。

**Tech Stack:** TypeScript, Node.js (`node:test`, `node:util.parseArgs`), MCP SDK, zod

---

### Task 1: 新增 `user` 配置入口（CLI + ENV）

**Files:**
- Modify: `mcp-file-adapter/src/config.ts`
- Modify: `mcp-file-adapter/test/config.test.ts`

**Step 1: Write the failing test**

在 `config.test.ts` 增加用例：
- `--user` 优先于 `REMOTE_USER`
- 仅 `REMOTE_USER` 时可读到 `config.user`
- `--user` 缺失值时报错
- `--user=` 空值时报错

**Step 2: Run test to verify it fails**

Run: `cd mcp-file-adapter && node --import tsx --test test/config.test.ts`
Expected: FAIL，提示 `loadConfig` 返回结构不含 `user` 或相关断言失败。

**Step 3: Write minimal implementation**

在 `config.ts` 中：
- 扩展 `AdapterConfig`：新增 `user: string`
- 扩展 `parseCliValues`：新增 `--user`
- 新增 `parseUser(rawUser, source)`（规则与 `role` 一致：非空字符串；CLI 缺值/空值报错；ENV 空值视为未设置）
- 在 `loadConfig` 中按优先级加载 `user`（CLI > ENV）

**Step 4: Run test to verify it passes**

Run: `cd mcp-file-adapter && node --import tsx --test test/config.test.ts`
Expected: PASS。

**Step 5: Commit**

```bash
cd mcp-file-adapter
git add src/config.ts test/config.test.ts
git commit -m "feat: add user identity config for archive routing"
```

### Task 2: 实现归档写路径重写规则

**Files:**
- Modify: `mcp-file-adapter/src/paths.ts`
- Modify: `mcp-file-adapter/test/paths.test.ts`

**Step 1: Write the failing test**

在 `paths.test.ts` 增加 `resolveArchiveWritePath` 用例：
- `user` 为空时：`archive/123/a.md` 不变
- `user=alice` 且路径为 `archive/123/a.md`：重写为 `archive/123/alice/a.md`
- `user=alice` 且路径为 `archive/123`：重写为 `archive/123/alice`
- 非 `archive/...` 路径不变
- 已是 `archive/123/alice/...` 时不重复注入

**Step 2: Run test to verify it fails**

Run: `cd mcp-file-adapter && node --import tsx --test test/paths.test.ts`
Expected: FAIL，函数不存在或断言失败。

**Step 3: Write minimal implementation**

在 `paths.ts` 新增纯函数 `resolveArchiveWritePath(remotePath: string, user: string): string`：
- 仅处理以 `archive/` 开头且至少包含 `bizId` 的路径
- 注入位置固定为第二段后：`archive/<bizId>/<user>/...`
- 已包含同名 `user` 子目录时直接返回

**Step 4: Run test to verify it passes**

Run: `cd mcp-file-adapter && node --import tsx --test test/paths.test.ts`
Expected: PASS。

**Step 5: Commit**

```bash
cd mcp-file-adapter
git add src/paths.ts test/paths.test.ts
git commit -m "feat: add archive write path rewriting by user"
```

### Task 3: 将重写规则接入写操作并回传实际路径

**Files:**
- Modify: `mcp-file-adapter/src/server.ts`
- Modify: `mcp-file-adapter/src/paths.ts`（如需补导出）

**Step 1: Write the failing test**

在 `paths.test.ts` 增加行为覆盖（不新增复杂集成测试）：
- 给定 `remote_path=archive/123/doc.md` 与 `user=alice`，断言重写结果为 `archive/123/alice/doc.md`
- 用该断言作为 `server.ts` 路由接入的前置契约

**Step 2: Run test to verify it fails**

Run: `cd mcp-file-adapter && node --import tsx --test test/paths.test.ts`
Expected: 若未完成 Task 2/3 接入，相关断言 FAIL。

**Step 3: Write minimal implementation**

在 `server.ts` 中：
- `upload_file`：
  - 先 `resolveRemotePath(remotePath, role)`
  - 再 `resolveArchiveWritePath(..., user)`
  - 上传使用重写后的路径
  - 返回字段 `remote_path` 改为“实际远程路径”（即重写后）
- `dir_mkdir`：同样对写路径应用 `resolveArchiveWritePath`
- `list_files` / `download_file` / `delete`（若无）不做自动重写

**Step 4: Run test to verify it passes**

Run: `cd mcp-file-adapter && npm test && npm run build`
Expected: 全部 PASS，构建成功。

**Step 5: Commit**

```bash
cd mcp-file-adapter
git add src/server.ts src/paths.ts test/paths.test.ts
git commit -m "feat: apply user archive routing on write operations"
```

### Task 4: 文档更新与回归验证

**Files:**
- Modify: `mcp-file-adapter/README.md`

**Step 1: Write the failing test**

无需自动化测试，定义回归清单：
- README 必须出现 `--user`、`REMOTE_USER`
- README 必须明确 `archive` 写入重写规则与示例

**Step 2: Run test to verify it fails**

Run: `cd mcp-file-adapter && rg -n "REMOTE_USER|--user|archive/<bizId>/<user>" README.md`
Expected: 变更前至少缺失一项。

**Step 3: Write minimal implementation**

更新 README：
- 新增参数说明：`--user` / `REMOTE_USER`
- 新增路径规则示例：
  - 输入：`archive/123/spec.md`（`user=alice`）
  - 实际写入：`archive/123/alice/spec.md`
- 明确“读操作不自动改写”

**Step 4: Run test to verify it passes**

Run: `cd mcp-file-adapter && rg -n "REMOTE_USER|--user|archive/<bizId>/<user>" README.md && npm test`
Expected: `rg` 命中三项；测试 PASS。

**Step 5: Commit**

```bash
cd mcp-file-adapter
git add README.md
git commit -m "docs: document user-based archive routing"
```

### Task 5: 端到端人工冒烟

**Files:**
- Modify: 无

**Step 1: Write the failing test**

准备两组用户：`alice` 与 `bob`，同一业务号 `123`，同名文件 `design.md`。

**Step 2: Run test to verify it fails**

在未加 `--user` 的旧逻辑下，二者会命中同路径（该步骤用于对比认知）。

**Step 3: Write minimal implementation**

已在 Task 1-4 完成，无新增代码。

**Step 4: Run test to verify it passes**

Run（示意）:
```bash
# 进程1
REMOTE_USER=alice npm run dev
# 上传 archive/123/design.md -> 实际 archive/123/alice/design.md

# 进程2
REMOTE_USER=bob npm run dev
# 上传 archive/123/design.md -> 实际 archive/123/bob/design.md
```
Expected: 两份文件落在不同子目录，可直接从路径识别创建者。

**Step 5: Commit**

无代码变更可提交，记录验证结果到 PR 描述。
