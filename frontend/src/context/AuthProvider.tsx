import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { User, AuthResponse } from '../types/auth';
import { AuthContext } from './AuthContext';
import { getStoredSession, setStoredSession, clearStoredSession } from '../utils/auth-session';

const API_BASE = (import.meta.env.VITE_API_URL as string).replace(/\/$/, '');

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (notification?: (notification: any) => void) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: number;
            }
          ) => void;
          revoke?: (hint: string, done: () => void) => void;
        };
      };
    };
  }
}

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
  const [googleClientId, setGoogleClientId] = useState<string>(() =>
    (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').replace(/^["']|["']$/g, '').trim()
  );

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

  // Fetch Google Client ID from backend if not present in env
  useEffect(() => {
    if (!googleClientId) {
      const controller = new AbortController();
      fetch(`${API_BASE}/api/auth/config`, { signal: controller.signal })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (data?.googleClientId) {
            setGoogleClientId(String(data.googleClientId).replace(/^["']|["']$/g, '').trim());
          }
        })
        .catch(() => {
          // Ignore if offline
        });
      return () => controller.abort();
    }
  }, [googleClientId]);

  // Initialize Google Identity Services
  useEffect(() => {
    const cleanId = googleClientId.replace(/^["']|["']$/g, '').trim();
    if (!cleanId) return;

    const checkGoogleInterval = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(checkGoogleInterval);
        try {
          window.google.accounts.id.initialize({
            client_id: cleanId,
            callback: response => {
              if (response.credential) {
                loginWithGoogleCredential(response.credential);
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });
        } catch (e) {
          console.warn('Google Identity Services initialization warning:', e);
        }
      }
    }, 200);

    return () => clearInterval(checkGoogleInterval);
  }, [googleClientId, loginWithGoogleCredential]);

  // Prompt Google Sign-In with direct OAuth fallback
  const promptGoogleSignIn = useCallback(() => {
    const cleanId = (googleClientId || import.meta.env.VITE_GOOGLE_CLIENT_ID || '')
      .replace(/^["']|["']$/g, '')
      .trim();

    const openOAuthRedirect = () => {
      if (!cleanId) {
        console.warn('Google Client ID is missing, unable to redirect to Google Sign-In');
        return;
      }
      const redirectUri = `${API_BASE}/api/auth/google/callback`;
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
        cleanId
      )}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=code&scope=openid%20profile%20email&prompt=select_account`;
      window.location.href = authUrl;
    };

    if (window.google?.accounts?.id && cleanId) {
      try {
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.log(
              'Google prompt not displayed, falling back to OAuth redirect:',
              notification.getNotDisplayedReason()
            );
            openOAuthRedirect();
          }
        });
      } catch (err) {
        console.warn('Google prompt failed, falling back to OAuth redirect:', err);
        openOAuthRedirect();
      }
    } else {
      openOAuthRedirect();
    }
  }, [googleClientId]);

  // Restore session from cookie or stored token on mount (or URL ?token=...)
  useEffect(() => {
    let isMounted = true;

    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const urlToken = urlParams?.get('token');
    const effectiveToken = urlToken || token || getStoredSession();

    if (urlToken) {
      setStoredSession(urlToken);
      setToken(urlToken);
    }

    fetch(`${API_BASE}/api/auth/me`, {
      credentials: 'include',
      headers: effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {},
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
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
