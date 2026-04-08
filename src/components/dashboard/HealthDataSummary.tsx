import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Moon, 
  Activity, 
  Heart, 
  Wind,
  Footprints,
  Timer,
  Brain,
  Zap
} from 'lucide-react';
import { useHealthConnect } from '@/hooks/useHealthConnect';

interface ZoneBar {
  label: string;
  value: number;
  color: string;
}

function ZoneProgress({ zones, total }: { zones: ZoneBar[]; total: number }) {
  return (
    <div className="space-y-2">
      {zones.map((zone) => (
        <div key={zone.label} className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{zone.label}</span>
            <span className="font-medium">{zone.value.toFixed(0)} min ({total > 0 ? ((zone.value / total) * 100).toFixed(0) : 0}%)</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div 
              className={`h-full rounded-full ${zone.color}`}
              style={{ width: `${total > 0 ? (zone.value / total) * 100 : 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function HealthDataSummary() {
  const { isConnected } = useHealthConnect();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-32 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">
          {isConnected 
            ? 'No hay datos disponibles. Sincroniza tus datos de Health Connect.'
            : 'Conecta Health Connect para ver tu resumen de salud semanal.'}
        </p>
      </Card>
    );
  }

  const totalSleepMinutes = summary.sleep.averageDuration * 60;
  const sleepZones: ZoneBar[] = [
    { label: 'Sueño profundo', value: (summary.sleep.deepSleepPercent / 100) * totalSleepMinutes, color: 'bg-indigo-500' },
    { label: 'Sueño REM', value: (summary.sleep.remSleepPercent / 100) * totalSleepMinutes, color: 'bg-purple-500' },
    { label: 'Sueño ligero', value: totalSleepMinutes - ((summary.sleep.deepSleepPercent + summary.sleep.remSleepPercent) / 100) * totalSleepMinutes, color: 'bg-blue-300' },
  ];

  const activityZones: ZoneBar[] = [
    { label: 'Zona Quema Grasa', value: (summary.activity.fatBurnPercent / 100) * summary.activity.averageActiveMinutes, color: 'bg-yellow-500' },
    { label: 'Zona Cardio', value: (summary.activity.cardioPercent / 100) * summary.activity.averageActiveMinutes, color: 'bg-orange-500' },
    { label: 'Zona Peak', value: (summary.activity.peakPercent / 100) * summary.activity.averageActiveMinutes, color: 'bg-red-500' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-display font-bold">Resumen Semanal de Salud</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Sleep Summary */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10">
              <Moon className="h-5 w-5 text-indigo-500" />
            </div>
            <div>
              <h3 className="font-semibold">Sueño</h3>
              <p className="text-2xl font-bold">{summary.sleep.averageDuration.toFixed(1)}h</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Score:</span>
            <Progress value={summary.sleep.averageScore} className="flex-1 h-2" />
            <span className="font-medium">{summary.sleep.averageScore.toFixed(0)}</span>
          </div>
          <ZoneProgress zones={sleepZones} total={totalSleepMinutes} />
        </Card>

        {/* Activity Summary */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Activity className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <h3 className="font-semibold">Actividad</h3>
              <p className="text-2xl font-bold">{summary.activity.averageActiveMinutes.toFixed(0)} min</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Footprints className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{summary.activity.totalSteps.toLocaleString()} pasos</span>
          </div>
          <ZoneProgress zones={activityZones} total={summary.activity.averageActiveMinutes} />
        </Card>

        {/* Heart Rate */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <Heart className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h3 className="font-semibold">Frecuencia Cardíaca</h3>
              <p className="text-2xl font-bold">{summary.vitals.averageHR.toFixed(0)} <span className="text-sm font-normal">bpm</span></p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="p-2 rounded-lg bg-muted">
              <p className="text-muted-foreground">FC en reposo</p>
              <p className="font-bold">{summary.vitals.averageRHR.toFixed(0)} bpm</p>
            </div>
            <div className="p-2 rounded-lg bg-muted">
              <p className="text-muted-foreground">HRV</p>
              <p className="font-bold">{summary.vitals.averageHRV.toFixed(0)} ms</p>
            </div>
          </div>
        </Card>

        {/* Blood Oxygen */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10">
              <Wind className="h-5 w-5 text-cyan-500" />
            </div>
            <div>
              <h3 className="font-semibold">Oxígeno en Sangre</h3>
              <p className="text-2xl font-bold">{summary.vitals.averageSpO2.toFixed(1)}<span className="text-sm font-normal">%</span></p>
            </div>
          </div>
          <Progress value={summary.vitals.averageSpO2} className="h-3" />
          <p className="text-xs text-muted-foreground">
            {summary.vitals.averageSpO2 >= 95 ? '✓ Niveles normales' : '⚠ Niveles por debajo de lo normal'}
          </p>
        </Card>

        {/* Stress */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Brain className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <h3 className="font-semibold">Estrés</h3>
              <p className="text-2xl font-bold">{summary.vitals.averageStress.toFixed(0)}<span className="text-sm font-normal">/100</span></p>
            </div>
          </div>
          <Progress value={summary.vitals.averageStress} className="h-3" />
          <p className="text-xs text-muted-foreground">
            {summary.vitals.averageStress < 40 ? '✓ Estrés bajo' : summary.vitals.averageStress < 60 ? '⚡ Estrés moderado' : '⚠ Estrés alto'}
          </p>
        </Card>

        {/* VO2 Max */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Zap className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold">VO2 Max</h3>
              <p className="text-2xl font-bold">{summary.vo2Max.toFixed(1)} <span className="text-sm font-normal">ml/kg/min</span></p>
            </div>
          </div>
          <div className="text-sm">
            <p className="text-muted-foreground mb-1">Capacidad cardiorrespiratoria</p>
            <div className="flex gap-1">
              {['Bajo', 'Normal', 'Bueno', 'Excelente'].map((label, i) => (
                <div 
                  key={label}
                  className={`flex-1 h-2 rounded-full ${
                    (summary.vo2Max >= 35 && i === 0) ||
                    (summary.vo2Max >= 40 && i === 1) ||
                    (summary.vo2Max >= 45 && i === 2) ||
                    (summary.vo2Max >= 50 && i === 3)
                      ? 'bg-green-500'
                      : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>35</span>
              <span>40</span>
              <span>45</span>
              <span>50+</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
