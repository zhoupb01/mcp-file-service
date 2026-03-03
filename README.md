# mcp-file-service

一个由两部分组成的文件系统方案：
- `file-service`：远程文件服务（HTTP API）
- `mcp-file-adapter`：本地 MCP stdio 适配器（把工具调用转成远程 HTTP）

## 目录结构

- `file-service/`：服务端实现与 UI
- `mcp-file-adapter/`：MCP 适配器实现
- `docs/plans/`：实现计划文档
- `mcp-file-service-role-design.md`：角色与归档设计说明

## 快速开始

### 1) 启动 file-service

```bash
cd file-service
npm install
FILE_SERVICE_TOKEN=your-token \
npm run dev
```

默认：
- 端口：`8080`
- 鉴权：`Authorization: Bearer <FILE_SERVICE_TOKEN>`

### 2) 启动 mcp-file-adapter

```bash
cd mcp-file-adapter
npm install
npm run dev -- --auth-token=your-token
```

常用配置：
- `REMOTE_BASE_URL`：远程地址，默认 `http://localhost:8080`
- `--auth-token`：远程服务鉴权 token（`mcp-file-adapter` 启动参数，必填）
- `REMOTE_ROLE` / `--role`：角色
- `REMOTE_USER` / `--user`：用户标识（用于 `archive/<bizId>/<user>/...` 路径重写）

## 关键行为

- `template/...` 在设置 role 时映射为 `<role>/template/...`
- `archive/<bizId>/...` 在设置 user 时映射为 `archive/<bizId>/<user>/...`
- 读写操作（`list` / `download` / `mkdir` / `upload`）统一应用归档 user 路由

## 子项目文档

- 适配器说明与发布记录：`mcp-file-adapter/README.md`、`mcp-file-adapter/CHANGELOG.md`
- 服务端说明：`file-service/README.md`
