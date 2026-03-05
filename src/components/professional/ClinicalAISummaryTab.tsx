import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, Brain, Apple, Stethoscope, Dumbbell } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAISummary } from "@/hooks/useAISummary";
import { Specialty } from "@/hooks/useUserRoles";

interface ClinicalAISummaryTabProps {
  patientUserId: string;
  patientName: string;
}

const specialtyConfig: { id: Specialty; label: string; icon: React.ElementType; section: string }[] = [
  { id: "psychology", label: "Psicológico", icon: Brain, section: "clinical-psychology" },
  { id: "nutrition", label: "Alimentación", icon: Apple, section: "clinical-nutrition" },
  { id: "medicine", label: "Médico", icon: Stethoscope, section: "clinical-medicine" },
  { id: "physiotherapy", label: "Físico", icon: Dumbbell, section: "clinical-physiotherapy" },
];

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

function SpecialtySummaryCard({ specialty, patientUserId }: { specialty: typeof specialtyConfig[0]; patientUserId: string }) {
  const { generateSummary, loading, result, error } = useAISummary();
  const [expanded, setExpanded] = useState(false);
  const Icon = specialty.icon;

  const handleGenerate = () => {
    generateSummary(specialty.section, undefined, patientUserId);
  };

  return (
    <Card className="overflow-hidden border-primary/20">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground flex-1">{specialty.label}</h3>
          {result?.score !== null && result?.score !== undefined && (
            <span className={`text-lg font-bold ${getScoreColor(result.score)}`}>
              {result.score}/100
            </span>
          )}
        </div>

        {!result && !loading && !error && (
          <Button
            onClick={handleGenerate}
            variant="ghost"
            size="sm"
            className="w-full gap-2 text-primary hover:text-primary hover:bg-primary/10"
          >
            <Sparkles className="h-4 w-4" />
            Generar Resumen IA
          </Button>
        )}

        {loading && (
          <div className="flex items-center gap-2 py-3 justify-center">
            <Sparkles className="h-4 w-4 text-primary animate-spin" />
            <span className="text-sm text-muted-foreground">Analizando...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-destructive">{error}</p>
            <Button variant="ghost" size="sm" onClick={handleGenerate} className="gap-1">
              <RefreshCw className="h-3 w-3" /> Reintentar
            </Button>
          </div>
        )}

        {result && (
          <div className="space-y-2">
            <p className="text-sm text-foreground/90 leading-relaxed">{result.summary}</p>
            
            {result.markers && result.markers.length > 0 && (
              <AnimatePresence>
                {expanded && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <div className="space-y-1.5 mt-2">
                      {result.markers.map((m, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <div className={`w-2 h-2 rounded-full ${m.status === "green" ? "bg-success" : m.status === "yellow" ? "bg-warning" : "bg-destructive"}`} />
                          <span className="flex-1">{m.name}</span>
                          {m.note && <span className="text-muted-foreground truncate max-w-[200px]">{m.note}</span>}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {result.recommendations && result.recommendations.length > 0 && expanded && (
              <div className="pt-2 border-t border-border/50 space-y-1">
                {result.recommendations.map((r, i) => (
                  <p key={i} className="text-xs text-foreground/80">
                    <span className="text-accent font-bold">{i + 1}.</span> {r}
                  </p>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              {(result.markers?.length || result.recommendations?.length) ? (
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setExpanded(!expanded)}>
                  {expanded ? "Ver menos" : "Ver detalles"}
                </Button>
              ) : null}
              <Button variant="ghost" size="sm" className="text-xs h-7 gap-1 ml-auto" onClick={handleGenerate}>
                <RefreshCw className="h-3 w-3" /> Regenerar
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

export default function ClinicalAISummaryTab({ patientUserId, patientName }: ClinicalAISummaryTabProps) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-display font-bold text-foreground">Resumen IA</h2>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Resumen generado por IA de cada área clínica de {patientName}, incluyendo notas profesionales, datos de salud y progreso de hábitos.
      </p>

      <div className="grid gap-4">
        {specialtyConfig.map((s) => (
          <SpecialtySummaryCard key={s.id} specialty={s} patientUserId={patientUserId} />
        ))}
      </div>
    </motion.div>
  );
}
