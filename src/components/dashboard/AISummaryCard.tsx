import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, Lightbulb } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAISummary, AISummaryResult } from "@/hooks/useAISummary";

interface AISummaryCardProps {
  section: string;
  healthData: any;
  targetUserId?: string;
  compact?: boolean;
  autoLoad?: boolean;
}

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

export function AISummaryCard({ section, healthData, targetUserId, compact = false, autoLoad = false }: AISummaryCardProps) {
  const { generateSummary, loading, result, error } = useAISummary();
  const [expanded, setExpanded] = useState(!compact);

  useEffect(() => {
    if (autoLoad && healthData) {
      generateSummary(section, healthData, targetUserId);
    }
  }, [autoLoad, section]);

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
              {/* Summary text */}
              <p className="text-sm text-foreground/90 leading-relaxed">{result.summary}</p>

              {/* Section scores (for overall) */}
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

              {/* Markers (for specific sections) */}
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
                        {marker.note && <span className="text-xs text-muted-foreground max-w-[120px] truncate">{marker.note}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Highlights */}
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

              {/* Recommendations */}
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
