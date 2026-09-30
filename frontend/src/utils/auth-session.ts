const SESSION_KEY = 'chaturanga_user_session';

export function getStoredSession(): string | null {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem(SESSION_KEY) : null;
  } catch {
    return null;
  }
}

export function setStoredSession(token: string): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_KEY, token);
    }
  } catch {
    // Ignore storage quota or security errors in iframe/private browsing
  }
}

export function clearStoredSession(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_KEY);
    }
  } catch {
    // Ignore
  }
}

const API_BASE = ((import.meta.env.VITE_API_URL as string) || '').replace(/\/$/, '');

export async function fetchCurrentUser(token: string | null) {
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchGoogleAuthConfig(signal?: AbortSignal) {
  const res = await fetch(`${API_BASE}/api/auth/config`, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function pingBackendHealth(): Promise<Response> {
  return fetch(`${API_BASE}/api/health`, { method: 'GET' });
}
