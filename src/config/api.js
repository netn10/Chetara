// API configuration that works in both development and production
const API_BASE_URL = import.meta.env.PROD
  ? '/api'  // In production (Heroku), use relative URLs
  : 'http://localhost:5000/api';  // In development, use localhost

export default API_BASE_URL;
