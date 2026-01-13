import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Bell, 
  Clock, 
  Save, 
  RotateCcw,
  Moon,
  Utensils,
  Activity,
  Smartphone,
  Bed,
  Cloud,
  CloudOff
} from "lucide-react";
import { 
  useLocalNotifications, 
  ReminderNotification 
} from "@/hooks/useLocalNotifications";
import { useUserSettings, ReminderConfig } from "@/hooks/useUserSettings";
import { useAuth } from "@/hooks/useAuth";
import { Capacitor } from "@capacitor/core";

const iconMap: Record<number, React.ReactNode> = {
  1: <Utensils className="h-5 w-5" />,
  2: <Moon className="h-5 w-5" />,
  3: <Bed className="h-5 w-5" />,
  4: <Activity className="h-5 w-5" />,
  5: <Smartphone className="h-5 w-5" />,
};

export default function NotificationSettingsPage() {
  const { user } = useAuth();
  const { 
    settings, 
    isLoading, 
    isSaving, 
    updateNotificationSettings, 
    resetToDefaults,
    defaultNotificationSettings 
  } = useUserSettings();
  
  const [localReminders, setLocalReminders] = useState<ReminderConfig[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  const {
    hasPermission,
    requestPermissions,
    scheduleHabitReminders,
  } = useLocalNotifications();

  // Sync local state with cloud settings
  useEffect(() => {
    if (!isLoading && settings.notificationSettings) {
      setLocalReminders(settings.notificationSettings);
    }
  }, [isLoading, settings.notificationSettings]);

  const handleTimeChange = (id: number, field: "hour" | "minute", value: string) => {
    const numValue = parseInt(value) || 0;
    const clampedValue = field === "hour" 
      ? Math.min(23, Math.max(0, numValue))
      : Math.min(59, Math.max(0, numValue));

    setLocalReminders(prev => prev.map(r => 
      r.id === id ? { ...r, [field]: clampedValue } : r
    ));
    setHasChanges(true);
  };

  const handleToggle = (id: number, enabled: boolean) => {
    setLocalReminders(prev => prev.map(r => 
      r.id === id ? { ...r, enabled } : r
    ));
    setHasChanges(true);
  };

  const handleSave = async () => {
    // Save to cloud/localStorage
    const success = await updateNotificationSettings(localReminders);

    if (success && isNative) {
      if (!hasPermission) {
        const granted = await requestPermissions();
        if (!granted) return;
      }

      const enabledReminders: ReminderNotification[] = localReminders
        .filter(r => r.enabled)
        .map(r => ({
          id: r.id,
          title: r.notificationTitle,
          body: r.notificationBody,
          hour: r.hour,
          minute: r.minute,
        }));

      if (enabledReminders.length > 0) {
        await scheduleHabitReminders(enabledReminders);
      }
    }

    if (success) setHasChanges(false);
  };

  const handleReset = async () => {
    setLocalReminders(defaultNotificationSettings);
    await resetToDefaults();
    setHasChanges(false);
  };

  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Configuración de Notificaciones
            </h1>
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
        <p className="text-muted-foreground">
          Personaliza los horarios de tus recordatorios de hábitos
        </p>
      </motion.div>

      {!isNative && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="p-4 bg-warning/10 border-warning/30">
            <p className="text-sm text-warning-foreground">
              ⚠️ Las notificaciones push solo funcionan en la app nativa. 
              Puedes configurar los horarios ahora y se aplicarán cuando uses la app móvil.
            </p>
          </Card>
        </motion.div>
      )}

      <div className="space-y-4">
        {localReminders.map((reminder, index) => (
          <motion.div
            key={reminder.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`p-4 transition-all ${!reminder.enabled ? "opacity-60" : ""}`}>
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${reminder.enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {iconMap[reminder.id] || <Bell className="h-5 w-5" />}
                </div>
                
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-semibold text-foreground">
                        {reminder.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {reminder.description}
                      </p>
                    </div>
                    <Switch
                      checked={reminder.enabled}
                      onCheckedChange={(enabled) => handleToggle(reminder.id, enabled)}
                    />
                  </div>
                  
                  {reminder.enabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="flex items-center gap-3 pt-2 border-t border-border"
                    >
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Label htmlFor={`hour-${reminder.id}`} className="sr-only">
                            Hora
                          </Label>
                          <Input
                            id={`hour-${reminder.id}`}
                            type="number"
                            min={0}
                            max={23}
                            value={reminder.hour}
                            onChange={(e) => handleTimeChange(reminder.id, "hour", e.target.value)}
                            className="w-16 text-center"
                          />
                        </div>
                        <span className="text-lg font-bold text-muted-foreground">:</span>
                        <div className="flex items-center gap-1">
                          <Label htmlFor={`minute-${reminder.id}`} className="sr-only">
                            Minutos
                          </Label>
                          <Input
                            id={`minute-${reminder.id}`}
                            type="number"
                            min={0}
                            max={59}
                            value={reminder.minute.toString().padStart(2, "0")}
                            onChange={(e) => handleTimeChange(reminder.id, "minute", e.target.value)}
                            className="w-16 text-center"
                          />
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        ({formatTime(reminder.hour, reminder.minute)})
                      </span>
                    </motion.div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 flex gap-4"
      >
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="flex-1 gap-2"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Guardando..." : "Guardar cambios"}
        </Button>
        <Button
          variant="outline"
          onClick={handleReset}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Restaurar
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-6"
      >
        <Card className="p-4 bg-muted/30">
          <h4 className="font-medium text-sm mb-2">💡 Consejos</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Las notificaciones se activan solo durante las primeras 3 semanas del ciclo</li>
            <li>• En la semana 4 (prueba), no recibirás recordatorios</li>
            <li>• Ajusta los horarios según tu rutina diaria para mejores resultados</li>
          </ul>
        </Card>
      </motion.div>
    </div>
  );
}
