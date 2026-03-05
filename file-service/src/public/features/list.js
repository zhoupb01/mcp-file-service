import {
    fileIcon,
    formatBytes,
    formatTime,
    getExt,
    joinPath,
    normalizeSearch,
} from "../core/utils.js";

export const createListFeature = ({
    dom,
    state,
    runtime,
    constants,
    apiFetch,
    feedback,
    modal,
    callbacks,
}) => {
    const { setStatus, showToast } = feedback;

    const syncSearchUi = () => {
        dom.clearSearchBtn.classList.toggle("hidden", !normalizeSearch(state.searchKeyword));
    };

    const renderBreadcrumb = () => {
        dom.breadcrumb.innerHTML = "";
        const homeBtn = document.createElement("button");
        homeBtn.className = "shrink-0 px-2 py-1 rounded-md hover:bg-gray-100 text-gray-600 transition-colors";
        homeBtn.innerHTML = `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
        homeBtn.addEventListener("click", () => {
            state.currentPath = "";
            loadList();
        });
        dom.breadcrumb.appendChild(homeBtn);

        if (!state.currentPath) return;

        const parts = state.currentPath.split("/").filter(Boolean);
        parts.forEach((part, idx) => {
            const sep = document.createElement("span");
            sep.className = "text-gray-300 shrink-0";
            sep.textContent = "/";
            dom.breadcrumb.appendChild(sep);

            const btn = document.createElement("button");
            const isLast = idx === parts.length - 1;
            btn.className = `shrink-0 px-1.5 py-1 rounded-md text-sm transition-colors truncate max-w-[160px] ${isLast ? "text-gray-900 font-medium" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"}`;
            btn.textContent = part;
            btn.title = part;
            if (!isLast) {
                const targetPath = parts.slice(0, idx + 1).join("/");
                btn.addEventListener("click", () => {
                    state.currentPath = targetPath;
                    loadList();
                });
            }
            dom.breadcrumb.appendChild(btn);
        });
    };

    const renderRows = () => {
        dom.fileRows.innerHTML = "";
        const keyword = normalizeSearch(state.searchKeyword);
        const show = state.entries.length > 0;
        dom.emptyState.style.display = show ? "none" : "flex";
        dom.loadingState.style.display = "none";
        if (!show) {
            if (keyword) {
                dom.emptyStateTitle.textContent = "未找到匹配结果";
                dom.emptyStateHint.textContent = "换个关键词试试";
            } else {
                dom.emptyStateTitle.textContent = "此目录为空";
                dom.emptyStateHint.textContent = "上传文件或新建目录开始使用";
            }
        }

        const sorted = [...state.entries].sort((a, b) => {
            if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
            return a.name.localeCompare(b.name);
        });

        sorted.forEach((entry) => {
            const row = document.createElement("div");
            row.className = "file-row grid grid-cols-[1fr_100px_100px_160px] gap-2 px-4 py-2 text-sm items-center hover:bg-gray-100 cursor-pointer transition-colors";
            if (state.previewEntry && state.previewEntry.name === entry.name && state.previewEntry.type === entry.type) {
                row.classList.add("bg-brand-50", "hover:bg-brand-100");
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
                    callbacks.closePreview();
                    loadList();
                } else {
                    callbacks.openPreview(entry);
                    renderRows();
                }
            });

            dom.fileRows.appendChild(row);
        });

        const totalSize = state.entries.reduce((s, e) => s + (e.size || 0), 0);
        dom.statInfo.textContent = keyword
            ? `${state.entries.length} 项（递归搜索），共 ${formatBytes(totalSize)}`
            : `${state.entries.length} 项，共 ${formatBytes(totalSize)}`;
    };

    const syncUrl = () => {
        const url = new URL(window.location);
        if (state.currentPath) {
            url.searchParams.set("path", state.currentPath);
        } else {
            url.searchParams.delete("path");
        }
        const keyword = normalizeSearch(state.searchKeyword);
        if (keyword) {
            url.searchParams.set("q", keyword);
        } else {
            url.searchParams.delete("q");
        }
        history.replaceState(null, "", url);
    };

    const loadList = async () => {
        const requestId = ++runtime.loadRequestId;
        const keyword = normalizeSearch(state.searchKeyword);
        dom.loadingState.style.display = "flex";
        dom.emptyState.style.display = "none";
        dom.fileRows.innerHTML = "";
        syncUrl();
        renderBreadcrumb();

        const params = new URLSearchParams({ path: state.currentPath });
        if (keyword) {
            params.set("q", keyword);
        }
        const resp = await apiFetch(`/list?${params.toString()}`);
        if (!resp) {
            if (requestId === runtime.loadRequestId) dom.loadingState.style.display = "none";
            return;
        }
        const data = await resp.json();
        if (requestId !== runtime.loadRequestId) return;
        if (!resp.ok) {
            setStatus(data.error || (keyword ? "搜索失败" : "加载失败"));
            dom.loadingState.style.display = "none";
            return;
        }
        state.entries = data.entries || [];
        renderRows();
        setStatus(keyword
            ? `递归搜索完成 · ${state.entries.length} 项 · ${formatTime(Date.now())}`
            : `已加载 · ${formatTime(Date.now())}`);
    };

    const scheduleSearch = () => {
        if (runtime.searchTimer) clearTimeout(runtime.searchTimer);
        runtime.searchTimer = setTimeout(() => {
            loadList();
        }, constants.SEARCH_DEBOUNCE_MS);
    };

    const clearSearchAndReload = () => {
        state.searchKeyword = "";
        dom.searchInput.value = "";
        syncSearchUi();
        if (runtime.searchTimer) clearTimeout(runtime.searchTimer);
        loadList();
    };

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

    const deleteEntry = async (entry) => {
        const label = entry.type === "dir" ? "目录" : "文件";
        const confirmed = await modal.showConfirm(
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
                await modal.showAlert("无法删除", "目录不为空，请先清空目录内的文件再删除。");
            } else {
                setStatus(data.error || "删除失败");
                showToast(data.error || "删除失败", { type: "error" });
            }
            return;
        }
        if (state.previewEntry && state.previewEntry.name === entry.name) {
            callbacks.closePreview();
        }
        setStatus(`已删除: ${entry.name}`);
        showToast(`删除成功: ${entry.name}`);
        await loadList();
    };

    const createDir = async () => {
        const name = dom.mkdirNameInput.value.trim().replace(/^\/+|\/+$/g, "");
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
        dom.mkdirNameInput.value = "";
        modal.closeModal(dom.mkdirModal);
        setStatus(`目录已创建: ${name}`);
        await loadList();
    };

    dom.refreshBtn.addEventListener("click", loadList);
    dom.searchInput.addEventListener("input", () => {
        state.searchKeyword = dom.searchInput.value;
        syncSearchUi();
        scheduleSearch();
    });
    dom.clearSearchBtn.addEventListener("click", () => {
        clearSearchAndReload();
        dom.searchInput.focus();
    });

    dom.mkdirModalBtn.addEventListener("click", () => modal.openModal(dom.mkdirModal));
    dom.mkdirBtn.addEventListener("click", createDir);
    dom.mkdirNameInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") createDir();
    });

    return {
        loadList,
        renderRows,
        syncSearchUi,
        clearSearchAndReload,
        downloadFile,
    };
};
