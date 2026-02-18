import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Users, Heart, Scale, Brain, Activity, BarChart3,
  FileText, ChevronRight, User, Pencil, TrendingUp, Dumbbell,
  ClipboardList, Stethoscope, Timer
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/dashboard/MetricCard";
import appLogo from "@/assets/app-logo.png";

// ─── Demo patient list ────────────────────────────────────────────────────────
const DEMO_PATIENTS = [
  { id: "1", name: "Carlos Mendoza López", email: "carlos@demo.mx", age: 45, plan: "Oro", specialty: "Nutrición" },
  { id: "2", name: "Ana García Ruiz", email: "ana@demo.mx", age: 38, plan: "Platino", specialty: "Psicología" },
  { id: "3", name: "Roberto Sánchez Torres", email: "roberto@demo.mx", age: 52, plan: "Plata", specialty: "Medicina" },
];

// ─── Demo longevity metrics for selected patient ──────────────────────────────
const DEMO_LONGEVITY = [
  { label: "Edad Biológica", value: 47, unit: "años", target: 45, status: "warning" as const, trend: [48, 47.5, 47.2, 47] },
  { label: "VO₂ Max", value: 38, unit: "ml/kg/min", target: 42, status: "warning" as const, trend: [35, 36, 37, 38] },
  { label: "Equilibrio (Der.)", value: 28, unit: "seg", target: 30, status: "warning" as const, trend: [20, 23, 26, 28] },
  { label: "Equilibrio (Izq.)", value: 25, unit: "seg", target: 30, status: "warning" as const, trend: [18, 20, 22, 25] },
  { label: "Fuerza Agarre (Der.)", value: 42, unit: "kg", target: 40, status: "optimal" as const, trend: [38, 39, 41, 42] },
  { label: "Fuerza Agarre (Izq.)", value: 38, unit: "kg", target: 38, status: "optimal" as const, trend: [35, 36, 37, 38] },
  { label: "RCHA", value: 0.88, unit: "", target: 0.85, status: "warning" as const, trend: [0.92, 0.91, 0.9, 0.88] },
  { label: "VFC", value: 45, unit: "ms", target: 50, status: "warning" as const, trend: [40, 42, 44, 45] },
];

// ─── Demo body composition ────────────────────────────────────────────────────
const DEMO_BODY = [
  { label: "Peso", value: "82 kg" },
  { label: "Grasa corporal", value: "25.2%" },
  { label: "Masa muscular", value: "34.6 kg" },
  { label: "IMC", value: "26.5" },
  { label: "Grasa visceral", value: "10" },
  { label: "Agua corporal", value: "52.8%" },
];

// ─── Demo clinical notes ──────────────────────────────────────────────────────
const DEMO_NOTES = [
  { date: "2025-01-15", type: "Evolución", text: "Paciente muestra buena adherencia al plan nutricional. Peso disminuyó 1.5 kg en el mes. Se ajusta distribución de macros." },
  { date: "2024-10-10", type: "Inicial", text: "Primera consulta. Paciente refiere sedentarismo y hábitos alimenticios irregulares. Se establece línea base y objetivos." },
];

type DemoView = "patients" | "patient-detail" | "longevity" | "body-composition" | "clinical";

