import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, Lightbulb } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAISummary, AISummaryResult } from "@/hooks/useAISummary";

interface AISummaryCardProps {
  section: string;
  healthData?: any;
  targetUserId?: string;
  compact?: boolean;
  autoLoad?: boolean;
  isDemo?: boolean;
}

const DEMO_RESULTS: Record<string, AISummaryResult> = {
  overall: {
    score: 72,
    summary: "Tu salud general muestra un buen estado con áreas de oportunidad. Los indicadores de actividad física y sueño están en rangos aceptables, mientras que el manejo del estrés y la composición corporal pueden mejorar.",
    sections: [
      { name: "Hábitos", score: 75, status: "green", summary: "Buena adherencia al ejercicio y sueño. Reducir tiempo en pantalla." },
      { name: "Bienestar Psicológico", score: 68, status: "yellow", summary: "Ansiedad en rango moderado. Satisfacción con la vida puede mejorar." },
      { name: "Longevidad", score: 70, status: "yellow", summary: "VO₂ Max y equilibrio por debajo de la meta. Fuerza de agarre óptima. Percentil ~60 para hombres de 46 años." },
      { name: "Composición Corporal", score: 65, status: "yellow", summary: "Grasa visceral ligeramente elevada. Masa muscular en rango adecuado." },
    ],
    recommendations: [
      "Incorporar sesiones de meditación o mindfulness para reducir ansiedad.",
      "Aumentar el entrenamiento cardiovascular para mejorar VO₂ Max.",
      "Reducir tiempo en pantalla antes de dormir para mejorar calidad de sueño.",
    ],
    cached: false,
  },
  achievements: {
    score: 78,
    summary: "Has mantenido buena consistencia en tus hábitos. Tu racha semanal y el cumplimiento de metas muestran compromiso con tu salud.",
    markers: [
      { name: "Racha semanal", status: "green", trend: "improving", note: "3 semanas consecutivas" },
      { name: "Metas cumplidas", status: "green", trend: "stable", note: "4 de 5 metas" },
      { name: "Mejora general", status: "yellow", trend: "improving", note: "+12% vs mes anterior" },
    ],
    recommendations: ["Mantén la consistencia actual para alcanzar un ciclo completo exitoso."],
    cached: false,
  },
  habits: {
    score: 74,
    summary: "Tus hábitos de sueño y actividad física están en buen camino. El tiempo en pantalla es el área con mayor oportunidad de mejora.",
    markers: [
      { name: "Sueño", status: "green", trend: "stable", note: "7.2 hrs promedio - Percentil ~55 para hombres de 46 años" },
      { name: "Actividad física", status: "green", trend: "improving", note: "4 sesiones/semana" },
      { name: "Tiempo en pantalla", status: "red", trend: "declining", note: "185 min/día" },
      { name: "Desbloqueos", status: "yellow", trend: "stable", note: "78 veces/día" },
    ],
    recommendations: [
      "Establece límites de uso de pantalla después de las 9 PM.",
      "Considera activar el modo no molestar durante entrenamientos.",
    ],
    cached: false,
  },
  psychological: {
    score: 66,
    summary: "Tu bienestar psicológico muestra áreas de atención. La ansiedad está en rango moderado y la satisfacción con la vida puede mejorar con intervenciones dirigidas.",
    markers: [
      { name: "Ansiedad", status: "yellow", trend: "improving", note: "42 pts - Moderada. Percentil ~35 para hombres de 46 años" },
      { name: "Estrés", status: "green", trend: "stable", note: "35 pts - Bajo" },
      { name: "Síntomas Depresivos", status: "green", trend: "stable", note: "8 pts - Normal" },
      { name: "Satisfacción con la Vida", status: "yellow", trend: "stable", note: "7.2/10" },
    ],
    recommendations: [
      "Continuar con técnicas de mindfulness para reducir ansiedad.",
      "Evaluar factores que limitan la satisfacción vital.",
    ],
    cached: false,
  },
  longevity: {
    score: 70,
    summary: "Tus marcadores de longevidad están en rango aceptable para tu edad y sexo. El VO₂ Max y el equilibrio son las áreas prioritarias a mejorar.",
    markers: [
      { name: "Edad Biológica", status: "yellow", trend: "stable", note: "2 años mayor que cronológica" },
      { name: "VO₂ Max", status: "yellow", trend: "improving", note: "38 ml/kg/min - Percentil ~45 para hombres de 46 años" },
      { name: "Fuerza de Agarre", status: "green", trend: "stable", note: "Bilateral óptimo - Percentil ~70" },
      { name: "Equilibrio", status: "yellow", trend: "improving", note: "Por debajo de meta - Percentil ~40" },
      { name: "VFC", status: "yellow", trend: "stable", note: "45 ms - Percentil ~50" },
    ],
    recommendations: [
      "Incrementar entrenamiento de intervalos para mejorar VO₂ Max.",
      "Practicar ejercicios de equilibrio unipodal diariamente.",
    ],
    cached: false,
  },
  "body-composition": {
    score: 65,
    summary: "Tu composición corporal muestra masa muscular adecuada pero grasa visceral ligeramente elevada. El índice metabólico basal es normal para tu perfil.",
    markers: [
      { name: "Peso", status: "yellow", trend: "improving", note: "Tendencia descendente" },
      { name: "Grasa corporal", status: "yellow", trend: "stable", note: "22.5% - Percentil ~45 para hombres de 46 años" },
      { name: "Masa muscular", status: "green", trend: "stable", note: "42.3 kg - Percentil ~60" },
      { name: "Grasa visceral", status: "yellow", trend: "improving", note: "Nivel 9" },
      { name: "Agua corporal", status: "green", trend: "stable", note: "55.2%" },
    ],
    recommendations: [
      "Mantener entrenamiento de fuerza para preservar masa muscular.",
      "Reducir carbohidratos refinados para disminuir grasa visceral.",
    ],
    cached: false,
  },
  metabolic: {
    score: 73,
    summary: "Tus biomarcadores metabólicos están mayormente en rangos normales. La glucosa y la proteína C reactiva merecen seguimiento.",
    markers: [
      { name: "Glucosa", status: "yellow", trend: "stable", note: "98 mg/dL - Percentil ~55 para hombres de 46 años" },
      { name: "Albúmina", status: "green", trend: "stable", note: "4.2 g/dL" },
      { name: "Creatinina", status: "green", trend: "stable", note: "0.9 mg/dL" },
      { name: "PCR", status: "yellow", trend: "improving", note: "1.8 mg/L" },
    ],
    recommendations: [
      "Reducir azúcares simples para mejorar nivel de glucosa.",
      "Próximo control de biomarcadores en 3 meses.",
    ],
    cached: false,
  },
};

