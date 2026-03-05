export const createModalFeature = (dom) => {
    const openModal = (modal) => {
        modal.classList.remove("hidden");
    };

    const closeModal = (modal) => {
        modal.classList.add("hidden");
    };

    document.querySelectorAll("[data-close-modal]").forEach((el) => {
        el.addEventListener("click", () => {
            el.closest(".fixed").classList.add("hidden");
        });
    });

    let confirmResolve = null;

    const showConfirm = (title, message, { danger = false } = {}) => new Promise((resolve) => {
        confirmResolve = resolve;
        dom.confirmTitle.textContent = title;
        dom.confirmMessage.textContent = message;
        if (danger) {
            dom.confirmOkBtn.className = "flex-1 px-4 py-2.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors";
            dom.confirmOkBtn.textContent = "删除";
        } else {
            dom.confirmOkBtn.className = "flex-1 px-4 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors";
            dom.confirmOkBtn.textContent = "确定";
        }
        openModal(dom.confirmModal);
    });

    const showAlert = (title, message) => showConfirm(title, message);

    const resolveConfirm = (value) => {
        closeModal(dom.confirmModal);
        if (confirmResolve) {
            confirmResolve(value);
            confirmResolve = null;
        }
    };

    dom.confirmOkBtn.addEventListener("click", () => resolveConfirm(true));
    dom.confirmCancelBtn.addEventListener("click", () => resolveConfirm(false));
    dom.confirmModal.querySelector("[data-close-modal]").addEventListener("click", () => resolveConfirm(false));

    return {
        openModal,
        closeModal,
        showConfirm,
        showAlert,
    };
};
