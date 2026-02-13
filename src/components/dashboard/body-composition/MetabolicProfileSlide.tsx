import { motion } from "framer-motion";
import { BodySilhouette } from "./BodySilhouette";
import { FullBodyCompositionData } from "./types";
import { Flame, Clock, Droplets, Activity } from "lucide-react";

interface Props {
  data: FullBodyCompositionData;
}

export function MetabolicProfileSlide({ data }: Props) {
  const ageDiff = data.metabolicAge - 45;
  const ageStatus = ageDiff <= 0 ? "text-green-500" : ageDiff <= 3 ? "text-yellow-500" : "text-red-500";

  // Water fill opacity based on hydration
  const waterOpacity = Math.min(data.bodyWaterPercent / 100, 0.5);

  const metrics = [
    {
      icon: Flame,
      label: "Tasa Metabólica Basal",
      value: `${data.bmr}`,
      unit: "kcal/día",
      desc: "Calorías en reposo",
      color: "text-orange-500",
    },
    {
      icon: Clock,
      label: "Edad Metabólica",
      value: `${data.metabolicAge}`,
      unit: "años",
      desc: ageDiff <= 0 ? `${Math.abs(ageDiff)} años menor` : `${ageDiff} años mayor`,
      color: ageStatus,
    },
    {
      icon: Droplets,
      label: "Agua Corporal",
      value: `${data.bodyWaterPercent}`,
      unit: "%",
      desc: data.bodyWaterPercent >= 50 ? "Hidratación adecuada" : "Hidratación baja",
      color: "text-blue-500",
    },
    {
      icon: Activity,
      label: "IMC",
      value: `${data.bmi}`,
      unit: "kg/m²",
      desc: data.bmi < 18.5 ? "Bajo peso" : data.bmi < 25 ? "Normal" : data.bmi < 30 ? "Sobrepeso" : "Obesidad",
      color: data.bmi < 25 ? "text-green-500" : data.bmi < 30 ? "text-yellow-500" : "text-red-500",
    },
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      <h3 className="font-display font-bold text-lg">Perfil Metabólico</h3>
      <div className="flex items-center gap-6 w-full">
        <div className="w-1/3 flex flex-col items-center">
          <BodySilhouette
            highlights={[
              { zone: "full", color: "hsl(200, 80%, 55%)", opacity: waterOpacity },
              { zone: "abdomen", color: "hsl(25, 90%, 55%)", opacity: 0.3 },
            ]}
          />
          <p className="mt-2 text-sm text-muted-foreground text-center">
            <span className="font-bold text-foreground">{data.bmr}</span> kcal/día
          </p>
        </div>
        <div className="flex-1 space-y-3">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.12 }}
              className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl"
            >
              <m.icon className={`h-5 w-5 shrink-0 ${m.color}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <div className="flex items-end gap-1">
                  <span className="text-xl font-bold">{m.value}</span>
                  <span className="text-xs text-muted-foreground mb-0.5">{m.unit}</span>
                </div>
              </div>
              <span className={`text-xs font-medium ${m.color}`}>{m.desc}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
