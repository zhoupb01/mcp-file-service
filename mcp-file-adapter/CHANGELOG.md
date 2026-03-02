# Changelog

本文件记录 `mcp-file-adapter` 的可追溯变更。

说明：
- 版本遵循语义化版本（SemVer）。
- `0.1.2` 及以前为基于 git 提交的补录，可能不完整。

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
