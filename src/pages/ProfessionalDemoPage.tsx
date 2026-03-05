import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Heart, Scale, Brain, Activity, BarChart3,
  FileText, ChevronRight, User, Pencil, TrendingUp,
  ClipboardList, Stethoscope, ChevronLeft, Smile, Frown,
  Lock, Trophy, Apple, Dumbbell, Plus, Edit2, Sparkles
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetricCard } from "@/components/dashboard/MetricCard";
import ClinicalAISummaryTab from "@/components/professional/ClinicalAISummaryTab";

import { CompositionOverviewSlide } from "@/components/dashboard/body-composition/CompositionOverviewSlide";
import { FatAnalysisSlide } from "@/components/dashboard/body-composition/FatAnalysisSlide";
import { MuscleAndLeanSlide } from "@/components/dashboard/body-composition/MuscleAndLeanSlide";
import { MetabolicProfileSlide } from "@/components/dashboard/body-composition/MetabolicProfileSlide";
import { DEMO_DATA_MALE_45 } from "@/components/dashboard/body-composition/types";
import appLogo from "@/assets/app-logo.png";

// ─── Demo patients ────────────────────────────────────────────────────────────
const DEMO_PATIENTS = [
  { id: "1", name: "Carlos Mendoza López", email: "carlos@demo.mx", age: 45, plan: "Oro", specialty: "Nutrición" },
  { id: "2", name: "Ana García Ruiz", email: "ana@demo.mx", age: 38, plan: "Platino", specialty: "Psicología" },
  { id: "3", name: "Roberto Sánchez Torres", email: "roberto@demo.mx", age: 52, plan: "Plata", specialty: "Medicina" },
];

// ─── Demo longevity metrics ───────────────────────────────────────────────────
const DEMO_LONGEVITY = [
  { label: "Edad Biológica", value: 47, unit: "años", target: 45, status: "warning" as const },
  { label: "VO₂ Max", value: 38, unit: "ml/kg/min", target: 42, status: "warning" as const },
  { label: "Equilibrio (Der.)", value: 28, unit: "seg", target: 30, status: "warning" as const },
  { label: "Equilibrio (Izq.)", value: 25, unit: "seg", target: 30, status: "warning" as const },
  { label: "Fuerza Agarre (Der.)", value: 42, unit: "kg", target: 40, status: "optimal" as const },
  { label: "Fuerza Agarre (Izq.)", value: 38, unit: "kg", target: 38, status: "optimal" as const },
  { label: "RCHA", value: 0.88, unit: "", target: 0.85, status: "warning" as const },
  { label: "VFC", value: 45, unit: "ms", target: 50, status: "warning" as const },
];

// ─── Demo psychological metrics ───────────────────────────────────────────────
const DEMO_PSYCH = [
  { label: "Ansiedad", value: 42, unit: "pts", target: "< 50", status: "warning" as const },
  { label: "Estrés", value: 35, unit: "pts", target: "< 50", status: "optimal" as const },
  { label: "Síntomas Depresivos", value: 8, unit: "pts", target: "< 10", status: "optimal" as const },
  { label: "Satisfacción con la Vida", value: 7.2, unit: "/10", target: "> 8", status: "warning" as const },
];

// ─── Demo habits ──────────────────────────────────────────────────────────────
const DEMO_HABITS = [
  { label: "Ejercicio aeróbico", days: [true, true, false, true, true, false, false], target: 5 },
  { label: "Entrenamiento de fuerza", days: [true, false, true, false, true, false, false], target: 3 },
  { label: "Meditación / mindfulness", days: [true, true, true, false, true, false, false], target: 5 },
  { label: "Sueño ≥ 7h", days: [false, true, true, true, true, false, true], target: 7 },
];

// ─── Demo clinical notes by specialty ────────────────────────────────────────
const DEMO_CLINICAL = {
  nutrition: {
    label: "Nutrición",
    editable: true,
    notes: [
      { date: "2025-01-15", type: "Evolución", text: "Paciente muestra buena adherencia al plan nutricional. Peso disminuyó 1.5 kg en el mes. Se ajusta distribución de macros." },
      { date: "2024-10-10", type: "Inicial", text: "Primera consulta. Paciente refiere hábitos alimenticios irregulares. Se establece línea base y objetivos." },
    ],
  },
  psychology: {
    label: "Psicología",
    editable: false,
    notes: [
      { date: "2025-01-08", type: "Evolución", text: "Adherencia a técnicas de mindfulness. Índice de ansiedad pasó de 55 a 42. Se continúa con terapia cognitivo-conductual." },
    ],
  },
  medicine: {
    label: "Medicina General",
    editable: false,
    notes: [
      { date: "2024-12-01", type: "Seguimiento", text: "Biomarcadores dentro de rangos normales. Colesterol No-HDL en 98 mg/dL. Próxima revisión en 3 meses." },
    ],
  },
  physiotherapy: {
    label: "Fisioterapia",
    editable: false,
    notes: [],
  },
};

