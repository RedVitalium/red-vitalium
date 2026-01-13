import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Bell, 
  BellOff, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  TestTube,
  Settings
} from "lucide-react";
import { 
  useLocalNotifications, 
  loadCustomReminders
} from "@/hooks/useLocalNotifications";

interface NotificationSettingsProps {
  hasActiveCycle: boolean;
  currentWeek: number;
  className?: string;
}

export function NotificationSettings({ 
  hasActiveCycle, 
  currentWeek,
  className 
}: NotificationSettingsProps) {
  const {
    hasPermission,
    isNative,
    requestPermissions,
    scheduleHabitReminders,
    cancelAllNotifications,
    scheduleTestNotification,
  } = useLocalNotifications();

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [customReminders, setCustomReminders] = useState(loadCustomReminders());

  // Load saved preference
  useEffect(() => {
    const saved = localStorage.getItem("notificationsEnabled");
    if (saved === "true") {
      setNotificationsEnabled(true);
    }
    // Reload custom reminders when component mounts
    setCustomReminders(loadCustomReminders());
  }, []);

  // Update notifications based on cycle status
  useEffect(() => {
    if (!isNative) return;
    
    const updateNotifications = async () => {
      // If cycle is active and week is 1-3, enable reminders
      if (hasActiveCycle && currentWeek <= 3 && notificationsEnabled) {
        await scheduleHabitReminders(customReminders);
      } else {
        // Week 4 (test week) or no active cycle - cancel notifications
        await cancelAllNotifications();
      }
    };

    updateNotifications();
  }, [hasActiveCycle, currentWeek, notificationsEnabled, isNative, customReminders]);

  const handleToggleNotifications = async (enabled: boolean) => {
    setIsLoading(true);

    try {
      if (enabled) {
        if (!hasPermission) {
          const granted = await requestPermissions();
          if (!granted) {
            toast.error("Permiso de notificaciones denegado");
            setIsLoading(false);
            return;
          }
        }

        if (hasActiveCycle && currentWeek <= 3) {
          const success = await scheduleHabitReminders(customReminders);
          if (success) {
            toast.success("Recordatorios de hábitos activados");
          }
        } else {
          toast.info("Las notificaciones se activarán cuando inicie tu ciclo");
        }
      } else {
        await cancelAllNotifications();
        toast.success("Recordatorios desactivados");
      }

      setNotificationsEnabled(enabled);
      localStorage.setItem("notificationsEnabled", enabled.toString());
    } catch (error) {
      toast.error("Error al configurar notificaciones");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    const success = await scheduleTestNotification();
    if (success) {
      toast.success("Notificación de prueba programada (3 segundos)");
    } else {
      toast.error("No se pudo programar la notificación de prueba");
    }
  };

  // Don't show if not on native platform
  if (!isNative) {
    return null;
  }

  const isTestWeek = currentWeek === 4;

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {notificationsEnabled ? (
            <Bell className="h-5 w-5 text-primary" />
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          )}
          <h3 className="font-display font-semibold text-foreground">
            Notificaciones
          </h3>
        </div>
        <Badge variant={hasPermission ? "default" : "secondary"}>
          {hasPermission ? (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Permitido
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Sin permiso
            </span>
          )}
        </Badge>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Smartphone className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="notifications-toggle" className="cursor-pointer">
              Recordatorios de hábitos
            </Label>
          </div>
          <Switch
            id="notifications-toggle"
            checked={notificationsEnabled}
            onCheckedChange={handleToggleNotifications}
            disabled={isLoading}
          />
        </div>

        {notificationsEnabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-3"
          >
            {isTestWeek ? (
              <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg">
                <p className="text-sm text-accent font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Semana de prueba
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Los recordatorios están pausados esta semana
                </p>
              </div>
            ) : !hasActiveCycle ? (
              <div className="p-3 bg-muted/50 border border-muted rounded-lg">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Esperando inicio del ciclo
                </p>
              </div>
            ) : (
              <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                <p className="text-sm text-success font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Recordatorios activos
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {customReminders.length} notificaciones diarias programadas
                </p>
              </div>
            )}

            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">
                  Horarios de recordatorio:
                </p>
                <Link to="/settings/notifications">
                  <Button variant="ghost" size="sm" className="h-6 text-xs gap-1">
                    <Settings className="h-3 w-3" />
                    Personalizar
                  </Button>
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {customReminders.map((reminder) => (
                  <Badge key={reminder.id} variant="outline" className="text-xs">
                    {reminder.hour.toString().padStart(2, "0")}:{reminder.minute.toString().padStart(2, "0")}
                  </Badge>
                ))}
              </div>
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleTestNotification}
              className="w-full gap-2"
            >
              <TestTube className="h-4 w-4" />
              Enviar notificación de prueba
            </Button>
          </motion.div>
        )}
      </div>
    </Card>
  );
}
