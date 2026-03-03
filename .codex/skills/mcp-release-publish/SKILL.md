---
name: mcp-release-publish
description: Use when releasing this mcp-file-service repository, especially when you need a consistent flow for version/changelog alignment, release commit creation, npm publish of mcp-file-adapter, and Docker push of file-service.
---

# MCP Release Publish

## Overview

Use this workflow to 发布本仓库：先整理版本与变更记录，再提交代码，随后发布 `mcp-file-adapter` 到 npm，最后推送 `file-service` Docker 镜像。

## Prerequisites

- 在仓库根目录 `mcp-file-service` 执行命令。
- 拥有 npm 发布权限（`mcp-file-adapter`）。
- 拥有 Docker 推送权限（`registry.cn-hangzhou.aliyuncs.com/zhoupb/file-service`）。
- npm 发布始终显式使用 `--registry=https://registry.npmjs.org`，避免被本地 mirror 配置污染。

## Release Checklist

1. 对齐版本号与 `CHANGELOG`。
2. 运行验证命令（测试/构建/打包预检）。
3. 提交发布相关代码。
4. 发布 npm 包。
5. 推送 Docker 镜像（默认 `latest`）。
6. 输出发布结果（版本、digest、commit）。

## Step 1: Version and Changelog

- `mcp-file-adapter`：
  - `package.json` 与 `package-lock.json` 版本一致。
  - `CHANGELOG.md` 仅保留一个待发版本块，避免重复版本条目。
- `file-service`：
  - `package.json` 与 `CHANGELOG.md` 顶部版本一致。

可用检查命令：

```bash
cat mcp-file-adapter/package.json | rg '"version"'
cat mcp-file-adapter/package-lock.json | rg -n '"name"|"version"' | head
sed -n '1,80p' mcp-file-adapter/CHANGELOG.md
cat file-service/package.json | rg '"version"'
sed -n '1,60p' file-service/CHANGELOG.md
```

## Step 2: Verification

```bash
cd mcp-file-adapter
npm test
npm run build
npm_config_cache=/tmp/.npm-cache npm pack --dry-run
cd ../file-service
npm run build
cd ..
```

任一命令失败就停止发布，先修复再继续。

## Step 3: Commit Release Changes

```bash
git status --short
git add <release-files>
git commit -m "chore: release mcp-file-adapter@X.Y.Z and file-service@A.B.C"
```

## Step 4: Publish npm (mcp-file-adapter)

```bash
cd mcp-file-adapter
npm_config_cache=/tmp/.npm-cache npm publish --registry=https://registry.npmjs.org
cd ..
```

常见失败处理：
- `ENEEDAUTH`：先执行 `npm adduser --registry=https://registry.npmjs.org`。
- 沙箱网络 `EPERM`：使用提权执行发布命令。

## Step 5: Push Docker (file-service)

默认推 `latest`：

```bash
cd file-service
./push_docker_image.sh
cd ..
```

说明：
- 默认镜像：`registry.cn-hangzhou.aliyuncs.com/zhoupb/file-service:latest`。
- 若设置了 `REGISTRY_USERNAME/REGISTRY_PASSWORD` 会自动登录；未设置则沿用本机已有 docker 登录态。

## Final Report

发布完成后统一输出：
- commit hash
- npm 包名与版本
- docker 镜像 tag 与 digest
- 是否使用提权/手动登录等 fallback
