# MCP File Service —— `--role` 角色参数设计方案

## 1. 背景

MCP File Service 用于管理需求研发流程中的模板和产物文件。不同角色（产品、Java 后端、Node 后端等）使用不同的模板，但产物（PRD、详设、代码总结等）需要跨角色共享协作。

**核心思路**：模板按角色隔离，产物（archive）公共共享。

## 2. 服务端文件结构

```
ROOT_DIR/
├── product/                          # 产品角色
│   └── template/
│       ├── Interface_history_logic.md
│       ├── function_require_template.md
│       └── scrum_prd_template.md
├── java/                     # Java 后端角色
│   └── template/
│       ├── outline-design-template.md
│       ├── detail-design-template.md
│       └── code-review-checklist.md
├── python/                     # Node 后端角色
│   └── template/
│       ├── outline-design-template.md
│       ├── detail-design-template.md
│       └── code-review-checklist.md
└── archive/                          # 公共归档区（所有角色共享）
    └── <id>/
        ├── <id>-<name>-business-logic.md    ← 产品写
        ├── <id>-<name>-prd.md               ← 产品写
        ├── <id>-<name>-design.md            ← 后端写
        ├── <id>-<name>-tasks.md             ← 后端写
        └── <id>-<name>-code-summary.md      ← 后端写
```

## 3. 改动范围

**仅改 `mcp-file-adapter/src/index.ts` 一个文件**，file-service 不需要改动。

## 4. 具体改动

### 4.1 新增 `--role` 启动参数（第 20 行附近）

在现有参数读取之后，新增：

```typescript
const ROLE = readArg("role") || process.env.REMOTE_ROLE || "";
```

参数优先级：`--role=xxx` 命令行参数 > `REMOTE_ROLE` 环境变量 > 空字符串（不启用）

### 4.2 新增 `resolveRemotePath` 函数（第 49 行附近，`resolveLocalPath` 之后）

```typescript
function resolveRemotePath(remotePath: string): string {
    if (!ROLE) return remotePath;
    if (remotePath.startsWith("template/") || remotePath === "template") {
        return `${ROLE}/${remotePath}`;
    }
    return remotePath;
}
```

**规则**：
- 如果 `ROLE` 为空，所有路径原样透传（向后兼容）
- 如果路径以 `template/` 开头或等于 `template`，自动加 `<ROLE>/` 前缀
- 其他路径（如 `archive/<id>/`）不加前缀，保持公共共享

### 4.3 在 4 个 tool 中应用 `resolveRemotePath`

#### list_files（约第 132 行）

```diff
- const url = buildUrl("/list", { path: relPath });
+ const url = buildUrl("/list", { path: resolveRemotePath(relPath) });
```

#### dir_mkdir（约第 161 行）

```diff
- return postJson("/mkdir", { path: relPath, recursive: recursive ?? true });
+ return postJson("/mkdir", { path: resolveRemotePath(relPath), recursive: recursive ?? true });
```

#### upload_file（约第 202-203 行）

```diff
- const url = buildUrl("/upload", {
-     path: remotePath,
+ const url = buildUrl("/upload", {
+     path: resolveRemotePath(remotePath),
```

#### download_file（约第 281 行）

```diff
- const url = buildUrl("/download", { path: remotePath });
+ const url = buildUrl("/download", { path: resolveRemotePath(remotePath) });
```

### 4.4 更新 server name 以体现角色（可选，便于调试）

```diff
  const server = new McpServer({
-     name: "mcp-file-adapter",
+     name: ROLE ? `mcp-file-adapter[${ROLE}]` : "mcp-file-adapter",
      version: "0.1.0",
  });
```

## 5. 客户端配置示例

### Cursor / VSCode（`.vscode/mcp.json`）

```json
{
    "servers": {
        "mcp-product": {
            "type": "stdio",
            "command": "node",
            "args": [
                "./mcp-file-adapter/dist/index.js",
                "--remote-base-url=https://mcp-file.zhoupb.com",
                "--role=product"
            ]
        },
        "mcp-java": {
            "type": "stdio",
            "command": "node",
            "args": [
                "./mcp-file-adapter/dist/index.js",
                "--remote-base-url=https://mcp-file.zhoupb.com",
                "--role=java-backend"
            ]
        },
        "mcp-node": {
            "type": "stdio",
            "command": "node",
            "args": [
                "./mcp-file-adapter/dist/index.js",
                "--remote-base-url=https://mcp-file.zhoupb.com",
                "--role=node-backend"
            ]
        }
    }
}
```

### Claude Code（`~/.claude/settings.json`）

```json
{
    "mcpServers": {
        "mcp-java": {
            "command": "node",
            "args": [
                "/path/to/mcp-file-adapter/dist/index.js",
                "--remote-base-url=https://mcp-file.zhoupb.com",
                "--role=java-backend"
            ]
        }
    }
}
```

## 6. 路径映射示例

假设 `--role=java-backend`：

| 工具调用 | 原始路径 | 实际请求路径 |
|---------|---------|------------|
| `list_files({ path: "template/" })` | `template/` | `java-backend/template/` |
| `list_files({ path: "template" })` | `template` | `java-backend/template` |
| `download_file({ remote_path: "template/detail-design-template.md" })` | `template/detail-design-template.md` | `java-backend/template/detail-design-template.md` |
| `list_files({ path: "archive/123/" })` | `archive/123/` | `archive/123/`（不变） |
| `download_file({ remote_path: "archive/123/123-prd.md" })` | `archive/123/123-prd.md` | `archive/123/123-prd.md`（不变） |
| `upload_file({ remote_path: "archive/123/123-design.md" })` | `archive/123/123-design.md` | `archive/123/123-design.md`（不变） |

不传 `--role` 时，所有路径原样透传，完全向后兼容。

## 7. 注意事项

- **file-service 无需改动**：路径映射完全在 adapter 层完成，服务端只看到最终路径
- **向后兼容**：不传 `--role` 时行为与现有完全一致
- **新增角色**：只需在服务端 `ROOT_DIR/` 下创建 `<新角色>/template/` 目录并放入模板，客户端配置对应 `--role` 即可
