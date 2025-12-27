import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import ru from './locales/ru.json';
import kz from './locales/kz.json';
import en from './locales/en.json';

/**
 * i18n configuration for multi-language support.
 * Supports Russian (default), Kazakh, and English.
 * 
 * Language is persisted to localStorage and restored on app restart.
 */
i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            ru: { translation: ru },
            kz: { translation: kz },
            en: { translation: en },
        },
        fallbackLng: 'ru', // Default to Russian
        supportedLngs: ['ru', 'kz', 'en'],

        interpolation: {
            escapeValue: false, // React already escapes values
        },

        detection: {
            // Order of language detection methods
            order: ['localStorage', 'navigator'],
            // Key used in localStorage
            lookupLocalStorage: 'app-language',
            // Cache the detected language
            caches: ['localStorage'],
        },

        react: {
            useSuspense: false, // Prevents issues with SSR and suspense
        },
    });

export default i18n;
