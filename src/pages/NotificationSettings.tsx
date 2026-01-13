import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { 
  Bell, 
  Clock, 
  Save, 
  RotateCcw,
  Moon,
  Utensils,
  Activity,
  Smartphone,
  Bed
} from "lucide-react";
import { 
  useLocalNotifications, 
  defaultHabitReminders,
  ReminderNotification 
} from "@/hooks/useLocalNotifications";
import { Capacitor } from "@capacitor/core";

interface ReminderConfig {
  id: number;
  title: string;
  description: string;
  hour: number;
  minute: number;
  enabled: boolean;
  icon: React.ReactNode;
  notificationTitle: string;
  notificationBody: string;
}

const defaultReminders: ReminderConfig[] = [
  {
    id: 1,
    title: "Última comida",
    description: "Recordatorio para terminar tu última comida del día",
    hour: 19,
    minute: 0,
    enabled: true,
    icon: <Utensils className="h-5 w-5" />,
    notificationTitle: "🍽️ Hora de la última comida",
    notificationBody: "Recuerda terminar tu última comida del día para mejorar tu descanso",
  },
  {
    id: 2,
    title: "Preparación para dormir",
    description: "Hora de comenzar tu rutina de relajación",
    hour: 21,
    minute: 0,
    enabled: true,
    icon: <Moon className="h-5 w-5" />,
    notificationTitle: "🌙 Prepárate para dormir",
    notificationBody: "Es hora de comenzar tu rutina de relajación antes de dormir",
  },
  {
    id: 3,
    title: "Hora de acostarse",
    description: "Momento de dejar el teléfono y dormir",
    hour: 22,
    minute: 30,
    enabled: true,
    icon: <Bed className="h-5 w-5" />,
    notificationTitle: "😴 Hora de acostarte",
    notificationBody: "Deja el teléfono y prepárate para un sueño reparador",
  },
  {
    id: 4,
    title: "Actividad física",
    description: "Recordatorio de ejercicio diario",
    hour: 10,
    minute: 0,
    enabled: true,
    icon: <Activity className="h-5 w-5" />,
    notificationTitle: "🏃 Recordatorio de actividad",
    notificationBody: "¿Ya realizaste tu actividad física hoy? ¡Mantén el ritmo!",
  },
  {
    id: 5,
    title: "Descanso de pantallas",
    description: "Tomar un descanso del uso de dispositivos",
    hour: 15,
    minute: 0,
    enabled: true,
    icon: <Smartphone className="h-5 w-5" />,
    notificationTitle: "📱 Control de pantalla",
    notificationBody: "Considera tomar un descanso de las pantallas",
  },
];

const STORAGE_KEY = "customReminderSettings";

export default function NotificationSettingsPage() {
  const [reminders, setReminders] = useState<ReminderConfig[]>(defaultReminders);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  const {
    hasPermission,
    requestPermissions,
    scheduleHabitReminders,
  } = useLocalNotifications();

  // Load saved settings
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge saved settings with defaults (in case new reminders were added)
        const merged = defaultReminders.map(defaultReminder => {
          const savedReminder = parsed.find((r: ReminderConfig) => r.id === defaultReminder.id);
          if (savedReminder) {
            return {
              ...defaultReminder,
              hour: savedReminder.hour,
              minute: savedReminder.minute,
              enabled: savedReminder.enabled,
            };
          }
          return defaultReminder;
        });
        setReminders(merged);
      } catch (e) {
        console.error("Error loading saved reminder settings:", e);
      }
    }
  }, []);

  const handleTimeChange = (id: number, field: "hour" | "minute", value: string) => {
    const numValue = parseInt(value) || 0;
    const clampedValue = field === "hour" 
      ? Math.min(23, Math.max(0, numValue))
      : Math.min(59, Math.max(0, numValue));

    setReminders(prev => prev.map(r => 
      r.id === id ? { ...r, [field]: clampedValue } : r
    ));
    setHasChanges(true);
  };

  const handleToggle = (id: number, enabled: boolean) => {
    setReminders(prev => prev.map(r => 
      r.id === id ? { ...r, enabled } : r
    ));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));

      // If on native and notifications are enabled, reschedule
      if (isNative) {
        if (!hasPermission) {
          const granted = await requestPermissions();
          if (!granted) {
            toast.error("Permiso de notificaciones denegado");
            setIsSaving(false);
            return;
          }
        }

        const enabledReminders: ReminderNotification[] = reminders
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

      toast.success("Configuración guardada correctamente");
      setHasChanges(false);
    } catch (error) {
      toast.error("Error al guardar la configuración");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setReminders(defaultReminders);
    localStorage.removeItem(STORAGE_KEY);
    setHasChanges(true);
    toast.info("Configuración restaurada a valores predeterminados");
  };

  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-primary/10">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Configuración de Notificaciones
          </h1>
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
        {reminders.map((reminder, index) => (
          <motion.div
            key={reminder.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`p-4 transition-all ${!reminder.enabled ? "opacity-60" : ""}`}>
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${reminder.enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {reminder.icon}
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
