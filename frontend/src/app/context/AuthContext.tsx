import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { authApi } from '../services/api';
import type { User } from '../data/types';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('sf_token'),
    loading: !!localStorage.getItem('sf_token'), // only loading if we have a stored token
  });

  // Fetch user profile from /auth/me
  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('sf_token');
    if (!token) {
      setState({ user: null, token: null, loading: false });
      return;
    }
    try {
      const user = await authApi.me();
      setState({ user, token, loading: false });
    } catch {
      // Token invalid/expired
      localStorage.removeItem('sf_token');
      setState({ user: null, token: null, loading: false });
    }
  }, []);

  // On mount, hydrate user from stored token
  useEffect(() => {
    if (state.token) {
      refreshUser();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (email: string, password: string) => {
    const { access_token } = await authApi.login(email, password);
    localStorage.setItem('sf_token', access_token);
    setState((s) => ({ ...s, token: access_token }));
    // Fetch user profile
    const user = await authApi.me();
    setState({ user, token: access_token, loading: false });
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const { access_token } = await authApi.register(name, email, password);
      localStorage.setItem('sf_token', access_token);
      setState((s) => ({ ...s, token: access_token }));
      const user = await authApi.me();
      setState({ user, token: access_token, loading: false });
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem('sf_token');
    setState({ user: null, token: null, loading: false });
  }, []);

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
