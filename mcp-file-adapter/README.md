# mcp-file-adapter

本地 MCP stdio 适配器：将 4 个工具调用转为远程 HTTP 请求，并直接上传/下载文件。

变更记录见 [CHANGELOG.md](./CHANGELOG.md)。

## 最新变更（npm 页面可见）

- `0.1.9`：鉴权 token 改为启动参数 `--auth-token`。
- `0.1.8`：README 增加内联版本摘要，npm 页面可直接查看最近变更。
- `0.1.7`：发布包包含 `README.md` 与 `CHANGELOG.md`。
- `0.1.6`：`list_files`/`download_file` 也应用 `archive/<bizId>/<user>/...` 路径重写。

## 环境变量

- `REMOTE_BASE_URL`: 远程服务地址，默认 `http://localhost:8080`
- `TIMEOUT_MS`: 请求超时（毫秒），默认 `30000`
- `REMOTE_USER`: 用户标识（当未传 `--user` 时生效）

## 启动参数

- `--remote-base-url=...`: 覆盖 `REMOTE_BASE_URL`
- `--auth-token=...`: 远程服务鉴权 token（必填）
- `--user=...`: 用户标识，优先级高于 `REMOTE_USER`

参数解析使用 `node:util.parseArgs`（严格模式），未知参数会直接报错退出。

## 鉴权

- Header: `Authorization: Bearer <auth-token>`

## 路径映射规则

- 工具不再接受完整 `remote_path`，统一使用结构化字段：`biz`、`req`、`scope`、`rel_path`
- `scope=shared` -> `archive/<biz>/<req>/shared/<rel_path>`
- `scope=user` -> `archive/<biz>/<req>/users/<user>/<rel_path>`（`user` 来自 `--user` 或 `REMOTE_USER`）
- `rel_path` 为空时表示对应 scope 的根目录

> 注意：当前是“约定隔离”，不是“安全隔离”。持有 token 的请求仍可访问任意路径。

## 工具

- `list_files { biz, req, scope, rel_path? }`
  - biz/req: 业务域与需求标识
  - scope: `shared` 或 `user`
  - rel_path: scope 下相对路径，空表示 scope 根目录
- `dir_mkdir { biz, req, scope, rel_path?, recursive? }`
  - recursive: 是否递归创建父目录（默认 true）
- `upload_file { local_path, biz, req, scope, rel_path, overwrite?, mkdirs? }`
  - local_path: 本地文件路径（相对路径基于当前工作目录）
  - overwrite: 是否覆盖远程同名文件
  - mkdirs: 是否创建远程父目录
- `download_file { biz, req, scope, rel_path, local_path, overwrite?, mkdirs? }`
  - local_path: 本地目标路径（相对路径基于当前工作目录）
  - overwrite: 是否覆盖本地同名文件
  - mkdirs: 是否创建本地父目录

## 使用方式

先固定一组上下文字段：
- `biz`: 业务域，例如 `kilimallspec`
- `req`: 需求 ID，例如 `234898756`
- `scope`: `shared` 或 `user`

### 1) 列共享目录

```json
{
  "tool": "list_files",
  "arguments": {
    "biz": "kilimallspec",
    "req": "234898756",
    "scope": "shared",
    "rel_path": ""
  }
}
```

### 2) 在用户目录创建子目录

```json
{
  "tool": "dir_mkdir",
  "arguments": {
    "biz": "kilimallspec",
    "req": "234898756",
    "scope": "user",
    "rel_path": "design",
    "recursive": true
  }
}
```

### 3) 上传文件到共享目录

```json
{
  "tool": "upload_file",
  "arguments": {
    "local_path": "kilimallspec/design/234898756/234898756-物品同步-design.md",
    "biz": "kilimallspec",
    "req": "234898756",
    "scope": "shared",
    "rel_path": "234898756-物品同步-design.md",
    "overwrite": true,
    "mkdirs": true
  }
}
```

### 4) 下载共享 PRD 到本地

```json
{
  "tool": "download_file",
  "arguments": {
    "biz": "kilimallspec",
    "req": "234898756",
    "scope": "shared",
    "rel_path": "234898756-物品同步-prd.md",
    "local_path": "kilimallspec/design/234898756/234898756-物品同步-prd.md",
    "overwrite": true,
    "mkdirs": true
  }
}
```

### 5) 迁移提示（从旧参数到新参数）

- 旧：`list_files(path)` -> 新：`list_files(biz, req, scope, rel_path)`
- 旧：`upload_file(remote_path)` -> 新：`upload_file(biz, req, scope, rel_path)`
- 旧：`download_file(remote_path)` -> 新：`download_file(biz, req, scope, rel_path)`

## 运行

```bash
npm install
npm run dev -- --auth-token=your-token
```

## 测试

```bash
npm test
```

## 发布

```bash
npm run build
npm publish
```
