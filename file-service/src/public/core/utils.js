export const formatBytes = (v) => {
    if (v === 0) return "0 B";
    const u = ["B", "KB", "MB", "GB", "TB"];
    let s = v;
    let i = 0;
    while (s >= 1024 && i < u.length - 1) {
        s /= 1024;
        i++;
    }
    return `${s.toFixed(s >= 10 || i === 0 ? 0 : 1)} ${u[i]}`;
};

export const formatTime = (ms) => {
    const d = new Date(ms);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const joinPath = (base, name) => {
    const b = base.replace(/^\/+|\/+$/g, "");
    return b ? `${b}/${name}` : name;
};

export const normalizeSearch = (v) => v.trim();

export const getExt = (name) => {
    const i = name.lastIndexOf(".");
    return i > 0 ? name.slice(i + 1).toLowerCase() : "";
};

export const isImage = (ext) => ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico", "avif"].includes(ext);
export const isVideo = (ext) => ["mp4", "webm", "ogg", "mov"].includes(ext);
export const isAudio = (ext) => ["mp3", "wav", "ogg", "flac", "aac", "m4a"].includes(ext);
export const isText = (ext) => ["txt", "md", "json", "js", "ts", "jsx", "tsx", "css", "html", "xml", "yml", "yaml", "toml", "ini", "conf", "sh", "bash", "py", "rb", "go", "rs", "java", "c", "cpp", "h", "hpp", "sql", "log", "env", "gitignore", "dockerfile", "makefile", "csv"].includes(ext);
export const isPdf = (ext) => ext === "pdf";

export const fileIcon = (entry) => {
    if (entry.type === "dir") return `<svg class="w-5 h-5 text-brand-500" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>`;
    const ext = getExt(entry.name);
    if (isImage(ext)) return `<svg class="w-5 h-5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
    if (isVideo(ext)) return `<svg class="w-5 h-5 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`;
    if (isAudio(ext)) return `<svg class="w-5 h-5 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
    if (isPdf(ext)) return `<svg class="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
    if (isText(ext)) return `<svg class="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`;
    return `<svg class="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
};
