import { useEffect, useCallback, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface BackgroundSyncStatus {
  isEnabled: boolean;
  lastSync: Date | null;
  nextSync: Date | null;
}

// Dynamic import for Background Runner (only available on native)
let BackgroundRunner: typeof import('@capacitor/background-runner').BackgroundRunner | null = null;

async function loadBackgroundRunner(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      const module = await import('@capacitor/background-runner');
      BackgroundRunner = module.BackgroundRunner;
      return true;
    } catch (error) {
      console.error('Failed to load Background Runner:', error);
      return false;
    }
  }
  return false;
}

const LAST_SYNC_KEY = 'healthConnect_lastSync';
const SYNC_ENABLED_KEY = 'healthConnect_syncEnabled';

export function useBackgroundSync() {
  const { user } = useAuth();
  const [isPluginLoaded, setIsPluginLoaded] = useState(false);
  const [status, setStatus] = useState<BackgroundSyncStatus>({
    isEnabled: false,
    lastSync: null,
    nextSync: null,
  });

  // Load plugin on mount
  useEffect(() => {
    const init = async () => {
      const loaded = await loadBackgroundRunner();
      setIsPluginLoaded(loaded);
      
      // Load saved status
      const savedEnabled = localStorage.getItem(SYNC_ENABLED_KEY);
      const savedLastSync = localStorage.getItem(LAST_SYNC_KEY);
      
      setStatus(prev => ({
        ...prev,
        isEnabled: savedEnabled === 'true',
        lastSync: savedLastSync ? new Date(savedLastSync) : null,
        nextSync: savedLastSync ? new Date(new Date(savedLastSync).getTime() + 60 * 60 * 1000) : null,
      }));
    };
    init();
  }, []);

  // Check and request permissions
  const checkPermissions = useCallback(async () => {
    if (!BackgroundRunner) return { notifications: 'denied' as const };
    
    try {
      const result = await BackgroundRunner.checkPermissions();
      return result;
    } catch (error) {
      console.error('Error checking background runner permissions:', error);
      return { notifications: 'denied' as const };
    }
  }, []);

  const requestPermissions = useCallback(async () => {
    if (!BackgroundRunner) return false;
    
    try {
      const result = await BackgroundRunner.requestPermissions({
        apis: ['notifications'],
      });
      return result.notifications === 'granted';
    } catch (error) {
      console.error('Error requesting background runner permissions:', error);
      return false;
    }
  }, []);

  // Manually trigger a sync event
  const triggerSync = useCallback(async () => {
    if (!BackgroundRunner || !user) {
      console.log('Background sync not available or user not logged in');
      return false;
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const result = await BackgroundRunner.dispatchEvent({
        label: 'app.lovable.vitalium.background',
        event: 'syncHealthData',
        details: {
          supabaseUrl,
          supabaseKey,
          userId: user.id,
        },
      });

      console.log('Background sync triggered:', result);
      
      const now = new Date();
      localStorage.setItem(LAST_SYNC_KEY, now.toISOString());
      
      setStatus(prev => ({
        ...prev,
        lastSync: now,
        nextSync: new Date(now.getTime() + 60 * 60 * 1000),
      }));

      toast.success('Sincronización iniciada', {
        description: 'Los datos se están sincronizando en segundo plano.',
      });

      return true;
    } catch (error) {
      console.error('Error triggering background sync:', error);
      toast.error('Error al sincronizar', {
        description: 'No se pudo iniciar la sincronización en segundo plano.',
      });
      return false;
    }
  }, [user]);

  // Enable/disable background sync
  const setEnabled = useCallback((enabled: boolean) => {
    localStorage.setItem(SYNC_ENABLED_KEY, String(enabled));
    setStatus(prev => ({ ...prev, isEnabled: enabled }));
    
    if (enabled) {
      toast.success('Sincronización automática activada', {
        description: 'Los datos se sincronizarán cada hora.',
      });
    } else {
      toast.info('Sincronización automática desactivada');
    }
  }, []);

  // Get formatted time since last sync
  const getTimeSinceLastSync = useCallback(() => {
    if (!status.lastSync) return 'Nunca';
    
    const now = new Date();
    const diff = now.getTime() - status.lastSync.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    } else {
      return 'Hace un momento';
    }
  }, [status.lastSync]);

  return {
    isPluginLoaded,
    status,
    checkPermissions,
    requestPermissions,
    triggerSync,
    setEnabled,
    getTimeSinceLastSync,
  };
}
