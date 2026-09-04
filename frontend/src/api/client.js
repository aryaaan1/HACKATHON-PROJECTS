import { API_BASE_URL, AUTH_TOKEN_STORAGE_KEY } from '../config';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(path, options = {}) {
  const token = sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      'Could not reach the backend server. Is it running?',
      0
    );
  }

  let body = null;
  const text = await response.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }

  if (response.status === 401) {
    // Let AuthContext clear the stored session and redirect to /login —
    // it's the only place that knows how to do that safely from here.
    window.dispatchEvent(new Event('auth:unauthorized'));
  }

  if (!response.ok) {
    const detail =
      (body && (body.detail || body.error || body.message)) ||
      `Request failed with status ${response.status}`;
    throw new ApiError(detail, response.status);
  }

  if (body && typeof body === 'object' && 'error' in body && Object.keys(body).length === 1) {
    throw new ApiError(body.error, response.status);
  }

  return body;
}

export function apiGet(path) {
  return request(path, { method: 'GET' });
}

export function apiPost(path, data) {
  return request(path, { method: 'POST', body: JSON.stringify(data) });
}
