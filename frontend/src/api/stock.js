import { apiGet, apiPost } from './client';

// POST /api/stock/inward
export function stockInward(payload) {
  return apiPost('/api/stock/inward', payload);
}

// POST /api/stock/outward
export function stockOutward(payload) {
  return apiPost('/api/stock/outward', payload);
}

// POST /api/stock/transfer
export function stockTransfer(payload) {
  return apiPost('/api/stock/transfer', payload);
}

// GET /api/stock/movements
export function getMovements() {
  return apiGet('/api/stock/movements');
}

// GET /api/low-stock
export function getLowStock() {
  return apiGet('/api/low-stock');
}
