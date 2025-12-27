import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import type { TFunction, i18n } from 'i18next';

interface User {
    id: number;
    email: string;
    age?: number;
}

export interface UseProfileReturn {
    user: User | null;
    t: TFunction;
    i18n: i18n;
    handleLogout: () => void;
    handleLanguageChange: (langCode: string) => void;
}

/**
 * Custom hook to manage profile-related logic.
 * Encapsulates authentication actions and language settings.
 */
export const useProfile = (): UseProfileReturn => {
    const { t, i18n } = useTranslation();
    const { user, logout } = useAuthStore();

    const handleLogout = (): void => {
        logout();
        // Force redirect to login page for total state reset and rehydration prevention
        window.location.href = '/login';
    };

    const handleLanguageChange = (langCode: string): void => {
        i18n.changeLanguage(langCode);
        // Persist to localStorage for i18next-browser-languagedetector
        localStorage.setItem('app-language', langCode);
    };

    return {
        user,
        t,
        i18n,
        handleLogout,
        handleLanguageChange
    };
};
