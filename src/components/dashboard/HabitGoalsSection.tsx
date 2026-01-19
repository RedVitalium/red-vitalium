import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save, Smartphone, Monitor, Leaf, Moon, Heart, Activity } from "lucide-react";

interface HabitGoalsSectionProps {
  patientId: string | undefined;
  adminId: string | undefined;
  currentMonth: number; // Current month of the cycle (1-4+)
}

// Screen time options (15 min increments)
const screenTimeOptions = [30, 45, 60, 75, 90, 105, 120, 135, 150, 180, 210, 240];

// Phone unlocks options (10 increments)
const phoneUnlocksOptions = [20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 150];

// Yoga sessions options
const yogaSessionOptions = [1, 2, 3, 4, 5, 6, 7];

// Sleep hours options (0.5 increments)
const sleepHoursOptions = [6, 6.5, 7, 7.5, 8, 8.5, 9];

// Sleep quality score options (5 increments)
const sleepQualityOptions = [70, 75, 80, 85, 90, 95, 100];

// Activity sessions options
const activitySessionOptions = [1, 2, 3, 4, 5, 6, 7];

// Activity duration options (5 min increments)
const activityDurationOptions = [15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 75, 90];

export function HabitGoalsSection({ patientId, adminId, currentMonth }: HabitGoalsSectionProps) {
  const queryClient = useQueryClient();
  const [screenTimeGoal, setScreenTimeGoal] = useState(90);
  const [phoneUnlocksGoal, setPhoneUnlocksGoal] = useState(50);
  const [yogaGoal, setYogaGoal] = useState(3);
  const [sleepHoursGoal, setSleepHoursGoal] = useState(7.5);
  const [sleepQualityGoal, setSleepQualityGoal] = useState(85);
  const [activitySessionsGoal, setActivitySessionsGoal] = useState(4);
  const [activityDurationGoal, setActivityDurationGoal] = useState(30);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // Fetch existing goals for the selected month
  const { data: habitGoals = [], isLoading } = useQuery({
    queryKey: ["habit-goals", patientId, selectedMonth],
    queryFn: async () => {
      if (!patientId) return [];
      const { data, error } = await supabase
        .from("habit_goals")
        .select("*")
        .eq("user_id", patientId)
        .eq("month", selectedMonth);
      if (error) throw error;
      return data || [];
    },
    enabled: !!patientId,
  });

  // Update local state when data loads
  useEffect(() => {
    if (habitGoals.length > 0) {
      const screenTime = habitGoals.find(g => g.habit_type === "screen_time");
      const phoneUnlocks = habitGoals.find(g => g.habit_type === "phone_unlocks");
      const yoga = habitGoals.find(g => g.habit_type === "yoga");
      const sleepHours = habitGoals.find(g => g.habit_type === "sleep_hours");
      const sleepQuality = habitGoals.find(g => g.habit_type === "sleep_quality");
      const activitySessions = habitGoals.find(g => g.habit_type === "activity_sessions");
      const activityDuration = habitGoals.find(g => g.habit_type === "activity_duration");
      
      if (screenTime) setScreenTimeGoal(screenTime.target_value);
      if (phoneUnlocks) setPhoneUnlocksGoal(phoneUnlocks.target_value);
      if (yoga) setYogaGoal(yoga.target_value);
      if (sleepHours) setSleepHoursGoal(sleepHours.target_value);
      if (sleepQuality) setSleepQualityGoal(sleepQuality.target_value);
      if (activitySessions) setActivitySessionsGoal(activitySessions.target_value);
      if (activityDuration) setActivityDurationGoal(activityDuration.target_value);
    } else {
      // Set defaults
      setScreenTimeGoal(90);
      setPhoneUnlocksGoal(50);
      setYogaGoal(3);
      setSleepHoursGoal(7.5);
      setSleepQualityGoal(85);
      setActivitySessionsGoal(4);
      setActivityDurationGoal(30);
    }
  }, [habitGoals]);

  const saveGoalsMutation = useMutation({
    mutationFn: async () => {
      if (!patientId) throw new Error("No patient selected");
      
      const goals = [
        { user_id: patientId, habit_type: "screen_time", month: selectedMonth, target_value: screenTimeGoal, set_by: adminId },
        { user_id: patientId, habit_type: "phone_unlocks", month: selectedMonth, target_value: phoneUnlocksGoal, set_by: adminId },
        { user_id: patientId, habit_type: "yoga", month: selectedMonth, target_value: yogaGoal, set_by: adminId },
        { user_id: patientId, habit_type: "sleep_hours", month: selectedMonth, target_value: sleepHoursGoal, set_by: adminId },
        { user_id: patientId, habit_type: "sleep_quality", month: selectedMonth, target_value: sleepQualityGoal, set_by: adminId },
        { user_id: patientId, habit_type: "activity_sessions", month: selectedMonth, target_value: activitySessionsGoal, set_by: adminId },
        { user_id: patientId, habit_type: "activity_duration", month: selectedMonth, target_value: activityDurationGoal, set_by: adminId },
      ];

      // Upsert each goal
      for (const goal of goals) {
        const { error } = await supabase
          .from("habit_goals")
          .upsert(goal, { onConflict: 'user_id,habit_type,month' });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habit-goals", patientId] });
      queryClient.invalidateQueries({ queryKey: ["user-habit-goals"] });
      toast.success(`Metas del mes ${selectedMonth} guardadas`);
    },
    onError: (error) => {
      toast.error("Error al guardar metas: " + error.message);
    },
  });

  if (!patientId) {
    return (
      <div className="p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground">
        Seleccione un paciente para configurar metas de hábitos
      </div>
    );
  }

  const monthOptions = [1, 2, 3, 4, 5, 6];

  return (
    <div className="space-y-4">
      {/* Month Selector */}
      <div className="flex items-center gap-4 p-3 bg-primary/10 rounded-lg">
        <Label className="whitespace-nowrap">Mes del ciclo:</Label>
        <Select
          value={String(selectedMonth)}
          onValueChange={(value) => setSelectedMonth(parseInt(value))}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map(m => (
              <SelectItem key={m} value={String(m)}>Mes {m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">
          (Las metas son progresivas por mes)
        </span>
      </div>

      {/* Sleep Hours Goal */}
      <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <Moon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-display font-semibold">Meta de Horas de Sueño</h4>
            <p className="text-sm text-muted-foreground">Horas mínimas de sueño diario</p>
          </div>
        </div>
        <Select
          value={String(sleepHoursGoal)}
          onValueChange={(value) => setSleepHoursGoal(parseFloat(value))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sleepHoursOptions.map(n => (
              <SelectItem key={n} value={String(n)}>
                {">= "}{n} horas/día
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sleep Quality Goal */}
      <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <Heart className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-display font-semibold">Meta de Calidad de Sueño</h4>
            <p className="text-sm text-muted-foreground">Puntuación mínima del tracker</p>
          </div>
        </div>
        <Select
          value={String(sleepQualityGoal)}
          onValueChange={(value) => setSleepQualityGoal(parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sleepQualityOptions.map(n => (
              <SelectItem key={n} value={String(n)}>
                {">= "}{n} puntos
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Activity Sessions Goal */}
      <div className="p-4 bg-success/10 border border-success/30 rounded-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-success/20">
            <Activity className="h-5 w-5 text-success" />
          </div>
          <div>
            <h4 className="font-display font-semibold">Meta de Actividad Física</h4>
            <p className="text-sm text-muted-foreground">Sesiones y duración promedio por semana</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Sesiones/semana</Label>
            <Select
              value={String(activitySessionsGoal)}
              onValueChange={(value) => setActivitySessionsGoal(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {activitySessionOptions.map(n => (
                  <SelectItem key={n} value={String(n)}>
                    {n} {n === 1 ? 'sesión' : 'sesiones'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Duración promedio</Label>
            <Select
              value={String(activityDurationGoal)}
              onValueChange={(value) => setActivityDurationGoal(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {activityDurationOptions.map(n => (
                  <SelectItem key={n} value={String(n)}>
                    {">= "}{n} min
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Screen Time Goal */}
      <div className="p-4 bg-warning/10 border border-warning/30 rounded-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-warning/20">
            <Monitor className="h-5 w-5 text-warning" />
          </div>
          <div>
            <h4 className="font-display font-semibold">Meta de Tiempo en Pantalla</h4>
            <p className="text-sm text-muted-foreground">Promedio diario máximo</p>
          </div>
        </div>
        <Select
          value={String(screenTimeGoal)}
          onValueChange={(value) => setScreenTimeGoal(parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {screenTimeOptions.map(n => (
              <SelectItem key={n} value={String(n)}>
                {"< "}{n} minutos/día
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Phone Unlocks Goal */}
      <div className="p-4 bg-warning/10 border border-warning/30 rounded-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-warning/20">
            <Smartphone className="h-5 w-5 text-warning" />
          </div>
          <div>
            <h4 className="font-display font-semibold">Meta de Desbloqueos</h4>
            <p className="text-sm text-muted-foreground">Promedio diario máximo</p>
          </div>
        </div>
        <Select
          value={String(phoneUnlocksGoal)}
          onValueChange={(value) => setPhoneUnlocksGoal(parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {phoneUnlocksOptions.map(n => (
              <SelectItem key={n} value={String(n)}>
                {"< "}{n} desbloqueos/día
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Yoga Goal */}
      <div className="p-4 bg-success/10 border border-success/30 rounded-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-success/20">
            <Leaf className="h-5 w-5 text-success" />
          </div>
          <div>
            <h4 className="font-display font-semibold">Meta de Yoga</h4>
            <p className="text-sm text-muted-foreground">Sesiones por semana</p>
          </div>
        </div>
        <Select
          value={String(yogaGoal)}
          onValueChange={(value) => setYogaGoal(parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {yogaSessionOptions.map(n => (
              <SelectItem key={n} value={String(n)}>
                {n} {n === 1 ? 'sesión' : 'sesiones'}/semana
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button 
        onClick={() => saveGoalsMutation.mutate()}
        disabled={saveGoalsMutation.isPending || isLoading}
        className="w-full gap-2"
      >
        <Save className="h-4 w-4" />
        {saveGoalsMutation.isPending ? "Guardando..." : `Guardar Metas del Mes ${selectedMonth}`}
      </Button>
    </div>
  );
}
