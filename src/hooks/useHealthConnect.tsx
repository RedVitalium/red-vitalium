import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/custom-client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';

// Health data types we track
export type HealthDataType =
  | 'sleep_duration'
  | 'sleep_deep'
  | 'sleep_light'
  | 'sleep_rem'
  | 'sleep_awake'
  | 'sleep_score'
  | 'sleep_spo2'
  | 'activity_duration'
  | 'activity_zone_fat_burn'
  | 'activity_zone_cardio'
  | 'activity_zone_peak'
  | 'activity_type'
  | 'steps'
  | 'heart_rate'
  | 'resting_heart_rate'
  | 'hrv'
  | 'spo2'
  | 'stress'
  | 'vo2_max'
  | 'active_minutes'
  | 'calories'
  | 'phone_unlocks'
  | 'screen_time'
  | 'weight'
  | 'body_fat';

export interface SleepSession {
  startTime: Date;
  endTime: Date;
  totalDuration: number;
  deepSleep: number;
  lightSleep: number;
  remSleep: number;
  awake: number;
  sleepScore: number;
}

export interface HealthData {
  dataType: HealthDataType;
  value: number;
  unit: string;
  recordedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface DailyHealthSummary {
  date: Date;
  sleep?: SleepSession;
  vitals: { averageHR: number; averageRHR: number; averageHRV: number; averageSpO2: number; averageStress: number };
  activity: { totalSteps: number; totalCalories: number; activeMinutes: number; };
}

// Lazy load the Health plugin
let Health: any = null;

async function loadHealthPlugin(): Promise<boolean> {
  if (Health) return true;
  try {
    const module = await import('@capgo/capacitor-health');
    Health = module.Health;
    return true;
  } catch (e) {
    console.log('Failed to load @capgo/capacitor-health:', e);
    return false;
  }
}

function getUnit(dataType: HealthDataType): string {
  switch (dataType) {
    case 'sleep_duration': return 'hours';
    case 'sleep_deep':
    case 'sleep_light':
    case 'sleep_rem':
    case 'sleep_awake': return 'min';
    case 'sleep_score': return 'score';
    case 'sleep_spo2': return '%';
    case 'activity_duration': return 'min';
    case 'activity_zone_fat_burn':
    case 'activity_zone_cardio':
    case 'activity_zone_peak': return 'min';
    case 'steps': return 'steps';
    case 'heart_rate':
    case 'resting_heart_rate': return 'bpm';
    case 'hrv': return 'ms';
    case 'spo2': return '%';
    case 'stress': return 'level';
    case 'vo2_max': return 'ml/kg/min';
    case 'calories': return 'kcal';
    case 'weight': return 'kg';
    case 'body_fat': return '%';
    default: return '';
  }
}

export function useHealthConnect() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isPluginLoaded, setIsPluginLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const isNative = Capacitor.isNativePlatform();

  // Check availability on mount
  useEffect(() => {
    if (!isNative) return;
    const init = async () => {
      const loaded = await loadHealthPlugin();
      setIsPluginLoaded(loaded);
      if (loaded) {
        try {
          const result = await Health.isAvailable();
          setIsAvailable(result.available);
          console.log('Health plugin available:', result.available);
        } catch (e) {
          console.log('Health availability check failed:', e);
          setIsAvailable(false);
        }
      }
    };
    init();
  }, [isNative]);

  // Check availability
  const checkAvailability = useCallback(async (): Promise<boolean> => {
    if (!isNative || !Health) return false;
    try {
      const result = await Health.isAvailable();
      setIsAvailable(result.available);
      return result.available;
    } catch {
      return false;
    }
  }, [isNative]);

  // Request permissions
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (!isNative) {
      toast.error('Solo disponible en la app nativa');
      return false;
    }

    const loaded = await loadHealthPlugin();
    if (!loaded || !Health) {
      toast.error('Plugin de salud no disponible');
      return false;
    }

    const available = await checkAvailability();
    if (!available) {
      toast.error('Health Connect no instalado', {
        description: 'Por favor, instala Health Connect desde Play Store.'
      });
      return false;
    }