// ─── Demo AI clinical summary result ─────────────────────────────────────────
const DEMO_AI_CLINICAL_RESULT = {
  score: 68,
  plan: "Oro",
  summary: "Carlos presenta un perfil de salud moderado con áreas de mejora en capacidad aeróbica y equilibrio. Su estado psicológico es estable con niveles normales de ansiedad y estrés. La composición corporal muestra un porcentaje de grasa corporal ligeramente elevado para su edad.",
  specialtySections: [
    {
      specialty: "physiotherapy",
      score: 62,
      summary: "VO2 Max de 38 ml/kg/min se clasifica como Promedio para hombre de 45 años. Fuerza de agarre derecha (42 kg) es Buena, izquierda (38 kg) Promedio. Equilibrio por debajo del rango esperado. HRV de 45 ms en rango Bueno.",
      markers: [
        { name: "VO2 Max", status: "yellow", note: "Promedio (38 ml/kg/min)" },
        { name: "Fuerza Agarre Der.", status: "green", note: "Bueno (42 kg)" },
        { name: "Fuerza Agarre Izq.", status: "yellow", note: "Promedio (38 kg)" },
        { name: "Equilibrio", status: "yellow", note: "Por debajo del promedio" },
        { name: "HRV", status: "green", note: "Bueno (45 ms)" },
      ],
    },
    {
      specialty: "psychology",
      score: 78,
      summary: "Resultados DASS-21 dentro de rangos normales: ansiedad baja, estrés controlado y síntomas depresivos mínimos. Satisfacción con la vida ligeramente por debajo del promedio. Adherencia a técnicas de mindfulness reportada por el profesional.",
      markers: [
        { name: "Ansiedad (DASS-21)", status: "green", note: "Normal" },
        { name: "Estrés (DASS-21)", status: "green", note: "Normal" },
        { name: "Depresión (DASS-21)", status: "green", note: "Normal" },
        { name: "Satisfacción Vital (SWLS)", status: "yellow", note: "Ligeramente baja" },
      ],
    },
    {
      specialty: "nutrition",
      score: 64,
      summary: "IMC de 27.5 indica sobrepeso. Porcentaje de grasa corporal (28%) elevado para hombre de 45 años. Masa muscular (32.1 kg) en rango aceptable. Grasa visceral (11) en rango alto. Buena adherencia al plan nutricional con descenso de 1.5 kg en el último mes.",
      markers: [
        { name: "IMC", status: "yellow", note: "Sobrepeso (27.5)" },
        { name: "Grasa Corporal", status: "red", note: "Alto (28%)" },
        { name: "Masa Muscular", status: "green", note: "Aceptable (32.1 kg)" },
        { name: "Grasa Visceral", status: "red", note: "Alto (11)" },
      ],
    },
  ],
  recommendations: [
    "Incrementar frecuencia de actividad aeróbica para mejorar VO2 Max hacia rango Bueno (>42 ml/kg/min)",
    "Continuar plan nutricional enfocado en reducir grasa visceral y porcentaje de grasa corporal",
    "Incorporar ejercicios de equilibrio unipodal al menos 3 veces por semana",
    "Mantener prácticas de mindfulness que han mostrado beneficio en control de estrés",
  ],
};

const SLIDE_TITLES = ["General", "Grasa", "Músculo", "Metabólico"];
const DAYS_SHORT = ["L", "M", "X", "J", "V", "S", "D"];

type DemoView = "patient-detail" | "longevity" | "body-composition" | "psychological" | "habits" | "clinical";

