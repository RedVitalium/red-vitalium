import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = 'https://huxadvolwgfdjgsnraxm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1eGFkdm9sd2dmZGpnc25yYXhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NzcwMTQsImV4cCI6MjA5MTI1MzAxNH0.wIlcSFSo78F3aVT5vOl8LG6uu2f8tmx2guvHX1blFaE';

// Hybrid storage: tries Capacitor Preferences first, falls back to localStorage
const store: Record<string, string> = {};

(async () => {
  try {
    const { Preferences } = await import('@capacitor/preferences');
    const { keys } = await Preferences.keys();
    for (const key of keys) {
      const { value } = await Preferences.get({ key });
      if (value) store[key] = value;
    }
  } catch {
    // Not native or Preferences not available
  }
})();

const persistentStorage = {
  getItem(key: string): string | null {
    if (store[key]) return store[key];
    try { return localStorage.getItem(key); } catch { return null; }
  },
  setItem(key: string, value: string): void {
    store[key] = value;
    try { localStorage.setItem(key, value); } catch {}
    import('@capacitor/preferences').then(({ Preferences }) => {
      Preferences.set({ key, value });
    }).catch(() => {});
  },
  removeItem(key: string): void {
    delete store[key];
    try { localStorage.removeItem(key); } catch {}
    import('@capacitor/preferences').then(({ Preferences }) => {
      Preferences.remove({ key });
    }).catch(() => {});
  },
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: persistentStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
