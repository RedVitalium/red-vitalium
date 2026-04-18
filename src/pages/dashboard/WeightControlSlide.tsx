import { motion } from "framer-motion";
import { BodySilhouette } from "./BodySilhouette";
import { FullBodyCompositionData } from "./types";
import { Target, TrendingDown, TrendingUp, Minus, Heart } from "lucide-react";

interface Props {
  data: FullBodyCompositionData;
}

function getHealthScoreStatus(score: number): { label: string; color: string } {
  if (score >= 85) return { label: "Excelente", color: "text-green-500" };
  if (score >= 70) return { label: "Bueno", color: "text-blue-500" };
  if (score >= 55) return { label: "Promedio", color: "text-yellow-500" };
  return { label: "Bajo", color: "text-red-500" };
}

function getControlIcon(value: number) {
  if (value < -0.5) return TrendingDown;
  if (value > 0.5) return TrendingUp;
  return Minus;
}

function getControlColor(value: number, type: "weight" | "fat" | "muscle") {
  if (type === "muscle") {
    return value >= 0 ? "text-green-500" : "text-red-500";
  }
  // For weight and fat, negative = good (need to lose)
  return value <= 0 ? "text-green-500" : "text-red-500";
}

export function WeightControlSlide({ data }: Props) {
  const healthStatus = getHealthScoreStatus(data.healthAssessment);
  const scorePercent = Math.min(data.healthAssessment, 100);

  const controls = [
    {
      label: "Control de Peso",
      value: data.weightControlKg,
      unit: "kg",
      type: "weight" as const,
      desc: data.weightControlKg <= 0 ? "Perder" : "Ganar",
    },
    {
      label: "Control Masa Grasa",
      value: data.fatMassControlKg,
      unit: "kg",
      type: "fat" as const,
      desc: data.fatMassControlKg <= 0 ? "Reducir" : "Aumentar",
    },
    {
      label: "Control Músculo",
      value: data.muscleControlKg,
      unit: "kg",
      type: "muscle" as const,
      desc: data.muscleControlKg >= 0 ? "Mantener" : "Aumentar",
    },
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      <h3 className="font-display font-bold text-lg">Control de Peso</h3>
      <div className="flex items-center gap-6 w-full">
        <div className="w-1/3 flex flex-col items-center">
          <BodySilhouette
            highlights={[
              { zone: "full", color: "hsl(150, 60%, 45%)", opacity: 0.15 },
              { zone: "abdomen", color: "hsl(25, 90%, 50%)", opacity: data.weightControlKg < 0 ? 0.4 : 0.1 },
            ]}
          />
          <div className="mt-2 text-center">
            <p className="text-xs text-muted-foreground">Peso Objetivo</p>
            <p className="text-lg font-bold">{data.normalWeightKg}<span className="text-xs font-normal text-muted-foreground ml-1">kg</span></p>
          </div>
        </div>
        <div className="flex-1 space-y-3">
          {/* Health Assessment Score */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-3 bg-muted/50 rounded-xl"
          >
            <div className="flex items-center gap-2 mb-2">
              <Heart className={`h-4 w-4 ${healthStatus.color}`} />
              <p className="text-xs text-muted-foreground">Evaluación de Salud</p>
            </div>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-2xl font-bold">{data.healthAssessment}</span>
              <span className="text-xs text-muted-foreground mb-1">pts</span>
              <span className={`text-xs font-medium mb-1 ml-auto ${healthStatus.color}`}>{healthStatus.label}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-red-400 via-yellow-400 to-green-500"
                initial={{ width: 0 }}
                animate={{ width: `${scorePercent}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
          </motion.div>

          {/* Weight target */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="p-3 bg-muted/50 rounded-xl"
          >
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-blue-500" />
              <p className="text-xs text-muted-foreground">Peso Normal</p>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-xl font-bold">{data.normalWeightKg} <span className="text-xs font-normal text-muted-foreground">kg</span></span>
              <span className="text-sm text-muted-foreground">Actual: {data.weight} kg</span>
            </div>
          </motion.div>

          {/* Control deltas */}
          {controls.map((ctrl, i) => {
            const Icon = getControlIcon(ctrl.value);
            const color = getControlColor(ctrl.value, ctrl.type);
            return (
              <motion.div
                key={ctrl.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl"
              >
                <Icon className={`h-4 w-4 shrink-0 ${color}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{ctrl.label}</p>
                  <span className="text-lg font-bold">
                    {ctrl.value > 0 ? "+" : ""}{ctrl.value} <span className="text-xs font-normal text-muted-foreground">{ctrl.unit}</span>
                  </span>
                </div>
                <span className={`text-xs font-medium ${color}`}>{ctrl.desc}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
