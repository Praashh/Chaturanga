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
