import { useState } from "react";
import { motion } from "framer-motion";
import { SegmentalData } from "./types";

interface Props {
  segmentalData: SegmentalData[];
}

const SEGMENT_LABELS: Record<string, string> = {
  left_upper: "Brazo Izq",
  right_upper: "Brazo Der",
  trunk: "Tronco",
  left_lower: "Pierna Izq",
  right_lower: "Pierna Der",
};

const STATUS_COLORS: Record<string, string> = {
  Normal: "text-green-600",
  High: "text-red-500",
  Low: "text-blue-500",
};

const STATUS_BG: Record<string, string> = {
  Normal: "bg-green-50 ring-1 ring-green-200",
  High: "bg-red-50 ring-1 ring-red-200",
  Low: "bg-blue-50 ring-1 ring-blue-200",
};

function getBarColor(compared: number, type: string): string {
  if (type === "fat") {
    if (compared <= 100) return "bg-green-500";
    if (compared <= 150) return "bg-yellow-500";
    return "bg-red-500";
  }
  // muscle
  if (compared >= 100) return "bg-green-500";
  if (compared >= 80) return "bg-yellow-500";
  return "bg-red-500";
}

export function SegmentalAnalysisSlide({ segmentalData }: Props) {
  const [tab, setTab] = useState<"muscle" | "fat">("muscle");

  const muscleData = segmentalData.filter(d => d.analysisType === "muscle");
  const fatData = segmentalData.filter(d => d.analysisType === "fat");
  const currentData = tab === "muscle" ? muscleData : fatData;

  // Order: left_upper, right_upper, trunk, left_lower, right_lower
  const segmentOrder = ["left_upper", "right_upper", "trunk", "left_lower", "right_lower"];
  const sorted = segmentOrder
    .map(seg => currentData.find(d => d.segment === seg))
    .filter(Boolean) as SegmentalData[];

  if (segmentalData.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <h3 className="font-display font-bold text-lg">Análisis Segmental</h3>
        <p className="text-sm text-muted-foreground text-center">
          Los datos segmentales se obtienen del reporte detallado de Arboleaf.
          Sube las capturas que incluyan "Muscle balance" y "Segmental fat analysis".
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <h3 className="font-display font-bold text-lg">Análisis Segmental</h3>

      {/* Tab toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab("muscle")}
          className={`text-xs px-4 py-1.5 rounded-full transition-all ${
            tab === "muscle"
              ? "bg-red-500 text-white font-medium"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Músculo
        </button>
        <button
          onClick={() => setTab("fat")}
          className={`text-xs px-4 py-1.5 rounded-full transition-all ${
            tab === "fat"
              ? "bg-yellow-500 text-white font-medium"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Grasa
        </button>
      </div>

      {/* Segmental data */}
      <div className="w-full space-y-2">
        {sorted.map((seg, i) => {
          const barWidth = Math.min(seg.comparedToNormal, 200) / 2; // scale to 0-100%
          const barColor = getBarColor(seg.comparedToNormal, tab);

          return (
            <motion.div
              key={`${seg.segment}-${tab}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              className={`p-3 rounded-xl ${STATUS_BG[seg.status] || "bg-muted/50"}`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{SEGMENT_LABELS[seg.segment] || seg.segment}</span>
                  <span className={`text-xs font-medium ${STATUS_COLORS[seg.status] || "text-muted-foreground"}`}>
                    {seg.status}
                  </span>
                </div>
                <span className="text-sm font-bold">{seg.massKg} kg</span>
              </div>

              <div className="flex items-center gap-3">
                {/* Comparison bar */}
                <div className="flex-1">
                  <div className="h-2 bg-muted/60 rounded-full overflow-hidden relative">
                    {/* 100% reference line */}
                    <div className="absolute top-0 bottom-0 left-1/2 w-px bg-foreground/20 z-10" />
                    <motion.div
                      className={`h-full rounded-full ${barColor}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ duration: 0.6, delay: 0.3 + i * 0.08 }}
                    />
                  </div>
                  <div className="flex justify-between mt-0.5">
                    <span className="text-[9px] text-muted-foreground">0%</span>
                    <span className="text-[9px] text-muted-foreground">100%</span>
                    <span className="text-[9px] text-muted-foreground">200%</span>
                  </div>
                </div>

                {/* Compared to normal value */}
                <div className="text-right min-w-[50px]">
                  <span className="text-xs font-medium">{seg.comparedToNormal}%</span>
                  <p className="text-[9px] text-muted-foreground">vs normal</p>
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground mt-1">
                {seg.bodyPercentage}% del cuerpo
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
