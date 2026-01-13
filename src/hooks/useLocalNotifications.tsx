import { useEffect, useState, useCallback } from "react";
import { LocalNotifications, ScheduleOptions } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";

export interface ReminderNotification {
  id: number;
  title: string;
  body: string;
  hour: number;
  minute: number;
}

// Default habit reminders for weeks 1-3
export const defaultHabitReminders: ReminderNotification[] = [
  {
    id: 1,
    title: "🍽️ Hora de la última comida",
    body: "Recuerda terminar tu última comida del día para mejorar tu descanso",
    hour: 19,
    minute: 0,
  },
  {
    id: 2,
    title: "🌙 Prepárate para dormir",
    body: "Es hora de comenzar tu rutina de relajación antes de dormir",
    hour: 21,
    minute: 0,
  },
  {
    id: 3,
    title: "😴 Hora de acostarte",
    body: "Deja el teléfono y prepárate para un sueño reparador",
    hour: 22,
    minute: 30,
  },
  {
    id: 4,
    title: "🏃 Recordatorio de actividad",
    body: "¿Ya realizaste tu actividad física hoy? ¡Mantén el ritmo!",
    hour: 10,
    minute: 0,
  },
  {
    id: 5,
    title: "📱 Control de pantalla",
    body: "Considera tomar un descanso de las pantallas",
    hour: 15,
    minute: 0,
  },
];

const STORAGE_KEY = "customReminderSettings";

// Helper to load custom reminders from storage
export function loadCustomReminders(): ReminderNotification[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed
        .filter((r: { enabled?: boolean }) => r.enabled !== false)
        .map((r: { id: number; notificationTitle: string; notificationBody: string; hour: number; minute: number }) => ({
          id: r.id,
          title: r.notificationTitle,
          body: r.notificationBody,
          hour: r.hour,
          minute: r.minute,
        }));
    }
  } catch (e) {
    console.error("Error loading custom reminders:", e);
  }
  return defaultHabitReminders;
}

export function useLocalNotifications() {
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isNative, setIsNative] = useState<boolean>(false);

  useEffect(() => {
    // Check if running on native platform
    const native = Capacitor.isNativePlatform();
    setIsNative(native);

    if (native) {
      checkPermissions();
    }
  }, []);

  const checkPermissions = async () => {
    try {
      const status = await LocalNotifications.checkPermissions();
      setHasPermission(status.display === "granted");
    } catch (error) {
      console.error("Error checking notification permissions:", error);
    }
  };

  const requestPermissions = async (): Promise<boolean> => {
    if (!isNative) {
      console.log("Not running on native platform");
      return false;
    }

    try {
      const status = await LocalNotifications.requestPermissions();
      const granted = status.display === "granted";
      setHasPermission(granted);
      return granted;
    } catch (error) {
      console.error("Error requesting notification permissions:", error);
      return false;
    }
  };

  const scheduleHabitReminders = useCallback(async (reminders: ReminderNotification[]): Promise<boolean> => {
    if (!isNative) {
      console.log("Notifications: Not running on native platform");
      return false;
    }

    if (!hasPermission) {
      const granted = await requestPermissions();
      if (!granted) {
        console.log("Notification permission not granted");
        return false;
      }
    }

    try {
      // Cancel existing notifications first
      await cancelAllNotifications();

      // Schedule daily notifications for each reminder
      const notifications: ScheduleOptions = {
        notifications: reminders.map((reminder) => ({
          id: reminder.id,
          title: reminder.title,
          body: reminder.body,
          schedule: {
            on: {
              hour: reminder.hour,
              minute: reminder.minute,
            },
            repeats: true,
            allowWhileIdle: true,
          },
          sound: "default",
          smallIcon: "ic_stat_icon_config_sample",
          iconColor: "#6366f1",
        })),
      };

      await LocalNotifications.schedule(notifications);
      console.log("Scheduled", reminders.length, "habit reminder notifications");
      return true;
    } catch (error) {
      console.error("Error scheduling notifications:", error);
      return false;
    }
  }, [isNative, hasPermission]);

  const cancelAllNotifications = async (): Promise<void> => {
    if (!isNative) return;

    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({
          notifications: pending.notifications.map((n) => ({ id: n.id })),
        });
      }
      console.log("Cancelled all pending notifications");
    } catch (error) {
      console.error("Error cancelling notifications:", error);
    }
  };

  const scheduleTestNotification = async (): Promise<boolean> => {
    if (!isNative) {
      console.log("Notifications: Not running on native platform");
      return false;
    }

    if (!hasPermission) {
      const granted = await requestPermissions();
      if (!granted) return false;
    }

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 999,
            title: "🔔 Prueba de notificación",
            body: "¡Las notificaciones están funcionando correctamente!",
            schedule: {
              at: new Date(Date.now() + 3000), // 3 seconds from now
            },
            sound: "default",
          },
        ],
      });
      return true;
    } catch (error) {
      console.error("Error scheduling test notification:", error);
      return false;
    }
  };

  return {
    hasPermission,
    isNative,
    requestPermissions,
    scheduleHabitReminders,
    cancelAllNotifications,
    scheduleTestNotification,
  };
}
