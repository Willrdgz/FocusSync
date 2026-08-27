import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getDisplayName = (session: Session | null) => {
  const authUser = session?.user;
  const metadataName = authUser?.user_metadata?.full_name || authUser?.user_metadata?.name;

  return metadataName || authUser?.email?.split('@')[0] || 'Estudiante';
};

const toAppUser = (session: Session | null): User | null => {
  if (!session?.user.email) {
    return null;
  }

  return {
    email: session.user.email,
    name: getDisplayName(session),
  };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!mounted) return;

        if (error) {
          setAuthError(error.message);
          setSession(null);
          return;
        }

        setAuthError(null);
        setSession(data.session);
      })
      .catch((error: unknown) => {
        if (!mounted) return;
        setAuthError(error instanceof Error ? error.message : 'No se pudo verificar la sesion.');
        setSession(null);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const user = useMemo(() => toAppUser(session), [session]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setAuthError(null);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setAuthError(error.message);
      throw error;
    }

    setAuthError(null);
    setSession(data.session);
    router.replace('/(tabs)/dashboard');
  };

  const loginWithGoogle = async () => {
    throw new Error('El inicio con Google requiere configurar OAuth en Supabase.');
  };

  const register = async (email: string, password: string, name: string) => {
    setLoading(true);
    setAuthError(null);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: name.trim(),
          name: name.trim(),
        },
      },
    });

    setLoading(false);

    if (error) {
      setAuthError(error.message);
      throw error;
    }

    setAuthError(null);
    setSession(data.session);

    if (data.session) {
      router.replace('/(tabs)/dashboard');
      return;
    }

    router.replace('/(auth)/login');
  };

  const logout = async () => {
    setLoading(true);
    setAuthError(null);
    const { error } = await supabase.auth.signOut();
    setLoading(false);

    if (error) {
      setAuthError(error.message);
      throw error;
    }

    setAuthError(null);
    setSession(null);
    router.replace('/(auth)/login');
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, authError, clearAuthError, login, loginWithGoogle, register, logout }}>
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
