import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, AuthContextType, AuthResponse } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'chaturanga_session_token';
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

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
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });

      const data: AuthResponse = await res.json();
      if (res.ok && data.token && data.user) {
        localStorage.setItem(TOKEN_KEY, data.token);
        setToken(data.token);
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

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setError(null);
  }, []);

  // Fetch Google Client ID from backend if not present in env
  useEffect(() => {
    if (!googleClientId) {
      fetch(`${API_BASE}/api/auth/config`)
        .then(res => res.json())
        .then(data => {
          if (data?.googleClientId) {
            setGoogleClientId(String(data.googleClientId).replace(/^["']|["']$/g, '').trim());
          }
        })
        .catch(() => {
          // Ignore if offline
        });
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

  // Restore session from token on mount (or URL ?token=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    let activeToken = token;

    if (urlToken) {
      localStorage.setItem(TOKEN_KEY, urlToken);
      setToken(urlToken);
      activeToken = urlToken;
      // Clean query params from URL without reload
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }

    if (!activeToken) {
      setIsLoading(false);
      return;
    }

    fetch(`${API_BASE}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${activeToken}`,
      },
    })
      .then(res => {
        if (!res.ok) throw new Error('Session expired');
        return res.json();
      })
      .then(data => {
        if (data?.user) {
          setUser(data.user);
        } else {
          logout();
        }
      })
      .catch(() => {
        logout();
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token, logout]);

  // Complete Onboarding by claiming chosen username
  const completeOnboarding = useCallback(
    async (username: string): Promise<{ success: boolean; error?: string }> => {
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      try {
        const res = await fetch(`${API_BASE}/api/auth/onboard`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ username }),
        });

        const data = await res.json();
        if (res.ok && data.success && data.user) {
          if (data.token) {
            localStorage.setItem(TOKEN_KEY, data.token);
            setToken(data.token);
          }
          setUser(data.user);
          return { success: true };
        } else {
          return { success: false, error: data.error || 'Failed to complete onboarding' };
        }
      } catch (err: any) {
        return { success: false, error: err.message || 'Network error completing onboarding' };
      }
    },
    [token]
  );

  // Refresh user data from backend
  const refreshUser = useCallback(async (): Promise<void> => {
    const activeToken = token || localStorage.getItem(TOKEN_KEY);
    if (!activeToken) return;

    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${activeToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.user) {
          setUser(data.user);
        }
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  }, [token]);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    loginWithGoogleCredential,
    completeOnboarding,
    refreshUser,
    logout,
    promptGoogleSignIn,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
