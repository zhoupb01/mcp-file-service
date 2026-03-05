import {
    formatBytes,
    formatTime,
    getExt,
    isAudio,
    isImage,
    isPdf,
    isText,
    isVideo,
    joinPath,
} from "../core/utils.js";

export const createPreviewFeature = ({
    dom,
    state,
    runtime,
    constants,
    getToken,
    callbacks,
}) => {
    const isMobileViewport = () => window.innerWidth <= constants.PREVIEW_MOBILE_BREAKPOINT;

    const clampPreviewWidth = (width) => {
        const maxWidth = Math.floor(window.innerWidth * constants.PREVIEW_MAX_RATIO);
        return Math.max(constants.PREVIEW_MIN_WIDTH, Math.min(Math.floor(width), maxWidth));
    };

    const applyPreviewWidth = () => {
        if (isMobileViewport()) {
            dom.previewPanel.style.removeProperty("width");
            return;
        }
        const width = runtime.previewWidth === null
            ? clampPreviewWidth(window.innerWidth * constants.PREVIEW_DEFAULT_RATIO)
            : clampPreviewWidth(runtime.previewWidth);
        runtime.previewWidth = width;
        dom.previewPanel.style.width = `${width}px`;
    };

    const openPreview = (entry) => {
        state.previewEntry = entry;
        applyPreviewWidth();
        if (runtime.previewHideTimer) {
            clearTimeout(runtime.previewHideTimer);
            runtime.previewHideTimer = null;
        }
        dom.previewBackdrop.classList.remove("hidden");
        dom.previewPanel.classList.remove("hidden");
        requestAnimationFrame(() => {
            dom.previewBackdrop.classList.add("preview-backdrop-show");
            dom.previewPanel.classList.add("preview-drawer-open");
        });
        dom.previewTitle.textContent = entry.name;

        const ext = getExt(entry.name);
        const relPath = joinPath(state.currentPath, entry.name);
        const token = getToken();
        const authUrl = `/download?path=${encodeURIComponent(relPath)}`;

        dom.previewBody.innerHTML = "";

        if (isImage(ext)) {
            const img = document.createElement("img");
            img.className = "max-w-full rounded-lg border border-gray-200";
            img.alt = entry.name;
            fetch(authUrl, { headers: { authorization: `Bearer ${token}` } })
                .then((r) => r.blob())
                .then((b) => {
                    img.src = URL.createObjectURL(b);
                });
            dom.previewBody.appendChild(img);
        } else if (isVideo(ext)) {
            const video = document.createElement("video");
            video.className = "max-w-full rounded-lg";
            video.controls = true;
            fetch(authUrl, { headers: { authorization: `Bearer ${token}` } })
                .then((r) => r.blob())
                .then((b) => {
                    video.src = URL.createObjectURL(b);
                });
            dom.previewBody.appendChild(video);
        } else if (isAudio(ext)) {
            const audio = document.createElement("audio");
            audio.className = "w-full mt-4";
            audio.controls = true;
            fetch(authUrl, { headers: { authorization: `Bearer ${token}` } })
                .then((r) => r.blob())
                .then((b) => {
                    audio.src = URL.createObjectURL(b);
                });
            const iconWrap = document.createElement("div");
            iconWrap.className = "flex items-center justify-center py-8";
            iconWrap.innerHTML = `<svg class="w-16 h-16 text-orange-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
            dom.previewBody.appendChild(iconWrap);
            dom.previewBody.appendChild(audio);
        } else if (isText(ext)) {
            const pre = document.createElement("pre");
            pre.className = "text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-auto whitespace-pre-wrap break-all h-full text-gray-700";
            pre.textContent = "加载中...";
            fetch(authUrl, { headers: { authorization: `Bearer ${token}` } })
                .then((r) => r.text())
                .then((t) => {
                    pre.textContent = t.length > 100000 ? `${t.slice(0, 100000)}\n\n... (内容过长，已截断)` : t;
                });
            dom.previewBody.appendChild(pre);
        } else if (isPdf(ext)) {
            const wrap = document.createElement("div");
            wrap.className = "flex flex-col items-center justify-center py-8 text-gray-400";
            wrap.innerHTML = `
                <svg class="w-16 h-16 text-red-300 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <p class="text-sm font-medium">PDF 文件</p>
                <p class="text-xs mt-1">点击下方按钮下载查看</p>
            `;
            dom.previewBody.appendChild(wrap);
        } else {
            const pre = document.createElement("pre");
            pre.className = "text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-auto whitespace-pre-wrap break-all h-full text-gray-700";
            pre.textContent = "加载中...";
            fetch(authUrl, { headers: { authorization: `Bearer ${token}` } })
                .then((r) => {
                    const ct = r.headers.get("content-type") || "";
                    return r.blob().then((b) => ({ blob: b, ct }));
                })
                .then(({ blob, ct }) => {
                    if (ct.startsWith("text/") || blob.size < 512 * 1024) {
                        blob.text().then((t) => {
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
                                dom.previewBody.appendChild(wrap);
                            } else {
                                pre.textContent = t.length > 100000 ? `${t.slice(0, 100000)}\n\n... (内容过长，已截断)` : t;
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
                        dom.previewBody.appendChild(wrap);
                    }
                });
            dom.previewBody.appendChild(pre);
        }

        dom.previewMeta.innerHTML = `
            <p>大小: <span class="text-gray-700">${formatBytes(entry.size || 0)}</span></p>
            <p>修改: <span class="text-gray-700">${formatTime(entry.mtimeMs)}</span></p>
            <p>路径: <span class="text-gray-700 font-mono">${relPath}</span></p>
        `;

        dom.previewDownloadBtn.onclick = () => callbacks.downloadFile(entry);
    };

    const closePreview = () => {
        state.previewEntry = null;
        dom.previewBackdrop.classList.remove("preview-backdrop-show");
        dom.previewPanel.classList.remove("preview-drawer-open");
        if (runtime.previewHideTimer) clearTimeout(runtime.previewHideTimer);
        runtime.previewHideTimer = setTimeout(() => {
            if (!state.previewEntry) {
                dom.previewBackdrop.classList.add("hidden");
                dom.previewPanel.classList.add("hidden");
            }
        }, 240);
    };

    dom.closePreviewBtn.addEventListener("click", () => {
        closePreview();
        callbacks.renderRows();
    });
    dom.previewBackdrop.addEventListener("click", () => {
        closePreview();
        callbacks.renderRows();
    });
    dom.resizeHandle.addEventListener("mousedown", (e) => {
        if (isMobileViewport()) return;
        e.preventDefault();
        runtime.resizingPreview = true;
        dom.resizeHandle.classList.add("active");
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
    });
    document.addEventListener("mousemove", (e) => {
        if (!runtime.resizingPreview) return;
        const nextWidth = clampPreviewWidth(window.innerWidth - e.clientX);
        runtime.previewWidth = nextWidth;
        dom.previewPanel.style.width = `${nextWidth}px`;
    });
    document.addEventListener("mouseup", () => {
        if (!runtime.resizingPreview) return;
        runtime.resizingPreview = false;
        dom.resizeHandle.classList.remove("active");
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
    });
    window.addEventListener("resize", () => {
        applyPreviewWidth();
    });

    return {
        openPreview,
        closePreview,
    };
};
