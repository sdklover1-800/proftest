/**
 * Language utility functions for handling localized content from database.
 * Used primarily for question text which has text_ru, text_kz, text_en columns.
 */

interface LocalizedObject {
    text_ru?: string;
    text_kz?: string;
    text_en?: string;
    [key: string]: any; // Use any to allow Question type to be passed in
}

/**
 * Returns the localized text based on the current language.
 * Falls back to Russian if the requested language text is not available.
 * 
 * @param obj - Object containing text_ru, text_kz, text_en properties
 * @param lang - Current language code ('ru', 'kz', 'en')
 * @returns The localized text string
 * 
 * @example
 * const question = { text_ru: 'Привет', text_kz: 'Сәлем', text_en: 'Hello' };
 * getLocalizedText(question, 'kz') // Returns 'Сәлем'
 * getLocalizedText(question, 'en') // Returns 'Hello'
 * getLocalizedText(question, 'fr') // Returns 'Привет' (fallback to Russian)
 */
export const getLocalizedText = (obj: LocalizedObject, lang: string): string => {
    if (!obj) {
        return '';
    }

    switch (lang) {
        case 'kz':
            // Return Kazakh text or fallback to Russian
            return obj.text_kz || obj.text_ru || '';
        case 'en':
            // Return English text or fallback to Russian
            return obj.text_en || obj.text_ru || '';
        case 'ru':
        default:
            // Default to Russian
            return obj.text_ru || '';
    }
};

/**
 * Get the language display name in its native form.
 * 
 * @param langCode - Language code ('ru', 'kz', 'en')
 * @returns Native language name
 */
export const getLanguageName = (langCode: string): string => {
    const names: Record<string, string> = {
        ru: 'Русский',
        kz: 'Қазақша',
        en: 'English',
    };
    return names[langCode] || langCode;
};

/**
 * Available languages in the app.
 */
export const AVAILABLE_LANGUAGES = [
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'kz', name: 'Қазақша', flag: '🇰🇿' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
] as const;
