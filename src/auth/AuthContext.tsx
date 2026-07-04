import { createContext, useContext, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { loginWithGoogleIdToken } from '../api/authApi';
import { clearTokens, getAccessToken, setTokens } from './tokenStorage';

interface AuthContextValue {
  isAuthenticated: boolean;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getAccessToken()));

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      loginWithGoogle: async (idToken: string) => {
        const tokens = await loginWithGoogleIdToken(idToken);
        setTokens({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        });
        setIsAuthenticated(true);
      },
      logout: () => {
        clearTokens();
        setIsAuthenticated(false);
      },
    }),
    [isAuthenticated],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
