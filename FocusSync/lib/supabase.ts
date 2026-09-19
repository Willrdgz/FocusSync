import 'react-native-url-polyfill/auto';
import 'expo-sqlite/localStorage/install';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

if (!isSupabaseConfigured) {
  console.warn('Supabase credentials are missing. Create a .env file from .env.example.');
}

export const supabase = createClient(supabaseUrl ?? '', supabasePublishableKey ?? '', {
  auth: {
    storage: (globalThis as typeof globalThis & { localStorage: any }).localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
