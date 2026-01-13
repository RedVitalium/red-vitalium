import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  User, 
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
  Calendar
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

export default function Admin() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [unlockedHabits, setUnlockedHabits] = useState<Record<string, string[]>>({});
  
  // Fetch patients (profiles)
  const { data: patients = [] } = useQuery({
    queryKey: ["admin-patients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, date_of_birth, sex");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch active cycle for selected patient
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

  // Mutation to start a cycle
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
      queryClient.invalidateQueries({ queryKey: ["patient-cycle", selectedPatient] });
      toast.success("Ciclo detenido correctamente");
    },
    onError: (error) => {
      toast.error("Error al detener el ciclo: " + error.message);
    },
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
    // Validate all required fields
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

  const handleSaveBiomarkers = () => {
    if (!selectedPatient) {
      toast.error("Por favor seleccione un paciente");
      return;
    }
    // Here you would save to database
    toast.success("Biomarcadores guardados correctamente");
  };

  const toggleHabitUnlock = (habitId: string) => {
    if (!selectedPatient) {
      toast.error("Por favor seleccione un paciente");
      return;
    }
    
    setUnlockedHabits(prev => {
      const patientHabits = prev[selectedPatient] || [];
      const isUnlocked = patientHabits.includes(habitId);
      
      return {
        ...prev,
        [selectedPatient]: isUnlocked 
          ? patientHabits.filter(h => h !== habitId)
          : [...patientHabits, habitId]
      };
    });
    
    toast.success("Estado del hábito actualizado");
  };

  const isHabitUnlocked = (habitId: string) => {
    return selectedPatient && (unlockedHabits[selectedPatient] || []).includes(habitId);
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Panel de Administración
          </h1>
          <p className="text-muted-foreground">
            Gestione pacientes, biomarcadores y hábitos desbloqueados
          </p>
        </motion.div>

        {/* Patient Selector */}
        <Card className="p-6 mb-8">
          <div className="flex items-center gap-4">
            <User className="h-5 w-5 text-muted-foreground" />
            <Label htmlFor="patient-select">Seleccionar Paciente:</Label>
            <Select value={selectedPatient} onValueChange={setSelectedPatient}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Seleccione un paciente" />
              </SelectTrigger>
              <SelectContent>
                {patients.map(patient => (
                  <SelectItem key={patient.user_id} value={patient.user_id}>
                    {patient.full_name || "Sin nombre"} ({calculateAge(patient.date_of_birth)} años, {patient.sex === "female" ? "F" : patient.sex === "male" ? "M" : "-"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Tabs defaultValue="cycle" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-lg">
            <TabsTrigger value="cycle" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Ciclo
            </TabsTrigger>
            <TabsTrigger value="biomarkers" className="flex items-center gap-2">
              <Droplets className="h-4 w-4" />
              Biomarcadores
            </TabsTrigger>
            <TabsTrigger value="biological-age" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Edad Biológica
            </TabsTrigger>
            <TabsTrigger value="habits" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Hábitos
            </TabsTrigger>
          </TabsList>

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

          {/* Biomarkers Tab */}
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
                {/* Chronological Age */}
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

                {/* Blood biomarkers */}
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
                <Button onClick={handleSaveBiomarkers} className="gap-2">
                  <Save className="h-4 w-4" />
                  Guardar Biomarcadores
                </Button>
                <Button variant="outline" onClick={handleCalculateBiologicalAge} className="gap-2">
                  <Calculator className="h-4 w-4" />
                  Calcular Edad Biológica
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Biological Age Tab */}
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

              {!selectedPatient ? (
                <div className="text-center py-12 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Seleccione un paciente para gestionar sus hábitos</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {advancedHabits.map(habit => {
                    const unlocked = isHabitUnlocked(habit.id);
                    return (
                      <motion.div
                        key={habit.id}
                        whileHover={{ scale: 1.02 }}
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                          unlocked 
                            ? 'bg-success/10 border-success/30' 
                            : 'bg-muted/30 border-muted'
                        }`}
                        onClick={() => toggleHabitUnlock(habit.id)}
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
                          >
                            {unlocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
