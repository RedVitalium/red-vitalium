import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/custom-client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  User, 
  Search,
  Droplets, 
  Activity, 
  Calculator,
  Save,
  Unlock,
  Lock,
  FileText,
  TrendingUp,
  Play,
  StopCircle,
  Calendar,
  MessageSquare,
  Clock,
  Plus,
  Trash2,
  UserCircle,
  Brain,
  Settings
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { 
  calculateBiologicalAge, 
  biomarkerReferenceRanges,
  validateBiomarkers,
  BloodBiomarkers 
} from "@/lib/biological-age";
import { calculateVO2Max } from "@/lib/vo2max-calculator";
import { HabitGoalsSection } from "@/components/dashboard/HabitGoalsSection";

// Locked habits that can be unlocked by admin
const advancedHabits = [
  { id: "sauna", name: "Saunas", description: "Sesiones de sauna finlandesa" },
  { id: "cold_bath", name: "Baños Fríos", description: "Inmersión en agua fría" },
  { id: "meditation", name: "Meditación", description: "Práctica de meditación guiada" },
  { id: "yoga", name: "Yoga", description: "Sesiones de yoga y estiramientos" },
];

// ─── SurveyTimeConfig ───────────────────────────────────────
function SurveyTimeConfig({ 
  patientId, 
  currentBreakfastTime 
}: { 
  patientId: string | undefined; 
  currentBreakfastTime: string | null;
}) {
  const [surveyTime, setSurveyTime] = useState(currentBreakfastTime?.slice(0, 5) || "08:00");
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (currentBreakfastTime) {
      setSurveyTime(currentBreakfastTime.slice(0, 5));
    }
  }, [currentBreakfastTime]);

  const handleSave = async () => {
    if (!patientId) return;
    setIsSaving(true);
    try {
      const { data: existing } = await supabase
        .from("user_settings")
        .select("id")
        .eq("user_id", patientId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("user_settings")
          .update({ breakfast_time: surveyTime + ":00" })
          .eq("user_id", patientId);
      } else {
        await supabase
          .from("user_settings")
          .insert({ user_id: patientId, breakfast_time: surveyTime + ":00" });
      }
      
      queryClient.invalidateQueries({ queryKey: ["patient-settings", patientId] });
      toast.success("Hora de encuesta actualizada");
    } catch {
      toast.error("Error al guardar la hora");
    }
    setIsSaving(false);
  };

  const getReminderTime = () => {
    const [hours, minutes] = surveyTime.split(":").map(Number);
    let newMinutes = minutes - 5;
    let newHours = hours;
    if (newMinutes < 0) {
      newMinutes += 60;
      newHours = (newHours - 1 + 24) % 24;
    }
    return `${newHours.toString().padStart(2, "0")}:${newMinutes.toString().padStart(2, "0")}`;
  };

  return (
    <div className="p-4 bg-accent/10 border border-accent/30 rounded-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-accent/20">
          <Clock className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h4 className="font-display font-semibold">Hora de la Encuesta Diaria</h4>
          <p className="text-sm text-muted-foreground">
            El paciente recibirá un recordatorio 5 minutos antes de esta hora
          </p>
        </div>
      </div>
      <div className="flex items-end gap-4">
        <div className="flex-1 space-y-2">
          <Label htmlFor="survey-time">Hora del desayuno / encuesta</Label>
          <Input
            id="survey-time"
            type="time"
            value={surveyTime}
            onChange={(e) => setSurveyTime(e.target.value)}
            className="max-w-xs"
          />
          <p className="text-xs text-muted-foreground">
            Recordatorio a las: <span className="font-medium text-accent">{getReminderTime()}</span>
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving || !patientId}
          size="sm"
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </div>
  );
}

