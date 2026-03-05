import { fileIcon, formatBytes, joinPath } from "../core/utils.js";

export const createUploadFeature = ({
    dom,
    state,
    apiFetch,
    feedback,
    modal,
    callbacks,
}) => {
    const { setStatus, showToast } = feedback;

    let uploadDragDepth = 0;

    const renderFileQueue = () => {
        dom.fileQueue.innerHTML = "";
        if (state.selectedFiles.length === 0) {
            dom.fileQueue.classList.add("hidden");
            dom.uploadBtn.disabled = true;
            return;
        }
        dom.fileQueue.classList.remove("hidden");
        dom.uploadBtn.disabled = false;
        state.selectedFiles.forEach((f, i) => {
            const row = document.createElement("div");
            row.className = "flex items-center gap-2 px-3 py-2 bg-gray-50/80 rounded-lg text-sm";
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
            dom.fileQueue.appendChild(row);
        });
    };

    const addFiles = (files) => {
        state.selectedFiles.push(...Array.from(files));
        renderFileQueue();
    };

    const resetUploadModalState = () => {
        dom.uploadPathLabel.textContent = `/${state.currentPath}`;
        state.selectedFiles = [];
        renderFileQueue();
        dom.uploadProgress.classList.add("hidden");
        uploadDragDepth = 0;
        dom.dropzone.classList.remove("drop-active");
    };

    dom.uploadModalBtn.addEventListener("click", () => {
        resetUploadModalState();
        modal.openModal(dom.uploadModal);
    });

    dom.dropzone.addEventListener("click", () => dom.fileInput.click());
    dom.fileInput.addEventListener("change", () => {
        if (dom.fileInput.files.length) addFiles(dom.fileInput.files);
        dom.fileInput.value = "";
    });
    dom.uploadModal.addEventListener("dragenter", (e) => {
        e.preventDefault();
        uploadDragDepth += 1;
        dom.dropzone.classList.add("drop-active");
    });
    dom.uploadModal.addEventListener("dragover", (e) => {
        e.preventDefault();
        dom.dropzone.classList.add("drop-active");
    });
    dom.uploadModal.addEventListener("dragleave", (e) => {
        e.preventDefault();
        uploadDragDepth = Math.max(0, uploadDragDepth - 1);
        if (uploadDragDepth === 0) {
            dom.dropzone.classList.remove("drop-active");
        }
    });
    dom.uploadModal.addEventListener("drop", (e) => {
        e.preventDefault();
        uploadDragDepth = 0;
        dom.dropzone.classList.remove("drop-active");
        if (e.dataTransfer?.files.length) addFiles(e.dataTransfer.files);
    });

    dom.uploadBtn.addEventListener("click", async () => {
        if (!state.selectedFiles.length) return;
        const overwrite = dom.overwriteInput.checked ? "1" : "0";
        const mkdirs = dom.mkdirsInput.checked ? "1" : "0";
        const total = state.selectedFiles.length;
        dom.uploadProgress.classList.remove("hidden");
        dom.uploadBtn.disabled = true;

        for (let i = 0; i < total; i++) {
            const file = state.selectedFiles[i];
            const target = joinPath(state.currentPath, file.name);
            dom.uploadProgressBar.style.width = `${(i / total) * 100}%`;
            dom.uploadProgressText.textContent = `上传中 (${i + 1}/${total}): ${file.name}`;

            const resp = await apiFetch(`/upload?path=${encodeURIComponent(target)}&overwrite=${overwrite}&mkdirs=${mkdirs}`, {
                method: "POST",
                headers: { "content-type": file.type || "application/octet-stream" },
                body: file,
            });
            if (!resp) {
                dom.uploadBtn.disabled = false;
                return;
            }
            if (!resp.ok) {
                const data = await resp.json();
                setStatus(data.error || "上传失败");
                dom.uploadBtn.disabled = false;
                return;
            }
        }

        dom.uploadProgressBar.style.width = "100%";
        dom.uploadProgressText.textContent = "上传完成";
        setStatus(`已上传 ${total} 个文件`);
        showToast(`上传成功: ${total} 个文件`);
        state.selectedFiles = [];

        setTimeout(() => {
            modal.closeModal(dom.uploadModal);
            callbacks.loadList();
        }, 500);
    });

    document.body.addEventListener("dragover", (e) => {
        e.preventDefault();
        if (!dom.uploadModal.classList.contains("hidden")) return;
        resetUploadModalState();
        modal.openModal(dom.uploadModal);
    });
    document.body.addEventListener("drop", (e) => {
        e.preventDefault();
        const files = e.dataTransfer?.files;
        if (!files?.length) return;
        if (dom.uploadModal.classList.contains("hidden")) {
            resetUploadModalState();
            modal.openModal(dom.uploadModal);
        }
        uploadDragDepth = 0;
        dom.dropzone.classList.remove("drop-active");
        addFiles(files);
    });

    return {
        renderFileQueue,
    };
};
