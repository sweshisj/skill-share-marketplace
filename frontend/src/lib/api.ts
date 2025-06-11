import axios from 'axios';

// Ensure NEXT_PUBLIC_BACKEND_URL is set in your .env.local file
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add the JWT token
api.interceptors.request.use((config) => {
    // Only access localStorage in a client-side environment
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response interceptor to handle global errors like 401 Unauthorized
api.interceptors.response.use((response) => response, (error) => {
    if (error.response && error.response.status === 401) {
        // Clear token and redirect to login on 401
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
        }
    }
    return Promise.reject(error);
});

export default api;