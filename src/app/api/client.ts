import { API_BASE_URL } from './config';
import { ensureAccessToken, refreshAccessToken } from './auth';

type RequestOptions = RequestInit & {
  auth?: boolean;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, headers, ...rest } = options;
  const requestHeaders = new Headers(headers || {});

  if (auth) {
    const token = await ensureAccessToken();
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  const isFormData = rest.body instanceof FormData;
  if (!isFormData && rest.body && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: requestHeaders,
  });

  if (response.status === 401 && auth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      requestHeaders.set('Authorization', `Bearer ${refreshed}`);
      const retry = await fetch(`${API_BASE_URL}${path}`, {
        ...rest,
        headers: requestHeaders,
      });
      return parseResponse<T>(retry);
    }
  }

  return parseResponse<T>(response);
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.error || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}
