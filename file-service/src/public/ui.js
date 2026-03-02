(() => {
    /* ───── 常量 & 元素 ───── */
    const TOKEN_KEY = "file-service-token";
    const $ = (id) => document.getElementById(id);

    const tokenInput       = $("tokenInput");
    const saveTokenBtn     = $("saveTokenBtn");
    const refreshBtn       = $("refreshBtn");
    const breadcrumb       = $("breadcrumb");
    const fileRows         = $("fileRows");
    const emptyState       = $("emptyState");
    const loadingState     = $("loadingState");
    const statusLine       = $("statusLine");
    const statInfo         = $("statInfo");
    const previewPanel     = $("previewPanel");
    const previewTitle     = $("previewTitle");
    const previewBody      = $("previewBody");
    const previewMeta      = $("previewMeta");
    const previewDownloadBtn = $("previewDownloadBtn");
    const closePreviewBtn  = $("closePreviewBtn");
    const settingsBtn      = $("settingsBtn");
    const authModal        = $("authModal");
    const uploadModal      = $("uploadModal");
    const uploadModalBtn   = $("uploadModalBtn");
    const mkdirModal       = $("mkdirModal");
    const mkdirModalBtn    = $("mkdirModalBtn");
    const mkdirNameInput   = $("mkdirNameInput");
    const mkdirBtn         = $("mkdirBtn");
    const dropzone         = $("dropzone");
    const fileInput        = $("fileInput");
    const fileQueue        = $("fileQueue");
    const uploadBtn        = $("uploadBtn");
    const overwriteInput   = $("overwriteInput");
    const mkdirsInput      = $("mkdirsInput");
    const uploadPathLabel  = $("uploadPathLabel");
    const uploadProgress   = $("uploadProgress");
    const uploadProgressBar = $("uploadProgressBar");
    const uploadProgressText = $("uploadProgressText");
    const confirmModal     = $("confirmModal");
    const confirmTitle     = $("confirmTitle");
    const confirmMessage   = $("confirmMessage");
    const confirmOkBtn     = $("confirmOkBtn");
    const confirmCancelBtn = $("confirmCancelBtn");

    const state = { entries: [], currentPath: "", selectedFiles: [], previewEntry: null };

    /* ───── 工具函数 ───── */
    const formatBytes = (v) => {
        if (v === 0) return "0 B";
        const u = ["B", "KB", "MB", "GB", "TB"];
        let s = v, i = 0;
        while (s >= 1024 && i < u.length - 1) { s /= 1024; i++; }
        return `${s.toFixed(s >= 10 || i === 0 ? 0 : 1)} ${u[i]}`;
    };

    const formatTime = (ms) => {
        const d = new Date(ms);
        const pad = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const joinPath = (base, name) => {
        const b = base.replace(/^\/+|\/+$/g, "");
        return b ? `${b}/${name}` : name;
    };

    const getToken = () => tokenInput.value.trim();
    const setStatus = (msg) => { statusLine.textContent = msg; };

    const getExt = (name) => {
        const i = name.lastIndexOf(".");
        return i > 0 ? name.slice(i + 1).toLowerCase() : "";
    };

    const isImage = (ext) => ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico", "avif"].includes(ext);
    const isVideo = (ext) => ["mp4", "webm", "ogg", "mov"].includes(ext);
    const isAudio = (ext) => ["mp3", "wav", "ogg", "flac", "aac", "m4a"].includes(ext);
    const isText = (ext) => ["txt", "md", "json", "js", "ts", "jsx", "tsx", "css", "html", "xml", "yml", "yaml", "toml", "ini", "conf", "sh", "bash", "py", "rb", "go", "rs", "java", "c", "cpp", "h", "hpp", "sql", "log", "env", "gitignore", "dockerfile", "makefile", "csv"].includes(ext);
    const isPdf = (ext) => ext === "pdf";

    const fileIcon = (entry) => {
        if (entry.type === "dir") return `<svg class="w-5 h-5 text-brand-500" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>`;
        const ext = getExt(entry.name);
        if (isImage(ext)) return `<svg class="w-5 h-5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
        if (isVideo(ext)) return `<svg class="w-5 h-5 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`;
        if (isAudio(ext)) return `<svg class="w-5 h-5 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
        if (isPdf(ext)) return `<svg class="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
        if (isText(ext)) return `<svg class="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`;
        return `<svg class="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
    };

    /* ───── API ───── */
    const apiFetch = async (url, options = {}) => {
        const token = getToken();
        if (!token) {
            openModal(authModal);
            return null;
        }
        const headers = Object.assign({}, options.headers, { authorization: `Bearer ${token}` });
        return fetch(url, Object.assign({}, options, { headers }));
    };

    /* ───── Modal ───── */
    const openModal = (modal) => { modal.classList.remove("hidden"); };
    const closeModal = (modal) => { modal.classList.add("hidden"); };

    document.querySelectorAll("[data-close-modal]").forEach((el) => {
        el.addEventListener("click", () => {
            el.closest(".fixed").classList.add("hidden");
        });
    });

    /* ───── 确认弹框 ───── */
    let confirmResolve = null;

    const showConfirm = (title, message, { danger = false } = {}) => {
        return new Promise((resolve) => {
            confirmResolve = resolve;
            confirmTitle.textContent = title;
            confirmMessage.textContent = message;
            if (danger) {
                confirmOkBtn.className = "flex-1 px-4 py-2.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors";
                confirmOkBtn.textContent = "删除";
            } else {
                confirmOkBtn.className = "flex-1 px-4 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors";
                confirmOkBtn.textContent = "确定";
            }
            openModal(confirmModal);
        });
    };

    const showAlert = (title, message) => showConfirm(title, message);

    const resolveConfirm = (value) => {
        closeModal(confirmModal);
        if (confirmResolve) { confirmResolve(value); confirmResolve = null; }
    };

    confirmOkBtn.addEventListener("click", () => resolveConfirm(true));
    confirmCancelBtn.addEventListener("click", () => resolveConfirm(false));
    confirmModal.querySelector("[data-close-modal]").addEventListener("click", () => resolveConfirm(false));

    /* ───── Token ───── */
    const loadToken = () => {
        const saved = localStorage.getItem(TOKEN_KEY);
        if (saved) tokenInput.value = saved;
    };

    saveTokenBtn.addEventListener("click", () => {
        const token = getToken();
        if (!token) return;
        localStorage.setItem(TOKEN_KEY, token);
        closeModal(authModal);
        setStatus("令牌已保存");
        loadList();
    });

    settingsBtn.addEventListener("click", () => openModal(authModal));

    /* ───── 面包屑 ───── */
    const renderBreadcrumb = () => {
        breadcrumb.innerHTML = "";
        const homeBtn = document.createElement("button");
        homeBtn.className = "shrink-0 px-2 py-1 rounded-md hover:bg-gray-100 text-gray-600 transition-colors";
        homeBtn.innerHTML = `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
        homeBtn.addEventListener("click", () => { state.currentPath = ""; loadList(); });
        breadcrumb.appendChild(homeBtn);

        if (!state.currentPath) return;

        const parts = state.currentPath.split("/").filter(Boolean);
        parts.forEach((part, idx) => {
            const sep = document.createElement("span");
            sep.className = "text-gray-300 shrink-0";
            sep.textContent = "/";
            breadcrumb.appendChild(sep);

            const btn = document.createElement("button");
            const isLast = idx === parts.length - 1;
            btn.className = `shrink-0 px-1.5 py-1 rounded-md text-sm transition-colors truncate max-w-[160px] ${isLast ? "text-gray-900 font-medium" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"}`;
            btn.textContent = part;
            btn.title = part;
            if (!isLast) {
                const targetPath = parts.slice(0, idx + 1).join("/");
                btn.addEventListener("click", () => { state.currentPath = targetPath; loadList(); });
            }
            breadcrumb.appendChild(btn);
        });
    };

    /* ───── 文件列表 ───── */
    const renderRows = () => {
        fileRows.innerHTML = "";
        const show = state.entries.length > 0;
        emptyState.style.display = show ? "none" : "flex";
        loadingState.style.display = "none";

        const sorted = [...state.entries].sort((a, b) => {
            if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
            return a.name.localeCompare(b.name);
        });

        sorted.forEach((entry) => {
            const row = document.createElement("div");
            row.className = "file-row grid grid-cols-[1fr_100px_100px_160px] gap-2 px-4 py-2 text-sm items-center hover:bg-gray-50 cursor-pointer transition-colors";
            if (state.previewEntry && state.previewEntry.name === entry.name && state.previewEntry.type === entry.type) {
                row.classList.add("bg-brand-50");
            }

            row.innerHTML = `
                <div class="flex items-center gap-3 min-w-0">
                    <span class="shrink-0">${fileIcon(entry)}</span>
                    <span class="truncate ${entry.type === "dir" ? "font-medium" : ""}">${entry.name}</span>
                    <div class="file-actions flex items-center gap-1 ml-auto shrink-0">
                        ${entry.type === "file" ? `<button class="action-download p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600" title="下载"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></button>` : ""}
                        <button class="action-delete p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500" title="删除"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>
                    </div>
                </div>
                <span class="text-gray-500 text-xs">${entry.type === "dir" ? "目录" : getExt(entry.name).toUpperCase() || "文件"}</span>
                <span class="text-gray-500 text-xs font-mono">${entry.type === "file" ? formatBytes(entry.size || 0) : "-"}</span>
                <span class="text-gray-400 text-xs">${formatTime(entry.mtimeMs)}</span>
            `;

            row.addEventListener("click", (e) => {
                if (e.target.closest(".action-download")) {
                    e.stopPropagation();
                    downloadFile(entry);
                    return;
                }
                if (e.target.closest(".action-delete")) {
                    e.stopPropagation();
                    deleteEntry(entry);
                    return;
                }
                if (entry.type === "dir") {
                    state.currentPath = joinPath(state.currentPath, entry.name);
                    closePreview();
                    loadList();
                } else {
                    openPreview(entry);
                    renderRows();
                }
            });

            fileRows.appendChild(row);
        });

        statInfo.textContent = `${state.entries.length} 项，共 ${formatBytes(state.entries.reduce((s, e) => s + (e.size || 0), 0))}`;
    };

    const syncUrl = () => {
        const url = new URL(window.location);
        if (state.currentPath) {
            url.searchParams.set("path", state.currentPath);
        } else {
            url.searchParams.delete("path");
        }
        history.replaceState(null, "", url);
    };

    const loadList = async () => {
        loadingState.style.display = "flex";
        emptyState.style.display = "none";
        fileRows.innerHTML = "";
        syncUrl();
        renderBreadcrumb();

        const resp = await apiFetch(`/list?path=${encodeURIComponent(state.currentPath)}`);
        if (!resp) { loadingState.style.display = "none"; return; }
        const data = await resp.json();
        if (!resp.ok) {
            setStatus(data.error || "加载失败");
            loadingState.style.display = "none";
            return;
        }
        state.entries = data.entries || [];
        renderRows();
        setStatus(`已加载 · ${formatTime(Date.now())}`);
    };

    refreshBtn.addEventListener("click", loadList);

    /* ───── 下载 ───── */
    const downloadFile = async (entry) => {
        const relPath = joinPath(state.currentPath, entry.name);
        const resp = await apiFetch(`/download?path=${encodeURIComponent(relPath)}`);
        if (!resp) return;
        if (!resp.ok) {
            const data = await resp.json();
            setStatus(data.error || "下载失败");
            return;
        }
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = entry.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        setStatus(`已下载: ${entry.name}`);
    };

    /* ───── 删除 ───── */
    const deleteEntry = async (entry) => {
        const label = entry.type === "dir" ? "目录" : "文件";
        const confirmed = await showConfirm(
            `删除${label}`,
            `确定要删除${label}「${entry.name}」吗？此操作不可撤销。`,
            { danger: true }
        );
        if (!confirmed) return;
        const relPath = joinPath(state.currentPath, entry.name);
        const resp = await apiFetch("/delete", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ path: relPath }),
        });
        if (!resp) return;
        const data = await resp.json();
        if (!resp.ok) {
            if (data.error === "directory not empty") {
                await showAlert("无法删除", "目录不为空，请先清空目录内的文件再删除。");
            } else {
                setStatus(data.error || "删除失败");
            }
            return;
        }
        if (state.previewEntry && state.previewEntry.name === entry.name) {
            closePreview();
        }
        setStatus(`已删除: ${entry.name}`);
        await loadList();
    };

    /* ───── 预览 ───── */
    const openPreview = (entry) => {
        state.previewEntry = entry;
        previewPanel.classList.remove("hidden");
        previewPanel.classList.add("preview-enter");
        previewTitle.textContent = entry.name;

        const ext = getExt(entry.name);
        const relPath = joinPath(state.currentPath, entry.name);
        const token = getToken();
        const authUrl = `/download?path=${encodeURIComponent(relPath)}`;

        previewBody.innerHTML = "";

        if (isImage(ext)) {
            const img = document.createElement("img");
            img.className = "max-w-full rounded-lg border border-gray-200";
            img.alt = entry.name;
            fetch(authUrl, { headers: { authorization: `Bearer ${token}` } })
                .then(r => r.blob())
                .then(b => { img.src = URL.createObjectURL(b); });
            previewBody.appendChild(img);
        } else if (isVideo(ext)) {
            const video = document.createElement("video");
            video.className = "max-w-full rounded-lg";
            video.controls = true;
            fetch(authUrl, { headers: { authorization: `Bearer ${token}` } })
                .then(r => r.blob())
                .then(b => { video.src = URL.createObjectURL(b); });
            previewBody.appendChild(video);
        } else if (isAudio(ext)) {
            const audio = document.createElement("audio");
            audio.className = "w-full mt-4";
            audio.controls = true;
            fetch(authUrl, { headers: { authorization: `Bearer ${token}` } })
                .then(r => r.blob())
                .then(b => { audio.src = URL.createObjectURL(b); });
            const iconWrap = document.createElement("div");
            iconWrap.className = "flex items-center justify-center py-8";
            iconWrap.innerHTML = `<svg class="w-16 h-16 text-orange-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
            previewBody.appendChild(iconWrap);
            previewBody.appendChild(audio);
        } else if (isText(ext)) {
            const pre = document.createElement("pre");
            pre.className = "text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-auto whitespace-pre-wrap break-all h-full text-gray-700";
            pre.textContent = "加载中...";
            fetch(authUrl, { headers: { authorization: `Bearer ${token}` } })
                .then(r => r.text())
                .then(t => {
                    pre.textContent = t.length > 100000 ? t.slice(0, 100000) + "\n\n... (内容过长，已截断)" : t;
                });
            previewBody.appendChild(pre);
        } else if (isPdf(ext)) {
            const wrap = document.createElement("div");
            wrap.className = "flex flex-col items-center justify-center py-8 text-gray-400";
            wrap.innerHTML = `
                <svg class="w-16 h-16 text-red-300 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <p class="text-sm font-medium">PDF 文件</p>
                <p class="text-xs mt-1">点击下方按钮下载查看</p>
            `;
            previewBody.appendChild(wrap);
        } else {
            const pre = document.createElement("pre");
            pre.className = "text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-auto whitespace-pre-wrap break-all h-full text-gray-700";
            pre.textContent = "加载中...";
            fetch(authUrl, { headers: { authorization: `Bearer ${token}` } })
                .then(r => {
                    const ct = r.headers.get("content-type") || "";
                    return r.blob().then(b => ({ blob: b, ct }));
                })
                .then(({ blob, ct }) => {
                    if (ct.startsWith("text/") || blob.size < 512 * 1024) {
                        blob.text().then(t => {
                            const isBinary = /[\x00-\x08\x0E-\x1F]/.test(t.slice(0, 4096));
                            if (isBinary) {
                                pre.remove();
                                const wrap = document.createElement("div");
                                wrap.className = "flex flex-col items-center justify-center py-8 text-gray-400";
                                wrap.innerHTML = `
                                    <svg class="w-16 h-16 text-gray-300 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                    <p class="text-sm font-medium">二进制文件</p>
                                    <p class="text-xs mt-1">点击下方按钮下载文件</p>
                                `;
                                previewBody.appendChild(wrap);
                            } else {
                                pre.textContent = t.length > 100000 ? t.slice(0, 100000) + "\n\n... (内容过长，已截断)" : t;
                            }
                        });
                    } else {
                        pre.remove();
                        const wrap = document.createElement("div");
                        wrap.className = "flex flex-col items-center justify-center py-8 text-gray-400";
                        wrap.innerHTML = `
                            <svg class="w-16 h-16 text-gray-300 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            <p class="text-sm font-medium">文件过大，无法预览</p>
                            <p class="text-xs mt-1">点击下方按钮下载文件</p>
                        `;
                        previewBody.appendChild(wrap);
                    }
                });
            previewBody.appendChild(pre);
        }

        previewMeta.innerHTML = `
            <p>大小: <span class="text-gray-700">${formatBytes(entry.size || 0)}</span></p>
            <p>修改: <span class="text-gray-700">${formatTime(entry.mtimeMs)}</span></p>
            <p>路径: <span class="text-gray-700 font-mono">${relPath}</span></p>
        `;

        previewDownloadBtn.onclick = () => downloadFile(entry);
    };

    const closePreview = () => {
        state.previewEntry = null;
        previewPanel.classList.add("hidden");
    };

    closePreviewBtn.addEventListener("click", () => { closePreview(); renderRows(); });

    /* ───── 预览面板拖拽调整宽度 ───── */
    const resizeHandle = $("resizeHandle");
    let resizing = false;
    resizeHandle.addEventListener("mousedown", (e) => {
        e.preventDefault();
        resizing = true;
        resizeHandle.classList.add("active");
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
    });
    document.addEventListener("mousemove", (e) => {
        if (!resizing) return;
        const newWidth = window.innerWidth - e.clientX;
        const clamped = Math.max(280, Math.min(newWidth, window.innerWidth * 0.6));
        previewPanel.style.width = clamped + "px";
    });
    document.addEventListener("mouseup", () => {
        if (!resizing) return;
        resizing = false;
        resizeHandle.classList.remove("active");
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
    });

    /* ───── 新建目录 ───── */
    mkdirModalBtn.addEventListener("click", () => openModal(mkdirModal));

    const createDir = async () => {
        const name = mkdirNameInput.value.trim().replace(/^\/+|\/+$/g, "");
        if (!name) return;
        const target = joinPath(state.currentPath, name);
        const resp = await apiFetch("/mkdir", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ path: target, recursive: true }),
        });
        if (!resp) return;
        const data = await resp.json();
        if (!resp.ok) {
            setStatus(data.error || "创建失败");
            return;
        }
        mkdirNameInput.value = "";
        closeModal(mkdirModal);
        setStatus(`目录已创建: ${name}`);
        await loadList();
    };

    mkdirBtn.addEventListener("click", createDir);
    mkdirNameInput.addEventListener("keydown", (e) => { if (e.key === "Enter") createDir(); });

    /* ───── 上传 ───── */
    uploadModalBtn.addEventListener("click", () => {
        uploadPathLabel.textContent = "/" + state.currentPath;
        state.selectedFiles = [];
        renderFileQueue();
        uploadProgress.classList.add("hidden");
        openModal(uploadModal);
    });

    const renderFileQueue = () => {
        fileQueue.innerHTML = "";
        if (state.selectedFiles.length === 0) {
            fileQueue.classList.add("hidden");
            uploadBtn.disabled = true;
            return;
        }
        fileQueue.classList.remove("hidden");
        uploadBtn.disabled = false;
        state.selectedFiles.forEach((f, i) => {
            const row = document.createElement("div");
            row.className = "flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-sm";
            row.innerHTML = `
                <span class="shrink-0">${fileIcon({ name: f.name, type: "file" })}</span>
                <span class="truncate flex-1">${f.name}</span>
                <span class="text-xs text-gray-400 shrink-0">${formatBytes(f.size)}</span>
                <button class="remove-file p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 shrink-0" data-index="${i}">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            `;
            row.querySelector(".remove-file").addEventListener("click", () => {
                state.selectedFiles.splice(i, 1);
                renderFileQueue();
            });
            fileQueue.appendChild(row);
        });
    };

    const addFiles = (files) => {
        state.selectedFiles.push(...Array.from(files));
        renderFileQueue();
    };

    dropzone.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", () => { if (fileInput.files.length) addFiles(fileInput.files); fileInput.value = ""; });
    dropzone.addEventListener("dragover", (e) => { e.preventDefault(); dropzone.classList.add("drop-active"); });
    dropzone.addEventListener("dragleave", () => dropzone.classList.remove("drop-active"));
    dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.classList.remove("drop-active");
        if (e.dataTransfer?.files.length) addFiles(e.dataTransfer.files);
    });

    uploadBtn.addEventListener("click", async () => {
        if (!state.selectedFiles.length) return;
        const overwrite = overwriteInput.checked ? "1" : "0";
        const mkdirs = mkdirsInput.checked ? "1" : "0";
        const total = state.selectedFiles.length;
        uploadProgress.classList.remove("hidden");
        uploadBtn.disabled = true;

        for (let i = 0; i < total; i++) {
            const file = state.selectedFiles[i];
            const target = joinPath(state.currentPath, file.name);
            uploadProgressBar.style.width = `${((i) / total) * 100}%`;
            uploadProgressText.textContent = `上传中 (${i + 1}/${total}): ${file.name}`;

            const resp = await apiFetch(`/upload?path=${encodeURIComponent(target)}&overwrite=${overwrite}&mkdirs=${mkdirs}`, {
                method: "POST",
                headers: { "content-type": file.type || "application/octet-stream" },
                body: file,
            });
            if (!resp) { uploadBtn.disabled = false; return; }
            if (!resp.ok) {
                const data = await resp.json();
                setStatus(data.error || "上传失败");
                uploadBtn.disabled = false;
                return;
            }
        }

        uploadProgressBar.style.width = "100%";
        uploadProgressText.textContent = "上传完成";
        setStatus(`已上传 ${total} 个文件`);
        state.selectedFiles = [];

        setTimeout(() => { closeModal(uploadModal); loadList(); }, 500);
    });

    /* ───── 全局拖放 ───── */
    document.body.addEventListener("dragover", (e) => {
        e.preventDefault();
        if (!uploadModal.classList.contains("hidden")) return;
        uploadPathLabel.textContent = "/" + state.currentPath;
        state.selectedFiles = [];
        renderFileQueue();
        uploadProgress.classList.add("hidden");
        openModal(uploadModal);
    });

    /* ───── 键盘快捷键 ───── */
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            document.querySelectorAll(".fixed:not(.hidden)").forEach((m) => m.classList.add("hidden"));
        }
    });

    /* ───── 初始化 ───── */
    loadToken();
    state.currentPath = new URLSearchParams(window.location.search).get("path") || "";
    if (!getToken()) {
        openModal(authModal);
    } else {
        loadList();
    }
})();
