import axios from 'axios';
import { getLang } from '../utils/userLocalStore';

const isoMap = {
    JP: 'ja',
    EN: 'en',
    VI: 'vi',
};

export const getIsoLang = (lang = getLang()) => isoMap[lang] || 'vi';

export const detectLanguage = (text) => {
    if (!text) return 'EN';
    if (/[\u3040-\u30FF\u4E00-\u9FAF]/.test(text)) return 'JP';
    if (/[àáạảãăằắặẳẵâầấậẩẫèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text)) {
        return 'VI';
    }
    return 'EN';
};

const cacheKey = (text, targetLang) => `cw.translation.${targetLang}.${hashText(text)}`;

const hashText = (text) => {
    let hash = 0;
    for (let i = 0; i < text.length; i += 1) {
        hash = ((hash << 5) - hash) + text.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash).toString(36);
};

export const translateText = async (text, targetLang = getLang()) => {
    if (!text || !text.trim()) return text;

    const sourceLang = detectLanguage(text);
    if (sourceLang === targetLang) return text;

    const key = cacheKey(text, targetLang);
    const cached = localStorage.getItem(key);
    if (cached) return cached;

    try {
        const sourceISO = getIsoLang(sourceLang);
        const targetISO = getIsoLang(targetLang);
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceISO}|${targetISO}`;
        const response = await axios.get(url);
        const translated = response.data?.responseData?.translatedText;
        if (translated && typeof translated === 'string') {
            localStorage.setItem(key, translated);
            return translated;
        }
    } catch (error) {
        console.warn('Translation failed:', error);
    }

    return text;
};

export const getCafeName = (cafe) => cafe?.localizedName || cafe?.name || '';
export const getCafeAddress = (cafe) => cafe?.localizedAddress || cafe?.address || '';
export const getCafeDescription = (cafe) => cafe?.localizedDescription || cafe?.description || '';
