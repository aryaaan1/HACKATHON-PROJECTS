import { apiGet, apiPost } from './client';

// GET /api/locations
export function getLocations() {
  return apiGet('/api/locations');
}

// POST /api/warehouses — not implemented on the backend yet.
export function createWarehouse(payload) {
  return apiPost('/api/warehouses', payload);
}

// POST /api/rows — not implemented on the backend yet.
export function createRow(payload) {
  return apiPost('/api/rows', payload);
}

// POST /api/bins — not implemented on the backend yet.
export function createBin(payload) {
  return apiPost('/api/bins', payload);
}
