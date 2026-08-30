import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { colors } from '../../constants/theme';

export default function AuthCallbackScreen() {
  const router = useRouter();

  useEffect(() => {
    let active = true;

    const completeAuth = async () => {
      try {
        const location = (globalThis as { location?: { href?: string } }).location;

        if (location?.href) {
          const url = new URL(location.href);
          const code = url.searchParams.get('code');
          const session = (await supabase.auth.getSession()).data.session;

          if (code) {
            await supabase.auth.exchangeCodeForSession(code);
          } else if (!session && url.hash) {
            const params = new URLSearchParams(url.hash.replace(/^#/, ''));
            const access_token = params.get('access_token');
            const refresh_token = params.get('refresh_token');
            if (access_token && refresh_token) {
              await supabase.auth.setSession({ access_token, refresh_token });
            }
          }
        }

        if (active) {
          const { data } = await supabase.auth.getSession();
          router.replace(data.session ? '/(tabs)/dashboard' : '/(auth)/login');
        }
      } catch {
        if (active) router.replace('/(auth)/login');
      }
    };

    completeAuth();

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}