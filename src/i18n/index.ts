import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import nl from './nl.json';
import en from './en.json';
import de from './de.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      nl: { translation: nl },
      en: { translation: en },
      de: { translation: de }
    },
    lng: localStorage.getItem('language') || 'nl', // Default to Dutch
    fallbackLng: 'nl',
    interpolation: {
      escapeValue: false // React already escapes
    }
  });

export default i18n;

// Helper function to change language
export const changeLanguage = (lng: 'nl' | 'en' | 'de') => {
  i18n.changeLanguage(lng);
  localStorage.setItem('language', lng);
};

// Get current language
export const getCurrentLanguage = () => i18n.language;
