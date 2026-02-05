import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { client } from '../api/client';

interface User {
    id: number;
    email: string;
    age?: number;
    is_superuser?: boolean;
}

interface AuthState {
    token: string | null;
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, age?: number) => Promise<void>;
    logout: () => void;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (email: string, password: string) => {
                set({ isLoading: true, error: null });
                try {
                    // OAuth2 expects form data with 'username' and 'password' fields
                    const formData = new FormData();
                    formData.append('username', email);
                    formData.append('password', password);

                    const response = await client.post('/api/v1/auth/login', formData, {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                    });

                    const { access_token } = response.data;

                    // Set the token in axios default headers
                    client.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

                    // Fetch user profile
                    const userResponse = await client.get('/api/v1/auth/me');

                    set({
                        token: access_token,
                        user: userResponse.data,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } catch (error: any) {
                    set({
                        error: error.response?.data?.detail || 'Login failed',
                        isLoading: false,
                    });
                    throw error;
                }
            },

            register: async (email: string, password: string, age?: number) => {
                set({ isLoading: true, error: null });
                try {
                    await client.post('/api/v1/auth/register', {
                        email,
                        password,
                        age,
                    });

                    // Auto-login after registration
                    const formData = new FormData();
                    formData.append('username', email);
                    formData.append('password', password);

                    const response = await client.post('/api/v1/auth/login', formData, {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                    });

                    const { access_token } = response.data;
                    client.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

                    const userResponse = await client.get('/api/v1/auth/me');

                    set({
                        token: access_token,
                        user: userResponse.data,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } catch (error: any) {
                    set({
                        error: error.response?.data?.detail || 'Registration failed',
                        isLoading: false,
                    });
                    throw error;
                }
            },

            logout: () => {
                delete client.defaults.headers.common['Authorization'];
                set({
                    token: null,
                    user: null,
                    isAuthenticated: false,
                    error: null,
                });
            },

            clearError: () => set({ error: null }),
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                token: state.token,
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
            onRehydrateStorage: () => (state) => {
                // When the store is rehydrated from localStorage, set the Authorization header
                if (state?.token) {
                    client.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
                }
            },
        }
    )
);
