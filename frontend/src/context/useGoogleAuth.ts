import { useState, useEffect, useCallback } from 'react';
import { fetchGoogleAuthConfig } from '../utils/auth-session';

interface GoogleCredentialResponse {
  credential?: string;
}

interface GooglePromptNotification {
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
  getNotDisplayedReason: () => string;
  getSkippedReason: () => string;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (callback?: (notification: GooglePromptNotification) => void) => void;
        };
      };
    };
  }
}

const API_BASE = ((import.meta.env.VITE_API_URL as string) || '').replace(/\/$/, '');

interface UseGoogleAuthProps {
  onLoginWithCredential: (credential: string) => Promise<boolean>;
}

export function useGoogleAuth({ onLoginWithCredential }: UseGoogleAuthProps) {
  const [googleClientId, setGoogleClientId] = useState<string>(() =>
    (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').replace(/^["']|["']$/g, '').trim()
  );

  // Fetch Google Client ID from backend if not present in env
  useEffect(() => {
    if (!googleClientId) {
      const controller = new AbortController();
      fetchGoogleAuthConfig(controller.signal)
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
            callback: (response: GoogleCredentialResponse) => {
              if (response.credential) {
                onLoginWithCredential(response.credential);
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
  }, [googleClientId, onLoginWithCredential]);

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
        window.google.accounts.id.prompt((notification: GooglePromptNotification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
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

  return { promptGoogleSignIn, googleClientId, setGoogleClientId };
}
