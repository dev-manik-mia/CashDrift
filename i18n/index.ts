import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'intl-pluralrules';

import en from './en.json';
import bn from './bn.json';

const LANGUAGE_KEY = '@language_pref';

export const setupI18n = async () => {
  const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
  
  i18n.use(initReactI18next).init({
    compatibilityJSON: 'v4',
    resources: {
      en: { translation: en },
      bn: { translation: bn },
    },
    lng: savedLanguage || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });
};

export const changeLanguage = async (lang: string) => {
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  i18n.changeLanguage(lang);
};

export default i18n;
