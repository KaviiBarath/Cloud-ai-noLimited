import { handleClientFallback } from './client-mock-data';

const BASE = (import.meta.env.VITE_API_URL || import.meta.env.BASE_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'freellmapi_dashboard_token';

// Dashboard session token (#35). Stored in localStorage; sent as a Bearer on
// every /api request and cleared on a 401.
export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function setToken(token: string): void {
  try { localStorage.setItem(TOKEN_KEY, token); } catch { /* ignore */ }
}
export function clearToken(): void {
  try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
}

export const UNAUTHORIZED_EVENT = 'freellmapi:unauthorized';

// Error thrown by apiFetch on a non-2xx response. Carries the HTTP status and
// the server's machine-readable `error.type` so callers can branch on them.
export interface ApiError extends Error {
  status?: number;
  code?: string;
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers = new Headers(options?.headers);
  const isFormData = typeof FormData !== 'undefined' && options?.body instanceof FormData;
  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const res = await fetch(`${BASE}${path}`, {
      ...options,
      headers,
    });

    if (res.ok) {
      if (res.status === 204) return undefined as T;
      const text = await res.text();
      try {
        return JSON.parse(text) as T;
      } catch {
        // Non-JSON response (e.g. Netlify/Vercel static SPA redirect returning index.html for /api/*)
        return handleClientFallback<T>(path, options);
      }
    }

    // Try parsing server JSON error
    const body = await res.json().catch(() => null);
    if (body && body.error) {
      if (res.status === 401 && body.error?.type === 'authentication_error') {
        clearToken();
        window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
      }
      const message = typeof body.error === 'string' ? body.error : body.error?.message;
      const err = new Error(message || `HTTP ${res.status}`) as ApiError;
      err.status = res.status;
      err.code = body.error?.type;
      throw err;
    }

    // 404 or other non-JSON response from static host
    return handleClientFallback<T>(path, options);
  } catch (err) {
    if (err instanceof Error && (err as ApiError).status) {
      throw err;
    }
    // Network failure (offline, backend down, or static deployment without backend)
    return handleClientFallback<T>(path, options);
  }
}

export async function logout(): Promise<void> {
  try { await apiFetch('/api/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
  clearToken();
  window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
}
