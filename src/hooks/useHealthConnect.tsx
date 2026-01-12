import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

// Health Connect data types
export type HealthDataType = 
  | 'sleep_duration'
  | 'heart_rate'
  | 'hrv'
  | 'steps'
  | 'active_minutes'
  | 'calories'
  | 'phone_unlocks'
  | 'screen_time';

interface HealthData {
  dataType: HealthDataType;
  value: number;
  unit: string;
  recordedAt: Date;
}

export function useHealthConnect() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if Health Connect is available (Android only)
  const checkAvailability = useCallback(async (): Promise<boolean> => {
    // In a real implementation, this would check for the Health Connect API
    // For now, we'll simulate availability check
    if (typeof navigator !== 'undefined' && 'userAgent' in navigator) {
      const isAndroid = /android/i.test(navigator.userAgent);
      return isAndroid;
    }
    return false;
  }, []);

  // Request permissions for Health Connect
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    try {
      const isAvailable = await checkAvailability();
      
      if (!isAvailable) {
        toast.error('Health Connect no disponible', {
          description: 'Health Connect solo está disponible en dispositivos Android.'
        });
        return false;
      }

      // In a real implementation, this would open the Health Connect permissions dialog
      // For now, we'll simulate a successful permission grant
      toast.info('Health Connect', {
        description: 'Para conectar con Health Connect, necesitas instalar la app en tu dispositivo Android.'
      });
      
      setIsConnected(true);
      return true;
    } catch (error) {
      console.error('Error requesting Health Connect permissions:', error);
      toast.error('Error al conectar con Health Connect');
      return false;
    } finally {
      setLoading(false);
    }
  }, [checkAvailability]);

  // Sync health data from Health Connect
  const syncHealthData = useCallback(async (dataTypes: HealthDataType[]): Promise<HealthData[]> => {
    if (!user) {
      toast.error('Debes iniciar sesión para sincronizar datos');
      return [];
    }

    setLoading(true);
    try {
      // In a real implementation, this would fetch data from Health Connect API
      // For now, we'll generate sample data
      const sampleData: HealthData[] = dataTypes.map(type => ({
        dataType: type,
        value: getRandomValue(type),
        unit: getUnit(type),
        recordedAt: new Date(),
      }));

      // Save to database
      for (const data of sampleData) {
        await supabase.from('health_data').insert({
          user_id: user.id,
          data_type: data.dataType,
          value: data.value,
          unit: data.unit,
          recorded_at: data.recordedAt.toISOString(),
          source: 'health_connect',
        });
      }

      toast.success('Datos sincronizados', {
        description: `Se sincronizaron ${sampleData.length} métricas de salud.`
      });

      return sampleData;
    } catch (error) {
      console.error('Error syncing health data:', error);
      toast.error('Error al sincronizar datos de salud');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Get latest health data from database
  const getLatestHealthData = useCallback(async (dataType: HealthDataType): Promise<number | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('health_data')
        .select('value')
        .eq('user_id', user.id)
        .eq('data_type', dataType)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data?.value ?? null;
    } catch (error) {
      console.error('Error fetching health data:', error);
      return null;
    }
  }, [user]);

  // Get health data history
  const getHealthDataHistory = useCallback(async (
    dataType: HealthDataType,
    days: number = 7
  ): Promise<{ value: number; recordedAt: Date }[]> => {
    if (!user) return [];

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('health_data')
        .select('value, recorded_at')
        .eq('user_id', user.id)
        .eq('data_type', dataType)
        .gte('recorded_at', startDate.toISOString())
        .order('recorded_at', { ascending: true });

      if (error) throw error;

      return (data ?? []).map(d => ({
        value: Number(d.value),
        recordedAt: new Date(d.recorded_at),
      }));
    } catch (error) {
      console.error('Error fetching health data history:', error);
      return [];
    }
  }, [user]);

  return {
    isConnected,
    loading,
    checkAvailability,
    requestPermissions,
    syncHealthData,
    getLatestHealthData,
    getHealthDataHistory,
  };
}

// Helper functions
function getRandomValue(type: HealthDataType): number {
  switch (type) {
    case 'sleep_duration': return 6 + Math.random() * 3; // 6-9 hours
    case 'heart_rate': return 60 + Math.random() * 40; // 60-100 bpm
    case 'hrv': return 30 + Math.random() * 50; // 30-80 ms
    case 'steps': return 5000 + Math.random() * 10000; // 5000-15000 steps
    case 'active_minutes': return 20 + Math.random() * 100; // 20-120 min
    case 'calories': return 1500 + Math.random() * 1500; // 1500-3000 kcal
    case 'phone_unlocks': return 30 + Math.random() * 100; // 30-130 unlocks
    case 'screen_time': return 2 + Math.random() * 8; // 2-10 hours
    default: return 0;
  }
}

function getUnit(type: HealthDataType): string {
  switch (type) {
    case 'sleep_duration': return 'hours';
    case 'heart_rate': return 'bpm';
    case 'hrv': return 'ms';
    case 'steps': return 'steps';
    case 'active_minutes': return 'min';
    case 'calories': return 'kcal';
    case 'phone_unlocks': return 'unlocks';
    case 'screen_time': return 'hours';
    default: return '';
  }
}