export default function ProfessionalDemoPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<DemoView>("patients");
  const [selectedPatient, setSelectedPatient] = useState(DEMO_PATIENTS[0]);

  const handleSelectPatient = (patient: typeof DEMO_PATIENTS[0]) => {
    setSelectedPatient(patient);
    setView("patient-detail");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (view === "patients") navigate("/");
                else if (view === "patient-detail") setView("patients");
                else setView("patient-detail");
              }}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <img src={appLogo} alt="Red Vitalium" className="h-8 w-auto" />
            <span className="text-lg font-display font-bold text-primary">Panel Profesional</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full">Demo</span>
            <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full hidden sm:inline">
              Nutrición
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">

        {/* ── VIEW: Patient list ─────────────────────────────── */}
        {view === "patients" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-6 text-center">
              <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full mb-3">
                <Stethoscope className="h-4 w-4" />
                <span className="text-sm font-medium">Demo de Profesional de Salud</span>
              </div>
              <h1 className="text-2xl font-display font-bold text-foreground mb-1">Mis Pacientes</h1>
              <p className="text-muted-foreground text-sm">Selecciona un paciente para ver su tablero completo</p>
            </div>

            {/* What pros get - highlight cards */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { icon: BarChart3, label: "Métricas clínicas", desc: "Edita y registra" },
                { icon: ClipboardList, label: "Historia clínica", desc: "Notas y evolución" },
                { icon: TrendingUp, label: "Tendencias", desc: "Gráficas de progreso" },
              ].map(({ icon: Icon, label, desc }) => (
                <Card key={label} className="p-3 text-center border-accent/20">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-2">
                    <Icon className="h-4 w-4 text-accent" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </Card>
              ))}
            </div>

            <Card className="overflow-hidden">
              <div className="px-4 py-3 bg-muted/30 border-b border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Pacientes asignados ({DEMO_PATIENTS.length})
                </p>
              </div>
              <div className="divide-y divide-border">
                {DEMO_PATIENTS.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => handleSelectPatient(patient)}
                    className="w-full p-4 text-left hover:bg-muted/50 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{patient.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-muted-foreground">{patient.age} años</p>
                          <span className="text-muted-foreground">·</span>
                          <Badge variant="outline" className="text-xs py-0 h-4">Plan {patient.plan}</Badge>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </button>
                ))}
              </div>
            </Card>

            <div className="mt-4 p-4 bg-accent/5 border border-accent/20 rounded-xl">
              <p className="text-xs text-muted-foreground text-center">
                Como profesional, solo verás los pacientes que te han sido asignados por el equipo Vitalium.
              </p>
            </div>
          </motion.div>
        )}

        {/* ── VIEW: Patient detail ───────────────────────────── */}
        {view === "patient-detail" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {/* Patient banner */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-5 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{selectedPatient.name}</p>
                <p className="text-sm text-muted-foreground">{selectedPatient.age} años · Plan {selectedPatient.plan}</p>
              </div>
              <Badge className="ml-auto bg-accent/15 text-accent border-accent/30 hover:bg-accent/20">
                {selectedPatient.specialty}
              </Badge>
            </div>

            <h2 className="text-base font-display font-bold text-foreground mb-3">Resumen por Categoría</h2>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { icon: Heart, label: "Longevidad", desc: "Métricas editables", view: "longevity" as DemoView },
                { icon: Scale, label: "Composición Corporal", desc: "Báscula inteligente", view: "body-composition" as DemoView },
                { icon: Brain, label: "Bienestar Psicológico", desc: "Tests y evolución", view: "patient-detail" as DemoView },
                { icon: Activity, label: "Hábitos", desc: "Semana en curso", view: "patient-detail" as DemoView },
              ].map((cat) => {
                const Icon = cat.icon;
                return (
                  <Card
                    key={cat.label}
                    className="p-4 flex items-center gap-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setView(cat.view)}
                  >
                    <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{cat.label}</p>
                      <p className="text-xs text-muted-foreground">{cat.desc}</p>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Clinical history */}
            <Card
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors mb-5"
              onClick={() => setView("clinical")}
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Historia Clínica</p>
                  <p className="text-sm text-muted-foreground">Notas y evolución del paciente</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Card>

            <div className="p-4 bg-muted/30 border border-border rounded-xl">
              <p className="text-xs text-muted-foreground text-center">
                Como profesional puedes <strong>editar métricas</strong>, registrar nuevas mediciones y añadir notas clínicas directamente desde el tablero.
              </p>
            </div>
          </motion.div>
        )}

        {/* ── VIEW: Longevity metrics ────────────────────────── */}
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

        {/* ── VIEW: Body composition ─────────────────────────── */}
        {view === "body-composition" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-2">
              <Scale className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-display font-bold text-foreground">Composición Corporal</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              Datos de báscula inteligente. Como profesional puedes añadir mediciones o editar el último registro.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-5">
              {DEMO_BODY.map((item) => (
                <Card key={item.label} className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                  <p className="text-xl font-bold font-display text-foreground">{item.value}</p>
                </Card>
              ))}
            </div>

            <Button variant="outline" className="w-full gap-2 mb-5 border-primary/30 text-primary hover:bg-primary/5">
              <Pencil className="h-4 w-4" />
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

        {/* ── VIEW: Clinical history ─────────────────────────── */}
        {view === "clinical" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-display font-bold text-foreground">Historia Clínica</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              Notas clínicas permanentes y evolución del paciente por especialidad.
            </p>

            <div className="space-y-3 mb-5">
              {DEMO_NOTES.map((note, i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs">{note.type}</Badge>
                    <span className="text-xs text-muted-foreground">{note.date}</span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{note.text}</p>
                </Card>
              ))}
            </div>

            <Button variant="outline" className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5">
              <FileText className="h-4 w-4" />
              Añadir nueva nota clínica
            </Button>

            <div className="mt-4 p-4 bg-accent/5 border border-accent/20 rounded-xl">
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
