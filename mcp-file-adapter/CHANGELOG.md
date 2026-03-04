# Changelog

本文件记录 `mcp-file-adapter` 的可追溯变更。

说明：
- 版本遵循语义化版本（SemVer）。
- `0.1.2` 及以前为基于 git 提交的补录，可能不完整。

## [0.2.0] - 2026-03-04

### Breaking
- 旧参数已删除：
  - `list_files.path`
  - `dir_mkdir.path`
  - `upload_file.remote_path`
  - `download_file.remote_path`
- 所有调用方必须迁移到结构化参数：`biz`、`req`、`scope`、`rel_path`。

### Changed
- 工具入参改为结构化字段：`biz`、`req`、`scope`、`rel_path`。
- 不再接受旧的 `path` / `remote_path` 透传模式。
- archive 路径统一为协议化构造：
  - `scope=shared` -> `archive/<biz>/<req>/shared/<rel_path>`
  - `scope=user` -> `archive/<biz>/<req>/users/<user>/<rel_path>`
- `role` 相关逻辑与参数移除。

### Tests
- `test/paths.test.ts` 改为覆盖结构化路径构造与参数校验。

### Docs
- `README.md` 新增“使用方式”示例（list/mkdir/upload/download）。
- 明确“约定隔离，不是安全隔离”。

### Migration
- `list_files(path)` -> `list_files(biz, req, scope, rel_path?)`
- `dir_mkdir(path, recursive?)` -> `dir_mkdir(biz, req, scope, rel_path?, recursive?)`
- `upload_file(local_path, remote_path, ...)` -> `upload_file(local_path, biz, req, scope, rel_path, ...)`
- `download_file(remote_path, local_path, ...)` -> `download_file(biz, req, scope, rel_path, local_path, ...)`

## [0.1.9] - 2026-03-03

### Changed
- 鉴权 token 改为必填启动参数 `--auth-token`。
- 不再使用硬编码 token，也不再从环境变量读取 token。

### Tests
- `test/config.test.ts` 增加 `--auth-token` 解析/缺失/空值用例。
- 现有配置用例改为统一通过启动参数注入 token。

### Docs
- 更新 `README.md`：将 token 配置方式改为 `--auth-token` 启动参数。

## [0.1.8] - 2026-03-02

### Changed
- `README.md` 增加“最新变更（npm 页面可见）”摘要区块，便于在 npm 包主页直接查看最近版本变更。

## [0.1.7] - 2026-03-02

### Changed
- npm 包内容增加 `README.md` 与 `CHANGELOG.md`（通过 `package.json.files` 声明）。
- `README.md` 增加 changelog 入口链接，便于在 npm 包内追踪版本变更。

## [0.1.6] - 2026-03-02

### Fixed
- `list_files` 与 `download_file` 也应用 `archive/<bizId>/<user>/...` 路径重写规则，和 `upload_file` / `dir_mkdir` 保持一致。
- `download_file` 返回的 `remote_path` 调整为实际远端路径（重写后路径）。

### Docs
- 更新路径映射说明，明确读操作同样会按 user 规则重写。

参考提交：`0c0ebc1`

## [0.1.5] - 2026-03-02

### Added
- 新增 `--user` 启动参数与 `REMOTE_USER` 环境变量。
- 新增 `resolveArchiveWritePath`：将 `archive/<bizId>/...` 规范到 `archive/<bizId>/<user>/...`（当 `user` 存在时）。
- 新增配置与路径重写相关测试用例。

### Changed
- `dir_mkdir`、`upload_file` 接入 user 归档路径重写。
- `upload_file` 返回 `remote_path` 为实际上传远程路径（重写后）。

参考提交：`b46d7bc`

## [0.1.4] - 2026-02-28

### Changed
- `role` 从固定枚举调整为动态字符串（非空）。
- 增加保留名限制（如 `template`、`archive`）与对应校验。
- 更新配置与文档，发布 `0.1.4`。

参考提交：`d7639d9`

## [0.1.3] - 2026-02-27

### Changed
- 版本号更新至 `0.1.3`（无功能变更记录）。

参考提交：`829ddc3`

## [0.1.2] - 2026-02-27

### Added
- 引入 `mcp-file-adapter` 初始实现：本地 MCP stdio 适配到远程 file service。

### Changed
- 完成模块拆分（`config` / `paths` / `remote` / `result` / `server`）与 role 参数解析重构。

参考提交：`7ce58e0`、`ad216ee`

## 历史补录说明

- 当前仓库内可稳定追溯到 `0.1.2`。
- `0.1.2` 之前（如 `0.1.0`、`0.1.1`）没有明确发布记录，暂不补录，避免写错历史。
