import axios from 'axios';

/**
 * Dynamically determines the API base URL.
 * - If VITE_API_URL is set in .env, use that (manual override).
 * - If running on localhost/127.0.0.1, use localhost:8000.
 * - Otherwise (e.g., mobile phone via WiFi), use the same host with port 8000.
 */
const getApiBaseUrl = (): string => {
    // Manual override from .env takes priority
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }

    const hostname = window.location.hostname;

    // Local development on desktop
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:8000';
    }

    // Mobile or other device accessing via network IP
    // Use the same IP as the frontend, just change port to 8000
    return `http://${hostname}:8000`;
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
