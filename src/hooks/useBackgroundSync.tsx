// Background sync stub — @capacitor/background-runner removed for Gen 1
// The plugin is incompatible with Capacitor 8 (missing .aar, Kotlin JVM target mismatch)
// Health Connect syncs when user opens the app instead
// Re-add background-runner when plugin is updated for Capacitor 8

export function useBackgroundSync() {
  return {
    isPluginLoaded: false,
    status: 'unavailable' as const,
    checkPermissions: async () => ({ notifications: 'denied' as const }),
    requestPermissions: async () => false,
    triggerSync: async () => false,
    setEnabled: (_enabled: boolean) => {},
    getTimeSinceLastSync: () => null,
  };
}