export default function ProfessionalDemoPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<DemoView>("patient-detail");
  const [selectedPatient] = useState(DEMO_PATIENTS[0]);
  const [bodySlide, setBodySlide] = useState(0);

  const goBack = () => {
    if (view === "patient-detail") navigate("/");
    else setView("patient-detail");
  };

  const bodySlides = [
    <CompositionOverviewSlide key="overview" data={DEMO_DATA_MALE_45} />,
    <FatAnalysisSlide key="fat" data={DEMO_DATA_MALE_45} />,
    <MuscleAndLeanSlide key="muscle" data={DEMO_DATA_MALE_45} />,
    <MetabolicProfileSlide key="metabolic" data={DEMO_DATA_MALE_45} />,
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={goBack} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <img src={appLogo} alt="Red Vitalium" className="h-8 w-auto" />
            <span className="text-lg font-display font-bold text-primary">Panel Profesional</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full">Demo</span>
            <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full hidden sm:inline">Nutrición</span>
          </div>
        </div>
      </header>

      {/* Patient Banner - same as ProfessionalHistory */}
      <div className="bg-primary/5 border-b border-primary/20">
        <div className="container mx-auto px-4 py-3 max-w-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">{selectedPatient.name}</p>
            <p className="text-xs text-muted-foreground">{selectedPatient.age} años · Plan {selectedPatient.plan}</p>
          </div>
          <Badge className="flex-shrink-0 bg-accent/15 text-accent border-accent/30 hover:bg-accent/20 text-xs">
            {selectedPatient.specialty}
          </Badge>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 max-w-xl">

        {/* ── VIEW: Patient detail ─ mismo layout que ProfessionalHistory ── */}
        {view === "patient-detail" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div>
              <h2 className="text-lg font-display font-bold text-foreground mb-3">Resumen por Categoría</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Trophy, label: "Logros", desc: "Metas y achievements", demoView: null as DemoView | null },
                  { icon: Activity, label: "Hábitos", desc: "Semana en curso", demoView: "habits" as DemoView },
                  { icon: Brain, label: "Bienestar Psicológico", desc: "Tests y evolución", demoView: "psychological" as DemoView },
                  { icon: Heart, label: "Longevidad", desc: "Métricas editables", demoView: "longevity" as DemoView },
                  { icon: Scale, label: "Composición Corporal", desc: "Báscula inteligente", demoView: "body-composition" as DemoView },
                  { icon: BarChart3, label: "Marcadores Metabólicos", desc: "Biomarcadores", demoView: null as DemoView | null },
                ].map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <Card
                      key={cat.label}
                      className={`p-4 flex items-center gap-3 transition-colors ${cat.demoView ? "cursor-pointer hover:bg-muted/50" : "opacity-60 cursor-default"}`}
                      onClick={() => cat.demoView && setView(cat.demoView)}
                    >
                      <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground leading-tight">{cat.label}</p>
                        <p className="text-xs text-muted-foreground">{cat.demoView ? "Ver detalles →" : "Próximamente"}</p>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            <Card
              className="p-5 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setView("clinical")}
            >
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Historia Clínica</h3>
                  <p className="text-sm text-muted-foreground">Notas permanentes del paciente</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Card>

            <div className="p-5 bg-muted/30 border border-border rounded-xl">
              <p className="text-sm text-muted-foreground text-center">
                Estás viendo los datos de <strong>{selectedPatient.name}</strong>. Selecciona una categoría o accede a la historia clínica.
              </p>
            </div>
          </motion.div>
        )}

        {/* ── VIEW: Longevity ─────────────────────────────────── */}
        {view === "longevity" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-2">
              <Heart className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-display font-bold text-foreground">Longevidad</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              Como profesional puedes editar cualquier métrica. Haz clic en "Editar" para registrar un nuevo valor.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              {DEMO_LONGEVITY.map((metric) => (
                <div key={metric.label}>
                  <MetricCard
                    title={metric.label}
                    value={metric.value}
                    unit={metric.unit}
                    status={metric.status}
                    target={`Meta: ${metric.target}${metric.unit}`}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-1 text-xs gap-1 text-muted-foreground hover:text-primary"
                    onClick={() => {}}
                  >
                    <Pencil className="h-3 w-3" />
                    Editar {metric.label}
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-accent/5 border border-accent/20 rounded-xl">
              <p className="text-xs font-semibold text-accent mb-1">✦ Funcionalidad exclusiva del profesional</p>
              <p className="text-xs text-muted-foreground">
                El botón "Editar" abre un panel donde puedes registrar nuevos valores, ver el historial de mediciones previas, y en el caso de la edad biológica, ingresar los 9 biomarcadores para calcularla automáticamente.
              </p>
            </div>
          </motion.div>
        )}

        {/* ── VIEW: Body composition ──────────────────────────── */}
        {view === "body-composition" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-2">
              <Scale className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-display font-bold text-foreground">Composición Corporal</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Datos de báscula inteligente. Como profesional puedes añadir mediciones o editar el último registro.
            </p>

            {/* Carousel with real body composition slides */}
            <Card className="p-5 relative overflow-hidden mb-3">
              {/* Slide tabs */}
              <div className="flex items-center justify-center gap-2 mb-4">
                {SLIDE_TITLES.map((title, i) => (
                  <button
                    key={title}
                    onClick={() => setBodySlide(i)}
                    className={`text-xs px-3 py-1 rounded-full transition-all ${
                      i === bodySlide
                        ? "bg-primary text-primary-foreground font-medium"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {title}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={bodySlide}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.25 }}
                >
                  {bodySlides[bodySlide]}
                </motion.div>
              </AnimatePresence>

              <button
                onClick={() => setBodySlide((p) => (p - 1 + bodySlides.length) % bodySlides.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-card/80 hover:bg-muted rounded-full shadow-md transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setBodySlide((p) => (p + 1) % bodySlides.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-card/80 hover:bg-muted rounded-full shadow-md transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </Card>

            <Button variant="ghost" size="sm" className="w-full text-xs gap-1 text-muted-foreground hover:text-primary mb-4">
              <Pencil className="h-3 w-3" />
              Añadir / editar datos de composición corporal
            </Button>

            <div className="p-4 bg-accent/5 border border-accent/20 rounded-xl">
              <p className="text-xs font-semibold text-accent mb-1">✦ Registro de tendencia</p>
              <p className="text-xs text-muted-foreground">
                Cada vez que el profesional añade una medición, el sistema construye una línea de tendencia temporal mostrando la evolución de peso, grasa y músculo.
              </p>
            </div>
          </motion.div>
        )}

        {/* ── VIEW: Psychological well-being ─────────────────── */}
        {view === "psychological" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-display font-bold text-foreground">Bienestar Psicológico</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              Resultados de tests psicométricos. Solo el psicólogo asignado puede añadir o editar estas métricas.
            </p>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {DEMO_PSYCH.map((metric) => (
                <MetricCard
                  key={metric.label}
                  title={metric.label}
                  value={metric.value}
                  unit={metric.unit}
                  status={metric.status}
                  target={metric.target}
                  icon={metric.label.includes("Satisfacción") ? <Smile className="h-5 w-5" /> : metric.label.includes("Depres") ? <Frown className="h-5 w-5" /> : <Brain className="h-5 w-5" />}
                />
              ))}
            </div>

            <Card className="p-4 mb-4">
              <h3 className="font-display font-bold text-sm mb-3">Tests Psicométricos Completados</h3>
              <div className="space-y-2">
                {[
                  { name: "DASS-21 (Ansiedad/Depresión/Estrés)", date: "Ene 2025", score: "Completado" },
                  { name: "Escala SWLS (Satisfacción con la Vida)", date: "Ene 2025", score: "Completado" },
                  { name: "PHQ-9 (Síntomas depresivos)", date: "Oct 2024", score: "Completado" },
                ].map((test) => (
                  <div key={test.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-xs font-medium text-foreground">{test.name}</p>
                      <p className="text-xs text-muted-foreground">{test.date}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">{test.score}</Badge>
                  </div>
                ))}
              </div>
            </Card>

            <div className="p-4 bg-accent/5 border border-accent/20 rounded-xl">
              <p className="text-xs font-semibold text-accent mb-1">✦ Acceso multidisciplinario</p>
              <p className="text-xs text-muted-foreground">
                Todos los profesionales pueden consultar el bienestar psicológico del paciente. Solo el psicólogo asignado puede registrar nuevas evaluaciones.
              </p>
            </div>
          </motion.div>
        )}

        {/* ── VIEW: Habits ────────────────────────────────────── */}
        {view === "habits" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-display font-bold text-foreground">Hábitos Semanales</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              Adherencia del paciente a sus hábitos en la semana en curso. Los hábitos son desbloqueados por el profesional.
            </p>

            <div className="space-y-3 mb-6">
              {DEMO_HABITS.map((habit) => {
                const completed = habit.days.filter(Boolean).length;
                const pct = Math.round((completed / habit.target) * 100);
                return (
                  <Card key={habit.label} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-foreground">{habit.label}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        pct >= 100 ? "bg-green-500/10 text-green-600" :
                        pct >= 60 ? "bg-yellow-500/10 text-yellow-600" :
                        "bg-red-500/10 text-red-600"
                      }`}>
                        {completed}/{habit.target} días
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      {habit.days.map((done, i) => (
                        <div key={i} className="flex flex-col items-center gap-1 flex-1">
                          <div className={`w-full h-6 rounded-md flex items-center justify-center text-xs font-medium transition-colors ${
                            done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          }`}>
                            {DAYS_SHORT[i]}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>

            <Button variant="ghost" size="sm" className="w-full text-xs gap-1 text-muted-foreground hover:text-primary mb-4">
              <Pencil className="h-3 w-3" />
              Gestionar hábitos desbloqueados
            </Button>

            <div className="p-4 bg-accent/5 border border-accent/20 rounded-xl">
              <p className="text-xs font-semibold text-accent mb-1">✦ Hábitos personalizados</p>
              <p className="text-xs text-muted-foreground">
                El profesional puede desbloquear hábitos específicos para cada paciente y establecer objetivos semanales según su plan de tratamiento.
              </p>
            </div>
          </motion.div>
        )}

        {/* ── VIEW: Clinical history ──────────────────────────── */}
        {view === "clinical" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Tabs defaultValue="ai-summary" className="w-full">
              <TabsList className="w-full grid grid-cols-5 mb-4">
                <TabsTrigger value="ai-summary" className="flex flex-col items-center gap-1 text-xs py-2">
                  <Sparkles className="h-4 w-4" />
                  <span className="hidden sm:inline">IA</span>
                </TabsTrigger>
                {[
                  { id: "psychology", label: "Psicológico", icon: Brain },
                  { id: "nutrition", label: "Alimentación", icon: Apple },
                  { id: "medicine", label: "Médico", icon: Stethoscope },
                  { id: "physiotherapy", label: "Físico", icon: Dumbbell },
                ].map(({ id, label, icon: Icon }) => (
                  <TabsTrigger key={id} value={id} className="flex flex-col items-center gap-1 text-xs py-2">
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="ai-summary">
                <ClinicalAISummaryTab
                  patientUserId="demo"
                  patientName="Carlos Mendoza López"
                  isDemo={true}
                  demoResult={DEMO_AI_CLINICAL_RESULT}
                />
              </TabsContent>

              {Object.entries(DEMO_CLINICAL).map(([key, specialty]) => (
                <TabsContent key={key} value={key}>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="flex items-center gap-2 mb-4">
                      {key === "psychology" && <Brain className="h-5 w-5 text-primary" />}
                      {key === "nutrition" && <Apple className="h-5 w-5 text-primary" />}
                      {key === "medicine" && <Stethoscope className="h-5 w-5 text-primary" />}
                      {key === "physiotherapy" && <Dumbbell className="h-5 w-5 text-primary" />}
                      <h2 className="text-lg font-display font-bold text-foreground">{specialty.label}</h2>
                      {specialty.editable && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-auto">
                          Tu especialidad
                        </span>
                      )}
                    </div>

                    {/* Add note form for editable specialty */}
                    {specialty.editable && (
                      <Card className="p-4 mb-4 border-primary/20">
                        <textarea
                          placeholder="Escribir nueva nota clínica..."
                          className="w-full text-sm bg-transparent border border-border rounded-md p-2 mb-3 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                          rows={3}
                          readOnly
                          onClick={() => {}}
                        />
                        <Button size="sm" className="gap-2" disabled>
                          <Plus className="h-4 w-4" />
                          Agregar Nota
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          * En la app real podrás escribir y guardar notas clínicas aquí.
                        </p>
                      </Card>
                    )}

                    {/* Notes list */}
                    {specialty.notes.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        No hay notas en esta sección
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {specialty.notes.map((note, i) => (
                          <Card key={i} className={`p-4 ${!specialty.editable ? "bg-muted/30" : ""}`}>
                            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{note.text}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-muted-foreground">{note.date}</span>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">{note.type}</Badge>
                                {specialty.editable && (
                                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" disabled>
                                    <Edit2 className="h-3 w-3" /> Editar
                                  </Button>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </TabsContent>
              ))}
            </Tabs>

            <div className="mt-5 p-4 bg-accent/5 border border-accent/20 rounded-xl">
              <p className="text-xs font-semibold text-accent mb-1">✦ Notas compartidas</p>
              <p className="text-xs text-muted-foreground">
                Las notas pueden marcarse como visibles para otros profesionales del equipo, permitiendo una atención coordinada y multidisciplinaria.
              </p>
            </div>
          </motion.div>
        )}


      </main>
    </div>
  );
}
