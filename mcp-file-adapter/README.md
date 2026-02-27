# mcp-file-adapter

本地 MCP stdio 适配器：将 4 个工具调用转为远程 HTTP 请求，并直接上传/下载文件。

## 环境变量

- REMOTE_BASE_URL: 远程服务地址，默认 http://localhost:8080
- TIMEOUT_MS: 请求超时，默认 30000

## 启动参数

- --remote-base-url=...  最高优先级

## 鉴权

- 固定 token: mcp-file-service-token

## 工具

- list_files { path }
  - path: 远程相对路径，空字符串表示根目录
- dir_mkdir { path, recursive? }
  - path: 远程相对路径
  - recursive: 是否递归创建父目录（默认 true）
- upload_file { local_path, remote_path, overwrite?, mkdirs? }
  - local_path: 本地文件路径（相对路径基于当前工作目录）
  - remote_path: 远程相对路径
  - overwrite: 是否覆盖远程同名文件
  - mkdirs: 是否创建远程父目录
- download_file { remote_path, local_path, overwrite?, mkdirs? }
  - remote_path: 远程相对路径
  - local_path: 本地目标路径（相对路径基于当前工作目录）
  - overwrite: 是否覆盖本地同名文件
  - mkdirs: 是否创建本地父目录

## 运行

```bash
npm install
npm run dev
```

## 发布

```bash
npm run build
npm publish
```
