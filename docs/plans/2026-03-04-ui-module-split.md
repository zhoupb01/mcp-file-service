# File Service UI 模块化拆分 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 `file-service/src/public/ui.js` 从单文件拆分为分层 ES Modules，保持现有行为不变。

**Architecture:** 采用入口装配 + core/features 分层。`ui-main.js` 作为唯一入口，`core` 提供状态/DOM/API/工具，`features` 提供列表/预览/上传/弹窗功能。模块间使用显式依赖注入，避免隐式全局耦合。

**Tech Stack:** 原生 JavaScript ES Modules + 现有 Express 静态资源服务。

---

### Task 1: 抽离 core 层

**Files:**
- Create: `file-service/src/public/core/state.js`
- Create: `file-service/src/public/core/dom.js`
- Create: `file-service/src/public/core/utils.js`
- Create: `file-service/src/public/core/api.js`
- Create: `file-service/src/public/core/feedback.js`

### Task 2: 抽离 features 层

**Files:**
- Create: `file-service/src/public/features/modal.js`
- Create: `file-service/src/public/features/preview.js`
- Create: `file-service/src/public/features/list.js`
- Create: `file-service/src/public/features/upload.js`

### Task 3: 构建入口装配

**Files:**
- Create: `file-service/src/public/ui-main.js`
- Modify: `file-service/src/ui.html`
- Delete: `file-service/src/public/ui.js`

### Task 4: 验证

**Files:**
- Verify: `file-service` build output

**Commands:**
- `cd file-service && npm run build`
