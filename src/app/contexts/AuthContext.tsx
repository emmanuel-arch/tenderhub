import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, RegisterResponse, UserProfile } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ mustChangePassword?: boolean }>;
  register: (name: string, email: string, password: string, adminCode?: string) => Promise<RegisterResponse>;
  logout: () => void;
  refreshUser: (updated: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('auth_user');
    const token  = localStorage.getItem('auth_token');
    if (stored && token) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    localStorage.setItem('auth_token', res.token);
    localStorage.setItem('auth_user', JSON.stringify(res.user));
    setUser(res.user);
    return { mustChangePassword: res.user.mustChangePassword };
  };

  const refreshUser = (updated: UserProfile) => {
    localStorage.setItem('auth_user', JSON.stringify(updated));
    setUser(updated);
  };

  const register = async (name: string, email: string, password: string, adminCode?: string): Promise<RegisterResponse> => {
    const res = await authApi.register(name, email, password, adminCode);
    // Registration no longer auto-logs in — user must verify email first
    return res;
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
    window.location.replace('/');
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isAdmin: user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'superadmin',
      isSuperAdmin: user?.role?.toLowerCase() === 'superadmin',
      loading,
      login,
      register,
      logout,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
