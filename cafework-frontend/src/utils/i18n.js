import ja from '../locales/ja';
import en from '../locales/en';
import vi from '../locales/vi';

import { getLang } from './userLocalStore';

const dictionaries = {
    JP: ja,
    EN: en,
    VI: vi
};

export const t = (key, params) => {
  const lang = getLang();
  const text = dictionaries[lang]?.[key] || dictionaries.JP[key] || key;

  return params
    ? text.replace(/\{(\w+)\}/g, (_, name) => params[name] ?? `{${name}}`)
    : text;
};