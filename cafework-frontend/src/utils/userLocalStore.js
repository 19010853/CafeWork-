const readJson = (key, fallback) => {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw);
    } catch {
        return fallback;
    }
};

const writeJson = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
};

export const getLang = () => localStorage.getItem('lang') || 'JP';
export const setLang = (lang) => localStorage.setItem('lang', lang);

export const getUserKey = () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return 'guest';
    try {
        const user = JSON.parse(userStr);
        return user?.id || user?.email || 'guest';
    } catch {
        return 'guest';
    }
};

const bookmarksKey = () => `cafework.bookmarks.${getUserKey()}`;
const historyKey = () => `cafework.searchHistory.${getUserKey()}`;
const phoneKey = () => `cafework.phone.${getUserKey()}`;

export const getPhoneLocal = () => localStorage.getItem(phoneKey()) || '';
export const setPhoneLocal = (phone) => localStorage.setItem(phoneKey(), phone || '');

export const getBookmarks = () => readJson(bookmarksKey(), []);

export const isBookmarked = (cafeId) => {
    if (!cafeId) return false;
    return getBookmarks().includes(cafeId);
};

export const toggleBookmark = (cafeId) => {
    if (!cafeId) return { saved: false, bookmarks: getBookmarks() };

    const current = getBookmarks();
    const exists = current.includes(cafeId);
    const next = exists ? current.filter((id) => id !== cafeId) : [cafeId, ...current];
    writeJson(bookmarksKey(), next);
    return { saved: !exists, bookmarks: next };
};

export const addSearchHistory = (keyword) => {
    const value = (keyword || '').trim();
    if (!value) return;

    const current = readJson(historyKey(), []);
    const filtered = current.filter((item) => item?.keyword !== value);
    const next = [{ keyword: value, at: new Date().toISOString() }, ...filtered].slice(0, 20);
    writeJson(historyKey(), next);
};

export const removeSearchHistory = (keyword, at) => {
    const current = getSearchHistory();

    const updated = current.filter(
        item => !(item.keyword === keyword && item.at === at)
    );

    localStorage.setItem(
        'search_history',
        JSON.stringify(updated)
    );
};

export const clearSearchHistory = () => {
    localStorage.removeItem('search_history');
};
export const getSearchHistory = () => readJson(historyKey(), []);
