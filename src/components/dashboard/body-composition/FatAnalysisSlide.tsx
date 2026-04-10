import { motion } from "framer-motion";
import { BodySilhouette } from "./BodySilhouette";
import { FullBodyCompositionData } from "./types";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

interface Props {
  data: FullBodyCompositionData;
  age?: number;
  sex?: string;
}

function getBodyFatRanges(age: number, sex: string) {
  const isMale = sex.toLowerCase().includes("mas") || sex.toLowerCase() === "m" || sex.toLowerCase() === "male";
  
  if (isMale) {
    if (age >= 50) return { athlete: 15, good: 20, average: 26 };
    if (age >= 40) return { athlete: 14, good: 19, average: 25 };
    if (age >= 30) return { athlete: 12, good: 17, average: 23 };
    return { athlete: 11, good: 16, average: 22 }; // 20-29
  } else {
    if (age >= 50) return { athlete: 19, good: 26, average: 33 };
    if (age >= 40) return { athlete: 18, good: 25, average: 32 };
    if (age >= 30) return { athlete: 17, good: 24, average: 31 };
    return { athlete: 16, good: 23, average: 30 }; // 20-29
  }
}

// Generic fallback ranges (average across all age groups)
const GENERIC_RANGES = { athlete: 14, good: 19, average: 25 };

function getFatStatus(fatPercent: number, age?: number, sex?: string) {
  const ranges = (age && age > 0 && sex) ? getBodyFatRanges(age, sex) : GENERIC_RANGES;
  
  if (fatPercent < ranges.athlete) return { label: "Atleta", color: "text-blue-500", icon: CheckCircle2 };
  if (fatPercent <= ranges.good) return { label: "Bueno", color: "text-green-500", icon: CheckCircle2 };
  if (fatPercent <= ranges.average) return { label: "Promedio", color: "text-yellow-500", icon: AlertTriangle };
  return { label: "Alto", color: "text-red-500", icon: AlertTriangle };
}

function getVisceralStatus(level: number) {
  if (level <= 9) return { label: "Normal", color: "text-green-500" };
  if (level <= 14) return { label: "Alto", color: "text-yellow-500" };
  return { label: "Muy Alto", color: "text-red-500" };
}

export function FatAnalysisSlide({ data, age, sex }: Props) {
  const fatStatus = getFatStatus(data.bodyFatPercent, age, sex);
  const visceralStatus = getVisceralStatus(data.visceralFat);
  const StatusIcon = fatStatus.icon;

  // Calculate indicator position based on age/sex ranges
  const ranges = (age && age > 0 && sex) ? getBodyFatRanges(age, sex) : GENERIC_RANGES;
  const maxRange = ranges.average + 15; // extend beyond "alto"
  const indicatorPos = Math.min((data.bodyFatPercent / maxRange) * 100, 95);
  const greenEnd = (ranges.good / maxRange) * 100;
  const yellowEnd = (ranges.average / maxRange) * 100;

  return (
    <div className="flex flex-col items-center gap-4">
      <h3 className="font-display font-bold text-lg">Análisis de Grasa</h3>
      <div className="flex items-center gap-6 w-full">
        <div className="w-1/3 flex flex-col items-center">
          <BodySilhouette
            highlights={[
              { zone: "skin", color: "hsl(45, 90%, 55%)", opacity: 0.5 },
              { zone: "abdomen", color: "hsl(25, 90%, 50%)", opacity: 0.55 },
            ]}
          />
          <div className="mt-2 flex items-center gap-1">
            <StatusIcon className={`h-4 w-4 ${fatStatus.color}`} />
            <span className={`text-sm font-medium ${fatStatus.color}`}>{fatStatus.label}</span>
          </div>
        </div>
        <div className="flex-1 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-3 bg-muted/50 rounded-xl"
          >
            <p className="text-xs text-muted-foreground mb-1">Grasa Corporal Total</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold">{data.bodyFatPercent}</span>
              <span className="text-sm text-muted-foreground mb-1">%</span>
            </div>
            <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden relative">
              <div className="absolute inset-0 flex">
                <div className="h-full bg-green-500/30" style={{ width: `${greenEnd}%` }} />
                <div className="h-full bg-yellow-500/30" style={{ width: `${yellowEnd - greenEnd}%` }} />
                <div className="h-full bg-red-500/30" style={{ width: `${100 - yellowEnd}%` }} />
              </div>
              <motion.div
                className="absolute top-0 w-1 h-full bg-foreground rounded-full"
                initial={{ left: "0%" }}
                animate={{ left: `${indicatorPos}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>Bueno</span>
              <span>Promedio</span>
              <span>Alto</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-3 bg-muted/50 rounded-xl"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <p className="text-xs text-muted-foreground">Grasa Subcutánea</p>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold">{data.subcutaneousFat}</span>
              <span className="text-sm text-muted-foreground mb-0.5">%</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Visible en el borde de la silueta</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="p-3 bg-muted/50 rounded-xl"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <p className="text-xs text-muted-foreground">Grasa Visceral</p>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold">{data.visceralFat}</span>
              <span className={`text-sm font-medium mb-0.5 ${visceralStatus.color}`}>
                {visceralStatus.label}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Zona abdominal en la silueta</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
