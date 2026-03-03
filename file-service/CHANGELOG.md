# Changelog

本文件记录 `file-service` 的可追溯变更。

说明：
- 版本遵循语义化版本（SemVer）。
- `0.1.0` 为基于 git 的补录版本。

## [0.1.1] - 2026-03-03

### Changed
- 鉴权 token 不再硬编码，改为从环境变量 `FILE_SERVICE_TOKEN` 读取。
- 当缺少 `FILE_SERVICE_TOKEN` 时，服务启动阶段直接报错退出。

### Docs
- 更新 `README.md`：环境变量说明、鉴权 header 示例与启动命令。

## [0.1.0] - 2026-03-02

### Added
- 重构 Web UI，并新增删除功能（文件/目录删除流程）。
- 优化上传/操作反馈（toast）交互体验。

### Changed
- 构建脚本修复：构建产物包含 `dist/public` 静态资源目录。

### Notes
- 历史提交参考：`4542ea5`、`994b7b9`、`7ce58e0`。
