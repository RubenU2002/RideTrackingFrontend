import { API_BASE_URL } from '@/core/config/env';
import { getToken } from '@/core/auth/tokenStorage';
import type {
  ApiErrorBody,
  ApiSuccess,
  LoginData,
  ProfileData,
  RegisterData,
} from '@/core/api/types';
import { ApiError } from '@/core/api/types';
import { createLogger } from '../utils/logger';

const log = createLogger('API');

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
  const bodySent = options.body ? JSON.parse(options.body.toString()) : undefined;
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const body = json as Partial<ApiErrorBody>;
    let message = (body && (body.message as string)) || `HTTP ${res.status}`;
    log.error('body sent', bodySent);
    if (res.status === 500) {
      log.error('Internal server error', { path, method: options.method, body });
      message = 'Ha ocurrido un error. Por favor, inténtalo de nuevo más tarde.';
    }
    throw new ApiError(message, res.status, body as ApiErrorBody);
  }

  return json as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiSuccess<LoginData>>('/api/v1/auth/login', { email, password }),
  profile: () => api.get<ApiSuccess<ProfileData>>('/api/v1/auth/profile'),
  register: (name: string, email: string, phone: string, password: string) =>
    api.post<ApiSuccess<RegisterData>>('/api/v1/auth/register', { name, email, phone, password }),
};
