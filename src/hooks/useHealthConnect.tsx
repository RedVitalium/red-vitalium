import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/custom-client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';

// Health data types we track in Vitalium
export type HealthDataType =
  | 'sleep_duration'
  | 'sleep_deep'
  | 'sleep_light'
  | 'sleep_rem'
  | 'sleep_awake'
  | 'sleep_score'
  | 'sleep_spo2'
  | 'activity_duration'
  | 'steps'
  | 'heart_rate'
  | 'resting_heart_rate'
  | 'hrv'
  | 'vo2_max'
  | 'calories'
  | 'calories_total'
  | 'calories_basal'
  | 'distance'
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
    case 'steps': return 'steps';
    case 'heart_rate':
    case 'resting_heart_rate': return 'bpm';
    case 'hrv': return 'ms';
    case 'vo2_max': return 'ml/kg/min';
    case 'calories': return 'kcal';
    case 'calories_total': return 'kcal';
    case 'calories_basal': return 'kcal';
    case 'distance': return 'm';
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
  // ONLY types from plugin's HealthDataType: steps, distance, calories, heartRate, weight,
  // sleep, respiratoryRate, oxygenSaturation, restingHeartRate, heartRateVariability,
  // bloodPressure, bloodGlucose, bodyTemperature, height, flightsClimbed, exerciseTime,
  // distanceCycling, bodyFat, basalBodyTemperature, basalCalories, totalCalories, mindfulness
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
          'totalCalories',
          'basalCalories',
          'distance',
          'heartRate',
          'restingHeartRate',
          'heartRateVariability',
          'oxygenSaturation',
          'weight',
          'bodyFat',
          'sleep',
          'workouts'
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
              console.log('SYNC: reading calories (active)');
              const { samples } = await Health.readSamples({
                dataType: 'calories',
                startDate: startOfDay.toISOString(),
                endDate: endOfDay.toISOString(),
                limit: 100,
              });
              if (samples && samples.length > 0) {
                value = Math.round(samples.reduce((sum: number, s: any) => sum + (s.value || 0), 0));
              }
              console.log('SYNC: calories (active) =', value);
              break;
            }

            case 'calories_total': {
              console.log('SYNC: reading totalCalories');
              try {
                const { samples } = await Health.readSamples({
                  dataType: 'totalCalories',
                  startDate: startOfDay.toISOString(),
                  endDate: endOfDay.toISOString(),
                  limit: 100,
                });
                if (samples && samples.length > 0) {
                  value = Math.round(samples.reduce((sum: number, s: any) => sum + (s.value || 0), 0));
                }
              } catch (e) {
                console.log('SYNC: totalCalories not available');
              }
              console.log('SYNC: calories_total =', value);
              break;
            }

            case 'calories_basal': {
              console.log('SYNC: reading basalCalories');
              try {
                const { samples } = await Health.readSamples({
                  dataType: 'basalCalories',
                  startDate: startOfDay.toISOString(),
                  endDate: endOfDay.toISOString(),
                  limit: 100,
                });
                if (samples && samples.length > 0) {
                  value = Math.round(samples.reduce((sum: number, s: any) => sum + (s.value || 0), 0));
                }
              } catch (e) {
                console.log('SYNC: basalCalories not available');
              }
              console.log('SYNC: calories_basal =', value);
              break;
            }

            case 'distance': {
              console.log('SYNC: reading distance');
              try {
                const { samples } = await Health.readSamples({
                  dataType: 'distance',
                  startDate: startOfDay.toISOString(),
                  endDate: endOfDay.toISOString(),
                  limit: 100,
                });
                if (samples && samples.length > 0) {
                  value = Math.round(samples.reduce((sum: number, s: any) => sum + (s.value || 0), 0));
                }
              } catch (e) {
                console.log('SYNC: distance not available');
              }
              console.log('SYNC: distance =', value, 'm');
              break;
            }

            case 'activity_duration': {
              // exerciseTime and workouts are declared in plugin definitions.ts
              // but NOT implemented in Android native code (bug in plugin 8.4.6)
              // Exercise data comes from: OCR screenshots or derived from HR samples
              console.log('SYNC: activity_duration — not supported by plugin, skipping');
              value = null;
              break;
            }

            case 'vo2_max': {
              // vo2Max is NOT in the plugin's supported types (definitions.ts)
              // It must come from: OCR screenshot, manual professional entry, or Uth formula
              // Keeping the case for future plugin updates or derived calculation
              console.log('SYNC: vo2_max — not supported by plugin, skipping');
              value = null;
              break;
            }

            case 'heart_rate': {
              console.log('SYNC: reading heartRate');
              const { samples } = await Health.readSamples({
                dataType: 'heartRate',
                startDate: startOfDay.toISOString(),
                endDate: endOfDay.toISOString(),
                limit: 1000,
              });
              if (samples && samples.length > 0) {
                value = Math.round(samples.reduce((sum: number, s: any) => sum + (s.value || 0), 0) / samples.length);
                metadata = { totalSamples: samples.length };
                
                // Save individual HR samples (skip if already synced today)
                const today = new Date().toLocaleDateString('en-CA');
                const { count: existingSamples } = await supabase
                  .from('health_data')
                  .select('*', { count: 'exact', head: true })
                  .eq('user_id', user.id)
                  .eq('data_type', 'heart_rate_sample')
                  .gte('recorded_at', `${today}T00:00:00`);
                
                if (!existingSamples || existingSamples < 10) {
                  const sampleInserts = samples
                    .filter((s: any) => s.value && (s.startDate || s.endDate))
                    .map((s: any) => ({
                      user_id: user.id,
                      data_type: 'heart_rate_sample',
                      value: s.value,
                      unit: 'bpm',
                      recorded_at: s.startDate || s.endDate,
                      source: 'health_connect',
                    }));
                  if (sampleInserts.length > 0) {
                    await supabase.from('health_data').insert(sampleInserts);
                  }
                  console.log('SYNC: saved', sampleInserts.length, 'individual HR samples');
                } else {
                  console.log('SYNC: HR samples already synced today, skipping');
                }
              }
              console.log('SYNC: heartRate avg =', value, 'from', samples?.length, 'samples');
              
              // Separate nighttime read for resting HR (10PM yesterday to 5AM today)
              const lastNight10pm = new Date(yesterday);
              lastNight10pm.setHours(22, 0, 0, 0);
              const thisAm5 = new Date(startOfDay);
              thisAm5.setHours(5, 0, 0, 0);
              
              try {
                const { samples: nightSamples } = await Health.readSamples({
                  dataType: 'heartRate',
                  startDate: lastNight10pm.toISOString(),
                  endDate: thisAm5.toISOString(),
                  limit: 500,
                });
                if (nightSamples && nightSamples.length > 0) {
                  const sorted = [...nightSamples].sort((a: any, b: any) => (a.value || 0) - (b.value || 0));
                  const bottom20 = sorted.slice(0, Math.max(1, Math.floor(sorted.length * 0.2)));
                  const restingAvg = Math.round(bottom20.reduce((sum: number, s: any) => sum + (s.value || 0), 0) / bottom20.length);
                  
                  console.log('SYNC: resting HR =', restingAvg, 'from', nightSamples.length, 'night samples (bottom 20%:', bottom20.length, ')');
                  
                  const today = new Date().toLocaleDateString('en-CA');
                  const { data: existingResting } = await supabase
                    .from('health_data')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('data_type', 'resting_heart_rate')
                    .gte('recorded_at', `${today}T00:00:00`)
                    .lte('recorded_at', `${today}T23:59:59`)
                    .limit(1)
                    .maybeSingle();
                  if (existingResting) {
                    await supabase.from('health_data').update({ value: restingAvg, recorded_at: new Date().toISOString() }).eq('id', existingResting.id);
                  } else {
                    await supabase.from('health_data').insert({
                      user_id: user.id, data_type: 'resting_heart_rate', value: restingAvg,
                      unit: 'bpm', recorded_at: new Date().toISOString(), source: 'health_connect',
                    });
                  }
                }
              } catch (e) {
                console.log('SYNC: nighttime HR read failed', e);
              }
              break;
            }

            case 'resting_heart_rate': {
              // Derived from nighttime HR readings in heart_rate case above
              value = null;
              break;
            }

            case 'hrv': {
              console.log('SYNC: reading heartRateVariability');
              try {
                const { samples } = await Health.readSamples({
                  dataType: 'heartRateVariability',
                  startDate: yesterday.toISOString(),
                  endDate: endOfDay.toISOString(),
                  limit: 50,
                });
                if (samples && samples.length > 0) {
                  value = Math.round((samples.reduce((sum: number, s: any) => sum + (s.value || 0), 0) / samples.length) * 10) / 10;
                }
              } catch (e) {
                console.log('SYNC: HRV not available');
              }
              console.log('SYNC: HRV =', value);
              break;
            }

            case 'sleep_spo2': {
              console.log('SYNC: reading oxygenSaturation (nocturnal)');
              try {
                const { samples } = await Health.readSamples({
                  dataType: 'oxygenSaturation',
                  startDate: yesterday.toISOString(),
                  endDate: endOfDay.toISOString(),
                  limit: 50,
                });
                if (samples && samples.length > 0) {
                  const nightSamples = samples.filter((s: any) => {
                    const hour = new Date(s.startDate || s.endDate).getHours();
                    return hour < 8 || hour >= 22;
                  });
                  const relevantSamples = nightSamples.length > 0 ? nightSamples : samples;
                  value = Math.round((relevantSamples.reduce((sum: number, s: any) => sum + (s.value || 0), 0) / relevantSamples.length) * 10) / 10;
                }
              } catch (e) {
                console.log('SYNC: oxygenSaturation not available');
              }
              console.log('SYNC: sleep_spo2 =', value);
              break;
            }

            case 'weight': {
              console.log('SYNC: reading weight');
              try {
                const { samples } = await Health.readSamples({
                  dataType: 'weight',
                  startDate: historicStart.toISOString(),
                  endDate: endOfDay.toISOString(),
                  limit: 10,
                });
                if (samples && samples.length > 0) {
                  const sorted = [...samples].sort((a: any, b: any) => 
                    new Date(b.startDate || b.endDate || 0).getTime() - new Date(a.startDate || a.endDate || 0).getTime());
                  value = Math.round(sorted[0].value * 10) / 10;
                }
              } catch (e) {
                console.log('SYNC: weight not available');
              }
              console.log('SYNC: weight =', value);
              break;
            }

            case 'body_fat': {
              console.log('SYNC: reading bodyFat');
              try {
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
              } catch (e) {
                console.log('SYNC: bodyFat not available');
              }
              console.log('SYNC: bodyFat =', value);
              break;
            }

            case 'sleep_duration': {
              console.log('SYNC: reading sleep (with stages)');
              try {
                const { samples } = await Health.readSamples({
                  dataType: 'sleep',
                  startDate: yesterday.toISOString(),
                  endDate: endOfDay.toISOString(),
                  limit: 50,
                });
                console.log('SYNC: sleep raw samples:', samples?.length, 'first 3:', JSON.stringify(samples?.slice(0, 3))?.substring(0, 500));
                
                if (samples && samples.length > 0) {
                  // Extract sleep stages from sleepState field
                  // sleepState values: 'inBed' | 'asleep' | 'awake' | 'rem' | 'deep' | 'light'
                  let totalMinutes = 0;
                  let deepMinutes = 0;
                  let lightMinutes = 0;
                  let remMinutes = 0;
                  let awakeMinutes = 0;
                  let inBedMinutes = 0;
                  
                  for (const sample of samples) {
                    const mins = sample.value || 0;
                    const state = sample.sleepState || '';
                    
                    switch (state) {
                      case 'deep':
                        deepMinutes += mins;
                        totalMinutes += mins;
                        break;
                      case 'light':
                        lightMinutes += mins;
                        totalMinutes += mins;
                        break;
                      case 'rem':
                        remMinutes += mins;
                        totalMinutes += mins;
                        break;
                      case 'awake':
                        awakeMinutes += mins;
                        break;
                      case 'asleep':
                        // Generic asleep without stage detail
                        totalMinutes += mins;
                        break;
                      case 'inBed':
                        inBedMinutes += mins;
                        break;
                      default:
                        // No sleepState — use value as total time
                        totalMinutes += mins;
                        break;
                    }
                  }
                  
                  // Use inBed if available and larger, otherwise totalMinutes
                  const displayMinutes = inBedMinutes > totalMinutes ? inBedMinutes : totalMinutes;
                  value = Math.round(displayMinutes / 60 * 10) / 10;
                  
                  metadata = {
                    rawSamples: samples.length,
                    totalMinutes: displayMinutes,
                    deepMinutes,
                    lightMinutes,
                    remMinutes,
                    awakeMinutes,
                    inBedMinutes,
                    hasSleepStages: deepMinutes > 0 || lightMinutes > 0 || remMinutes > 0,
                  };
                  
                  console.log('SYNC: sleep stages — deep:', deepMinutes, 'light:', lightMinutes, 'rem:', remMinutes, 'awake:', awakeMinutes, 'inBed:', inBedMinutes, 'total:', displayMinutes);
                  
                  // Save sleep stages to health_data if we have stage data
                  const today = new Date().toLocaleDateString('en-CA');
                  
                  const stagesToSave = [
                    { type: 'sleep_deep', val: deepMinutes },
                    { type: 'sleep_light', val: lightMinutes },
                    { type: 'sleep_rem', val: remMinutes },
                    { type: 'sleep_awake', val: awakeMinutes },
                  ];
                  
                  for (const stage of stagesToSave) {
                    if (stage.val > 0) {
                      const { data: existingStage } = await supabase
                        .from('health_data')
                        .select('id')
                        .eq('user_id', user.id)
                        .eq('data_type', stage.type)
                        .gte('recorded_at', `${today}T00:00:00`)
                        .lte('recorded_at', `${today}T23:59:59`)
                        .limit(1)
                        .maybeSingle();
                      if (existingStage) {
                        await supabase.from('health_data')
                          .update({ value: stage.val, recorded_at: now.toISOString() })
                          .eq('id', existingStage.id);
                      } else {
                        await supabase.from('health_data').insert({
                          user_id: user.id,
                          data_type: stage.type,
                          value: stage.val,
                          unit: 'min',
                          recorded_at: now.toISOString(),
                          source: 'health_connect',
                        });
                      }
                    }
                  }
                }
              } catch (e: any) {
                console.log('SYNC: sleep FAILED', e.message || e);
              }
              console.log('SYNC: sleep_duration =', value);
              break;
            }
            
            // Sleep sub-types are saved from the sleep_duration case above
            // These cases exist so the type system is happy but don't read separately
            case 'sleep_deep':
            case 'sleep_light':
            case 'sleep_rem':
            case 'sleep_awake':
            case 'sleep_score':
              value = null;
              break;

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
            const today = new Date().toLocaleDateString('en-CA');
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
      'calories_total',
      'calories_basal',
      'distance',
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
