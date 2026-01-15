import axios from 'axios';

// Netlify'da VITE_API_URL environment variable olarak tanımlanmalıdır.
// Varsayılan olarak localhost kullanılır.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
    baseURL: API_URL
});

export default api;
