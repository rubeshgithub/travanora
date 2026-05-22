import { env } from './env.js';
// ── Token management (injected by auth store on load) ─────────────────────────
let _token = null;
let _onTokenRefreshed = null;
let _onSessionExpired = null;
export const apiClient = {
    setToken(token) {
        _token = token;
    },
    onTokenRefreshed(cb) {
        _onTokenRefreshed = cb;
    },
    onSessionExpired(cb) {
        _onSessionExpired = cb;
    },
};
// ── Error class ───────────────────────────────────────────────────────────────
export class ApiError extends Error {
    status;
    code;
    details;
    constructor(status, code, message, details) {
        super(message);
        this.status = status;
        this.code = code;
        this.details = details;
        this.name = 'ApiError';
    }
}
// ── Refresh-token deduplication ───────────────────────────────────────────────
let _refreshPromise = null;
async function refreshAccessToken() {
    if (_refreshPromise)
        return _refreshPromise;
    _refreshPromise = fetch(`${env.VITE_API_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
    })
        .then(async (res) => {
        if (!res.ok)
            return null;
        const data = (await res.json());
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
async function request(method, path, body, isRetry = false) {
    const headers = {
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
            return request(method, path, body, true);
        }
        _onSessionExpired?.();
        throw new ApiError(401, 'SESSION_EXPIRED', 'Your session has expired. Please sign in again.');
    }
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new ApiError(res.status, data?.error?.code ?? 'API_ERROR', data?.error?.message ?? `Request failed with status ${res.status}`, data?.error?.details);
    }
    // 204 No Content
    if (res.status === 204)
        return undefined;
    return res.json();
}
// ── Public HTTP helpers ───────────────────────────────────────────────────────
export const api = {
    get(path) {
        return request('GET', path);
    },
    post(path, body) {
        return request('POST', path, body);
    },
    patch(path, body) {
        return request('PATCH', path, body);
    },
    delete(path) {
        return request('DELETE', path);
    },
};
//# sourceMappingURL=api.js.map