import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/custom-client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export interface ReminderConfig {
  id: number;
  title: string;
  description: string;
  hour: number;
  minute: number;
  enabled: boolean;
  notificationTitle: string;
  notificationBody: string;
}

export interface SleepSettings {
  bedtime: number;
  sleepGoal: number;
}

export interface RemindersPageSettings {
  reminders: {
    id: string;
    type: string;
    enabled: boolean;
    time: string;
  }[];
}

export interface UserSettings {
  notificationSettings: ReminderConfig[];
  notificationsEnabled: boolean;
  bedtime: number;
  sleepGoal: number;
  reminders: RemindersPageSettings["reminders"];
}

const defaultNotificationSettings: ReminderConfig[] = [
  {
    id: 1,
    title: "Última comida",
    description: "Recordatorio para terminar tu última comida del día",
    hour: 19,
    minute: 0,
    enabled: true,
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
    notificationTitle: "📱 Control de pantalla",
    notificationBody: "Considera tomar un descanso de las pantallas",
  },
];

const defaultRemindersPage = [
  { id: "meal", type: "meal", enabled: true, time: "19:00" },
  { id: "screen", type: "screen-break", enabled: true, time: "20:00" },
  { id: "prepare", type: "prepare-sleep", enabled: true, time: "21:30" },
  { id: "bed", type: "bedtime", enabled: true, time: "22:30" },
  { id: "wake", type: "morning", enabled: true, time: "06:30" },
];

const defaultSettings: UserSettings = {
  notificationSettings: defaultNotificationSettings,
  notificationsEnabled: true,
  bedtime: 22.5,
  sleepGoal: 7.5,
  reminders: defaultRemindersPage,
};

export function useUserSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings from cloud or localStorage
  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    
    if (user) {
      try {
        const { data, error } = await supabase
          .from("user_settings")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          const notifSettings = Array.isArray(data.notification_settings) 
            ? (data.notification_settings as unknown as ReminderConfig[])
            : defaultNotificationSettings;
          
          const pageReminders = Array.isArray(data.reminders)
            ? (data.reminders as unknown as RemindersPageSettings["reminders"])
            : defaultRemindersPage;

          setSettings({
            notificationSettings: notifSettings,
            notificationsEnabled: data.notifications_enabled ?? true,
            bedtime: data.bedtime ?? 22.5,
            sleepGoal: data.sleep_goal ?? 7.5,
            reminders: pageReminders,
          });
        } else {
          // No settings in cloud, try localStorage for migration
          const localNotifications = localStorage.getItem("customReminderSettings");
          if (localNotifications) {
            const parsed = JSON.parse(localNotifications);
            const migrated = {
              ...defaultSettings,
              notificationSettings: defaultNotificationSettings.map(def => {
                const saved = parsed.find((r: ReminderConfig) => r.id === def.id);
                return saved ? { ...def, ...saved } : def;
              }),
            };
            setSettings(migrated);
            // Save migrated settings to cloud
            await saveSettingsToCloud(migrated);
            // Clear localStorage after migration
            localStorage.removeItem("customReminderSettings");
          }
        }
      } catch (error) {
        console.error("Error loading settings from cloud:", error);
        // Fallback to localStorage
        loadFromLocalStorage();
      }
    } else {
      loadFromLocalStorage();
    }
    
    setIsLoading(false);
  }, [user]);

  const loadFromLocalStorage = () => {
    const localNotifications = localStorage.getItem("customReminderSettings");
    if (localNotifications) {
      try {
        const parsed = JSON.parse(localNotifications);
        setSettings(prev => ({
          ...prev,
          notificationSettings: defaultNotificationSettings.map(def => {
            const saved = parsed.find((r: ReminderConfig) => r.id === def.id);
            return saved ? { ...def, ...saved } : def;
          }),
        }));
      } catch (e) {
        console.error("Error loading from localStorage:", e);
      }
    }
  };

  const saveSettingsToCloud = async (newSettings: UserSettings): Promise<boolean> => {
    if (!user) return false;

    try {
      // Check if record exists
      const { data: existing } = await supabase
        .from("user_settings")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      const notifJson = JSON.parse(JSON.stringify(newSettings.notificationSettings)) as Json;
      const remindersJson = JSON.parse(JSON.stringify(newSettings.reminders)) as Json;

      if (existing) {
        const { error } = await supabase
          .from("user_settings")
          .update({
            notification_settings: notifJson,
            notifications_enabled: newSettings.notificationsEnabled,
            bedtime: newSettings.bedtime,
            sleep_goal: newSettings.sleepGoal,
            reminders: remindersJson,
          })
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_settings")
          .insert({
            user_id: user.id,
            notification_settings: notifJson,
            notifications_enabled: newSettings.notificationsEnabled,
            bedtime: newSettings.bedtime,
            sleep_goal: newSettings.sleepGoal,
            reminders: remindersJson,
          });
        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error("Error saving settings to cloud:", error);
      return false;
    }
  };

  const saveSettings = useCallback(async (newSettings: Partial<UserSettings>): Promise<boolean> => {
    setIsSaving(true);
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);

    let success = false;

    if (user) {
      success = await saveSettingsToCloud(updatedSettings);
      if (success) {
        toast.success("Configuración sincronizada en la nube");
      } else {
        // Fallback to localStorage
        localStorage.setItem("customReminderSettings", JSON.stringify(updatedSettings.notificationSettings));
        toast.warning("Guardado localmente (sin conexión)");
        success = true;
      }
    } else {
      // Not logged in, save to localStorage
      localStorage.setItem("customReminderSettings", JSON.stringify(updatedSettings.notificationSettings));
      toast.success("Configuración guardada localmente");
      success = true;
    }

    setIsSaving(false);
    return success;
  }, [user, settings]);

  const updateNotificationSettings = useCallback((notificationSettings: ReminderConfig[]) => {
    return saveSettings({ notificationSettings });
  }, [saveSettings]);

  const updateSleepSettings = useCallback((sleepSettings: SleepSettings) => {
    return saveSettings({
      bedtime: sleepSettings.bedtime,
      sleepGoal: sleepSettings.sleepGoal,
    });
  }, [saveSettings]);

  const updateReminders = useCallback((reminders: RemindersPageSettings["reminders"]) => {
    return saveSettings({ reminders });
  }, [saveSettings]);

  const resetToDefaults = useCallback(async (): Promise<boolean> => {
    return saveSettings(defaultSettings);
  }, [saveSettings]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    isLoading,
    isSaving,
    saveSettings,
    updateNotificationSettings,
    updateSleepSettings,
    updateReminders,
    resetToDefaults,
    defaultNotificationSettings,
    defaultRemindersPage,
  };
}
