import { createContext, useContext, ReactNode, useMemo } from 'react';
import { authClient } from '../lib/auth-client';

interface User {
  id: string;
  name: string | null;
  email: string;
  image?: string | null;
  emailVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();

  const login = async (email: string, password: string) => {
    const result = await authClient.signIn.email({
      email,
      password,
    });
    
    if (result.error) {
      throw new Error(result.error.message);
    }
  };

  const loginWithGoogle = async () => {
    await authClient.signIn.social({
      provider: 'google',
    });
  };

  const logout = async () => {
    await authClient.signOut();
  };

  const value = useMemo(() => ({
    user: session?.user || null,
    loading: isPending,
    login,
    loginWithGoogle,
    logout,
  }), [session, isPending]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
