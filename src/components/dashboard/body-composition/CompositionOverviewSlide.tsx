import { motion } from "framer-motion";
import { BodySilhouette } from "./BodySilhouette";
import { FullBodyCompositionData } from "./types";
import { cn } from "@/lib/utils";

interface Props {
  data: FullBodyCompositionData;
  age?: number;
  sex?: string;
}

function getBmiStatus(bmi: number): "optimal" | "warning" | "danger" {
  if (bmi === 0) return "optimal";
  if (bmi >= 18.5 && bmi <= 24.9) return "optimal";
  if ((bmi >= 25 && bmi <= 29.9) || (bmi >= 16 && bmi < 18.5)) return "warning";
  return "danger";
}

function getVisceralFatStatus(vf: number): "optimal" | "warning" | "danger" {
  if (vf === 0) return "optimal";
  if (vf >= 1 && vf <= 9) return "optimal";
  if (vf >= 10 && vf <= 14) return "warning";
  return "danger";
}

const statusColors: Record<string, string> = {
  optimal: "ring-2 ring-green-400/60 bg-green-50/30 dark:bg-green-950/20",
  warning: "ring-2 ring-yellow-400/60 bg-yellow-50/30 dark:bg-yellow-950/20",
  danger: "ring-2 ring-red-400/60 bg-red-50/30 dark:bg-red-950/20",
};

export function CompositionOverviewSlide({ data, age, sex }: Props) {
  const segments = [
    { label: "Agua", value: data.bodyWaterPercent, color: "hsl(200, 80%, 55%)" },
    { label: "Músculo", value: data.muscleMass, color: "hsl(0, 70%, 55%)" },
    { label: "Grasa", value: data.bodyFatPercent, color: "hsl(45, 90%, 55%)" },
    { label: "Hueso", value: (data.boneMass / data.weight) * 100, color: "hsl(0, 0%, 65%)" },
    { label: "Proteína", value: data.protein, color: "hsl(280, 60%, 55%)" },
  ];

  const bmiStatus = getBmiStatus(data.bmi);
  const visceralStatus = getVisceralFatStatus(data.visceralFat);

  return (
    <div className="flex flex-col items-center gap-4">
      <h3 className="font-display font-bold text-lg">Composición General</h3>
      <div className="flex items-center gap-6 w-full">
        <div className="w-1/3 flex flex-col items-center">
          <BodySilhouette
            highlights={[
              { zone: "full", color: "hsl(200, 80%, 55%)", opacity: 0.15 },
              { zone: "muscles", color: "hsl(0, 70%, 55%)", opacity: 0.25 },
              { zone: "skin", color: "hsl(45, 90%, 55%)", opacity: 0.3 },
              { zone: "bones", color: "hsl(0, 0%, 65%)", opacity: 0.4 },
            ]}
          />
          <div className="mt-2 text-center">
            <p className="text-2xl font-bold">{data.weight} <span className="text-sm font-normal text-muted-foreground">kg</span></p>
          </div>
        </div>
        <div className="flex-1 space-y-3">
          {segments.map((seg, i) => (
            <motion.div
              key={seg.label}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: seg.color }} />
                  {seg.label}
                </span>
                <span className="font-medium">{seg.value.toFixed(1)}%</span>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: seg.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(seg.value, 100)}%` }}
                  transition={{ duration: 0.8, delay: 0.4 + i * 0.1 }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 w-full mt-2">
        <div className={cn("text-center p-2 rounded-lg", data.bmi > 0 ? statusColors[bmiStatus] : "bg-muted/50")}>
          <p className="text-xs text-muted-foreground">IMC</p>
          <p className="text-lg font-bold">{data.bmi}</p>
        </div>
        <div className="text-center p-2 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">Tipo Corporal</p>
          <p className="text-sm font-bold leading-tight">{data.bodyType}</p>
        </div>
        <div className={cn("text-center p-2 rounded-lg", data.visceralFat > 0 ? statusColors[visceralStatus] : "bg-muted/50")}>
          <p className="text-xs text-muted-foreground">Grasa Visceral</p>
          <p className="text-lg font-bold">{data.visceralFat}</p>
        </div>
      </div>
    </div>
  );
}
