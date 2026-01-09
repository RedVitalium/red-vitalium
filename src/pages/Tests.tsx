import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  Brain, 
  Users, 
  Smile, 
  ChevronRight, 
  ChevronLeft,
  Clock,
  CheckCircle2,
  PlayCircle
} from "lucide-react";

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
  },
  "bfi-10": {
    name: "BFI-10",
    fullName: "Inventario de Personalidad de 10 Items",
    description: "Evalúa los cinco grandes rasgos de personalidad",
    icon: Users,
    duration: "5 min",
    questions: 10,
    color: "accent",
  },
  "swls": {
    name: "SWLS",
    fullName: "Escala de Satisfacción con la Vida",
    description: "Mide el bienestar subjetivo y satisfacción general",
    icon: Smile,
    duration: "3 min",
    questions: 5,
    color: "success",
  },
};

// Sample questions for DASS-21 (abbreviated)
const dass21Questions = [
  "Me costó mucho relajarme",
  "Me di cuenta que tenía la boca seca",
  "No podía sentir ningún sentimiento positivo",
  "Se me hizo difícil respirar",
  "Se me hizo difícil tomar la iniciativa para hacer cosas",
  "Reaccioné exageradamente en ciertas situaciones",
  "Sentí que mis manos temblaban",
];

const scaleOptions = [
  { value: "0", label: "No me aplicó" },
  { value: "1", label: "Me aplicó un poco" },
  { value: "2", label: "Me aplicó bastante" },
  { value: "3", label: "Me aplicó mucho" },
];

type TestId = keyof typeof tests;
type TestStatus = "pending" | "in-progress" | "completed";

interface ScheduledTest {
  id: TestId;
  status: TestStatus;
  scheduledDate: string;
  completedDate?: string;
  score?: number;
}

export default function Tests() {
  const [selectedTest, setSelectedTest] = useState<TestId | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isComplete, setIsComplete] = useState(false);

  const scheduledTests: ScheduledTest[] = [
    { id: "dass-21", status: "pending", scheduledDate: "2025-01-15" },
    { id: "bfi-10", status: "completed", scheduledDate: "2025-01-08", completedDate: "2025-01-08", score: 72 },
    { id: "swls", status: "pending", scheduledDate: "2025-01-20" },
  ];

  const startTest = (testId: TestId) => {
    setSelectedTest(testId);
    setCurrentQuestion(0);
    setAnswers({});
    setIsComplete(false);
  };

  const handleAnswer = (value: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion]: value }));
  };

  const nextQuestion = () => {
    if (currentQuestion < dass21Questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
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
  };

  // Test in progress view
  if (selectedTest && !isComplete) {
    const test = tests[selectedTest];
    const progress = ((currentQuestion + 1) / dass21Questions.length) * 100;

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
              <span>Pregunta {currentQuestion + 1} de {dass21Questions.length}</span>
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
                  Por favor indica cuánto te ha aplicado esta afirmación durante la última semana:
                </p>
                <h2 className="text-xl font-display font-semibold mb-8">
                  "{dass21Questions[currentQuestion]}"
                </h2>

                <RadioGroup
                  value={answers[currentQuestion] || ""}
                  onValueChange={handleAnswer}
                  className="space-y-4"
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
                      <RadioGroupItem value={option.value} id={`option-${option.value}`} />
                      <Label 
                        htmlFor={`option-${option.value}`} 
                        className="cursor-pointer flex-1 text-foreground"
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
              disabled={!answers[currentQuestion]}
            >
              {currentQuestion === dass21Questions.length - 1 ? "Finalizar" : "Siguiente"}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Test complete view
  if (isComplete) {
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
            Gracias por completar el test. Tus resultados han sido registrados y serán analizados por tu especialista.
          </p>
          <div className="bg-card rounded-2xl p-6 border border-border mb-8">
            <h3 className="font-display font-semibold mb-4">Resumen</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">7</p>
                <p className="text-sm text-muted-foreground">Preguntas</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-success">100%</p>
                <p className="text-sm text-muted-foreground">Completado</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-accent">Pendiente</p>
                <p className="text-sm text-muted-foreground">Análisis</p>
              </div>
            </div>
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
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">
          Tests Psicométricos
        </h1>
        <p className="text-muted-foreground">
          Completa tus evaluaciones programadas para monitorear tu bienestar
        </p>
      </motion.div>

      {/* Scheduled Tests */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {scheduledTests.map((scheduled, index) => {
          const test = tests[scheduled.id];
          const Icon = test.icon;

          return (
            <motion.div
              key={scheduled.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`p-6 h-full flex flex-col ${
                scheduled.status === "completed" ? "opacity-75" : ""
              }`}>
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-${test.color}/10`}>
                    <Icon className={`h-6 w-6 text-${test.color}`} />
                  </div>
                  {scheduled.status === "completed" ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full">
                      <CheckCircle2 className="h-3 w-3" />
                      Completado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-warning bg-warning/10 px-2 py-1 rounded-full">
                      <Clock className="h-3 w-3" />
                      Pendiente
                    </span>
                  )}
                </div>

                <h3 className="font-display font-bold text-lg mb-1">{test.name}</h3>
                <p className="text-sm text-muted-foreground mb-4 flex-1">
                  {test.description}
                </p>

                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {test.duration}
                  </span>
                  <span>{test.questions} preguntas</span>
                </div>

                {scheduled.status === "completed" ? (
                  <div className="bg-success/10 rounded-lg p-3 text-center">
                    <p className="text-sm text-muted-foreground">Puntuación</p>
                    <p className="text-2xl font-display font-bold text-success">{scheduled.score}%</p>
                  </div>
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

      {/* Available Tests */}
      <div>
        <h2 className="text-xl font-display font-bold mb-4">Todos los Tests</h2>
        <div className="grid gap-4">
          {Object.entries(tests).map(([id, test]) => {
            const Icon = test.icon;
            return (
              <Card 
                key={id}
                className="p-4 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => startTest(id as TestId)}
              >
                <div className="p-3 rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{test.fullName}</h4>
                  <p className="text-sm text-muted-foreground">{test.description}</p>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>{test.duration}</p>
                  <p>{test.questions} preguntas</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
