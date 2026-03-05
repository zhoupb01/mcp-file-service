import { createApiClient } from "./core/api.js";
import { dom } from "./core/dom.js";
import { createFeedback } from "./core/feedback.js";
import { state, runtime, UI_CONSTANTS } from "./core/state.js";
import { createListFeature } from "./features/list.js";
import { createModalFeature } from "./features/modal.js";
import { createPreviewFeature } from "./features/preview.js";
import { createUploadFeature } from "./features/upload.js";

const TOKEN_KEY = "file-service-token";

const modal = createModalFeature(dom);
const feedback = createFeedback({ statusLine: dom.statusLine });

const getToken = () => dom.tokenInput.value.trim();

const { apiFetch } = createApiClient({
    getToken,
    openAuthModal: () => modal.openModal(dom.authModal),
});

const callbacks = {
    openPreview: () => {},
    closePreview: () => {},
    renderRows: () => {},
    downloadFile: () => {},
    loadList: () => {},
};

const listFeature = createListFeature({
    dom,
    state,
    runtime,
    constants: UI_CONSTANTS,
    apiFetch,
    feedback,
    modal,
    callbacks,
});

const previewFeature = createPreviewFeature({
    dom,
    state,
    runtime,
    constants: UI_CONSTANTS,
    getToken,
    callbacks,
});

createUploadFeature({
    dom,
    state,
    apiFetch,
    feedback,
    modal,
    callbacks,
});

callbacks.openPreview = previewFeature.openPreview;
callbacks.closePreview = previewFeature.closePreview;
callbacks.renderRows = listFeature.renderRows;
callbacks.downloadFile = listFeature.downloadFile;
callbacks.loadList = listFeature.loadList;

const loadToken = () => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (saved) dom.tokenInput.value = saved;
};

dom.saveTokenBtn.addEventListener("click", () => {
    const token = getToken();
    if (!token) return;
    localStorage.setItem(TOKEN_KEY, token);
    modal.closeModal(dom.authModal);
    feedback.setStatus("令牌已保存");
    listFeature.loadList();
});

dom.settingsBtn.addEventListener("click", () => modal.openModal(dom.authModal));

document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        dom.searchInput.focus();
        dom.searchInput.select();
        return;
    }
    if (e.key === "Escape") {
        if (document.activeElement === dom.searchInput && dom.searchInput.value) {
            listFeature.clearSearchAndReload();
            return;
        }
        if (state.previewEntry) {
            previewFeature.closePreview();
            listFeature.renderRows();
            return;
        }
        document.querySelectorAll(".fixed:not(.hidden)").forEach((m) => m.classList.add("hidden"));
    }
});

loadToken();

const params = new URLSearchParams(window.location.search);
state.searchKeyword = params.get("q") || "";
dom.searchInput.value = state.searchKeyword;
listFeature.syncSearchUi();

state.currentPath = params.get("path") || "";
if (!getToken()) {
    modal.openModal(dom.authModal);
} else {
    listFeature.loadList();
}
