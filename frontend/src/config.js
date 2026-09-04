// Central place for frontend configuration.
// Override by creating a .env file with VITE_API_BASE_URL=http://your-host:port
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
