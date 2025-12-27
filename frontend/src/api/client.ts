import axios from 'axios';

const client = axios.create({
    baseURL: 'http://localhost:8000',
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
