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
import { supabase } from "@/integrations/supabase/client";
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
  Bell, 
  UserCircle, 
  Clock, 
  Plus, 
  Trash2, 
  Edit
} from "lucide-react";
import { 
  calculateBiologicalAge, 
  biomarkerReferenceRanges,
  validateBiomarkers,
  BloodBiomarkers 
} from "@/lib/biological-age";

// Locked habits that can be unlocked by admin
const advancedHabits = [
  { id: "sauna", name: "Saunas", description: "Sesiones de sauna finlandesa" },
  { id: "cold_bath", name: "Baños Fríos", description: "Inmersión en agua fría" },
  { id: "meditation", name: "Meditación", description: "Práctica de meditación guiada" },
  { id: "yoga", name: "Yoga", description: "Sesiones de yoga y estiramientos" },
];

interface PatientProfile {
  user_id: string;
  full_name: string | null;
  email: string | null;
  date_of_birth: string | null;
  sex: string | null;
}

// Survey Time Configuration Component
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
      // Check if settings exist
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
    } catch (error) {
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
    <div className="p-4 bg-accent/10 border border-accent/30 rounded-xl mb-6">
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

export function AdminPanel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(null);
  const [unlockedHabits, setUnlockedHabits] = useState<string[]>([]);
  
  // Personal data form
  const [personalData, setPersonalData] = useState({
    full_name: "",
    date_of_birth: "",
    sex: "",
    height: "",
    weight: "",
    waist: "",
  });

  // Biomarker form state
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

  // Search patients by email
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ["search-patients", searchEmail],
    queryFn: async () => {
      if (searchEmail.length < 3) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, date_of_birth, sex, weight, height, waist_circumference")
        .ilike("email", `%${searchEmail}%`)
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: searchEmail.length >= 3,
  });

  // Fetch full profile for selected patient
  const { data: fullPatientProfile } = useQuery({
    queryKey: ["patient-profile", selectedPatient?.user_id],
    queryFn: async () => {
      if (!selectedPatient) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", selectedPatient.user_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedPatient,
  });

  // Fetch active cycle for selected patient
  const { data: activeCycle } = useQuery({
    queryKey: ["patient-cycle", selectedPatient?.user_id],
    queryFn: async () => {
      if (!selectedPatient) return null;
      const { data, error } = await supabase
        .from("user_cycles")
        .select("*")
        .eq("user_id", selectedPatient.user_id)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedPatient,
  });

  // Fetch unlocked habits for selected patient
  const { data: patientUnlockedHabits = [] } = useQuery({
    queryKey: ["patient-unlocked-habits", selectedPatient?.user_id],
    queryFn: async () => {
      if (!selectedPatient) return [];
      const { data, error } = await supabase
        .from("unlocked_habits")
        .select("habit_id")
        .eq("user_id", selectedPatient.user_id);
      if (error) throw error;
      return data.map(h => h.habit_id);
    },
    enabled: !!selectedPatient,
  });

  // Fetch daily survey questions
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

  // Fetch patient settings
  const { data: patientSettings } = useQuery({
    queryKey: ["patient-settings", selectedPatient?.user_id],
    queryFn: async () => {
      if (!selectedPatient) return null;
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", selectedPatient.user_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedPatient,
  });

  // Update unlocked habits when patient changes
  useEffect(() => {
    setUnlockedHabits(patientUnlockedHabits);
  }, [patientUnlockedHabits]);

  // Update personal data when full patient profile is loaded
  useEffect(() => {
    if (fullPatientProfile) {
      setPersonalData({
        full_name: fullPatientProfile.full_name || "",
        date_of_birth: fullPatientProfile.date_of_birth || "",
        sex: fullPatientProfile.sex || "",
        height: fullPatientProfile.height?.toString() || "",
        weight: fullPatientProfile.weight?.toString() || "",
        waist: fullPatientProfile.waist_circumference?.toString() || "",
      });
    }
  }, [fullPatientProfile]);

  // Reset personal data when patient changes (but no profile loaded yet)
  useEffect(() => {
    if (selectedPatient && !fullPatientProfile) {
      setPersonalData({
        full_name: selectedPatient.full_name || "",
        date_of_birth: selectedPatient.date_of_birth || "",
        sex: selectedPatient.sex || "",
        height: "",
        weight: "",
        waist: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPatient?.user_id]);

  // Mutation to start a cycle
  const startCycleMutation = useMutation({
    mutationFn: async (patientId: string) => {
      await supabase
        .from("user_cycles")
        .update({ is_active: false })
        .eq("user_id", patientId)
        .eq("is_active", true);
      
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
      queryClient.invalidateQueries({ queryKey: ["patient-cycle", selectedPatient?.user_id] });
      toast.success("Ciclo iniciado correctamente");
    },
    onError: (error) => {
      toast.error("Error al iniciar el ciclo: " + error.message);
    },
  });

  // Mutation to stop a cycle
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
      queryClient.invalidateQueries({ queryKey: ["patient-cycle", selectedPatient?.user_id] });
      toast.success("Ciclo detenido correctamente");
    },
    onError: (error) => {
      toast.error("Error al detener el ciclo: " + error.message);
    },
  });

  // Mutation to update profile
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof personalData) => {
      if (!selectedPatient) throw new Error("No patient selected");
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: data.full_name || null,
          date_of_birth: data.date_of_birth || null,
          sex: data.sex || null,
          weight: data.weight ? parseFloat(data.weight) : null,
          height: data.height ? parseFloat(data.height) : null,
          waist_circumference: data.waist ? parseFloat(data.waist) : null,
        })
        .eq("user_id", selectedPatient.user_id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search-patients"] });
      queryClient.invalidateQueries({ queryKey: ["patient-profile", selectedPatient?.user_id] });
      toast.success("Perfil actualizado correctamente");
    },
    onError: (error) => {
      toast.error("Error al actualizar perfil: " + error.message);
    },
  });

  // Mutation to save biomarkers
  const saveBiomarkersMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPatient) throw new Error("No patient selected");
      
      const { error } = await supabase
        .from("biomarkers")
        .insert({
          user_id: selectedPatient.user_id,
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
      toast.success("Biomarcadores guardados correctamente");
    },
    onError: (error) => {
      toast.error("Error al guardar biomarcadores: " + error.message);
    },
  });

  // Mutation to toggle habit unlock
  const toggleHabitMutation = useMutation({
    mutationFn: async ({ habitId, unlock }: { habitId: string; unlock: boolean }) => {
      if (!selectedPatient) throw new Error("No patient selected");
      
      if (unlock) {
        const { error } = await supabase
          .from("unlocked_habits")
          .insert({
            user_id: selectedPatient.user_id,
            habit_id: habitId,
            unlocked_by: user?.id,
          });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("unlocked_habits")
          .delete()
          .eq("user_id", selectedPatient.user_id)
          .eq("habit_id", habitId);
        if (error) throw error;
      }
    },
    onSuccess: (_, { habitId, unlock }) => {
      setUnlockedHabits(prev => 
        unlock 
          ? [...prev, habitId]
          : prev.filter(h => h !== habitId)
      );
      queryClient.invalidateQueries({ queryKey: ["patient-unlocked-habits", selectedPatient?.user_id] });
      toast.success("Hábito actualizado");
    },
    onError: (error) => {
      toast.error("Error: " + error.message);
    },
  });

  // Mutation to add/edit question
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
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
      setNewQuestion({
        question_text: "",
        week_start: 1,
        week_end: 4,
        follow_up_label: "",
        follow_up_options: "",
        habit_category: "",
      });
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

  // Calculate age from date of birth
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

  // Get cycle info
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

  const selectPatient = (patient: PatientProfile) => {
    setSelectedPatient(patient);
    setSearchEmail("");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Patient Search */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Search className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-display font-semibold">Buscar Paciente</h3>
        </div>
        
        <div className="relative">
          <Input
            placeholder="Buscar por correo electrónico..."
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            className="pr-10"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          )}
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-3 border rounded-lg divide-y">
            {searchResults.map((patient) => (
              <button
                key={patient.user_id}
                onClick={() => selectPatient(patient)}
                className="w-full p-3 text-left hover:bg-muted/50 transition-colors flex items-center gap-3"
              >
                <UserCircle className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">{patient.full_name || "Sin nombre"}</p>
                  <p className="text-sm text-muted-foreground">{patient.email}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Selected Patient */}
        {selectedPatient && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-display font-semibold">{selectedPatient.full_name || "Sin nombre"}</p>
                  <p className="text-sm text-muted-foreground">{selectedPatient.email}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedPatient(null)}
              >
                Cambiar
              </Button>
            </div>
          </motion.div>
        )}
      </Card>

      {/* Admin Tabs - Only show when patient is selected */}
      {selectedPatient && (
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 max-w-2xl">
            <TabsTrigger value="personal" className="flex items-center gap-2 text-xs">
              <UserCircle className="h-4 w-4" />
              Personal
            </TabsTrigger>
            <TabsTrigger value="cycle" className="flex items-center gap-2 text-xs">
              <Calendar className="h-4 w-4" />
              Ciclo
            </TabsTrigger>
            <TabsTrigger value="biomarkers" className="flex items-center gap-2 text-xs">
              <Droplets className="h-4 w-4" />
              Biomarcadores
            </TabsTrigger>
            <TabsTrigger value="questions" className="flex items-center gap-2 text-xs">
              <MessageSquare className="h-4 w-4" />
              Preguntas
            </TabsTrigger>
            <TabsTrigger value="habits" className="flex items-center gap-2 text-xs">
              <Activity className="h-4 w-4" />
              Hábitos
            </TabsTrigger>
          </TabsList>

          {/* Personal Data Tab */}
          <TabsContent value="personal">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <UserCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold">Datos Personales</h2>
                  <p className="text-sm text-muted-foreground">
                    Actualice la información personal del paciente
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nombre Completo</Label>
                  <Input
                    id="full_name"
                    value={personalData.full_name}
                    onChange={(e) => setPersonalData(prev => ({ ...prev, full_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Fecha de Nacimiento</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={personalData.date_of_birth}
                    onChange={(e) => setPersonalData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sex">Sexo</Label>
                  <Select 
                    value={personalData.sex} 
                    onValueChange={(value) => setPersonalData(prev => ({ ...prev, sex: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Masculino</SelectItem>
                      <SelectItem value="female">Femenino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Altura (m)</Label>
                  <Input
                    id="height"
                    type="number"
                    step="0.01"
                    placeholder="Ej: 1.75"
                    value={personalData.height}
                    onChange={(e) => setPersonalData(prev => ({ ...prev, height: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Peso (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    placeholder="Ej: 70"
                    value={personalData.weight}
                    onChange={(e) => setPersonalData(prev => ({ ...prev, weight: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="waist">Circunferencia de Cintura (cm)</Label>
                  <Input
                    id="waist"
                    type="number"
                    step="0.1"
                    placeholder="Ej: 85"
                    value={personalData.waist}
                    onChange={(e) => setPersonalData(prev => ({ ...prev, waist: e.target.value }))}
                  />
                </div>
              </div>

              <Button 
                onClick={() => updateProfileMutation.mutate(personalData)}
                disabled={updateProfileMutation.isPending}
                className="mt-6 gap-2"
              >
                <Save className="h-4 w-4" />
                Guardar Cambios
              </Button>
            </Card>
          </TabsContent>

          {/* Cycle Management Tab */}
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
                      onClick={() => stopCycleMutation.mutate(selectedPatient.user_id)}
                      disabled={stopCycleMutation.isPending}
                      className="gap-2"
                    >
                      <StopCircle className="h-4 w-4" />
                      Detener
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="text-center p-4 bg-background rounded-lg">
                      <p className="text-2xl font-display font-bold text-primary">{cycleInfo.currentWeek}</p>
                      <p className="text-xs text-muted-foreground">Semana actual</p>
                    </div>
                    <div className="text-center p-4 bg-background rounded-lg">
                      <p className="text-2xl font-display font-bold text-primary">{cycleInfo.diffDays}</p>
                      <p className="text-xs text-muted-foreground">Días transcurridos</p>
                    </div>
                    <div className="text-center p-4 bg-background rounded-lg">
                      <p className="text-2xl font-display font-bold text-primary">{Math.max(28 - cycleInfo.diffDays, 0)}</p>
                      <p className="text-xs text-muted-foreground">Días restantes</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    {[1, 2, 3, 4].map((week) => (
                      <div
                        key={week}
                        className={`flex-1 h-2 rounded-full ${
                          week === cycleInfo.currentWeek
                            ? week === 4 ? "bg-accent" : "bg-primary"
                            : week < cycleInfo.currentWeek
                            ? "bg-success"
                            : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 bg-muted/50 border border-muted rounded-xl text-center"
                >
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-display font-semibold text-foreground mb-2">Sin ciclo activo</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Inicie un nuevo ciclo de 4 semanas para este paciente.
                  </p>
                  <Button 
                    onClick={() => startCycleMutation.mutate(selectedPatient.user_id)}
                    disabled={startCycleMutation.isPending}
                    className="gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Iniciar Ciclo
                  </Button>
                </motion.div>
              )}
            </Card>
          </TabsContent>

          {/* Biomarkers Tab */}
          <TabsContent value="biomarkers">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Droplets className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold">Biomarcadores</h2>
                  <p className="text-sm text-muted-foreground">
                    Ingrese los resultados del examen de sangre
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
                  onClick={() => saveBiomarkersMutation.mutate()}
                  disabled={saveBiomarkersMutation.isPending}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Guardar
                </Button>
                <Button variant="outline" onClick={handleCalculateBiologicalAge} className="gap-2">
                  <Calculator className="h-4 w-4" />
                  Calcular Edad Biológica
                </Button>
              </div>

              {biologicalAgeResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 grid md:grid-cols-3 gap-4"
                >
                  <Card className="p-4 bg-primary/5 border-primary/20">
                    <p className="text-sm text-muted-foreground">Edad Biológica</p>
                    <p className="text-3xl font-display font-bold text-primary">
                      {biologicalAgeResult.phenotypicAge} años
                    </p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-sm text-muted-foreground">Diferencia</p>
                    <p className={`text-3xl font-display font-bold ${
                      biologicalAgeResult.ageDifference <= 0 ? 'text-success' : 'text-destructive'
                    }`}>
                      {biologicalAgeResult.ageDifference > 0 ? '+' : ''}{biologicalAgeResult.ageDifference} años
                    </p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-sm text-muted-foreground">Estado</p>
                    <p className="text-lg font-display font-bold">
                      {biologicalAgeResult.healthStatus === 'excellent' ? '🌟 Excelente' :
                       biologicalAgeResult.healthStatus === 'good' ? '✅ Bueno' :
                       biologicalAgeResult.healthStatus === 'average' ? '⚠️ Promedio' : '🔴 Atención'}
                    </p>
                  </Card>
                </motion.div>
              )}
            </Card>
          </TabsContent>

          {/* Questions Tab */}
          <TabsContent value="questions">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold">Preguntas de Encuesta Diaria</h2>
                  <p className="text-sm text-muted-foreground">
                    Personalice las preguntas para los logros diarios
                  </p>
                </div>
              </div>

              {/* Survey Time Configuration */}
              <SurveyTimeConfig 
                patientId={selectedPatient?.user_id} 
                currentBreakfastTime={patientSettings?.breakfast_time || null}
              />

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
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
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
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
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
            </Card>
          </TabsContent>

          {/* Habits Tab */}
          <TabsContent value="habits">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold">Hábitos Avanzados</h2>
                  <p className="text-sm text-muted-foreground">
                    Desbloquee hábitos para pacientes que han estabilizado los básicos
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {advancedHabits.map(habit => {
                  const unlocked = unlockedHabits.includes(habit.id);
                  return (
                    <motion.div
                      key={habit.id}
                      whileHover={{ scale: 1.02 }}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        unlocked 
                          ? 'bg-success/10 border-success/30' 
                          : 'bg-muted/30 border-muted'
                      }`}
                      onClick={() => toggleHabitMutation.mutate({ 
                        habitId: habit.id, 
                        unlock: !unlocked 
                      })}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-display font-semibold">{habit.name}</h3>
                          <p className="text-sm text-muted-foreground">{habit.description}</p>
                        </div>
                        <Button
                          variant={unlocked ? "default" : "outline"}
                          size="icon"
                          className={unlocked ? "bg-success hover:bg-success/90" : ""}
                          disabled={toggleHabitMutation.isPending}
                        >
                          {unlocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </motion.div>
  );
}
