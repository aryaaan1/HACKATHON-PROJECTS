import { apiGet } from './client';

// GET /api/dashboard
export function getDashboard() {
  return apiGet('/api/dashboard');
}
