import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  Brain, 
  Users, 
  Smile, 
  ChevronRight, 
  ChevronLeft,
  Clock,
  CheckCircle2,
  PlayCircle,
  Lock,
  AlertCircle
} from "lucide-react";
import { 
  dass21Questions, 
  bfi10Questions, 
  swlsQuestions,
  calculateDASS21Scores,
  calculateSWLSScore,
  calculateBFI10Scores,
  testFrequencyLimits 
} from "@/data/psychometric-tests";

// Test definitions
const tests = {
  "dass-21": {
    name: "DASS-21",
    fullName: "Escala de Depresión, Ansiedad y Estrés",
    description: "Evalúa estados emocionales negativos de depresión, ansiedad y estrés",
    icon: Brain,
    duration: "10-15 min",
    questions: 21,
    color: "primary",
    frequencyDays: testFrequencyLimits["dass-21"],
    frequencyLabel: "1 vez al mes",
  },
  "bfi-10": {
    name: "BFI-10",
    fullName: "Inventario de Personalidad de 10 Items",
    description: "Evalúa los cinco grandes rasgos de personalidad",
    icon: Users,
    duration: "5 min",
    questions: 10,
    color: "accent",
    frequencyDays: testFrequencyLimits["bfi-10"],
    frequencyLabel: "Inicio y final del programa",
  },
  "swls": {
    name: "SWLS",
    fullName: "Escala de Satisfacción con la Vida",
    description: "Mide el bienestar subjetivo y satisfacción general",
    icon: Smile,
    duration: "3 min",
    questions: 5,
    color: "success",
    frequencyDays: testFrequencyLimits["swls"],
    frequencyLabel: "1 vez cada 3 meses",
  },
};

// Scale options for DASS-21
const dass21ScaleOptions = [
  { value: 0, label: "No me aplicó" },
  { value: 1, label: "Me aplicó un poco, o durante parte del tiempo" },
  { value: 2, label: "Me aplicó bastante, o durante una buena parte del tiempo" },
  { value: 3, label: "Me aplicó mucho, o la mayor parte del tiempo" },
];

// Scale options for SWLS (7-point Likert)
const swlsScaleOptions = [
  { value: 1, label: "Totalmente en desacuerdo" },
  { value: 2, label: "En desacuerdo" },
  { value: 3, label: "Ligeramente en desacuerdo" },
  { value: 4, label: "Ni de acuerdo ni en desacuerdo" },
  { value: 5, label: "Ligeramente de acuerdo" },
  { value: 6, label: "De acuerdo" },
  { value: 7, label: "Totalmente de acuerdo" },
];

// Scale options for BFI-10 (5-point Likert)
const bfi10ScaleOptions = [
  { value: 1, label: "Muy en desacuerdo" },
  { value: 2, label: "En desacuerdo" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "De acuerdo" },
  { value: 5, label: "Muy de acuerdo" },
];

type TestId = keyof typeof tests;
type TestStatus = "pending" | "in-progress" | "completed" | "locked";

interface ScheduledTest {
  id: TestId;
  status: TestStatus;
  scheduledDate: string;
  completedDate?: string;
  scores?: Record<string, number>;
  nextAvailableDate?: string;
}

interface TestResult {
  testId: TestId;
  scores: Record<string, number>;
  interpretations: Record<string, string>;
}

