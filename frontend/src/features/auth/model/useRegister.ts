import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface UseRegisterReturn {
    email: string;
    setEmail: (v: string) => void;
    password: string;
    setPassword: (v: string) => void;
    age: number | undefined;
    setAge: (v: number | undefined) => void;
    isLoading: boolean;
    error: string | null;
    handleRegister: () => Promise<void>;
    goToLogin: () => void;
    clearError: () => void;
}

/**
 * Hook containing register logic.
 */
export const useRegister = (): UseRegisterReturn => {
    const history = useHistory();
    const { register, isLoading, error, clearError } = useAuthStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [age, setAge] = useState<number | undefined>(undefined);

    const handleRegister = async (): Promise<void> => {
        try {
            await register(email, password, age);
            history.push('/');
        } catch {
            // Error is handled by store and displayed via ErrorToast
        }
    };

    const goToLogin = (): void => {
        history.push('/login');
    };

    return {
        email,
        setEmail,
        password,
        setPassword,
        age,
        setAge,
        isLoading,
        error,
        handleRegister,
        goToLogin,
        clearError
    };
};
