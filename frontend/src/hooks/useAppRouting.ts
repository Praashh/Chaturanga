import { useEffect, useCallback } from 'react';
import type { User } from '../types/auth';

interface UseAppRoutingProps {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
}

export function useAppRouting({ isAuthenticated, user, isLoading }: UseAppRoutingProps) {
  const navigate = useCallback((path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
  }, []);

  // Synchronize browser URL bar with auth/onboarding status without internal state adjustments
  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && user && !user.onboarded) {
      if (window.location.pathname !== '/onboard') {
        window.history.replaceState({}, '', '/onboard');
      }
    } else if (isAuthenticated && user?.onboarded) {
      if (window.location.pathname === '/onboard') {
        window.history.replaceState({}, '', '/');
      }
    } else if (!isAuthenticated) {
      if (window.location.pathname === '/onboard') {
        window.history.replaceState({}, '', '/');
      }
    }
  }, [isAuthenticated, user, isLoading]);

  return { navigate };
}
