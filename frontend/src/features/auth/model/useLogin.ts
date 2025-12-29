import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface UseLoginReturn {
    email: string;
    setEmail: (v: string) => void;
    password: string;
    setPassword: (v: string) => void;
    isLoading: boolean;
    error: string | null;
    handleLogin: () => Promise<void>;
    goToRegister: () => void;
    clearError: () => void;
}

/**
 * Hook containing login logic.
 */
export const useLogin = (): UseLoginReturn => {
    const history = useHistory();
    const { login, isLoading, error, clearError } = useAuthStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (): Promise<void> => {
        try {
            await login(email, password);
            history.push('/');
        } catch {
            // Error is handled by store and displayed via ErrorToast
        }
    };

    const goToRegister = (): void => {
        history.push('/register');
    };

    return {
        email,
        setEmail,
        password,
        setPassword,
        isLoading,
        error,
        handleLogin,
        goToRegister,
        clearError
    };
};
