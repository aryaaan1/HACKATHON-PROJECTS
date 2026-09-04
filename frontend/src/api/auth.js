import { apiPost } from './client';

// POST /api/auth/login -> { access_token, token_type, username, role }
export function login(username, password) {
  return apiPost('/api/auth/login', { username, password });
}
