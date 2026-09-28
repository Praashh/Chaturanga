export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  onboarded: boolean;
  picture: string | null;
  rating: number;
  gamesPlayed: number;
  gamesWon: number;
}

export interface AuthResponse {
  success?: boolean;
  token?: string;
  user?: User;
  error?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithGoogleCredential: (credential: string) => Promise<boolean>;
  completeOnboarding: (username: string) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
  logout: () => void;
  promptGoogleSignIn: () => void;
  error: string | null;
}