export default function Tests() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTest, setSelectedTest] = useState<TestId | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  // Fetch test results from database
  const { data: dbTestResults = [], refetch: refetchResults } = useQuery({
    queryKey: ["test_results", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("test_results")
        .select("*")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Get last completion date for each test type
  const getLastCompletionDate = (testId: TestId): string | null => {
    const result = dbTestResults.find(r => r.test_id === testId);
    return result ? result.completed_at : null;
  };

  // Calculate if test is available based on frequency limits
  const isTestAvailable = (testId: TestId): { available: boolean; daysRemaining: number; nextDate: string | null } => {
    const lastCompleted = getLastCompletionDate(testId);
    if (!lastCompleted) return { available: true, daysRemaining: 0, nextDate: null };

    const lastDate = new Date(lastCompleted);
    const frequencyDays = testFrequencyLimits[testId];
    const nextAvailableDate = new Date(lastDate);
    nextAvailableDate.setDate(nextAvailableDate.getDate() + frequencyDays);

    const today = new Date();
    const daysRemaining = Math.ceil((nextAvailableDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return {
      available: daysRemaining <= 0,
      daysRemaining: Math.max(0, daysRemaining),
      nextDate: nextAvailableDate.toISOString().split('T')[0],
    };
  };

  // Mutation to save test results
  const saveResultMutation = useMutation({
    mutationFn: async (result: TestResult) => {
      if (!user?.id) throw new Error("User not authenticated");
      
      const testName = tests[result.testId].fullName;
      
      const { error } = await supabase
        .from("test_results")
        .insert({
          user_id: user.id,
          test_id: result.testId,
          test_name: testName,
          scores: {
            ...result.scores,
            interpretations: result.interpretations,
          },
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["test_results", user?.id] });
      toast.success("Resultados guardados correctamente");
    },
    onError: (error) => {
      console.error("Error saving test result:", error);
      toast.error("Error al guardar los resultados");
    },
  });

  const scheduledTests: ScheduledTest[] = useMemo(() => {
    return (["dass-21", "bfi-10", "swls"] as TestId[]).map(testId => {
      const availability = isTestAvailable(testId);
      const lastCompleted = getLastCompletionDate(testId);
      
      return { 
        id: testId, 
        status: availability.available ? "pending" : "locked" as TestStatus,
        scheduledDate: new Date().toISOString().split('T')[0],
        completedDate: lastCompleted || undefined,
        nextAvailableDate: availability.nextDate || undefined,
      };
    });
  }, [dbTestResults]);

  const getQuestionsForTest = (testId: TestId) => {
    switch (testId) {
      case "dass-21":
        return dass21Questions.map(q => q.text);
      case "bfi-10":
        return bfi10Questions.map(q => `Me veo a mí mismo/a como alguien que: ${q.text}`);
      case "swls":
        return swlsQuestions.map(q => q.text);
      default:
        return [];
    }
  };

  const getScaleOptionsForTest = (testId: TestId) => {
    switch (testId) {
      case "dass-21":
        return dass21ScaleOptions;
      case "bfi-10":
        return bfi10ScaleOptions;
      case "swls":
        return swlsScaleOptions;
      default:
        return dass21ScaleOptions;
    }
  };

  const startTest = (testId: TestId) => {
    const availability = isTestAvailable(testId);
    if (!availability.available) return;

    setSelectedTest(testId);
    setCurrentQuestion(0);
    setAnswers({});
    setIsComplete(false);
    setTestResult(null);
  };

  const handleAnswer = (value: number) => {
    setAnswers(prev => ({ ...prev, [currentQuestion]: value }));
  };

  const questions = selectedTest ? getQuestionsForTest(selectedTest) : [];
  const scaleOptions = selectedTest ? getScaleOptionsForTest(selectedTest) : [];

  const nextQuestion = async () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // Calculate scores based on test type
      let result: TestResult;
      
      if (selectedTest === "dass-21") {
        const scores = calculateDASS21Scores(answers);
        result = {
          testId: selectedTest,
          scores: {
            depression: scores.depression,
            anxiety: scores.anxiety,
            stress: scores.stress,
          },
          interpretations: scores.interpretations,
        };
      } else if (selectedTest === "swls") {
        const scores = calculateSWLSScore(answers);
        result = {
          testId: selectedTest,
          scores: { total: scores.total },
          interpretations: { satisfaction: scores.interpretation },
        };
      } else if (selectedTest === "bfi-10") {
        const scores = calculateBFI10Scores(answers);
        result = {
          testId: selectedTest,
          scores: {
            extraversion: scores.extraversion,
            agreeableness: scores.agreeableness,
            conscientiousness: scores.conscientiousness,
            neuroticism: scores.neuroticism,
            openness: scores.openness,
          },
          interpretations: {},
        };
      } else {
        result = { testId: selectedTest!, scores: {}, interpretations: {} };
      }

      // Save to database
      await saveResultMutation.mutateAsync(result);
      
      setTestResult(result);
      setIsComplete(true);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const resetTest = () => {
    setSelectedTest(null);
    setCurrentQuestion(0);
    setAnswers({});
    setIsComplete(false);
    setTestResult(null);
  };

  // Test in progress view
  if (selectedTest && !isComplete) {
    const test = tests[selectedTest];
    const progress = ((currentQuestion + 1) / questions.length) * 100;

    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" onClick={resetTest} className="mb-4">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Volver a tests
            </Button>
            <h1 className="text-2xl font-display font-bold text-foreground mb-2">
              {test.fullName}
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Pregunta {currentQuestion + 1} de {questions.length}</span>
            </div>
            <Progress value={progress} className="mt-4 h-2" />
          </div>

          {/* Question */}
          <Card className="p-8 mb-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <p className="text-sm text-muted-foreground mb-4">
                  {selectedTest === "dass-21" 
                    ? "Por favor indica cuánto te ha aplicado esta afirmación durante la última semana:"
                    : selectedTest === "swls"
                    ? "Indica tu grado de acuerdo con la siguiente afirmación:"
                    : "Indica qué tan de acuerdo estás con esta descripción:"}
                </p>
                <h2 className="text-xl font-display font-semibold mb-8">
                  "{questions[currentQuestion]}"
                </h2>

                <RadioGroup
                  value={answers[currentQuestion]?.toString() || ""}
                  onValueChange={(v) => handleAnswer(parseInt(v))}
                  className="space-y-3"
                >
                  {scaleOptions.map((option) => (
                    <div
                      key={option.value}
                      className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        answers[currentQuestion] === option.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <RadioGroupItem value={option.value.toString()} id={`option-${option.value}`} />
                      <Label 
                        htmlFor={`option-${option.value}`} 
                        className="cursor-pointer flex-1 text-foreground text-sm"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </motion.div>
            </AnimatePresence>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={prevQuestion}
              disabled={currentQuestion === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>
            <Button
              onClick={nextQuestion}
              disabled={answers[currentQuestion] === undefined || saveResultMutation.isPending}
            >
              {saveResultMutation.isPending ? "Guardando..." : currentQuestion === questions.length - 1 ? "Finalizar" : "Siguiente"}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Test complete view
  if (isComplete && testResult) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-success" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-4">
            ¡Test Completado!
          </h1>
          <p className="text-muted-foreground mb-8">
            Tus resultados han sido guardados y serán analizados por tu psicólogo.
          </p>
          
          <div className="bg-card rounded-2xl p-6 border border-border mb-8 text-left">
            <h3 className="font-display font-semibold mb-4 text-center">Resultados</h3>
            
            {testResult.testId === "dass-21" && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-xl">
                    <p className="text-2xl font-bold text-primary">{testResult.scores.depression}</p>
                    <p className="text-xs text-muted-foreground">Depresión</p>
                    <p className="text-xs font-medium mt-1 text-primary">{testResult.interpretations.depression}</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-xl">
                    <p className="text-2xl font-bold text-warning">{testResult.scores.anxiety}</p>
                    <p className="text-xs text-muted-foreground">Ansiedad</p>
                    <p className="text-xs font-medium mt-1 text-warning">{testResult.interpretations.anxiety}</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-xl">
                    <p className="text-2xl font-bold text-accent">{testResult.scores.stress}</p>
                    <p className="text-xs text-muted-foreground">Estrés</p>
                    <p className="text-xs font-medium mt-1 text-accent">{testResult.interpretations.stress}</p>
                  </div>
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Estos resultados son orientativos. Tu psicólogo revisará los resultados en tu próxima consulta.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {testResult.testId === "swls" && (
              <div className="text-center">
                <p className="text-4xl font-bold text-primary mb-2">{testResult.scores.total}/35</p>
                <p className="text-sm text-muted-foreground">Puntuación total</p>
                <p className="text-lg font-semibold text-success mt-2">{testResult.interpretations.satisfaction}</p>
              </div>
            )}

            {testResult.testId === "bfi-10" && (
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(testResult.scores).map(([trait, score]) => (
                  <div key={trait} className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-lg font-bold text-primary">{(score as number).toFixed(1)}/5</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {trait === "extraversion" ? "Extraversión" :
                       trait === "agreeableness" ? "Amabilidad" :
                       trait === "conscientiousness" ? "Responsabilidad" :
                       trait === "neuroticism" ? "Neuroticismo" :
                       "Apertura"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <Button onClick={resetTest}>
            Volver a Tests
          </Button>
        </motion.div>
      </div>
    );
  }

  // Test list view
  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Tests Psicométricos" backTo="/home" />
      <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <p className="text-muted-foreground">
          Completa tus evaluaciones programadas para monitorear tu bienestar
        </p>
      </motion.div>

      {/* Scheduled Tests */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {scheduledTests.map((scheduled, index) => {
          const test = tests[scheduled.id];
          const Icon = test.icon;
          const availability = isTestAvailable(scheduled.id);
          const hasCompleted = !!scheduled.completedDate;

          return (
            <motion.div
              key={scheduled.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`p-6 h-full flex flex-col relative ${
                scheduled.status === "locked" ? "opacity-75" : ""
              }`}>
                {/* Locked overlay */}
                {scheduled.status === "locked" && (
                  <div className="absolute inset-0 bg-background/50 rounded-2xl flex items-center justify-center z-10">
                    <div className="text-center px-4">
                      <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm font-medium text-muted-foreground">
                        Disponible en {availability.daysRemaining} días
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Frecuencia: {test.frequencyLabel}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-${test.color}/10`}>
                    <Icon className={`h-6 w-6 text-${test.color}`} />
                  </div>
                  {hasCompleted && scheduled.status === "locked" ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full">
                      <CheckCircle2 className="h-3 w-3" />
                      Completado
                    </span>
                  ) : scheduled.status === "locked" ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      <Lock className="h-3 w-3" />
                      Bloqueado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-warning bg-warning/10 px-2 py-1 rounded-full">
                      <Clock className="h-3 w-3" />
                      Disponible
                    </span>
                  )}
                </div>

                <h3 className="font-display font-bold text-lg mb-1">{test.name}</h3>
                <p className="text-sm text-muted-foreground mb-2 flex-1">
                  {test.description}
                </p>
                <p className="text-xs text-muted-foreground/70 mb-4">
                  📅 {test.frequencyLabel}
                </p>

                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {test.duration}
                  </span>
                  <span>{test.questions} preguntas</span>
                </div>

                {scheduled.status === "locked" && hasCompleted ? (
                  <div className="bg-success/10 rounded-lg p-3 text-center">
                    <p className="text-sm text-success font-medium">✓ Completado recientemente</p>
                  </div>
                ) : scheduled.status === "locked" ? (
                  <Button disabled className="w-full">
                    <Lock className="h-4 w-4 mr-2" />
                    No disponible
                  </Button>
                ) : (
                  <Button 
                    onClick={() => startTest(scheduled.id)} 
                    className="w-full"
                  >
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Iniciar Test
                  </Button>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Info about frequency */}
      <Alert className="mb-8">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Frecuencia de tests:</strong> El DASS-21 puede tomarse <strong>1 vez al mes</strong>. 
          El SWLS y BFI-10 pueden tomarse <strong>cada 3 meses</strong> para evaluar cambios significativos.
        </AlertDescription>
      </Alert>
    </div>
    </div>
  );
}
