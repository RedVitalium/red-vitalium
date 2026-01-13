import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { HabitWeekIndicator } from "@/components/dashboard/HabitWeekIndicator";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { 
  Bell, 
  Moon, 
  Utensils, 
  BedDouble, 
  Sun,
  Smartphone,
  Clock,
  Settings,
  CheckCircle2,
  AlertCircle,
  Cloud,
  CloudOff
} from "lucide-react";

interface Reminder {
  id: string;
  type: "meal" | "prepare-sleep" | "bedtime" | "morning" | "screen-break";
  title: string;
  description: string;
  time: string;
  enabled: boolean;
  icon: typeof Moon;
}

const reminderDefaults: Omit<Reminder, "enabled" | "time">[] = [
  {
    id: "meal",
    type: "meal",
    title: "Última comida del día",
    description: "Termina de comer 3 horas antes de dormir",
    icon: Utensils,
  },
  {
    id: "screen",
    type: "screen-break",
    title: "Reducir pantallas",
    description: "Activa filtro de luz azul",
    icon: Smartphone,
  },
  {
    id: "prepare",
    type: "prepare-sleep",
    title: "Preparar para dormir",
    description: "Comienza tu rutina nocturna",
    icon: Moon,
  },
  {
    id: "bed",
    type: "bedtime",
    title: "Hora de dormir",
    description: "Ve a la cama para 7-8 horas de sueño",
    icon: BedDouble,
  },
  {
    id: "wake",
    type: "morning",
    title: "Despertar",
    description: "Rutina matutina y luz natural",
    icon: Sun,
  },
];

// Get current week of the month (1-4)
function getCurrentWeekOfMonth(): number {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const dayOfMonth = now.getDate();
  return Math.ceil((dayOfMonth + firstDay.getDay()) / 7);
}

