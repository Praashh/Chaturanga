import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { User, AuthResponse } from '../types/auth';
import { AuthContext } from './AuthContext';
import {
  getStoredSession,
  setStoredSession,
  clearStoredSession,
  fetchCurrentUser,
} from '../utils/auth-session';
import { useGoogleAuth } from './useGoogleAuth';

const API_BASE = (import.meta.env.VITE_API_URL as string).replace(/\/$/, '');

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const urlToken = new URLSearchParams(window.location.search).get('token');
      if (urlToken) {
        setStoredSession(urlToken);
        return urlToken;
      }
    }
    return getStoredSession();
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Authenticate with verified Google Credential
  const loginWithGoogleCredential = useCallback(async (credential: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/google`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });

      const data: AuthResponse = await res.json();
      if (res.ok && data.user) {
        if (data.token) {
          setStoredSession(data.token);
          setToken(data.token);
        }
        setUser(data.user);
        setIsLoading(false);
        return true;
      } else {
        const errorMsg = data.error || 'Authentication failed';
        setError(errorMsg);
        setIsLoading(false);
        return false;
      }
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(err.message || 'Failed to connect to authentication server');
      setIsLoading(false);
      return false;
    }
  }, []);

  const { promptGoogleSignIn } = useGoogleAuth({
    onLoginWithCredential: loginWithGoogleCredential,
  });

  // Logout (clears backend HttpOnly cookie and local storage)
  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Ignore network errors on logout
    }
    clearStoredSession();
    setToken(null);
    setUser(null);
    setError(null);
  }, []);

  // Restore session from cookie or stored token on mount (or URL ?token=...)
  useEffect(() => {
    let isMounted = true;

    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const urlToken = urlParams?.get('token');
    const effectiveToken = urlToken || getStoredSession();

    if (urlToken) {
      setStoredSession(urlToken);
      setToken(urlToken);
    }

    fetchCurrentUser(effectiveToken)
      .then(data => {
        if (!isMounted) return;
        if (data?.user) {
          setUser(data.user);
          const finalToken = data.token || effectiveToken;
          if (finalToken) {
            setStoredSession(finalToken);
            setToken(finalToken);
          }
          // Clean URL only after successful authentication
          if (urlToken && typeof window !== 'undefined') {
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
          }
        } else {
          clearStoredSession();
          setToken(null);
          setUser(null);
        }
      })
      .catch(err => {
        if (!isMounted) return;
        console.warn('Session verification notice:', err);
        // Only clear credentials if server explicitly rejected with 401
        if (err.message?.includes('401')) {
          clearStoredSession();
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Complete Onboarding by claiming chosen username
  const completeOnboarding = useCallback(
    async (username: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/onboard`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ username }),
        });

        const data = await res.json();
        if (res.ok && data.success && data.user) {
          if (data.token) {
            setStoredSession(data.token);
            setToken(data.token);
          }
          setUser(data.user);
          return { success: true };
        } else {
          return { success: false, error: data.error || 'Failed to complete profile' };
        }
      } catch (err: any) {
        return { success: false, error: err.message || 'Network error' };
      }
    },
    [token]
  );

  // Authoritatively re-fetch the logged-in user profile
  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data?.user) {
        setUser(data.user);
        if (data.token) {
          setStoredSession(data.token);
          setToken(data.token);
        }
      }
    } catch {
      // Ignore
    }
  }, [token]);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: !!user,
      isLoading,
      error,
      loginWithGoogleCredential,
      logout,
      promptGoogleSignIn,
      completeOnboarding,
      refreshUser,
    }),
    [
      user,
      token,
      isLoading,
      error,
      loginWithGoogleCredential,
      logout,
      promptGoogleSignIn,
      completeOnboarding,
      refreshUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
