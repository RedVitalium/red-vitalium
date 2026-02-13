import { motion } from "framer-motion";
import { BodySilhouette } from "./BodySilhouette";
import { FullBodyCompositionData } from "./types";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

interface Props {
  data: FullBodyCompositionData;
}

function getFatStatus(fatPercent: number) {
  if (fatPercent < 14) return { label: "Bajo", color: "text-blue-500", icon: AlertTriangle };
  if (fatPercent <= 20) return { label: "Saludable", color: "text-green-500", icon: CheckCircle2 };
  if (fatPercent <= 25) return { label: "Aceptable", color: "text-yellow-500", icon: AlertTriangle };
  return { label: "Alto", color: "text-red-500", icon: AlertTriangle };
}

function getVisceralStatus(level: number) {
  if (level <= 9) return { label: "Normal", color: "text-green-500" };
  if (level <= 14) return { label: "Alto", color: "text-yellow-500" };
  return { label: "Muy Alto", color: "text-red-500" };
}

export function FatAnalysisSlide({ data }: Props) {
  const fatStatus = getFatStatus(data.bodyFatPercent);
  const visceralStatus = getVisceralStatus(data.visceralFat);
  const StatusIcon = fatStatus.icon;

  return (
    <div className="flex flex-col items-center gap-4">
      <h3 className="font-display font-bold text-lg">Análisis de Grasa</h3>
      <div className="flex items-center gap-6 w-full">
        <div className="w-1/3 flex flex-col items-center">
          <BodySilhouette
            highlightColor="hsl(45, 90%, 55%)"
            opacity={0.5}
            fillPercentage={data.bodyFatPercent * 2.5}
            direction="bottom"
          />
          <div className="mt-2 flex items-center gap-1">
            <StatusIcon className={`h-4 w-4 ${fatStatus.color}`} />
            <span className={`text-sm font-medium ${fatStatus.color}`}>{fatStatus.label}</span>
          </div>
        </div>
        <div className="flex-1 space-y-4">
          {/* Total body fat */}
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
                <div className="h-full bg-green-500/30" style={{ width: "20%" }} />
                <div className="h-full bg-yellow-500/30" style={{ width: "25%" }} />
                <div className="h-full bg-red-500/30" style={{ width: "55%" }} />
              </div>
              <motion.div
                className="absolute top-0 w-1 h-full bg-foreground rounded-full"
                initial={{ left: "0%" }}
                animate={{ left: `${Math.min(data.bodyFatPercent * 2, 95)}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>Bajo</span>
              <span>Normal</span>
              <span>Alto</span>
            </div>
          </motion.div>

          {/* Subcutaneous fat */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-3 bg-muted/50 rounded-xl"
          >
            <p className="text-xs text-muted-foreground mb-1">Grasa Subcutánea</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold">{data.subcutaneousFat}</span>
              <span className="text-sm text-muted-foreground mb-0.5">%</span>
            </div>
          </motion.div>

          {/* Visceral fat */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="p-3 bg-muted/50 rounded-xl"
          >
            <p className="text-xs text-muted-foreground mb-1">Grasa Visceral</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold">{data.visceralFat}</span>
              <span className={`text-sm font-medium mb-0.5 ${visceralStatus.color}`}>
                {visceralStatus.label}
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
