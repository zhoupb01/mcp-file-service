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
- `REMOTE_ROLE`: 角色名（当未传 `--role` 时生效）
- `REMOTE_USER`: 用户标识（当未传 `--user` 时生效）

## 启动参数

- `--remote-base-url=...`: 覆盖 `REMOTE_BASE_URL`
- `--auth-token=...`: 远程服务鉴权 token（必填）
- `--role=...`: 角色名，优先级高于 `REMOTE_ROLE`
- `--user=...`: 用户标识，优先级高于 `REMOTE_USER`

参数解析使用 `node:util.parseArgs`（严格模式），未知参数会直接报错退出。

## Role 规则

- `role` 不再是固定枚举，任意非空字符串都可用
- 但不能与系统保留名冲突：`template`、`archive`
- 空值（`--role=`）或缺值（`--role`）都会报错

## 鉴权

- Header: `Authorization: Bearer <auth-token>`

## 路径映射规则

- 未设置角色：路径原样透传

设置角色后：

- 当远程路径是 `template` 或 `template/...`，自动映射为 `<role>/template/...`
- 读写操作命中 `archive/<bizId>/...` 且设置了 `user` 时，自动重写为 `archive/<bizId>/<user>/...`
- 示例：输入 `archive/123/spec.md` + `user=alice`，实际写入 `archive/123/alice/spec.md`
- `list_files`/`download_file` 也会按上述规则重写路径
- `list_files({ path: "" })` 时，仅暴露逻辑根目录：`template` 和 `archive`

## 工具

- `list_files { path }`
  - path: 远程相对路径，空字符串表示根目录
- `dir_mkdir { path, recursive? }`
  - path: 远程相对路径
  - recursive: 是否递归创建父目录（默认 true）
- `upload_file { local_path, remote_path, overwrite?, mkdirs? }`
  - local_path: 本地文件路径（相对路径基于当前工作目录）
  - remote_path: 远程相对路径
  - overwrite: 是否覆盖远程同名文件
  - mkdirs: 是否创建远程父目录
- `download_file { remote_path, local_path, overwrite?, mkdirs? }`
  - remote_path: 远程相对路径
  - local_path: 本地目标路径（相对路径基于当前工作目录）
  - overwrite: 是否覆盖本地同名文件
  - mkdirs: 是否创建本地父目录

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
