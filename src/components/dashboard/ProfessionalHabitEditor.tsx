import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useAdminMode } from "@/hooks/useAdminMode";
import {
  Save, Edit, Unlock, Lock, Play, StopCircle, Plus, Trash2,
  MessageSquare, Clock, Moon, Activity, Smartphone, Sparkles, Leaf
} from "lucide-react";

const ADVANCED_HABITS = [
  { id: "sauna", name: "Saunas", description: "Sesiones de sauna finlandesa" },
  { id: "cold_bath", name: "Baños Fríos", description: "Inmersión en agua fría" },
  { id: "meditation", name: "Meditación", description: "Práctica de meditación guiada" },
  { id: "yoga", name: "Yoga", description: "Sesiones de yoga y estiramientos" },
];

// Goal editing popover for individual metrics
function GoalEditor({ 
  label, icon, value, onChange, options, unit, onSave, isSaving 
}: { 
  label: string;
  icon: React.ReactNode;
  value: number;
  onChange: (v: number) => void;
  options: number[];
  unit: string;
  onSave: () => void;
  isSaving: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);

  if (!isEditing) {
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        className="w-full mt-2 text-xs gap-1 text-muted-foreground hover:text-primary"
        onClick={() => setIsEditing(true)}
      >
        <Edit className="h-3 w-3" />
        Editar meta: {value} {unit}
      </Button>
    );
  }

  return (
    <div className="mt-2 p-3 bg-muted/50 rounded-lg border border-border space-y-2">
      <div className="flex items-center gap-2 text-xs font-medium">
        {icon}
        <span>{label}</span>
      </div>
      <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(n => (
            <SelectItem key={n} value={String(n)}>{n} {unit}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex gap-2">
        <Button size="sm" className="h-7 text-xs flex-1 gap-1" onClick={() => { onSave(); setIsEditing(false); }} disabled={isSaving}>
          <Save className="h-3 w-3" />
          Guardar
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setIsEditing(false)}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

export function ProfessionalHabitEditor() {
  const { user } = useAuth();
  const { selectedPatient } = useAdminMode();
  const queryClient = useQueryClient();
  const patientId = selectedPatient?.userId;

  // Goal states
  const [sleepHoursGoal, setSleepHoursGoal] = useState(7.5);
  const [sleepQualityGoal, setSleepQualityGoal] = useState(85);
  const [activitySessionsGoal, setActivitySessionsGoal] = useState(4);
  const [activityDurationGoal, setActivityDurationGoal] = useState(30);
  const [screenTimeGoal, setScreenTimeGoal] = useState(90);
  const [phoneUnlocksGoal, setPhoneUnlocksGoal] = useState(50);
  const [selectedMonth, setSelectedMonth] = useState(1);

  // Fetch cycle to determine month
  const { data: activeCycle } = useQuery({
    queryKey: ["patient-cycle", patientId],
    queryFn: async () => {
      if (!patientId) return null;
      const { data } = await supabase
        .from("user_cycles").select("*").eq("user_id", patientId).eq("is_active", true).maybeSingle();
      return data;
    },
    enabled: !!patientId,
  });

  useEffect(() => {
    if (activeCycle) {
      const days = Math.floor((Date.now() - new Date(activeCycle.started_at).getTime()) / (1000*60*60*24));
      setSelectedMonth(Math.ceil(days / 28) || 1);
    }
  }, [activeCycle]);

  // Fetch habit goals
  const { data: habitGoals = [] } = useQuery({
    queryKey: ["habit-goals", patientId, selectedMonth],
    queryFn: async () => {
      if (!patientId) return [];
      const { data } = await supabase
        .from("habit_goals").select("*").eq("user_id", patientId).eq("month", selectedMonth);
      return data || [];
    },
    enabled: !!patientId,
  });

  useEffect(() => {
    if (habitGoals.length > 0) {
      const find = (t: string) => habitGoals.find(g => g.habit_type === t);
      if (find("sleep_hours")) setSleepHoursGoal(find("sleep_hours")!.target_value);
      if (find("sleep_quality")) setSleepQualityGoal(find("sleep_quality")!.target_value);
      if (find("activity_sessions")) setActivitySessionsGoal(find("activity_sessions")!.target_value);
      if (find("activity_duration")) setActivityDurationGoal(find("activity_duration")!.target_value);
      if (find("screen_time")) setScreenTimeGoal(find("screen_time")!.target_value);
      if (find("phone_unlocks")) setPhoneUnlocksGoal(find("phone_unlocks")!.target_value);
    }
  }, [habitGoals]);

  // Fetch unlocked habits
  const { data: unlockedHabitIds = [] } = useQuery({
    queryKey: ["patient-unlocked-habits", patientId],
    queryFn: async () => {
      if (!patientId) return [];
      const { data } = await supabase
        .from("unlocked_habits").select("habit_id").eq("user_id", patientId);
      return data?.map(h => h.habit_id) || [];
    },
    enabled: !!patientId,
  });

  // Fetch survey questions
  const { data: surveyQuestions = [] } = useQuery({
    queryKey: ["admin-survey-questions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("daily_survey_questions").select("*").order("week_start").order("display_order");
      return data || [];
    },
  });

  // Fetch patient settings (for survey time)
  const { data: patientSettings } = useQuery({
    queryKey: ["patient-settings", patientId],
    queryFn: async () => {
      if (!patientId) return null;
      const { data } = await supabase
        .from("user_settings").select("*").eq("user_id", patientId).maybeSingle();
      return data;
    },
    enabled: !!patientId,
  });

  // Save a single goal type
  const saveGoalMutation = useMutation({
    mutationFn: async ({ habitType, targetValue }: { habitType: string; targetValue: number }) => {
      if (!patientId) throw new Error("No patient");
      const { error } = await supabase
        .from("habit_goals")
        .upsert({ user_id: patientId, habit_type: habitType, month: selectedMonth, target_value: targetValue, set_by: user?.id }, 
          { onConflict: 'user_id,habit_type,month' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habit-goals", patientId] });
      queryClient.invalidateQueries({ queryKey: ["user-habit-goals"] });
      toast.success("Meta actualizada");
    },
    onError: (e) => toast.error("Error: " + e.message),
  });

  // Toggle habit
  const toggleHabitMutation = useMutation({
    mutationFn: async ({ habitId, unlock }: { habitId: string; unlock: boolean }) => {
      if (!patientId) throw new Error("No patient");
      if (unlock) {
        await supabase.from("unlocked_habits").insert({ user_id: patientId, habit_id: habitId, unlocked_by: user?.id });
      } else {
        await supabase.from("unlocked_habits").delete().eq("user_id", patientId).eq("habit_id", habitId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-unlocked-habits", patientId] });
      queryClient.invalidateQueries({ queryKey: ["unlocked-habits"] });
      toast.success("Hábito actualizado");
    },
    onError: (e) => toast.error("Error: " + e.message),
  });

  // Cycle mutations
  const startCycleMutation = useMutation({
    mutationFn: async () => {
      if (!patientId) throw new Error("No patient");
      await supabase.from("user_cycles").update({ is_active: false }).eq("user_id", patientId).eq("is_active", true);
      const { error } = await supabase.from("user_cycles").insert({ user_id: patientId, started_by: user?.id, is_active: true });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-cycle", patientId] });
      toast.success("Ciclo iniciado");
    },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const stopCycleMutation = useMutation({
    mutationFn: async () => {
      if (!patientId) throw new Error("No patient");
      await supabase.from("user_cycles").update({ is_active: false }).eq("user_id", patientId).eq("is_active", true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-cycle", patientId] });
      toast.success("Ciclo detenido");
    },
    onError: (e) => toast.error("Error: " + e.message),
  });

  // Survey time
  const [surveyTime, setSurveyTime] = useState(patientSettings?.breakfast_time?.slice(0, 5) || "08:00");
  useEffect(() => {
    if (patientSettings?.breakfast_time) setSurveyTime(patientSettings.breakfast_time.slice(0, 5));
  }, [patientSettings]);

  const saveSurveyTimeMutation = useMutation({
    mutationFn: async () => {
      if (!patientId) throw new Error("No patient");
      const { data: existing } = await supabase.from("user_settings").select("id").eq("user_id", patientId).maybeSingle();
      if (existing) {
        await supabase.from("user_settings").update({ breakfast_time: surveyTime + ":00" }).eq("user_id", patientId);
      } else {
        await supabase.from("user_settings").insert({ user_id: patientId, breakfast_time: surveyTime + ":00" });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-settings", patientId] });
      toast.success("Hora de encuesta actualizada");
    },
    onError: (e) => toast.error("Error: " + e.message),
  });

  // Survey question management
  const [newQuestion, setNewQuestion] = useState({ question_text: "", week_start: 1, week_end: 4, follow_up_label: "", follow_up_options: "", habit_category: "" });

  const addQuestionMutation = useMutation({
    mutationFn: async () => {
      const followUpOptions = newQuestion.follow_up_options ? newQuestion.follow_up_options.split(",").map(o => o.trim()) : null;
      const { error } = await supabase.from("daily_survey_questions").insert({
        question_text: newQuestion.question_text,
        week_start: newQuestion.week_start,
        week_end: newQuestion.week_end,
        follow_up_label: newQuestion.follow_up_label || null,
        follow_up_options: followUpOptions,
        habit_category: newQuestion.habit_category || null,
        display_order: surveyQuestions.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-survey-questions"] });
      setNewQuestion({ question_text: "", week_start: 1, week_end: 4, follow_up_label: "", follow_up_options: "", habit_category: "" });
      toast.success("Pregunta añadida");
    },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("daily_survey_questions").delete().eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-survey-questions"] });
      toast.success("Pregunta eliminada");
    },
  });

  const toggleQuestionMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await supabase.from("daily_survey_questions").update({ is_active: isActive }).eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-survey-questions"] });
    },
  });

  const getCycleInfo = () => {
    if (!activeCycle) return null;
    const days = Math.floor((Date.now() - new Date(activeCycle.started_at).getTime()) / (1000*60*60*24));
    return { week: Math.min(Math.floor(days / 7) + 1, 4), days };
  };

  const cycleInfo = getCycleInfo();

  if (!patientId) return null;

  return (
    <div className="space-y-6">
      {/* Cycle Management */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-4">
          <h3 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
            <Play className="h-4 w-4 text-primary" />
            Gestión de Ciclo
          </h3>
          {activeCycle ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Ciclo activo — Semana {cycleInfo?.week}/4 (Día {cycleInfo?.days})
              </p>
              <p className="text-xs text-muted-foreground">
                Inicio: {new Date(activeCycle.started_at).toLocaleDateString("es-ES")}
              </p>
              <Button size="sm" variant="destructive" className="gap-1" onClick={() => stopCycleMutation.mutate()} disabled={stopCycleMutation.isPending}>
                <StopCircle className="h-3 w-3" />
                Detener Ciclo
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Sin ciclo activo</p>
              <Button size="sm" className="gap-1" onClick={() => startCycleMutation.mutate()} disabled={startCycleMutation.isPending}>
                <Play className="h-3 w-3" />
                Iniciar Ciclo
              </Button>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Month selector for goals */}
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Label className="text-sm font-medium">Mes del ciclo para metas:</Label>
          <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
            <SelectTrigger className="w-28 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1,2,3,4,5,6].map(m => (
                <SelectItem key={m} value={String(m)}>Mes {m}</SelectItem>
              ))
              }
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Goal editors rendered under each habit metric - these are exported for inline use */}
      {/* Below are the standalone management sections */}

      {/* Unlock Advanced Habits */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="p-4">
          <h3 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Hábitos Avanzados
          </h3>
          <div className="space-y-2">
            {ADVANCED_HABITS.map(habit => {
              const unlocked = unlockedHabitIds.includes(habit.id);
              return (
                <div key={habit.id} className={`p-3 rounded-lg border flex items-center justify-between ${unlocked ? 'bg-success/10 border-success/30' : 'bg-muted/30 border-border'}`}>
                  <div>
                    <p className="text-sm font-medium">{habit.name}</p>
                    <p className="text-xs text-muted-foreground">{habit.description}</p>
                  </div>
                  <Button
                    size="icon"
                    variant={unlocked ? "default" : "outline"}
                    className={`h-8 w-8 ${unlocked ? 'bg-success hover:bg-success/90' : ''}`}
                    onClick={() => toggleHabitMutation.mutate({ habitId: habit.id, unlock: !unlocked })}
                    disabled={toggleHabitMutation.isPending}
                  >
                    {unlocked ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>
      </motion.div>

      {/* Daily Survey Config */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="p-4">
          <h3 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Encuesta Diaria
          </h3>

          {/* Survey time */}
          <div className="flex items-end gap-3 mb-4 p-3 bg-accent/10 rounded-lg">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Hora de la encuesta</Label>
              <Input type="time" value={surveyTime} onChange={(e) => setSurveyTime(e.target.value)} className="h-8 text-xs" />
            </div>
            <Button size="sm" className="h-8 gap-1" onClick={() => saveSurveyTimeMutation.mutate()} disabled={saveSurveyTimeMutation.isPending}>
              <Save className="h-3 w-3" />
            </Button>
          </div>

          {/* Existing questions */}
          <div className="space-y-2 mb-4">
            {surveyQuestions.map(q => (
              <div key={q.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs">
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{q.question_text}</p>
                  <p className="text-muted-foreground">Sem {q.week_start}-{q.week_end}</p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <Switch
                    checked={q.is_active}
                    onCheckedChange={(checked) => toggleQuestionMutation.mutate({ id: q.id, isActive: checked })}
                  />
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => deleteQuestionMutation.mutate(q.id)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Add new question */}
          <div className="space-y-2 p-3 border border-dashed border-border rounded-lg">
            <p className="text-xs font-medium">Nueva pregunta</p>
            <Input
              placeholder="Texto de la pregunta..."
              value={newQuestion.question_text}
              onChange={(e) => setNewQuestion(p => ({ ...p, question_text: e.target.value }))}
              className="h-8 text-xs"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px]">Semana inicio</Label>
                <Select value={String(newQuestion.week_start)} onValueChange={(v) => setNewQuestion(p => ({ ...p, week_start: Number(v) }))}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4].map(w => <SelectItem key={w} value={String(w)}>Sem {w}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px]">Semana fin</Label>
                <Select value={String(newQuestion.week_end)} onValueChange={(v) => setNewQuestion(p => ({ ...p, week_end: Number(v) }))}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4].map(w => <SelectItem key={w} value={String(w)}>Sem {w}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Input
              placeholder="Categoría (ej: sugar, meals...)"
              value={newQuestion.habit_category}
              onChange={(e) => setNewQuestion(p => ({ ...p, habit_category: e.target.value }))}
              className="h-7 text-xs"
            />
            <Button size="sm" className="w-full h-7 text-xs gap-1" onClick={() => addQuestionMutation.mutate()} disabled={!newQuestion.question_text || addQuestionMutation.isPending}>
              <Plus className="h-3 w-3" />
              Añadir Pregunta
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

// Inline goal editor that goes below each MetricCard
export function InlineGoalEditor({
  habitType,
  currentValue,
  options,
  unit,
  patientId,
  selectedMonth,
}: {
  habitType: string;
  currentValue: number;
  options: number[];
  unit: string;
  patientId: string;
  selectedMonth: number;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(currentValue);

  useEffect(() => { setValue(currentValue); }, [currentValue]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("habit_goals")
        .upsert({ user_id: patientId, habit_type: habitType, month: selectedMonth, target_value: value, set_by: user?.id },
          { onConflict: 'user_id,habit_type,month' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habit-goals", patientId] });
      queryClient.invalidateQueries({ queryKey: ["user-habit-goals"] });
      toast.success("Meta actualizada");
      setIsEditing(false);
    },
    onError: (e) => toast.error("Error: " + e.message),
  });

  if (!isEditing) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="w-full mt-1 text-xs gap-1 text-muted-foreground hover:text-primary h-7"
        onClick={() => setIsEditing(true)}
      >
        <Edit className="h-3 w-3" />
        Editar meta
      </Button>
    );
  }

  return (
    <div className="mt-1 p-2 bg-muted/50 rounded-lg border border-border space-y-2">
      <Select value={String(value)} onValueChange={(v) => setValue(Number(v))}>
        <SelectTrigger className="h-7 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(n => (
            <SelectItem key={n} value={String(n)}>{n} {unit}</SelectItem>
          ))
          }
        </SelectContent>
      </Select>
      <div className="flex gap-1">
        <Button size="sm" className="h-6 text-[10px] flex-1 gap-1" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          <Save className="h-3 w-3" />
          Guardar
        </Button>
        <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => setIsEditing(false)}>
          ✕
        </Button>
      </div>
    </div>
  );
}
