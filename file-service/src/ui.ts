export function renderUiHtml(): string {
    return `<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>文件服务</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
            tailwind.config = {
                theme: {
                    extend: {
                        colors: {
                            brand: {
                                50: "#ECFEFF",
                                100: "#CFFAFE",
                                600: "#0891B2",
                                700: "#0E7490",
                            },
                            accent: {
                                500: "#22C55E",
                                600: "#16A34A",
                            },
                        },
                        fontFamily: {
                            sans: ["Fira Sans", "ui-sans-serif", "system-ui"],
                            mono: ["Fira Code", "ui-monospace", "SFMono-Regular"],
                        },
                        boxShadow: {
                            glow: "0 12px 40px rgba(8,145,178,0.18)",
                        },
                    },
                },
            };
        </script>
        <style>
            @import url("https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap");
        </style>
    </head>
    <body class="min-h-screen bg-gradient-to-br from-brand-50 via-white to-emerald-50 text-slate-800">
        <div class="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 py-10">
            <header class="flex flex-col gap-6">
                <div class="flex flex-wrap items-center justify-between gap-4">
                    <div class="flex items-center gap-3">
                        <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-glow">
                            <svg viewBox="0 0 24 24" aria-hidden="true" class="h-6 w-6">
                                <path fill="currentColor" d="M3 6.75A2.25 2.25 0 0 1 5.25 4.5h5.19a2.25 2.25 0 0 1 1.59.66l1.62 1.62c.42.42.99.66 1.59.66h3.78A2.25 2.25 0 0 1 21 9.69v7.56a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 17.25z" />
                            </svg>
                        </div>
                        <div>
                            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">文件服务</p>
                            <h1 class="text-3xl font-semibold text-slate-900">文件浏览与上传</h1>
                        </div>
                    </div>
                    <div class="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        <span class="rounded-full border border-brand-100 bg-white px-3 py-1">需要鉴权</span>
                        <span class="rounded-full border border-brand-100 bg-white px-3 py-1">根目录范围</span>
                    </div>
                </div>
                <div class="rounded-2xl border border-brand-100 bg-white/80 p-6 shadow-lg backdrop-blur">
                    <div class="grid gap-6 md:grid-cols-[1.4fr_1fr]">
                        <div class="flex flex-col gap-4">
                            <div>
                                <label for="tokenInput" class="text-sm font-semibold text-slate-700">访问令牌</label>
                                <div class="mt-2 flex flex-wrap items-center gap-3">
                                    <input id="tokenInput" type="password" placeholder="mcp-file-service-token" class="w-full flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100" />
                                    <button id="saveTokenBtn" type="button" class="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">保存</button>
                                </div>
                            </div>
                            <div>
                                <label for="pathInput" class="text-sm font-semibold text-slate-700">当前路径</label>
                                <div class="mt-2 flex flex-wrap items-center gap-3">
                                    <input id="pathInput" type="text" placeholder="（根目录）" class="w-full flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100" />
                                    <button id="upBtn" type="button" class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-600 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">
                                        <svg viewBox="0 0 24 24" aria-hidden="true" class="h-4 w-4">
                                            <path fill="currentColor" d="M12 5.25a.75.75 0 0 1 .53.22l5 5a.75.75 0 1 1-1.06 1.06l-3.72-3.72v9.44a.75.75 0 0 1-1.5 0V7.81l-3.72 3.72a.75.75 0 0 1-1.06-1.06l5-5A.75.75 0 0 1 12 5.25z" />
                                        </svg>
                                        上一级
                                    </button>
                                    <button id="refreshBtn" type="button" class="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">
                                        <svg viewBox="0 0 24 24" aria-hidden="true" class="h-4 w-4">
                                            <path fill="currentColor" d="M4.5 12a7.5 7.5 0 0 1 12.48-5.57l.77-.77a.75.75 0 0 1 1.28.53v4.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.53-1.28l.82-.82A6 6 0 1 0 18 12a.75.75 0 0 1 1.5 0 7.5 7.5 0 0 1-15 0z" />
                                        </svg>
                                        刷新
                                    </button>
                                </div>
                            </div>
                            <p id="statusLine" data-state="idle" class="text-sm text-slate-600 transition-colors data-[state=error]:text-red-600 data-[state=ok]:text-emerald-600 data-[state=loading]:text-brand-700"></p>
                        </div>
                        <div class="flex flex-col justify-between gap-4 rounded-2xl border border-brand-100 bg-white p-5 shadow-md">
                            <div>
                                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">概览</p>
                                <h2 class="mt-2 text-2xl font-semibold text-slate-900">目录概览</h2>
                            </div>
                            <div class="grid gap-4 sm:grid-cols-2">
                                <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">条目数</p>
                                    <p id="statCount" class="mt-2 text-2xl font-semibold text-slate-900">0</p>
                                </div>
                                <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">总大小</p>
                                    <p id="statSize" class="mt-2 text-2xl font-semibold text-slate-900">0 B</p>
                                </div>
                            </div>
                            <div class="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-xs text-brand-700">
                                已启用 Token 鉴权与根目录隔离。
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main class="grid gap-6">
                <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
                    <div class="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h2 class="text-xl font-semibold text-slate-900">文件列表</h2>
                            <p class="text-sm text-slate-600">点击文件夹进入，点击下载按钮下载文件。</p>
                        </div>
                        <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                            <span id="lastRefresh">尚未刷新</span>
                        </div>
                    </div>
                    <div class="mt-6 overflow-hidden rounded-2xl border border-slate-200">
                        <div class="hidden grid-cols-[1.4fr_0.5fr_0.6fr_0.7fr] gap-4 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 sm:grid">
                            <span>名称</span>
                            <span>类型</span>
                            <span>大小</span>
                            <span>修改时间</span>
                        </div>
                        <div id="fileRows" class="divide-y divide-slate-200"></div>
                    </div>
                    <div id="emptyState" class="mt-6 hidden rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center text-sm text-slate-500">
                        当前目录为空。
                    </div>
                </section>

                <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
                    <div class="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h2 class="text-xl font-semibold text-slate-900">上传</h2>
                            <p class="text-sm text-slate-600">上传到当前路径。</p>
                        </div>
                        <div class="flex items-center gap-3 text-sm text-slate-600">
                            <label class="flex items-center gap-2">
                                <input id="overwriteInput" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600" />
                                覆盖写入
                            </label>
                            <label class="flex items-center gap-2">
                                <input id="mkdirsInput" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600" checked />
                                自动创建目录
                            </label>
                        </div>
                    </div>
                    <div class="mt-6 grid gap-4 lg:grid-cols-[1.2fr_auto]">
                        <div id="dropzone" data-active="false" class="flex min-h-[140px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-brand-200 bg-brand-50/60 px-6 py-8 text-center text-sm text-brand-700 transition data-[active=true]:border-brand-600 data-[active=true]:bg-brand-50">
                            <svg viewBox="0 0 24 24" aria-hidden="true" class="h-8 w-8">
                                <path fill="currentColor" d="M12 16.5a.75.75 0 0 1-.75-.75V9.31L9.53 11.03a.75.75 0 1 1-1.06-1.06l3-3a.75.75 0 0 1 1.06 0l3 3a.75.75 0 1 1-1.06 1.06l-1.72-1.72v6.44a.75.75 0 0 1-.75.75z" />
                                <path fill="currentColor" d="M4.5 14.25A4.5 4.5 0 0 1 9 9.75h.33a6 6 0 0 1 11.67 1.5 3.75 3.75 0 0 1-.75 7.44H7.5A3 3 0 0 1 4.5 14.25z" />
                            </svg>
                            <div>
                                <p class="text-base font-semibold">拖拽文件到这里</p>
                                <p class="text-xs uppercase tracking-[0.2em] text-brand-600">或选择文件</p>
                            </div>
                        </div>
                        <div class="flex flex-col gap-3">
                            <input id="fileInput" type="file" multiple class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm" />
                            <button id="uploadBtn" type="button" class="w-full rounded-xl bg-accent-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2">上传所选文件</button>
                            <p class="text-xs text-slate-500">文件以原始二进制发送到 /upload。</p>
                        </div>
                    </div>
                </section>
            </main>
        </div>

        <script>
            const tokenInput = document.getElementById("tokenInput");
            const saveTokenBtn = document.getElementById("saveTokenBtn");
            const pathInput = document.getElementById("pathInput");
            const refreshBtn = document.getElementById("refreshBtn");
            const upBtn = document.getElementById("upBtn");
            const statusLine = document.getElementById("statusLine");
            const fileRows = document.getElementById("fileRows");
            const emptyState = document.getElementById("emptyState");
            const statCount = document.getElementById("statCount");
            const statSize = document.getElementById("statSize");
            const lastRefresh = document.getElementById("lastRefresh");
            const fileInput = document.getElementById("fileInput");
            const uploadBtn = document.getElementById("uploadBtn");
            const overwriteInput = document.getElementById("overwriteInput");
            const mkdirsInput = document.getElementById("mkdirsInput");
            const dropzone = document.getElementById("dropzone");

            const state = { entries: [] };
            const TOKEN_KEY = "file-service-token";

            const formatBytes = (value) => {
                if (value === 0) return "0 B";
                const units = ["B", "KB", "MB", "GB", "TB"];
                let size = value;
                let unitIndex = 0;
                while (size >= 1024 && unitIndex < units.length - 1) {
                    size /= 1024;
                    unitIndex += 1;
                }
                return \`\${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} \${units[unitIndex]}\`;
            };

            const setStatus = (type, message) => {
                statusLine.dataset.state = type;
                statusLine.textContent = message || "";
            };

            const getToken = () => tokenInput.value.trim();
            const loadToken = () => {
                const saved = localStorage.getItem(TOKEN_KEY);
                if (saved) tokenInput.value = saved;
            };
            const saveToken = () => {
                const token = getToken();
                if (!token) {
                    setStatus("error", "需要填写访问令牌。");
                    return;
                }
                localStorage.setItem(TOKEN_KEY, token);
                setStatus("ok", "令牌已保存。");
            };

            const apiFetch = async (url, options = {}) => {
                const token = getToken();
                if (!token) {
                    setStatus("error", "需要填写访问令牌。");
                    return null;
                }
                const headers = Object.assign({}, options.headers, { authorization: \`Bearer \${token}\` });
                return fetch(url, Object.assign({}, options, { headers }));
            };

            const joinPath = (base, name) => {
                const cleanBase = base.replace(/^\\/+|\\/+$/g, "");
                if (!cleanBase) return name;
                return \`\${cleanBase}/\${name}\`;
            };

            const parentPath = (value) => {
                const parts = value.split("/").filter(Boolean);
                parts.pop();
                return parts.join("/");
            };

            const renderRows = () => {
                fileRows.innerHTML = "";
                emptyState.classList.toggle("hidden", state.entries.length > 0);
                state.entries.forEach((entry) => {
                    const row = document.createElement("div");
                    row.className = "grid gap-2 px-4 py-3 text-sm text-slate-700 transition hover:bg-brand-50/60 sm:grid-cols-[1.4fr_0.5fr_0.6fr_0.7fr] sm:gap-4";
                    const nameCell = document.createElement("div");
                    nameCell.className = "flex items-center gap-3 font-medium text-slate-900";
                    const icon = document.createElement("span");
                    icon.className = "flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200";
                    icon.innerHTML = entry.type === "dir"
                        ? '<svg viewBox="0 0 24 24" aria-hidden="true" class="h-4 w-4 text-brand-700"><path fill="currentColor" d="M3 6.75A2.25 2.25 0 0 1 5.25 4.5h5.19a2.25 2.25 0 0 1 1.59.66l1.62 1.62c.42.42.99.66 1.59.66h3.78A2.25 2.25 0 0 1 21 9.69v7.56a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 17.25z" /></svg>'
                        : '<svg viewBox="0 0 24 24" aria-hidden="true" class="h-4 w-4 text-slate-600"><path fill="currentColor" d="M6.75 3A1.75 1.75 0 0 0 5 4.75v14.5C5 20.216 5.784 21 6.75 21h10.5A1.75 1.75 0 0 0 19 19.25V8.5h-4.25A1.75 1.75 0 0 1 13 6.75V3z" /><path fill="currentColor" d="M14.5 3.44V6.5h3.06L14.5 3.44z" /></svg>';
                    const label = document.createElement("span");
                    label.textContent = entry.name;
                    nameCell.appendChild(icon);
                    nameCell.appendChild(label);
                    const meta = document.createElement("div");
                    meta.className = "mt-1 flex flex-wrap gap-2 text-xs text-slate-500 sm:hidden";
                    meta.textContent = \`\${entry.type === "dir" ? "目录" : "文件"} | \${entry.type === "file" ? formatBytes(entry.size || 0) : "-"} | \${new Date(entry.mtimeMs).toLocaleString()}\`;
                    nameCell.appendChild(meta);

                    if (entry.type === "dir") {
                        row.classList.add("cursor-pointer");
                        row.addEventListener("click", () => {
                            pathInput.value = joinPath(pathInput.value, entry.name);
                            loadList();
                        });
                    } else {
                        const downloadBtn = document.createElement("button");
                        downloadBtn.type = "button";
                        downloadBtn.className = "ml-auto flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-brand-600 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2";
                        downloadBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" class="h-3 w-3"><path fill="currentColor" d="M12 4.5a.75.75 0 0 1 .75.75v7.19l2.72-2.72a.75.75 0 0 1 1.06 1.06l-4 4a.75.75 0 0 1-1.06 0l-4-4a.75.75 0 1 1 1.06-1.06l2.72 2.72V5.25A.75.75 0 0 1 12 4.5z" /><path fill="currentColor" d="M4.5 18A1.5 1.5 0 0 0 6 19.5h12A1.5 1.5 0 0 0 19.5 18a.75.75 0 0 1 1.5 0 3 3 0 0 1-3 3H6a3 3 0 0 1-3-3 .75.75 0 0 1 1.5 0z" /></svg>下载';
                        downloadBtn.addEventListener("click", (event) => {
                            event.stopPropagation();
                            downloadFile(entry);
                        });
                        nameCell.appendChild(downloadBtn);
                    }

                    const typeCell = document.createElement("div");
                    typeCell.textContent = entry.type === "dir" ? "目录" : "文件";
                    typeCell.className = "hidden text-slate-500 sm:block";

                    const sizeCell = document.createElement("div");
                    sizeCell.textContent = entry.type === "file" ? formatBytes(entry.size || 0) : "-";
                    sizeCell.className = "hidden font-mono text-xs text-slate-500 sm:block";

                    const timeCell = document.createElement("div");
                    timeCell.textContent = new Date(entry.mtimeMs).toLocaleString();
                    timeCell.className = "hidden text-slate-500 sm:block";

                    row.appendChild(nameCell);
                    row.appendChild(typeCell);
                    row.appendChild(sizeCell);
                    row.appendChild(timeCell);
                    fileRows.appendChild(row);
                });
            };

            const updateStats = () => {
                statCount.textContent = String(state.entries.length);
                const total = state.entries.reduce((sum, entry) => sum + (entry.size || 0), 0);
                statSize.textContent = formatBytes(total);
            };

            const loadList = async () => {
                setStatus("loading", "加载中...");
                const relPath = pathInput.value.trim();
                const response = await apiFetch(\`/list?path=\${encodeURIComponent(relPath)}\`);
                if (!response) return;
                const payload = await response.json();
                if (!response.ok) {
                    setStatus("error", payload.error || "加载列表失败。");
                    return;
                }
                state.entries = payload.entries || [];
                renderRows();
                updateStats();
                lastRefresh.textContent = new Date().toLocaleString();
                setStatus("ok", "列表已更新。");
            };

            const downloadFile = async (entry) => {
                const relPath = joinPath(pathInput.value.trim(), entry.name);
                const response = await apiFetch(\`/download?path=\${encodeURIComponent(relPath)}\`);
                if (!response) return;
                if (!response.ok) {
                    const payload = await response.json();
                    setStatus("error", payload.error || "下载失败。");
                    return;
                }
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = entry.name;
                document.body.appendChild(link);
                link.click();
                link.remove();
                URL.revokeObjectURL(url);
                setStatus("ok", "下载完成。");
            };

            const uploadFiles = async (files) => {
                const relPath = pathInput.value.trim();
                const overwrite = overwriteInput.checked ? "1" : "0";
                const mkdirs = mkdirsInput.checked ? "1" : "0";
                for (const file of files) {
                    const target = joinPath(relPath, file.name);
                    const response = await apiFetch(\`/upload?path=\${encodeURIComponent(target)}&overwrite=\${overwrite}&mkdirs=\${mkdirs}\`, {
                        method: "POST",
                        headers: { "content-type": file.type || "application/octet-stream" },
                        body: file,
                    });
                    if (!response) return;
                    if (!response.ok) {
                        const payload = await response.json();
                        setStatus("error", payload.error || "上传失败。");
                        return;
                    }
                }
                setStatus("ok", "上传完成。");
                await loadList();
            };

            refreshBtn.addEventListener("click", loadList);
            upBtn.addEventListener("click", () => {
                pathInput.value = parentPath(pathInput.value.trim());
                loadList();
            });
            saveTokenBtn.addEventListener("click", () => {
                saveToken();
            });
            uploadBtn.addEventListener("click", () => {
                if (!fileInput.files || fileInput.files.length === 0) {
                    setStatus("error", "请至少选择一个文件。");
                    return;
                }
                uploadFiles(Array.from(fileInput.files));
            });
            dropzone.addEventListener("dragover", (event) => {
                event.preventDefault();
                dropzone.dataset.active = "true";
            });
            dropzone.addEventListener("dragleave", () => {
                dropzone.dataset.active = "false";
            });
            dropzone.addEventListener("drop", (event) => {
                event.preventDefault();
                dropzone.dataset.active = "false";
                if (event.dataTransfer && event.dataTransfer.files.length) {
                    uploadFiles(Array.from(event.dataTransfer.files));
                }
            });

            loadToken();
            loadList();
        </script>
    </body>
</html>`;
}
