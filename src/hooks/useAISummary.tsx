import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface AISummaryMarker {
  name: string;
  status: "green" | "yellow" | "red";
  trend?: "improving" | "stable" | "declining";
  note?: string;
}

export interface AISummarySection {
  name: string;
  score: number;
  status: "green" | "yellow" | "red";
  summary: string;
}

export interface AISummaryResult {
  score: number | null;
  summary: string;
  markers?: AISummaryMarker[];
  sections?: AISummarySection[];
  recommendations?: string[];
  highlights?: string[];
  cached: boolean;
}

export function useAISummary() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AISummaryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateSummary = useCallback(async (
    section: string,
    healthData: any,
    targetUserId?: string
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-health-summary", {
        body: { section, healthData, targetUserId },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      let parsed: any;
      try {
        parsed = typeof data.summary === "string" ? JSON.parse(data.summary) : data.summary;
      } catch {
        parsed = { summary: data.summary, score: data.score };
      }

      const summaryResult: AISummaryResult = {
        score: parsed.score ?? data.score,
        summary: parsed.summary || "",
        markers: parsed.markers,
        sections: parsed.sections,
        recommendations: parsed.recommendations,
        highlights: parsed.highlights,
        cached: data.cached,
      };

      setResult(summaryResult);
      return summaryResult;
    } catch (e: any) {
      const msg = e.message || "Error generando resumen";
      setError(msg);
      toast.error(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { generateSummary, loading, result, error };
}
