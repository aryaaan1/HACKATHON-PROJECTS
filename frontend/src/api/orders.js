import { apiGet, apiPost } from './client';

// GET /api/orders/{order_number}
export function getOrder(orderNumber) {
  return apiGet(`/api/orders/${encodeURIComponent(orderNumber)}`);
}

// POST /api/orders — not implemented on the backend yet.
export function createOrder(payload) {
  return apiPost('/api/orders', payload);
}
