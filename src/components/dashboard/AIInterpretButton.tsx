import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAISummary } from "@/hooks/useAISummary";
import { motion, AnimatePresence } from "framer-motion";

interface AIInterpretButtonProps {
  metricName: string;
  value: number | string;
  unit?: string;
  target?: string;
  section: string;
  context?: Record<string, any>;
  targetUserId?: string;
  isDemo?: boolean;
  demoText?: string;
}

export function AIInterpretButton({ 
  metricName, value, unit, target, section, context, targetUserId, isDemo, demoText 
}: AIInterpretButtonProps) {
  const [showResult, setShowResult] = useState(false);
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const { generateSummary, loading } = useAISummary();

  // Don't show if no real data
  if (value === 0 || value === "" || value === null || value === undefined) return null;

  const handleInterpret = async () => {
    if (isDemo) {
      setInterpretation(demoText || `${metricName}: valor de ${value}${unit ? ` ${unit}` : ''} está en rango adecuado para tu perfil. Meta: ${target || 'N/A'}.`);
      setShowResult(true);
      return;
    }

    const result = await generateSummary(`interpret-${section}-${metricName}`, {
      metric: metricName,
      value,
      unit,
      target,
      ...context,
    }, targetUserId);

    if (result) {
      setInterpretation(result.summary || JSON.stringify(result));
      setShowResult(true);
    }
  };

  return (
    <div className="mt-2">
      {!showResult && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs gap-1.5 text-primary/70 hover:text-primary hover:bg-primary/10"
          onClick={handleInterpret}
          disabled={loading}
        >
          {loading ? (
            <Sparkles className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {loading ? "Interpretando..." : "Interpretación con IA"}
        </Button>
      )}

      <AnimatePresence>
        {showResult && interpretation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="p-3 mt-1 border-primary/20 bg-primary/5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs text-foreground/80 leading-relaxed">{interpretation}</p>
                </div>
                <button onClick={() => setShowResult(false)} className="shrink-0 text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