function getStatusColor(status: string) {
  switch (status) {
    case "green": return "text-success";
    case "yellow": return "text-warning";
    case "red": return "text-destructive";
    default: return "text-muted-foreground";
  }
}

function getStatusBg(status: string) {
  switch (status) {
    case "green": return "bg-success/10 border-success/30";
    case "yellow": return "bg-warning/10 border-warning/30";
    case "red": return "bg-destructive/10 border-destructive/30";
    default: return "bg-muted/50 border-border";
  }
}

function getScoreColor(score: number | null) {
  if (!score) return "text-muted-foreground";
  if (score >= 75) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-destructive";
}

function getScoreBg(score: number | null) {
  if (!score) return "bg-muted";
  if (score >= 75) return "bg-success/15";
  if (score >= 50) return "bg-warning/15";
  return "bg-destructive/15";
}

const TrendIcon = ({ trend }: { trend?: string }) => {
  if (trend === "improving") return <TrendingUp className="h-3.5 w-3.5 text-success" />;
  if (trend === "declining") return <TrendingDown className="h-3.5 w-3.5 text-destructive" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
};

export function AISummaryCard({ section, healthData, targetUserId, compact = false, autoLoad = false, isDemo = false }: AISummaryCardProps) {
  const { generateSummary, loading, result: apiResult, error } = useAISummary();
  const [expanded, setExpanded] = useState(!compact);

  const result = isDemo ? (DEMO_RESULTS[section] || DEMO_RESULTS.overall) : apiResult;

  useEffect(() => {
    if (autoLoad && !isDemo) {
      // healthData is now optional - the edge function fetches data server-side
      generateSummary(section, healthData, targetUserId);
    }
  }, [autoLoad, section, isDemo]);

  const handleGenerate = () => {
    generateSummary(section, healthData, targetUserId);
  };

  if (!result && !loading) {
    return (
      <Card className="p-4 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <Button
          onClick={handleGenerate}
          variant="ghost"
          className="w-full gap-2 text-primary hover:text-primary hover:bg-primary/10"
          disabled={loading}
        >
          <Sparkles className="h-4 w-4" />
          Generar Resumen con IA
        </Button>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-5 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="animate-spin">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Analizando datos de salud...</p>
            <p className="text-xs text-muted-foreground">Esto puede tomar unos segundos</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 border-destructive/20 bg-destructive/5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="ghost" size="sm" onClick={handleGenerate} className="gap-1">
            <RefreshCw className="h-3.5 w-3.5" /> Reintentar
          </Button>
        </div>
      </Card>
    );
  }

  if (!result) return null;

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-accent/5">
      {/* Header */}
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${getScoreBg(result.score)}`}>
            <Sparkles className={`h-5 w-5 ${getScoreColor(result.score)}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-foreground">Resumen IA</h4>
              {result.score !== null && (
                <span className={`text-lg font-bold ${getScoreColor(result.score)}`}>
                  {result.score}/100
                </span>
              )}
            </div>
            {!expanded && (
              <p className="text-xs text-muted-foreground line-clamp-1">{result.summary}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {result.cached && <span className="text-[10px] text-muted-foreground">en caché</span>}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleGenerate(); }}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              <p className="text-sm text-foreground/90 leading-relaxed">{result.summary}</p>

              {result.sections && result.sections.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Por Sección</h5>
                  <div className="grid gap-2">
                    {result.sections.map((sec, i) => (
                      <div key={i} className={`p-3 rounded-lg border ${getStatusBg(sec.status)}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm font-medium ${getStatusColor(sec.status)}`}>{sec.name}</span>
                          <span className={`text-sm font-bold ${getStatusColor(sec.status)}`}>{sec.score}/100</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{sec.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.markers && result.markers.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Marcadores</h5>
                  <div className="grid gap-1.5">
                    {result.markers.map((marker, i) => (
                      <div key={i} className="flex items-center gap-2 py-1.5">
                        <div className={`w-2 h-2 rounded-full ${
                          marker.status === "green" ? "bg-success" : marker.status === "yellow" ? "bg-warning" : "bg-destructive"
                        }`} />
                        <span className="text-sm flex-1">{marker.name}</span>
                        <TrendIcon trend={marker.trend} />
                        {marker.note && <span className="text-xs text-muted-foreground max-w-[160px] truncate">{marker.note}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.highlights && result.highlights.length > 0 && (
                <div className="space-y-1.5">
                  <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Destacados</h5>
                  {result.highlights.map((h, i) => (
                    <p key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span> {h}
                    </p>
                  ))}
                </div>
              )}

              {result.recommendations && result.recommendations.length > 0 && (
                <div className="pt-2 border-t border-border/50 space-y-1.5">
                  <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Lightbulb className="h-3.5 w-3.5" /> Recomendaciones
                  </h5>
                  {result.recommendations.map((rec, i) => (
                    <p key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                      <span className="text-accent font-bold mt-0.5">{i + 1}.</span> {rec}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
