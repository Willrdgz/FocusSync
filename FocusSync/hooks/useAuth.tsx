import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { router } from 'expo-router';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = null;
    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const newUser: User = { email, name: email.split('@')[0] };
    setUser(newUser);
    setLoading(false);
    router.replace('/(tabs)/dashboard');
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const newUser: User = { email: 'usuario@gmail.com', name: 'Usuario Google' };
    setUser(newUser);
    setLoading(false);
    router.replace('/(tabs)/dashboard');
  };

  const register = async (email: string, password: string, name: string) => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const newUser: User = { email, name: name.trim() || email.split('@')[0] };
    setUser(newUser);
    setLoading(false);
    router.replace('/(tabs)/dashboard');
  };

  const logout = () => {
    setUser(null);
    router.replace('/(auth)/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
