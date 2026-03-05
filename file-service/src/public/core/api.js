export const createApiClient = ({ getToken, openAuthModal }) => {
    const apiFetch = async (url, options = {}) => {
        const token = getToken();
        if (!token) {
            openAuthModal();
            return null;
        }
        const headers = Object.assign({}, options.headers, { authorization: `Bearer ${token}` });
        return fetch(url, Object.assign({}, options, { headers }));
    };

    return { apiFetch };
};
