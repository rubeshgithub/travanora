import { env } from './env.js';

// ── Token management (injected by auth store on load) ─────────────────────────

let _token: string | null = null;
let _onTokenRefreshed: ((token: string) => void) | null = null;
let _onSessionExpired: (() => void) | null = null;

export const apiClient = {
  setToken(token: string | null) {
    _token = token;
  },
  onTokenRefreshed(cb: (token: string) => void) {
    _onTokenRefreshed = cb;
  },
  onSessionExpired(cb: () => void) {
    _onSessionExpired = cb;
  },
};

// ── Error class ───────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: { fields?: Record<string, string>; [key: string]: unknown },
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ── Refresh-token deduplication ───────────────────────────────────────────────

let _refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = fetch(`${env.VITE_API_URL}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
    .then(async (res) => {
      if (!res.ok) return null;
      const data = (await res.json()) as { accessToken: string };
      _token = data.accessToken;
      _onTokenRefreshed?.(data.accessToken);
      return data.accessToken;
    })
    .catch(() => null)
    .finally(() => {
      _refreshPromise = null;
    });

  return _refreshPromise;
}

// ── Core request function ─────────────────────────────────────────────────────

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  isRetry = false,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (_token) {
    headers['Authorization'] = `Bearer ${_token}`;
  }

  const res = await fetch(`${env.VITE_API_URL}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Attempt one transparent token refresh on 401
  if (res.status === 401 && !isRetry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return request<T>(method, path, body, true);
    }
    _onSessionExpired?.();
    throw new ApiError(401, 'SESSION_EXPIRED', 'Your session has expired. Please sign in again.');
  }

  if (!res.ok) {
    type ErrorBody = { error?: { code?: string; message?: string; details?: { fields?: Record<string, string> } } };
    const data = await res.json().catch((): ErrorBody => ({})) as ErrorBody;
    throw new ApiError(
      res.status,
      data?.error?.code ?? 'API_ERROR',
      data?.error?.message ?? `Request failed with status ${res.status}`,
      data?.error?.details,
    );
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Public HTTP helpers ───────────────────────────────────────────────────────

export const api = {
  get<T>(path: string): Promise<T> {
    return request<T>('GET', path);
  },
  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>('POST', path, body);
  },
  patch<T>(path: string, body?: unknown): Promise<T> {
    return request<T>('PATCH', path, body);
  },
  delete<T>(path: string): Promise<T> {
    return request<T>('DELETE', path);
  },
};
