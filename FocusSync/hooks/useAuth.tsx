import type { User as SupabaseUser } from "@supabase/supabase-js";
import * as AuthSession from "expo-auth-session";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { Platform } from "react-native";
import { supabase } from "../lib/supabase";
import { User } from "../types";

//Esto es necesario para la sesión de autenticación de Google y expo
WebBrowser.maybeCompleteAuthSession();

const REDIRECT_PATH = "auth/callback";

//Creamos la URI para redireccionar despues de la autenticación con google, es necesario paraque funcione el login con google
const googleRedirectUri = AuthSession.makeRedirectUri({
  scheme: "focussync",
  path: REDIRECT_PATH,
});

if (__DEV__) {
  console.log("Google redirect URI =>", googleRedirectUri);
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
  ) => Promise<{ requiresEmailConfirmation: boolean }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function toAppUser(sbUser: SupabaseUser | null): User | null {
  if (!sbUser) return null;
  const meta = sbUser.user_metadata ?? {};
  const name =
    typeof meta.name === "string" && meta.name
      ? meta.name
      : typeof meta.full_name === "string" && meta.full_name
        ? meta.full_name
        : (sbUser.email?.split("@")[0] ?? "Usuario");

  return { email: sbUser.email ?? "", name };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUser(toAppUser(data.session?.user ?? null));
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        setUser(toAppUser(session?.user ?? null));
        setLoading(false);
      },
    );

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    router.replace("/(tabs)/dashboard");
  };

  const register = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) throw error;

    if (data.session) {
      router.replace("/(tabs)/dashboard");
      return { requiresEmailConfirmation: false };
    }

    return { requiresEmailConfirmation: true };
  };

  const loginWithGoogle = async () => {
    if (Platform.OS === "web") {
      const location = (globalThis as { location?: { origin?: string } })
        .location;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${location?.origin ?? ""}/${REDIRECT_PATH}`,
        },
      });
      if (error) throw error;
      return;
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: googleRedirectUri,
        skipBrowserRedirect: true,
      },
    });
    if (error) throw error;
    if (!data.url)
      throw new Error("No se pudo obtener la URL de autenticación de Google");

    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      googleRedirectUri,
    );

    if (result.type !== "success" || !result.url) {
      throw new Error("Se canceló el inicio de sesión con Google");
    }

    const redirectUrl = new URL(result.url);
    const code = redirectUrl.searchParams.get("code");

    if (code) {
      const { error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) throw exchangeError;
    } else {
      const params = new URLSearchParams(redirectUrl.hash.replace(/^#/, ""));
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      if (!access_token || !refresh_token) {
        throw new Error("No se recibieron las credenciales de Google");
      }
      const { error: sessionError } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });
      if (sessionError) throw sessionError;
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    router.replace("/(auth)/login");
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, loginWithGoogle, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
