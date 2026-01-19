import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Clock, Save, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BreakfastTimeSettingProps {
  className?: string;
}

export function BreakfastTimeSetting({ className }: BreakfastTimeSettingProps) {
  const { user } = useAuth();
  const [breakfastTime, setBreakfastTime] = useState("08:00");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadBreakfastTime = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("user_settings")
          .select("breakfast_time")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (data?.breakfast_time) {
          // Format time from database (HH:MM:SS) to input format (HH:MM)
          setBreakfastTime(data.breakfast_time.substring(0, 5));
        }
      } catch (error) {
        console.error("Error loading breakfast time:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBreakfastTime();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      // Check if settings exist
      const { data: existing } = await supabase
        .from("user_settings")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("user_settings")
          .update({ breakfast_time: breakfastTime })
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_settings").insert({
          user_id: user.id,
          breakfast_time: breakfastTime,
        });

        if (error) throw error;
      }

      toast.success("Hora de desayuno guardada");
    } catch (error) {
      console.error("Error saving breakfast time:", error);
      toast.error("Error al guardar la hora");
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate reminder time (5 minutes before breakfast)
  const getReminderTime = () => {
    const [hours, minutes] = breakfastTime.split(":").map(Number);
    let reminderMinutes = minutes - 5;
    let reminderHours = hours;

    if (reminderMinutes < 0) {
      reminderMinutes += 60;
      reminderHours -= 1;
      if (reminderHours < 0) reminderHours = 23;
    }

    return `${String(reminderHours).padStart(2, "0")}:${String(reminderMinutes).padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Hora de Desayuno</CardTitle>
        </div>
        <CardDescription>
          Configura tu hora habitual de desayuno para recibir el recordatorio de logros diarios
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="breakfast-time">Hora del desayuno</Label>
          <Input
            id="breakfast-time"
            type="time"
            value={breakfastTime}
            onChange={(e) => setBreakfastTime(e.target.value)}
            className="w-full"
          />
        </div>

        <p className="text-sm text-muted-foreground">
          Recibirás el recordatorio de logros diarios a las{" "}
          <span className="font-medium text-foreground">{getReminderTime()}</span>
          {" "}(5 minutos antes del desayuno)
        </p>

        <Button onClick={handleSave} disabled={isSaving} className="w-full gap-2">
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Guardar
        </Button>
      </CardContent>
    </Card>
  );
}
