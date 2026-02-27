# mcp-file-adapter

本地 MCP stdio 适配器：将 4 个工具调用转为远程 HTTP 请求，并直接上传/下载文件。

## 环境变量

- `REMOTE_BASE_URL`: 远程服务地址，默认 `http://localhost:8080`
- `TIMEOUT_MS`: 请求超时（毫秒），默认 `30000`
- `REMOTE_ROLE`: 角色名（当未传 `--role` 时生效）

## 启动参数

- `--remote-base-url=...`: 覆盖 `REMOTE_BASE_URL`
- `--role=...`: 角色名，优先级高于 `REMOTE_ROLE`

参数解析使用 `node:util.parseArgs`（严格模式），未知参数会直接报错退出。

## Role 枚举

当前允许值：

- `product`
- `java`
- `python`
- `android`
- `vue`

非法值、空值（`--role=`）或缺值（`--role`）都会报错。

## 鉴权

- 固定 token: `mcp-file-service-token`

## 路径映射规则

- 未设置角色：路径原样透传

设置角色后：

- 当远程路径是 `template` 或 `template/...`，自动映射为 `<role>/template/...`
- `archive/...` 不加前缀，保持公共共享
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
npm run dev
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