export default function Reminders() {
  const { user } = useAuth();
  const { 
    settings, 
    isLoading, 
    updateSleepSettings, 
    updateReminders,
    defaultRemindersPage 
  } = useUserSettings();

  const [localBedtime, setLocalBedtime] = useState([22.5]);
  const [localSleepGoal, setLocalSleepGoal] = useState([7.5]);
  const [localReminders, setLocalReminders] = useState<Reminder[]>([]);

  // Sync local state with cloud settings
  useEffect(() => {
    if (!isLoading) {
      setLocalBedtime([settings.bedtime]);
      setLocalSleepGoal([settings.sleepGoal]);
      
      // Build reminders from saved settings
      const savedReminders = settings.reminders || defaultRemindersPage;
      const mergedReminders: Reminder[] = reminderDefaults.map(def => {
        const saved = savedReminders.find(r => r.id === def.id);
        return {
          ...def,
          enabled: saved?.enabled ?? true,
          time: saved?.time ?? "12:00",
        };
      });
      setLocalReminders(mergedReminders);
    }
  }, [isLoading, settings, defaultRemindersPage]);

  const toggleReminder = async (id: string) => {
    const updated = localReminders.map(r =>
      r.id === id ? { ...r, enabled: !r.enabled } : r
    );
    setLocalReminders(updated);
    
    // Save to cloud
    await updateReminders(updated.map(r => ({
      id: r.id,
      type: r.type,
      enabled: r.enabled,
      time: r.time,
    })));
  };

  const handleBedtimeChange = async (value: number[]) => {
    setLocalBedtime(value);
  };

  const handleBedtimeCommit = async () => {
    await updateSleepSettings({
      bedtime: localBedtime[0],
      sleepGoal: localSleepGoal[0],
    });
  };

  const handleSleepGoalChange = async (value: number[]) => {
    setLocalSleepGoal(value);
  };

  const handleSleepGoalCommit = async () => {
    await updateSleepSettings({
      bedtime: localBedtime[0],
      sleepGoal: localSleepGoal[0],
    });
  };

  const formatTime = (value: number) => {
    const hours = Math.floor(value);
    const minutes = (value - hours) * 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const calculateWakeTime = () => {
    const bedtimeHours = localBedtime[0];
    const sleepHours = localSleepGoal[0];
    const wakeTime = (bedtimeHours + sleepHours) % 24;
    return formatTime(wakeTime);
  };

  const currentWeek = getCurrentWeekOfMonth();
  const isTestWeek = currentWeek === 4;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-10 w-48 mb-8" />
        <Skeleton className="h-24 w-full mb-8" />
        <Skeleton className="h-64 w-full mb-8" />
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              Recordatorios
            </h1>
            <p className="text-muted-foreground">
              Configura tus rutinas diarias para optimizar tu bienestar
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {user ? (
              <span className="flex items-center gap-1 text-success">
                <Cloud className="h-4 w-4" />
                Sincronizado
              </span>
            ) : (
              <span className="flex items-center gap-1 text-muted-foreground">
                <CloudOff className="h-4 w-4" />
                Local
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Habit Week Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <HabitWeekIndicator />
      </motion.div>

      {/* Test Week Alert */}
      {isTestWeek && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8"
        >
          <Card className="p-6 bg-accent/10 border-accent/30">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-accent/20">
                <AlertCircle className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h2 className="text-lg font-display font-bold text-foreground mb-2">
                  Semana de Prueba de Hábitos
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Esta semana no recibirás recordatorios automáticos. Es momento de comprobar 
                  si los hábitos que has desarrollado durante las últimas 3 semanas ya están 
                  arraigados en tu rutina diaria.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-3 py-1 rounded-full bg-success/10 text-success font-medium">
                    🎯 Confía en tus hábitos
                  </span>
                  <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                    📊 Evaluaremos tu progreso
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Sleep Schedule Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Card className="p-6 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 border-primary/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-primary/10">
              <Moon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold">Programar Sueño</h2>
              <p className="text-sm text-muted-foreground">Optimiza tu ciclo de sueño</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-3">
                  <label className="text-sm font-medium">Hora de dormir</label>
                  <span className="text-sm font-display font-bold text-primary">
                    {formatTime(localBedtime[0])}
                  </span>
                </div>
                <Slider
                  value={localBedtime}
                  onValueChange={handleBedtimeChange}
                  onValueCommit={handleBedtimeCommit}
                  min={20}
                  max={24}
                  step={0.5}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex justify-between mb-3">
                  <label className="text-sm font-medium">Meta de sueño</label>
                  <span className="text-sm font-display font-bold text-primary">
                    {localSleepGoal[0]} horas
                  </span>
                </div>
                <Slider
                  value={localSleepGoal}
                  onValueChange={handleSleepGoalChange}
                  onValueCommit={handleSleepGoalCommit}
                  min={6}
                  max={9}
                  step={0.5}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex flex-col items-center justify-center bg-card rounded-2xl p-6 border">
              <p className="text-sm text-muted-foreground mb-2">Hora de despertar sugerida</p>
              <p className="text-4xl font-display font-bold text-primary">{calculateWakeTime()}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Para {localSleepGoal[0]} horas de sueño
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-4 mb-8"
      >
        <Card className="p-4 text-center cursor-pointer hover:shadow-md transition-shadow">
          <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
          <p className="text-sm font-medium">Recordar en 30 min</p>
        </Card>
        <Card className="p-4 text-center cursor-pointer hover:shadow-md transition-shadow">
          <Bell className="h-8 w-8 text-accent mx-auto mb-2" />
          <p className="text-sm font-medium">Silenciar 1 hora</p>
        </Card>
        <Card className="p-4 text-center cursor-pointer hover:shadow-md transition-shadow">
          <Settings className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium">Configuración</p>
        </Card>
      </motion.div>

      {/* Reminders List - Only show if not test week */}
      {!isTestWeek ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-display font-bold flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Recordatorios Diarios
            </h2>
            <Button variant="outline" size="sm">
              Agregar nuevo
            </Button>
          </div>

          <div className="space-y-3">
            {localReminders.map((reminder, index) => {
              const Icon = reminder.icon;
              return (
                <motion.div
                  key={reminder.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`p-4 transition-all ${
                    reminder.enabled ? "" : "opacity-50"
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${
                        reminder.enabled ? "bg-primary/10" : "bg-muted"
                      }`}>
                        <Icon className={`h-5 w-5 ${
                          reminder.enabled ? "text-primary" : "text-muted-foreground"
                        }`} />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{reminder.title}</h3>
                        <p className="text-sm text-muted-foreground">{reminder.description}</p>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-lg font-display font-semibold text-foreground">
                          {reminder.time}
                        </span>
                        <Switch
                          checked={reminder.enabled}
                          onCheckedChange={() => toggleReminder(reminder.id)}
                        />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <Bell className="h-8 w-8 text-accent" />
            </div>
            <h2 className="text-xl font-display font-bold text-foreground mb-2">
              Recordatorios Pausados
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Los recordatorios automáticos están desactivados esta semana para evaluar 
              si tus hábitos se mantienen sin apoyo externo.
            </p>
          </Card>
        </motion.div>
      )}

      {/* Today's Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8"
      >
        <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-success" />
          {isTestWeek ? "Seguimiento de Hábitos (Sin Recordatorios)" : "Progreso de Hoy"}
        </h2>
        <Card className="p-6">
          <div className="grid grid-cols-5 gap-4 text-center">
            {localReminders.map((reminder) => {
              const Icon = reminder.icon;
              const isCompleted = Math.random() > 0.3; // Simulated
              return (
                <div key={reminder.id} className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                    isCompleted ? "bg-success/10" : "bg-muted"
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 className="h-6 w-6 text-success" />
                    ) : (
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{reminder.time}</p>
                </div>
              );
            })}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
