import axios from 'axios';

// Vercel veya Netlify gibi ortamlarda frontend ve backend aynı domain altında olacağı için 
// production'da '/api' kullanmak yeterlidir. Yerelde ise 5000 portuna gider.
export const API_URL = import.meta.env.PROD
    ? '/api'
    : (import.meta.env.VITE_API_URL || 'http://localhost:5000/api');

const api = axios.create({
    baseURL: API_URL
});

export default api;