    try {
      await Health.requestAuthorization({
        read: [
          'steps',
          'calories',
          'heartRate',
          'restingHeartRate',
          'heartRateVariability',
          'oxygenSaturation',
          'weight',
          'bodyFat',
          'sleep',
        ],
        write: []
      });
      
      setIsConnected(true);
      toast.success('Health Connect conectado');
      console.log('Health permissions granted');
      return true;
    } catch (e) {
      console.error('Permission request failed:', e);
      toast.error('No se pudieron obtener permisos');
      return false;
    }
  }, [isNative, checkAvailability]);

  // Sync health data
  const syncHealthData = useCallback(async (dataTypes: HealthDataType[]): Promise<HealthData[]> => {
    if (!user) {
      toast.error('Debes iniciar sesión para sincronizar datos');
      return [];
    }

    if (!isNative || !Health || !isPluginLoaded || !isAvailable) {
      return [];
    }

    setLoading(true);
    const syncedData: HealthData[] = [];

    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
      const yesterday = new Date(startOfDay.getTime() - 86400000);
      
      // Check if this is first sync (no data in DB yet)
      const { count } = await supabase
        .from('health_data')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('source', 'health_connect');
      
      const isFirstSync = !count || count < 5;
      const thirtyDaysAgo = new Date(startOfDay.getTime() - 30 * 86400000);
      const historicStart = isFirstSync ? thirtyDaysAgo : yesterday;
      
      console.log(`SYNC: isFirstSync=${isFirstSync}, range=${isFirstSync ? '30 days' : 'yesterday'}`);

      for (const dataType of dataTypes) {
        try {
          let value: number | null = null;
          const unit = getUnit(dataType);
          let metadata: Record<string, unknown> | undefined;

          switch (dataType) {
            case 'steps': {
              console.log('SYNC: reading steps');
              const { samples } = await Health.readSamples({
                dataType: 'steps',
                startDate: startOfDay.toISOString(),
                endDate: endOfDay.toISOString(),
                limit: 100,
              });
              if (samples && samples.length > 0) {
                value = samples.reduce((sum: number, s: any) => sum + (s.value || 0), 0);
              }
              console.log('SYNC: steps =', value);
              break;
            }

            case 'calories': {
              console.log('SYNC: reading calories');
              const { samples } = await Health.readSamples({
                dataType: 'calories',
                startDate: startOfDay.toISOString(),
                endDate: endOfDay.toISOString(),
                limit: 100,
              });
              if (samples && samples.length > 0) {
                value = Math.round(samples.reduce((sum: number, s: any) => sum + (s.value || 0), 0));
              }
              console.log('SYNC: calories =', value);
              break;
            }

            case 'heart_rate': {
              console.log('SYNC: reading heartRate');
              const { samples } = await Health.readSamples({
                dataType: 'heartRate',
                startDate: startOfDay.toISOString(),
                endDate: endOfDay.toISOString(),
                limit: 200,
              });
              if (samples && samples.length > 0) {
                value = Math.round(samples.reduce((sum: number, s: any) => sum + (s.value || 0), 0) / samples.length);
                metadata = { totalSamples: samples.length };
              }
              console.log('SYNC: heartRate =', value);
              break;
            }

            case 'resting_heart_rate': {
              console.log('SYNC: reading restingHeartRate');
              const { samples } = await Health.readSamples({
                dataType: 'restingHeartRate',
                startDate: yesterday.toISOString(),
                endDate: endOfDay.toISOString(),
                limit: 10,
              });
              if (samples && samples.length > 0) {
                value = Math.round(samples[samples.length - 1].value || 0);
              }
              console.log('SYNC: restingHeartRate =', value);
              break;
            }

            case 'hrv': {
              console.log('SYNC: reading heartRateVariability');
              const { samples } = await Health.readSamples({
                dataType: 'heartRateVariability',
                startDate: yesterday.toISOString(),
                endDate: endOfDay.toISOString(),
                limit: 50,
              });
              if (samples && samples.length > 0) {
                value = Math.round((samples.reduce((sum: number, s: any) => sum + (s.value || 0), 0) / samples.length) * 10) / 10;
              }
              console.log('SYNC: HRV =', value);
              break;
            }

            case 'sleep_spo2': {
              console.log('SYNC: reading oxygenSaturation (nocturnal)');
              const { samples } = await Health.readSamples({
                dataType: 'oxygenSaturation',
                startDate: yesterday.toISOString(),
                endDate: endOfDay.toISOString(),
                limit: 50,
              });
              if (samples && samples.length > 0) {
                // Filter for nighttime/early morning samples (before 8am)
                const nightSamples = samples.filter((s: any) => {
                  const hour = new Date(s.startDate || s.endDate).getHours();
                  return hour < 8 || hour >= 22;
                });
                const relevantSamples = nightSamples.length > 0 ? nightSamples : samples;
                value = Math.round((relevantSamples.reduce((sum: number, s: any) => sum + (s.value || 0), 0) / relevantSamples.length) * 10) / 10;
              }
              console.log('SYNC: sleep_spo2 =', value);
              break;
            }

            case 'weight': {
              console.log('SYNC: reading weight');
              const { samples } = await Health.readSamples({
                dataType: 'weight',
                startDate: historicStart.toISOString(),
                endDate: endOfDay.toISOString(),
                limit: 10,
              });
              if (samples && samples.length > 0) {
                // Sort by date descending, take most recent
                const sorted = [...samples].sort((a: any, b: any) => 
                  new Date(b.startDate || b.endDate || 0).getTime() - new Date(a.startDate || a.endDate || 0).getTime());
                value = Math.round(sorted[0].value * 10) / 10;
              }
              console.log('SYNC: weight =', value);
              break;
            }

            case 'body_fat': {
              console.log('SYNC: reading bodyFat');
              const { samples } = await Health.readSamples({
                dataType: 'bodyFat',
                startDate: historicStart.toISOString(),
                endDate: endOfDay.toISOString(),
                limit: 10,
              });
             if (samples && samples.length > 0) {
                const sorted = [...samples].sort((a: any, b: any) => 
                  new Date(b.startDate || b.endDate || 0).getTime() - new Date(a.startDate || a.endDate || 0).getTime());
                value = Math.round(sorted[0].value * 10) / 10;
              }
              console.log('SYNC: bodyFat =', value);
              break;
            }

            case 'sleep_duration': {
              console.log('SYNC: reading sleep');
              try {
                const { samples } = await Health.readSamples({
                  dataType: 'sleep',
                  startDate: historicStart.toISOString(),
                  endDate: endOfDay.toISOString(),
                  limit: 10,
                });
                console.log('SYNC: sleep ALL', JSON.stringify(samples));
                if (samples && samples.length > 0) {
                  // Sort by value descending
                  const sorted = [...samples].sort((a: any, b: any) => (b.value || 0) - (a.value || 0));
                  
                  // Longest = time in bed (display value)
                  const timeInBed = sorted[0]?.value || 0;
                  value = Math.round(timeInBed / 60 * 10) / 10;
                  
                  metadata = {
                    rawSamples: samples.length,
                    timeInBedMinutes: timeInBed,
                    fellAsleep: sorted[0]?.startDate,
                    outOfBed: sorted[0]?.endDate,
                  };
                  console.log('SYNC: sleep parsed', JSON.stringify(metadata));
                }
              } catch (e: any) {
                console.log('SYNC: sleep FAILED', e.message || e);
              }
              console.log('SYNC: sleep_duration =', value);
              break;
            }
            
            // Sleep sub-types: we read sleep once and extract stages
            // For now, skip these as they depend on how the plugin returns sleep data
            case 'sleep_deep':
            case 'sleep_light':
            case 'sleep_rem':
            case 'sleep_awake':
            case 'sleep_score':
            case 'sleep_spo2':
              // These will be populated from the sleep_duration read above
              // once we understand the sleep data format from the new plugin
              value = null;
              break;
            case 'activity_duration': {
              console.log('SYNC: reading workouts');
              try {
                const { samples } = await Health.readSamples({
                  dataType: 'workouts' as any,
                  startDate: historicStart.toISOString(),
                  endDate: endOfDay.toISOString(),
                  limit: 20,
                });
                console.log('SYNC: workouts ALL', JSON.stringify(samples));
                if (samples && samples.length > 0) {
                  // Take most recent workout
                  const sorted = [...samples].sort((a: any, b: any) => 
                    new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime());
                  value = Math.round(sorted[0].value || 0);
                  metadata = {
                    workoutType: sorted[0].workoutType || sorted[0].activityType,
                    startDate: sorted[0].startDate,
                    endDate: sorted[0].endDate,
                    totalWorkouts: samples.length,
                  };
                }
              } catch (e: any) {
                console.log('SYNC: workouts FAILED', e.message || e);
              }
              console.log('SYNC: activity_duration =', value);
              break;
            }
            default:
              value = null;
          }

          if (value !== null && value > 0) {
            value = Math.round(value * 100) / 100;
            
            const healthData: HealthData = {
              dataType,
              value,
              unit,
              recordedAt: now,
              metadata,
            };
            syncedData.push(healthData);

           // Save to database — upsert: only save if no record today or value changed
            const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local
            const { data: existing } = await supabase
              .from('health_data')
              .select('id, value')
              .eq('user_id', user.id)
              .eq('data_type', dataType)
              .gte('recorded_at', `${today}T00:00:00`)
              .lte('recorded_at', `${today}T23:59:59`)
              .order('recorded_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (existing) {
              // Update only if value changed
              if (Math.abs(existing.value - value) > 0.01) {
                await supabase.from('health_data')
                  .update({ value, recorded_at: now.toISOString() })
                  .eq('id', existing.id);
              }
            } else {
              await supabase.from('health_data').insert({
                user_id: user.id,
                data_type: dataType,
                value,
                unit,
                recorded_at: now.toISOString(),
                source: 'health_connect',
              });
            }
          }
        } catch (error) {
          console.error(`Error syncing ${dataType}:`, error);
        }
      }

      if (syncedData.length > 0) {
        toast.success(`${syncedData.length} métricas sincronizadas`);
      }

      return syncedData;
    } catch (error) {
      console.error('Error syncing health data:', error);
      toast.error('Error al sincronizar datos de salud');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, isPluginLoaded, isAvailable, isNative]);

  // Sync all available health data types
  const syncAllHealthData = useCallback(async (): Promise<HealthData[]> => {
    const allTypes: HealthDataType[] = [
      'steps',
      'calories',
      'heart_rate',
      'resting_heart_rate',
      'hrv',
      'sleep_spo2',
      'weight',
      'body_fat',
      'sleep_duration',
    ];
    return syncHealthData(allTypes);
  }, [syncHealthData]);

  // Get latest health data for a type
  const getLatestHealthData = useCallback(async (dataType: string) => {
    if (!user) return null;
    const { data } = await supabase
      .from('health_data')
      .select('*')
      .eq('user_id', user.id)
      .eq('data_type', dataType)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return data;
  }, [user]);

  // Get health data history
  const getHealthDataHistory = useCallback(async (dataType: string, limit: number = 30) => {
    if (!user) return [];
    const { data } = await supabase
      .from('health_data')
      .select('*')
      .eq('user_id', user.id)
      .eq('data_type', dataType)
      .order('recorded_at', { ascending: false })
      .limit(limit);
    return data || [];
  }, [user]);

  // Open Health Connect settings
  const openHealthConnectSettings = useCallback(async () => {
    if (!Health) return;
    try {
      await Health.openHealthConnectSettings();
    } catch (e) {
      console.log('Could not open Health Connect settings:', e);
    }
  }, []);

  return {
    isConnected,
    isAvailable,
    isPluginLoaded,
    loading,
    checkAvailability,
    requestPermissions,
    syncHealthData,
    syncAllHealthData,
    getLatestHealthData,
    getHealthDataHistory,
    openHealthConnectSettings,
  };
}