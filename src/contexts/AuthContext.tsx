import React, { createContext, useState, useContext, useEffect } from 'react';
import { login as loginApi } from '../api/client';

interface AuthContextType {
  user: { username: string } | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      // Optionally decode token to get username
      setUser({ username: 'admin' });
    }
    setIsLoading(false);
  }, [token]);

  const login = async (username: string, password: string) => {
    const res = await loginApi(username, password);
    localStorage.setItem('access_token', res.data.access);
    localStorage.setItem('refresh_token', res.data.refresh);
    setToken(res.data.access);
    setUser({ username });
  };

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};