export const state = {
    entries: [],
    currentPath: "",
    selectedFiles: [],
    previewEntry: null,
    searchKeyword: "",
};

export const runtime = {
    previewHideTimer: null,
    previewWidth: null,
    resizingPreview: false,
    searchTimer: null,
    loadRequestId: 0,
};

export const UI_CONSTANTS = {
    PREVIEW_DEFAULT_RATIO: 1 / 3,
    PREVIEW_MIN_WIDTH: 320,
    PREVIEW_MAX_RATIO: 0.8,
    PREVIEW_MOBILE_BREAKPOINT: 640,
    SEARCH_DEBOUNCE_MS: 260,
};
