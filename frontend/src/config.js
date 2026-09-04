// Central place for frontend configuration.
// Override by creating a .env file with VITE_API_BASE_URL=http://your-host:port
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// sessionStorage (not localStorage) so login persists across a page refresh
// but clears when the browser/tab is closed, per the "current session" requirement.
export const AUTH_TOKEN_STORAGE_KEY = 'warehouse_auth_token';
export const AUTH_USER_STORAGE_KEY = 'warehouse_auth_user';
