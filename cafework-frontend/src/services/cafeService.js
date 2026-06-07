import api from '../api/axiosClient';
import { getLang } from '../utils/userLocalStore';

export const searchCafes = async (keyword, options = {}) => {
    try {
        const response = await api.get('/cafes/search', {
            params: {
                keyword,
                lang: getLang(),
                recordHistory: options.recordHistory ?? true,
            },
            signal: options.signal,
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi searchCafes:", error);
        const errorMsg = error.response?.data || 'Lỗi khi tải dữ liệu từ máy chủ';
        throw new Error(typeof errorMsg === 'string' ? errorMsg : 'Lỗi khi tải dữ liệu từ máy chủ');
    }
};

export const getAllCafes = async () => {
    try {
        const response = await api.get('/cafes', { params: { lang: getLang() } });
        return response.data;
    } catch (error) {
        console.error("Lỗi getAllCafes:", error);
        throw error;
    }
};

export const getCafeById = async (id) => {
    try {
        const response = await api.get(`/cafes/${id}`, { params: { lang: getLang() } });
        return response.data;
    } catch (error) {
        console.error("Lỗi getCafeById:", error);
        throw error;
    }
};
