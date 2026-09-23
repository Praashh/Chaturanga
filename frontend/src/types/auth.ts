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
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
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
  logout: () => void;
  promptGoogleSignIn: () => void;
  error: string | null;
}
