import { API_BASE_URL } from '../config';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
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
