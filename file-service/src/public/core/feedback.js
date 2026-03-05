export const createFeedback = ({ statusLine }) => {
    const setStatus = (msg) => {
        statusLine.textContent = msg;
    };

    const showToast = (message, { type = "success", duration = 2200 } = {}) => {
        const TOAST_META = {
            success: {
                title: "操作成功",
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"></circle><path d="M8.5 12.5l2.2 2.2 4.8-5.2"></path></svg>`,
            },
            error: {
                title: "操作失败",
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"></circle><path d="M9.5 9.5l5 5m0-5l-5 5"></path></svg>`,
            },
            info: {
                title: "提示",
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"></circle><path d="M12 10v5"></path><path d="M12 7h.01"></path></svg>`,
            },
        };
        const meta = TOAST_META[type] || TOAST_META.info;
        const hostId = "toastHost";
        let host = document.getElementById(hostId);
        if (!host) {
            host = document.createElement("div");
            host.id = hostId;
            host.className = "toast-host";
            document.body.appendChild(host);
        }

        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;
        toast.setAttribute("role", "status");
        toast.setAttribute("aria-live", "polite");
        const body = document.createElement("div");
        body.className = "toast-body";
        const icon = document.createElement("div");
        icon.className = `toast-icon toast-icon-${type}`;
        icon.innerHTML = meta.icon;
        const content = document.createElement("div");
        content.className = "toast-content";
        const title = document.createElement("p");
        title.className = "toast-title";
        title.textContent = meta.title;
        const text = document.createElement("div");
        text.className = "toast-message";
        text.textContent = message;
        content.appendChild(title);
        content.appendChild(text);
        body.appendChild(icon);
        body.appendChild(content);
        const progress = document.createElement("div");
        progress.className = "toast-progress";
        progress.style.animationDuration = `${duration}ms`;
        toast.appendChild(body);
        toast.appendChild(progress);
        host.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add("show");
        });

        window.setTimeout(() => {
            toast.classList.add("hide");
            window.setTimeout(() => {
                toast.remove();
            }, 220);
        }, duration);
    };

    return { setStatus, showToast };
};
