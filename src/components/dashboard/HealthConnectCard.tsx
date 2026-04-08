import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  RefreshCw, 
  Clock, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle,
  Zap
} from 'lucide-react';
import { useBackgroundSync } from '@/hooks/useBackgroundSync';
import { useHealthConnect } from '@/hooks/useHealthConnect';
import { Capacitor } from '@capacitor/core';

export function HealthConnectCard() {
  const { 
    isConnected, 
    isAvailable, 
    isPluginLoaded: isHealthConnectLoaded,
    loading: healthLoading,
    requestPermissions,
    syncHealthData,
    openHealthConnectSettings,
  } = useHealthConnect();

  const {
    isPluginLoaded: isBackgroundLoaded,
    status,
    triggerSync,
    setEnabled,
    getTimeSinceLastSync,
  } = useBackgroundSync();

  const [isSyncing, setIsSyncing] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  const handleConnect = async () => {
    await requestPermissions();
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      // Sync all comprehensive health data types
      await syncHealthData([
        'sleep_duration',
        'sleep_deep',
        'sleep_light',
        'sleep_rem',
        'sleep_score',
        'sleep_spo2',
        'activity_duration',
        'activity_zone_fat_burn',
        'activity_zone_cardio',
        'activity_zone_peak',
        'steps',
        'heart_rate',
        'resting_heart_rate',
        'hrv',
        'spo2',
        'stress',
        'vo2_max',
        'calories',
        'weight',
        'body_fat',
      ]);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleBackgroundSync = async () => {
    await triggerSync();
  };

  if (!isNative) {
    return (
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-muted">
            <Smartphone className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-bold text-lg mb-1">Health Connect</h3>
            <p className="text-sm text-muted-foreground mb-4">
              La sincronización con Health Connect solo está disponible en la app nativa de Android.
            </p>
            <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
              📱 Descarga la app para conectar con tus datos de salud
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-start gap-4 mb-6">
        <div className={`p-3 rounded-xl ${isConnected ? 'bg-success/10' : 'bg-primary/10'}`}>
          {isConnected ? (
            <CheckCircle2 className="h-6 w-6 text-success" />
          ) : (
            <Smartphone className="h-6 w-6 text-primary" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-display font-bold text-lg mb-1">Health Connect</h3>
          <p className="text-sm text-muted-foreground">
            {isConnected 
              ? 'Conectado y sincronizando datos' 
              : isAvailable 
                ? 'Conecta para sincronizar tus datos de salud'
                : 'Health Connect no está instalado'
            }
          </p>
        </div>
      </div>

      {!isConnected ? (
        <div className="space-y-3">
          <Button 
            onClick={handleConnect} 
            disabled={healthLoading || !isAvailable}
            className="w-full"
          >
            {healthLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Conectando...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Conectar Health Connect
              </>
            )}
          </Button>
          
          {!isAvailable && (
            <Button 
              variant="outline" 
              onClick={openHealthConnectSettings}
              className="w-full"
            >
              Instalar Health Connect
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Sync Status */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Última sincronización</span>
            </div>
            <span className="text-sm font-medium">{getTimeSinceLastSync()}</span>
          </div>

          {/* Auto Sync Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Sincronización automática</p>
                <p className="text-xs text-muted-foreground">Cada hora en segundo plano</p>
              </div>
            </div>
            <Switch
              checked={false}
              onCheckedChange={setEnabled}
              disabled={!isBackgroundLoaded}
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              onClick={handleManualSync}
              disabled={isSyncing}
              className="w-full"
            >
              {isSyncing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sincronizar
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={openHealthConnectSettings}
              className="w-full"
            >
              Configuración
            </Button>
          </div>

          {/* Next Sync Info */}
          {status !== 'unavailable' && false && (
            <div className="text-center text-xs text-muted-foreground">
              Próxima sincronización: --:--
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