// ─── PersonalityResults ─────────────────────────────────────
function PersonalityResults({ patientId }: { patientId: string | undefined }) {
  const { data: testResults = [], isLoading } = useQuery({
    queryKey: ["patient-personality", patientId],
    queryFn: async () => {
      if (!patientId) return [];
      const { data, error } = await supabase
        .from("test_results")
        .select("*")
        .eq("user_id", patientId)
        .eq("test_id", "bfi-10")
        .order("completed_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      return data || [];
    },
    enabled: !!patientId,
  });

  if (!patientId) {
    return (
      <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
        Seleccione un paciente para ver sus resultados de personalidad
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
        Cargando resultados...
      </div>
    );
  }

  if (testResults.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
        El paciente aún no ha completado el test de personalidad BFI-10
      </div>
    );
  }

  const result = testResults[0];
  const scores = result.scores as Record<string, number>;
  const completedAt = new Date(result.completed_at).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const traits = [
    { key: "extraversion", label: "Extraversión", description: "Sociabilidad y energía" },
    { key: "agreeableness", label: "Amabilidad", description: "Cooperación y confianza" },
    { key: "conscientiousness", label: "Responsabilidad", description: "Organización y disciplina" },
    { key: "neuroticism", label: "Neuroticismo", description: "Estabilidad emocional (inverso)" },
    { key: "openness", label: "Apertura", description: "Creatividad y curiosidad" },
  ];

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Completado: {completedAt}</p>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {traits.map(trait => {
          const score = scores[trait.key] || 0;
          const percentage = (score / 5) * 100;
          return (
            <div key={trait.key} className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-2xl font-bold text-primary">{score.toFixed(1)}</p>
              <p className="text-xs font-medium">{trait.label}</p>
              <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all" 
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">{trait.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ProfessionalNotes ──────────────────────────────────────
function ProfessionalNotes({ patientId }: { patientId: string | undefined }) {
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["professional-notes-admin", patientId],
    queryFn: async () => {
      if (!patientId) return [];
      const { data, error } = await supabase
        .from("professional_notes")
        .select("*, professionals(specialty)")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!patientId,
  });

  if (!patientId) {
    return (
      <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
        Seleccione un paciente para ver las notas profesionales
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
        Cargando notas...
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
        No hay notas profesionales para este paciente
      </div>
    );
  }

  const specialtyLabels: Record<string, string> = {
    psychology: "Psicología",
    nutrition: "Nutrición",
    medicine: "Medicina",
    physiotherapy: "Fisioterapia",
  };

  return (
    <div className="space-y-3">
      {notes.map((note) => (
        <div key={note.id} className="p-4 bg-muted/30 rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
              {specialtyLabels[note.specialty] || note.specialty}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(note.created_at).toLocaleDateString("es-ES", {
                day: "numeric", month: "short", year: "numeric"
              })}
            </span>
          </div>
          <p className="text-sm">{note.content}</p>
        </div>
      ))}
    </div>
  );
}

// ─── ActivityGoalsSection ───────────────────────────────────
function ActivityGoalsSection({ 
  patientId, 
  adminId 
}: { 
  patientId: string | undefined; 
  adminId: string | undefined;
}) {
  const queryClient = useQueryClient();
  const [sessionsGoal, setSessionsGoal] = useState(4);
  const [durationGoal, setDurationGoal] = useState(30);

  const { data: activityGoals, isLoading } = useQuery({
    queryKey: ["activity-goals", patientId],
    queryFn: async () => {
      if (!patientId) return null;
      const { data, error } = await supabase
        .from("activity_goals")
        .select("*")
        .eq("user_id", patientId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });

  useEffect(() => {
    if (activityGoals) {
      setSessionsGoal(activityGoals.target_sessions_per_week || 4);
      setDurationGoal(activityGoals.target_avg_duration_minutes || 30);
    }
  }, [activityGoals]);

  const saveGoalsMutation = useMutation({
    mutationFn: async () => {
      if (!patientId) throw new Error("No patient selected");
      const { error } = await supabase
        .from("activity_goals")
        .upsert({
          user_id: patientId,
          target_sessions_per_week: sessionsGoal,
          target_avg_duration_minutes: durationGoal,
          set_by: adminId,
        }, { onConflict: 'user_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity-goals", patientId] });
      toast.success("Metas de actividad guardadas");
    },
    onError: (error) => {
      toast.error("Error al guardar metas: " + error.message);
    },
  });

  if (!patientId) {
    return (
      <div className="p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground">
        Seleccione un paciente para configurar metas de actividad
      </div>
    );
  }

  const sessionOptions = [1, 2, 3, 4, 5, 6, 7];
  const durationOptions = [15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 75, 90];

  return (
    <div className="p-4 bg-accent/10 border border-accent/30 rounded-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-accent/20">
          <Activity className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h4 className="font-display font-semibold">Metas de Actividad Física</h4>
          <p className="text-sm text-muted-foreground">
            Configure el número de sesiones y duración promedio por semana
          </p>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Sesiones por Semana</Label>
          <Select value={String(sessionsGoal)} onValueChange={(v) => setSessionsGoal(parseInt(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {sessionOptions.map(n => (
                <SelectItem key={n} value={String(n)}>{n} {n === 1 ? 'sesión' : 'sesiones'}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Duración Promedio por Sesión</Label>
          <Select value={String(durationGoal)} onValueChange={(v) => setDurationGoal(parseInt(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {durationOptions.map(n => (
                <SelectItem key={n} value={String(n)}>{n} minutos</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Button 
        onClick={() => saveGoalsMutation.mutate()}
        disabled={saveGoalsMutation.isPending || isLoading}
        size="sm"
        className="mt-4 gap-2"
      >
        <Save className="h-4 w-4" />
        {saveGoalsMutation.isPending ? "Guardando..." : "Guardar Metas"}
      </Button>
    </div>
  );
}

// ─── HabitUnlockCard ────────────────────────────────────────
function HabitUnlockCard({
  habit,
  unlocked,
  patientId,
  onToggle,
  isToggling,
}: {
  habit: { id: string; name: string; description: string };
  unlocked: boolean;
  patientId: string | undefined;
  onToggle: () => void;
  isToggling: boolean;
}) {
  const queryClient = useQueryClient();
  const [targetSessions, setTargetSessions] = useState(3);

  const { data: habitGoal } = useQuery({
    queryKey: ["habit-goal", patientId, habit.id],
    queryFn: async () => {
      if (!patientId) return null;
      const { data, error } = await supabase
        .from("unlocked_habits")
        .select("target_sessions_per_week")
        .eq("user_id", patientId)
        .eq("habit_id", habit.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!patientId && unlocked,
  });

  useEffect(() => {
    if (habitGoal?.target_sessions_per_week) {
      setTargetSessions(habitGoal.target_sessions_per_week);
    }
  }, [habitGoal]);

  const updateGoalMutation = useMutation({
    mutationFn: async (sessions: number) => {
      if (!patientId) throw new Error("No patient selected");
      const { error } = await supabase
        .from("unlocked_habits")
        .update({ target_sessions_per_week: sessions })
        .eq("user_id", patientId)
        .eq("habit_id", habit.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habit-goal", patientId, habit.id] });
      toast.success("Meta de frecuencia actualizada");
    },
    onError: (error) => {
      toast.error("Error: " + error.message);
    },
  });

  const handleSessionChange = (value: string) => {
    const sessions = parseInt(value);
    setTargetSessions(sessions);
    if (unlocked) {
      updateGoalMutation.mutate(sessions);
    }
  };

  const sessionOptions = [1, 2, 3, 4, 5, 6, 7];

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`p-4 rounded-xl border-2 transition-all ${
        unlocked ? 'bg-success/10 border-success/30' : 'bg-muted/30 border-muted'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-display font-semibold">{habit.name}</h3>
          <p className="text-sm text-muted-foreground">{habit.description}</p>
        </div>
        <Button
          variant={unlocked ? "default" : "outline"}
          size="icon"
          className={unlocked ? "bg-success hover:bg-success/90" : ""}
          disabled={isToggling}
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
        >
          {unlocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
        </Button>
      </div>
      
      {unlocked && (
        <div className="mt-3 pt-3 border-t border-success/20">
          <div className="flex items-center gap-2">
            <Label className="text-xs whitespace-nowrap">Meta semanal:</Label>
            <Select value={String(targetSessions)} onValueChange={handleSessionChange}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {sessionOptions.map(n => (
                  <SelectItem key={n} value={String(n)}>{n} {n === 1 ? 'vez' : 'veces'}/semana</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN ADMIN PAGE
// ═══════════════════════════════════════════════════════════
export default function Admin() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [searchFilter, setSearchFilter] = useState("");
  
  // ── Fetch patients (profiles) ─────────────────────────────
  const { data: patients = [] } = useQuery({
    queryKey: ["admin-patients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, date_of_birth, sex");
      if (error) throw error;
      return data || [];
    },
  });

  // Filter patients by search
  const filteredPatients = patients.filter(p => {
    if (!searchFilter) return true;
    const q = searchFilter.toLowerCase();
    return (
      (p.full_name || "").toLowerCase().includes(q) ||
      (p.email || "").toLowerCase().includes(q)
    );
  });

  // ── Fetch unlocked habits from Supabase ───────────────────
  const { data: unlockedHabitIds = [], isLoading: habitsLoading } = useQuery({
    queryKey: ["unlocked-habits", selectedPatient],
    queryFn: async () => {
      if (!selectedPatient) return [];
      const { data, error } = await supabase
        .from("unlocked_habits")
        .select("habit_id")
        .eq("user_id", selectedPatient);
      if (error) throw error;
      return data.map(h => h.habit_id);
    },
    enabled: !!selectedPatient,
  });

  // ── Mutation to unlock a habit (INSERT) ───────────────────
  const unlockHabitMutation = useMutation({
    mutationFn: async (habitId: string) => {
      const { error } = await supabase
        .from("unlocked_habits")
        .insert({
          user_id: selectedPatient,
          habit_id: habitId,
          unlocked_by: user?.id,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unlocked-habits", selectedPatient] });
      toast.success("Hábito desbloqueado");
    },
    onError: (error) => {
      toast.error("Error al desbloquear hábito: " + error.message);
    },
  });

  // ── Mutation to lock a habit (DELETE) ─────────────────────
  const lockHabitMutation = useMutation({
    mutationFn: async (habitId: string) => {
      const { error } = await supabase
        .from("unlocked_habits")
        .delete()
        .eq("user_id", selectedPatient)
        .eq("habit_id", habitId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unlocked-habits", selectedPatient] });
      toast.success("Hábito bloqueado");
    },
    onError: (error) => {
      toast.error("Error al bloquear hábito: " + error.message);
    },
  });

  // ── Fetch active cycle for selected patient ───────────────
  const { data: activeCycle } = useQuery({
    queryKey: ["patient-cycle", selectedPatient],
    queryFn: async () => {
      if (!selectedPatient) return null;
      const { data, error } = await supabase
        .from("user_cycles")
        .select("*")
        .eq("user_id", selectedPatient)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedPatient,
  });

  // ── Mutation to start a cycle ─────────────────────────────
  const startCycleMutation = useMutation({
    mutationFn: async (patientId: string) => {
      // First, deactivate any existing active cycles
      await supabase
        .from("user_cycles")
        .update({ is_active: false })
        .eq("user_id", patientId)
        .eq("is_active", true);
      
      // Then create a new active cycle
      const { error } = await supabase
        .from("user_cycles")
        .insert({
          user_id: patientId,
          started_by: user?.id,
          is_active: true,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-cycle", selectedPatient] });
      toast.success("Ciclo iniciado correctamente");
    },
    onError: (error) => {
      toast.error("Error al iniciar el ciclo: " + error.message);
    },
  });

  // ── Mutation to stop a cycle ──────────────────────────────
  const stopCycleMutation = useMutation({
    mutationFn: async (patientId: string) => {
      const { error } = await supabase
        .from("user_cycles")
        .update({ is_active: false })
        .eq("user_id", patientId)
        .eq("is_active", true);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-cycle", selectedPatient] });
      toast.success("Ciclo detenido correctamente");
    },
    onError: (error) => {
      toast.error("Error al detener el ciclo: " + error.message);
    },
  });
  
  // ── Biomarker form state ──────────────────────────────────
  const [biomarkers, setBiomarkers] = useState<Partial<BloodBiomarkers>>({
    albumin: undefined,
    creatinine: undefined,
    glucose: undefined,
    crp: undefined,
    lymphocytePercent: undefined,
    mcv: undefined,
    rdw: undefined,
    alkalinePhosphatase: undefined,
    whiteBloodCellCount: undefined,
    chronologicalAge: undefined,
  });
  
  const [biologicalAgeResult, setBiologicalAgeResult] = useState<ReturnType<typeof calculateBiologicalAge> | null>(null);

  // ── Fetch patient settings ────────────────────────────────
  const { data: patientSettings } = useQuery({
    queryKey: ["patient-settings", selectedPatient],
    queryFn: async () => {
      if (!selectedPatient) return null;
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", selectedPatient)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedPatient,
  });

  // ── Fetch survey questions ────────────────────────────────
  const { data: surveyQuestions = [] } = useQuery({
    queryKey: ["admin-survey-questions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_survey_questions")
        .select("*")
        .order("week_start", { ascending: true })
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // ── Survey question mutations ─────────────────────────────
  const [newQuestion, setNewQuestion] = useState({
    question_text: "",
    week_start: 1,
    week_end: 4,
    follow_up_label: "",
    follow_up_options: "",
    habit_category: "",
  });

  const addQuestionMutation = useMutation({
    mutationFn: async (question: typeof newQuestion) => {
      const followUpOptions = question.follow_up_options
        ? question.follow_up_options.split(",").map(o => o.trim())
        : null;
      const { error } = await supabase
        .from("daily_survey_questions")
        .insert({
          question_text: question.question_text,
          week_start: question.week_start,
          week_end: question.week_end,
          follow_up_label: question.follow_up_label || null,
          follow_up_options: followUpOptions,
          habit_category: question.habit_category || null,
          display_order: surveyQuestions.length,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-survey-questions"] });
      setNewQuestion({ question_text: "", week_start: 1, week_end: 4, follow_up_label: "", follow_up_options: "", habit_category: "" });
      toast.success("Pregunta añadida correctamente");
    },
    onError: (error) => {
      toast.error("Error: " + error.message);
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: string) => {
      const { error } = await supabase
        .from("daily_survey_questions")
        .delete()
        .eq("id", questionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-survey-questions"] });
      toast.success("Pregunta eliminada");
    },
    onError: (error) => {
      toast.error("Error: " + error.message);
    },
  });

  const toggleQuestionMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("daily_survey_questions")
        .update({ is_active: isActive })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-survey-questions"] });
      toast.success("Pregunta actualizada");
    },
    onError: (error) => {
      toast.error("Error: " + error.message);
    },
  });

  // ── Calculate age from DOB ────────────────────────────────
  const calculateAge = (dateOfBirth: string | null): number => {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // ── Get cycle info ────────────────────────────────────────
  const getCycleInfo = () => {
    if (!activeCycle) return null;
    const startDate = new Date(activeCycle.started_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - startDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const currentWeek = Math.min(Math.floor(diffDays / 7) + 1, 4);
    return { startDate, diffDays, currentWeek };
  };

  const cycleInfo = getCycleInfo();

  const handleBiomarkerChange = (key: keyof BloodBiomarkers, value: string) => {
    const numValue = value === "" ? undefined : parseFloat(value);
    setBiomarkers(prev => ({ ...prev, [key]: numValue }));
  };

  const handleCalculateBiologicalAge = () => {
    const requiredFields = Object.keys(biomarkerReferenceRanges) as (keyof BloodBiomarkers)[];
    const missingFields = requiredFields.filter(f => biomarkers[f] === undefined);
    
    if (missingFields.length > 0 || biomarkers.chronologicalAge === undefined) {
      toast.error("Por favor complete todos los campos de biomarcadores");
      return;
    }
    
    const validation = validateBiomarkers(biomarkers);
    if (!validation.valid) {
      toast.error(validation.errors.join(", "));
      return;
    }
    
    const result = calculateBiologicalAge(biomarkers as BloodBiomarkers);
    setBiologicalAgeResult(result);
    toast.success("Edad biológica calculada correctamente");
  };

  // ── Mutation to save biomarkers ───────────────────────────
  const saveBiomarkersMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPatient) {
        throw new Error("No patient selected");
      }
      
      const { error } = await supabase.from("biomarkers").insert({
        user_id: selectedPatient,
        recorded_by: user?.id,
        albumin: biomarkers.albumin,
        creatinine: biomarkers.creatinine,
        glucose: biomarkers.glucose,
        c_reactive_protein: biomarkers.crp,
        lymphocyte_percentage: biomarkers.lymphocytePercent,
        mean_cell_volume: biomarkers.mcv,
        red_cell_distribution_width: biomarkers.rdw,
        alkaline_phosphatase: biomarkers.alkalinePhosphatase,
        white_blood_cell_count: biomarkers.whiteBloodCellCount,
        biological_age: biologicalAgeResult?.phenotypicAge,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-biomarkers", selectedPatient] });
      toast.success("Biomarcadores guardados correctamente");
    },
    onError: (error) => {
      toast.error("Error al guardar biomarcadores: " + error.message);
    },
  });

  const handleSaveBiomarkers = () => {
    if (!selectedPatient) {
      toast.error("Por favor seleccione un paciente");
      return;
    }
    
    const hasBiomarkers = Object.entries(biomarkers).some(
      ([key, value]) => key !== "chronologicalAge" && value !== undefined
    );
    
    if (!hasBiomarkers) {
      toast.error("Por favor ingrese al menos un biomarcador");
      return;
    }
    
    saveBiomarkersMutation.mutate();
  };

  // ── toggleHabitUnlock ─────────────────────────────────────
  const toggleHabitUnlock = (habitId: string) => {
    if (!selectedPatient) {
      toast.error("Por favor seleccione un paciente");
      return;
    }
    
    const isUnlocked = unlockedHabitIds.includes(habitId);
    
    if (isUnlocked) {
      lockHabitMutation.mutate(habitId);
    } else {
      unlockHabitMutation.mutate(habitId);
    }
  };

  const isHabitMutating = unlockHabitMutation.isPending || lockHabitMutation.isPending;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Administración" subtitle="Gestión de pacientes y configuración" backTo="/home" />
      <div className="container mx-auto px-4 py-8">

        {/* Patient Selector with Search */}
        <Card className="p-6 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <User className="h-5 w-5 text-muted-foreground" />
            <Label htmlFor="patient-select">Seleccionar Paciente:</Label>
          </div>

          {/* Search Filter */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o correo..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={selectedPatient} onValueChange={setSelectedPatient}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccione un paciente" />
            </SelectTrigger>
            <SelectContent>
              {filteredPatients.map(patient => (
                <SelectItem key={patient.user_id} value={patient.user_id}>
                  {patient.full_name || "Sin nombre"} — {patient.email || "sin email"} ({calculateAge(patient.date_of_birth)} años, {patient.sex === "female" ? "F" : patient.sex === "male" ? "M" : "-"})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>

        <Tabs defaultValue="cycle" className="space-y-6">
          <TabsList className="flex w-full max-w-4xl gap-1 justify-start overflow-x-auto whitespace-nowrap p-1">
            <TabsTrigger value="cycle" className="flex-shrink-0 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Ciclo
            </TabsTrigger>
            <TabsTrigger value="biomarkers" className="flex-shrink-0 flex items-center gap-2">
              <Droplets className="h-4 w-4" />
              Biomarcadores
            </TabsTrigger>
            <TabsTrigger value="biological-age" className="flex-shrink-0 flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Edad Biológica
            </TabsTrigger>
            <TabsTrigger value="habits" className="flex-shrink-0 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Hábitos
            </TabsTrigger>
            <TabsTrigger value="psychology" className="flex-shrink-0 flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Psicología
            </TabsTrigger>
            <TabsTrigger value="config" className="flex-shrink-0 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuración
            </TabsTrigger>
          </TabsList>

          {/* ── Cycle Management Tab ─────────────────────────── */}
          <TabsContent value="cycle">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold">Gestión de Ciclo</h2>
                  <p className="text-sm text-muted-foreground">
                    Inicie o detenga el ciclo de seguimiento de 4 semanas
                  </p>
                </div>
              </div>

              {!selectedPatient ? (
                <div className="text-center py-12 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Seleccione un paciente para gestionar su ciclo</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {activeCycle && cycleInfo ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-6 bg-success/10 border border-success/30 rounded-xl"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-success/20">
                            <Play className="h-5 w-5 text-success" />
                          </div>
                          <div>
                            <p className="font-display font-bold text-success">Ciclo Activo</p>
                            <p className="text-sm text-muted-foreground">
                              Iniciado el {cycleInfo.startDate.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="destructive" 
                          onClick={() => stopCycleMutation.mutate(selectedPatient)}
                          disabled={stopCycleMutation.isPending}
                          className="gap-2"
                        >
                          <StopCircle className="h-4 w-4" />
                          Detener Ciclo
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="text-center p-4 bg-background rounded-lg">
                          <p className="text-2xl font-display font-bold text-primary">
                            {cycleInfo.currentWeek}
                          </p>
                          <p className="text-xs text-muted-foreground">Semana actual</p>
                        </div>
                        <div className="text-center p-4 bg-background rounded-lg">
                          <p className="text-2xl font-display font-bold text-primary">
                            {cycleInfo.diffDays}
                          </p>
                          <p className="text-xs text-muted-foreground">Días transcurridos</p>
                        </div>
                        <div className="text-center p-4 bg-background rounded-lg">
                          <p className="text-2xl font-display font-bold text-primary">
                            {Math.max(28 - cycleInfo.diffDays, 0)}
                          </p>
                          <p className="text-xs text-muted-foreground">Días restantes</p>
                        </div>
                      </div>

                      {/* Week progress indicators */}
                      <div className="flex gap-2 mt-4">
                        {[1, 2, 3, 4].map((week) => (
                          <div
                            key={week}
                            className={`flex-1 h-2 rounded-full ${
                              week === cycleInfo.currentWeek
                                ? week === 4
                                  ? "bg-accent"
                                  : "bg-primary"
                                : week < cycleInfo.currentWeek
                                ? "bg-success"
                                : "bg-muted"
                            }`}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                        <span>Semana 1</span>
                        <span>Semana 2</span>
                        <span>Semana 3</span>
                        <span>Prueba</span>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-6 bg-muted/50 border border-muted rounded-xl text-center"
                    >
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="font-display font-semibold text-foreground mb-2">
                        Sin ciclo activo
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        Inicie un nuevo ciclo de 4 semanas para este paciente. Los recordatorios estarán activos las primeras 3 semanas, y la semana 4 será de prueba sin recordatorios.
                      </p>
                      <Button 
                        onClick={() => startCycleMutation.mutate(selectedPatient)}
                        disabled={startCycleMutation.isPending}
                        className="gap-2"
                      >
                        <Play className="h-4 w-4" />
                        Iniciar Ciclo
                      </Button>
                    </motion.div>
                  )}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ── Biomarkers Tab ────────────────────────────────── */}
          <TabsContent value="biomarkers">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold">Biomarcadores de Sangre</h2>
                  <p className="text-sm text-muted-foreground">
                    Ingrese los resultados del examen de sangre del paciente
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="chronologicalAge">Edad Cronológica (años)</Label>
                  <Input
                    id="chronologicalAge"
                    type="number"
                    step="1"
                    placeholder="Ej: 45"
                    value={biomarkers.chronologicalAge ?? ""}
                    onChange={(e) => handleBiomarkerChange("chronologicalAge", e.target.value)}
                  />
                </div>

                {Object.entries(biomarkerReferenceRanges).map(([key, range]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key}>
                      {range.name} ({range.unit})
                    </Label>
                    <Input
                      id={key}
                      type="number"
                      step="0.01"
                      placeholder={`${range.min} - ${range.max}`}
                      value={biomarkers[key as keyof BloodBiomarkers] ?? ""}
                      onChange={(e) => handleBiomarkerChange(key as keyof BloodBiomarkers, e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Ref: {range.min} - {range.max} {range.unit}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 mt-8">
                <Button 
                  onClick={handleSaveBiomarkers} 
                  disabled={saveBiomarkersMutation.isPending}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saveBiomarkersMutation.isPending ? "Guardando..." : "Guardar Biomarcadores"}
                </Button>
                <Button variant="outline" onClick={handleCalculateBiologicalAge} className="gap-2">
                  <Calculator className="h-4 w-4" />
                  Calcular Edad Biológica
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* ── Biological Age Tab ───────────────────────────── */}
          <TabsContent value="biological-age">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold">Edad Biológica</h2>
                  <p className="text-sm text-muted-foreground">
                    Basada en el algoritmo de Edad Fenotípica (Levine et al.)
                  </p>
                </div>
              </div>

              {biologicalAgeResult ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="grid md:grid-cols-3 gap-6"
                >
                  <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                    <p className="text-sm text-muted-foreground mb-1">Edad Biológica</p>
                    <p className="text-4xl font-display font-bold text-primary">
                      {biologicalAgeResult.phenotypicAge}
                    </p>
                    <p className="text-sm text-muted-foreground">años</p>
                  </Card>

                  <Card className="p-6 bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
                    <p className="text-sm text-muted-foreground mb-1">Diferencia de Edad</p>
                    <p className={`text-4xl font-display font-bold ${
                      biologicalAgeResult.ageDifference <= 0 ? 'text-success' : 'text-danger'
                    }`}>
                      {biologicalAgeResult.ageDifference > 0 ? '+' : ''}{biologicalAgeResult.ageDifference}
                    </p>
                    <p className="text-sm text-muted-foreground">años</p>
                  </Card>

                  <Card className={`p-6 border-2 ${
                    biologicalAgeResult.healthStatus === 'excellent' ? 'bg-success/10 border-success/30' :
                    biologicalAgeResult.healthStatus === 'good' ? 'bg-success/10 border-success/20' :
                    biologicalAgeResult.healthStatus === 'average' ? 'bg-warning/10 border-warning/30' :
                    'bg-danger/10 border-danger/30'
                  }`}>
                    <p className="text-sm text-muted-foreground mb-1">Estado</p>
                    <p className={`text-xl font-display font-bold ${
                      biologicalAgeResult.healthStatus === 'excellent' ? 'text-success' :
                      biologicalAgeResult.healthStatus === 'good' ? 'text-success' :
                      biologicalAgeResult.healthStatus === 'average' ? 'text-warning' :
                      'text-danger'
                    }`}>
                      {biologicalAgeResult.healthStatus === 'excellent' ? 'Excelente' :
                       biologicalAgeResult.healthStatus === 'good' ? 'Bueno' :
                       biologicalAgeResult.healthStatus === 'average' ? 'Promedio' : 'Atención'}
                    </p>
                  </Card>

                  <Card className="p-6 md:col-span-3">
                    <p className="text-lg">{biologicalAgeResult.interpretation}</p>
                  </Card>
                </motion.div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Ingrese los biomarcadores y haga clic en "Calcular Edad Biológica"</p>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ── Habits Tab (enhanced with HabitGoalsSection + ActivityGoals) ── */}
          <TabsContent value="habits">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold">Hábitos y Metas</h2>
                  <p className="text-sm text-muted-foreground">
                    Desbloquee hábitos avanzados y configure metas de actividad
                  </p>
                </div>
              </div>

              {!selectedPatient ? (
                <div className="text-center py-12 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Seleccione un paciente para gestionar sus hábitos</p>
                </div>
              ) : habitsLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p>Cargando hábitos del paciente...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Activity Goals */}
                  <ActivityGoalsSection patientId={selectedPatient} adminId={user?.id} />

                  {/* Monthly Progressive Goals */}
                  <div className="pt-6 border-t">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-warning/10">
                        <TrendingUp className="h-5 w-5 text-warning" />
                      </div>
                      <div>
                        <h3 className="font-display font-semibold">Metas Mensuales Progresivas</h3>
                        <p className="text-sm text-muted-foreground">
                          Configure metas de pantalla, desbloqueos y yoga que se ajustan mes a mes
                        </p>
                      </div>
                    </div>
                    <HabitGoalsSection 
                      patientId={selectedPatient} 
                      adminId={user?.id}
                      currentMonth={activeCycle ? Math.ceil((Date.now() - new Date(activeCycle.started_at).getTime()) / (28 * 24 * 60 * 60 * 1000)) + 1 : 1}
                    />
                  </div>

                  {/* Advanced Habits */}
                  <div className="pt-6 border-t">
                    <h3 className="font-display font-semibold mb-4">Hábitos Avanzados</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Desbloquee hábitos para pacientes que han estabilizado los básicos
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      {advancedHabits.map(habit => {
                        const unlocked = unlockedHabitIds.includes(habit.id);
                        return (
                          <HabitUnlockCard
                            key={habit.id}
                            habit={habit}
                            unlocked={unlocked}
                            patientId={selectedPatient}
                            onToggle={() => toggleHabitUnlock(habit.id)}
                            isToggling={isHabitMutating}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ── Psicología Tab ────────────────────────────────── */}
          <TabsContent value="psychology">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Brain className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold">Psicología</h2>
                  <p className="text-sm text-muted-foreground">
                    Resultados de personalidad BFI-10 y notas profesionales
                  </p>
                </div>
              </div>

              {!selectedPatient ? (
                <div className="text-center py-12 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Seleccione un paciente para ver información psicológica</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Personality Results */}
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-accent/10">
                        <UserCircle className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-display font-semibold">Resultados de Personalidad (BFI-10)</h3>
                        <p className="text-sm text-muted-foreground">
                          Últimos resultados del test de los Cinco Grandes
                        </p>
                      </div>
                    </div>
                    <PersonalityResults patientId={selectedPatient} />
                  </div>

                  {/* Professional Notes */}
                  <div className="pt-6 border-t">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <MessageSquare className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-display font-semibold">Notas Profesionales</h3>
                        <p className="text-sm text-muted-foreground">
                          Notas clínicas registradas por los profesionales asignados
                        </p>
                      </div>
                    </div>
                    <ProfessionalNotes patientId={selectedPatient} />
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ── Configuración Tab ─────────────────────────────── */}
          <TabsContent value="config">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Settings className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold">Configuración</h2>
                  <p className="text-sm text-muted-foreground">
                    Hora de encuesta diaria y gestión de preguntas
                  </p>
                </div>
              </div>

              {!selectedPatient ? (
                <div className="text-center py-12 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Seleccione un paciente para ver la configuración</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Survey Time Config */}
                  <SurveyTimeConfig 
                    patientId={selectedPatient} 
                    currentBreakfastTime={patientSettings?.breakfast_time || null}
                  />

                  {/* Survey Questions Management */}
                  <div className="pt-6 border-t">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <MessageSquare className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-display font-semibold">Preguntas de Encuesta Diaria</h3>
                        <p className="text-sm text-muted-foreground">
                          Personalice las preguntas para los logros diarios
                        </p>
                      </div>
                    </div>

                    {/* Add new question form */}
                    <div className="p-4 bg-muted/30 rounded-xl mb-6">
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Añadir Nueva Pregunta
                      </h4>
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <Label>Texto de la Pregunta</Label>
                          <Textarea
                            placeholder="Ej: ¿Lograste pasar el día sin tomar bebidas azucaradas?"
                            value={newQuestion.question_text}
                            onChange={(e) => setNewQuestion(prev => ({ ...prev, question_text: e.target.value }))}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Semana Inicio</Label>
                            <Select 
                              value={String(newQuestion.week_start)} 
                              onValueChange={(value) => setNewQuestion(prev => ({ ...prev, week_start: parseInt(value) }))}
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {[1, 2, 3, 4].map(w => (
                                  <SelectItem key={w} value={String(w)}>Semana {w}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Semana Fin</Label>
                            <Select 
                              value={String(newQuestion.week_end)} 
                              onValueChange={(value) => setNewQuestion(prev => ({ ...prev, week_end: parseInt(value) }))}
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {[1, 2, 3, 4].map(w => (
                                  <SelectItem key={w} value={String(w)}>Semana {w}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Etiqueta de Seguimiento (opcional)</Label>
                          <Input
                            placeholder="Ej: ¿Cuántas bebidas tomaste?"
                            value={newQuestion.follow_up_label}
                            onChange={(e) => setNewQuestion(prev => ({ ...prev, follow_up_label: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Opciones de Seguimiento (separadas por coma)</Label>
                          <Input
                            placeholder="Ej: 1, 2, 3, 4, 5+"
                            value={newQuestion.follow_up_options}
                            onChange={(e) => setNewQuestion(prev => ({ ...prev, follow_up_options: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Categoría del Hábito</Label>
                          <Input
                            placeholder="Ej: nutricion, sueno, actividad"
                            value={newQuestion.habit_category}
                            onChange={(e) => setNewQuestion(prev => ({ ...prev, habit_category: e.target.value }))}
                          />
                        </div>
                        <Button 
                          onClick={() => addQuestionMutation.mutate(newQuestion)}
                          disabled={addQuestionMutation.isPending || !newQuestion.question_text}
                          className="gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Añadir Pregunta
                        </Button>
                      </div>
                    </div>

                    {/* Existing questions */}
                    <div className="space-y-3">
                      <h4 className="font-semibold">Preguntas Existentes</h4>
                      {surveyQuestions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No hay preguntas configuradas</p>
                      ) : (
                        surveyQuestions.map((question) => (
                          <div 
                            key={question.id}
                            className={`p-4 rounded-lg border ${question.is_active ? 'bg-background' : 'bg-muted/50 opacity-60'}`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <p className="font-medium">{question.question_text}</p>
                                <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                                  <span className="bg-muted px-2 py-0.5 rounded">
                                    Semanas {question.week_start}-{question.week_end}
                                  </span>
                                  {question.habit_category && (
                                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded">
                                      {question.habit_category}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={question.is_active}
                                  onCheckedChange={(checked) => 
                                    toggleQuestionMutation.mutate({ id: question.id, isActive: checked })
                                  }
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteQuestionMutation.mutate(question.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
