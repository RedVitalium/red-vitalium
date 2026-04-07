import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Hybrid storage: tries Capacitor Preferences first, falls back to localStorage
const store: Record<string, string> = {};
let prefsReady = false;

// Hydrate from Preferences on startup
(async () => {
  try {
    const { Preferences } = await import('@capacitor/preferences');
    const { keys } = await Preferences.keys();
    for (const key of keys) {
      const { value } = await Preferences.get({ key });
      if (value) store[key] = value;
    }
    prefsReady = true;
  } catch {
    // Not native or Preferences not available — use localStorage
    prefsReady = false;
  }
})();

const persistentStorage = {
  getItem(key: string): string | null {
    // Check memory store first (hydrated from Preferences)
    if (store[key]) return store[key];
    // Fallback to localStorage
    try { return localStorage.getItem(key); } catch { return null; }
  },
  setItem(key: string, value: string): void {
    store[key] = value;
    // Save to both localStorage and Preferences
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

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: persistentStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});