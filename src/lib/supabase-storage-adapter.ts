import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const SUPABASE_AUTH_KEY = 'sb-huxadvolwgfdjgsnraxm-auth-token';

/**
 * On native platforms, syncs Supabase auth tokens between localStorage and
 * Capacitor Preferences so the session survives app restarts / WebView clears.
 *
 * Call this BEFORE AuthProvider mounts so the session is already in
 * localStorage when supabase.auth.getSession() runs.
 */
export async function restoreNativeSession(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const localValue = localStorage.getItem(SUPABASE_AUTH_KEY);
  const { value: nativeValue } = await Preferences.get({ key: SUPABASE_AUTH_KEY });

  if (!localValue && nativeValue) {
    // App reopened, WebView cleared localStorage → restore from native
    localStorage.setItem(SUPABASE_AUTH_KEY, nativeValue);
  } else if (localValue && !nativeValue) {
    // First migration: copy existing localStorage token to native
    await Preferences.set({ key: SUPABASE_AUTH_KEY, value: localValue });
  } else if (localValue && nativeValue && localValue !== nativeValue) {
    // localStorage is more recent (Supabase just refreshed)
    await Preferences.set({ key: SUPABASE_AUTH_KEY, value: localValue });
  }
}

/**
 * Starts a MutationObserver-like watcher that mirrors every Supabase
 * localStorage write to Capacitor Preferences so they stay in sync.
 */
export function startNativeStorageSync(): void {
  if (!Capacitor.isNativePlatform()) return;

  // Override setItem / removeItem so every Supabase write is mirrored
  const originalSetItem = Storage.prototype.setItem;
  const originalRemoveItem = Storage.prototype.removeItem;

  Storage.prototype.setItem = function (key: string, value: string) {
    originalSetItem.call(this, key, value);
    if (key === SUPABASE_AUTH_KEY) {
      Preferences.set({ key, value }).catch(() => {});
    }
  };

  Storage.prototype.removeItem = function (key: string) {
    originalRemoveItem.call(this, key);
    if (key === SUPABASE_AUTH_KEY) {
      Preferences.remove({ key }).catch(() => {});
    }
  };
}
