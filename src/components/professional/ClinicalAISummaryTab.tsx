import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, Brain, Apple, Stethoscope, Dumbbell, ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAISummary } from "@/hooks/useAISummary";

interface ClinicalAISummaryTabProps {
  patientUserId: string;
  patientName: string;
  isDemo?: boolean;
  demoResult?: any;
}

const specialtyIcons: Record<string, React.ElementType> = {
  psychology: Brain,
  nutrition: Apple,
  medicine: Stethoscope,
  physiotherapy: Dumbbell,
};

const specialtyLabels: Record<string, string> = {
  psychology: "Psicológico",
  nutrition: "Alimentación",
  medicine: "Médico",
  physiotherapy: "Físico",
};

function getScoreColor(score: number | null) {
  if (!score) return "text-muted-foreground";
  if (score >= 75) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-destructive";
}

function getStatusDot(status: string) {
  if (status === "green") return "bg-success";
  if (status === "yellow") return "bg-warning";
  return "bg-destructive";
}

export default function ClinicalAISummaryTab({ patientUserId, patientName, isDemo, demoResult }: ClinicalAISummaryTabProps) {
  const { generateSummary, loading, result, error } = useAISummary();
  const [expanded, setExpanded] = useState(false);

  const displayResult = isDemo ? demoResult : result;

  const handleGenerate = () => {
    generateSummary("clinical-unified", undefined, patientUserId);
  };

  // Parse the unified result which has specialtySections
  let parsed: any = null;
  if (displayResult) {
    try {
      parsed = typeof displayResult === "string" ? JSON.parse(displayResult) : displayResult;
      if (parsed?.summary && typeof parsed.summary === "string") {
        try { parsed = JSON.parse(parsed.summary); } catch {}
      }
    } catch {
      parsed = displayResult;
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-display font-bold text-foreground">Resumen Clínico con IA</h2>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Resumen integral generado por IA de {patientName}, basado en datos reales del paciente, notas profesionales y plan de suscripción.
      </p>

      {!parsed && !loading && !error && !isDemo && (
        <Card className="p-6">
          <Button
            onClick={handleGenerate}
            className="w-full gap-2"
            variant="outline"
          >
            <Sparkles className="h-4 w-4" />
            Generar Resumen Clínico Integral
          </Button>
        </Card>
      )}

      {loading && (
        <Card className="p-6">
          <div className="flex items-center gap-3 justify-center py-4">
            <Sparkles className="h-5 w-5 text-primary animate-spin" />
            <span className="text-sm text-muted-foreground">Analizando datos del paciente...</span>
          </div>
        </Card>
      )}

      {error && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-destructive">{error}</p>
            <Button variant="ghost" size="sm" onClick={handleGenerate} className="gap-1">
              <RefreshCw className="h-3 w-3" /> Reintentar
            </Button>
          </div>
        </Card>
      )}

      {parsed && (
        <div className="space-y-4">
          {/* Overall score & summary */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Puntuación General</h3>
              {parsed.score != null && (
                <span className={`text-2xl font-bold ${getScoreColor(parsed.score)}`}>
                  {parsed.score}/100
                </span>
              )}
            </div>
            {parsed.plan && (
              <p className="text-xs text-muted-foreground mb-2">
                Plan: <span className="font-medium text-foreground">{parsed.plan}</span>
              </p>
            )}
            <p className="text-sm text-foreground/90 leading-relaxed">{parsed.summary}</p>
          </Card>

          {/* Specialty sections */}
          {parsed.specialtySections && parsed.specialtySections.map((sec: any) => {
            const Icon = specialtyIcons[sec.specialty] || Brain;
            return (
              <Card key={sec.specialty} className="p-4 border-primary/10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground flex-1">
                    {specialtyLabels[sec.specialty] || sec.specialty}
                  </h4>
                  {sec.score != null && (
                    <span className={`text-base font-bold ${getScoreColor(sec.score)}`}>
                      {sec.score}/100
                    </span>
                  )}
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">{sec.summary}</p>

                {sec.markers && sec.markers.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {sec.markers.map((m: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <div className={`w-2 h-2 rounded-full ${getStatusDot(m.status)}`} />
                        <span className="flex-1">{m.name}</span>
                        {m.note && <span className="text-muted-foreground truncate max-w-[200px]">{m.note}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}

          {/* Recommendations */}
          {parsed.recommendations && parsed.recommendations.length > 0 && (
            <Card className="p-4">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center justify-between w-full text-left"
              >
                <h4 className="text-sm font-semibold text-foreground">Recomendaciones</h4>
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              <AnimatePresence>
                {expanded && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <div className="pt-2 space-y-1">
                      {parsed.recommendations.map((r: string, i: number) => (
                        <p key={i} className="text-xs text-foreground/80">
                          <span className="text-accent font-bold">{i + 1}.</span> {r}
                        </p>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          )}

          {/* Regenerate */}
          {!isDemo && (
            <Button variant="ghost" size="sm" className="w-full text-xs gap-1" onClick={handleGenerate}>
              <RefreshCw className="h-3 w-3" /> Regenerar resumen
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}
