import axios from 'axios';

/**
 * Resolves API base URL with production-safe defaults.
 * - `VITE_API_URL` has highest priority (manual override).
 * - In development, fall back to `http://<host>:8000`.
 * - In production, default to same-origin to avoid mixed-content issues.
 */
const getApiBaseUrl = (): string => {
    const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
    if (configuredApiUrl) {
        return configuredApiUrl.replace(/\/+$/, '');
    }

    const { hostname, origin } = window.location;

    if (import.meta.env.DEV) {
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:8000';
        }
        return `http://${hostname}:8000`;
    }

    return origin.replace(/\/+$/, '');
};

const client = axios.create({
    baseURL: getApiBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
});

// Response interceptor to handle 401 errors
client.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid - logout user
            // Dynamic import to avoid circular dependency
            const { useAuthStore } = await import('../store/authStore');
            useAuthStore.getState().logout();
        }
        return Promise.reject(error);
    }
);

export { client };
export default client;
