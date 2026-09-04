import { apiGet, apiPost } from './client';

// GET /api/products?search=
export function searchProducts(search = '') {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiGet(`/api/products${query}`);
}

// GET /api/products/{id}
export function getProduct(id) {
  return apiGet(`/api/products/${id}`);
}

// POST /api/products — not implemented on the backend yet.
// Kept here so the Admin "Add Product" form has a real call to make
// the moment this endpoint exists.
export function createProduct(payload) {
  return apiPost('/api/products', payload);
}
