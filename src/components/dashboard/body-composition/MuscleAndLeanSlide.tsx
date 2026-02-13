import { motion } from "framer-motion";
import { BodySilhouette } from "./BodySilhouette";
import { FullBodyCompositionData } from "./types";

interface Props {
  data: FullBodyCompositionData;
}

export function MuscleAndLeanSlide({ data }: Props) {
  const fatFreePercent = (data.fatFreeMass / data.weight) * 100;

  const items = [
    { label: "Masa Muscular", value: `${data.muscleMass}%`, sub: `${((data.muscleMass / 100) * data.weight).toFixed(1)} kg`, color: "hsl(0, 70%, 55%)" },
    { label: "Masa Libre de Grasa", value: `${fatFreePercent.toFixed(1)}%`, sub: `${data.fatFreeMass} kg`, color: "hsl(200, 70%, 50%)" },
    { label: "Masa Ósea", value: `${data.boneMass} kg`, sub: `${((data.boneMass / data.weight) * 100).toFixed(1)}%`, color: "hsl(0, 0%, 65%)" },
    { label: "Proteína", value: `${data.protein}%`, sub: `${((data.protein / 100) * data.weight).toFixed(1)} kg`, color: "hsl(280, 60%, 55%)" },
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      <h3 className="font-display font-bold text-lg">Masa Muscular y Magra</h3>
      <div className="flex items-center gap-6 w-full">
        <div className="w-1/3 flex flex-col items-center">
          <BodySilhouette
            highlights={[
              { zone: "core", color: "hsl(0, 70%, 55%)", opacity: 0.4 },
              { zone: "limbs", color: "hsl(0, 65%, 50%)", opacity: 0.3 },
              { zone: "bones", color: "hsl(0, 0%, 65%)", opacity: 0.5 },
            ]}
          />
          <p className="mt-2 text-sm text-muted-foreground text-center">Músculo: <span className="font-bold text-foreground">{data.muscleMass}%</span></p>
        </div>
        <div className="flex-1 space-y-3">
          {items.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.12 }}
              className="p-3 bg-muted/50 rounded-xl"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-xl font-bold">{item.value}</span>
                <span className="text-sm text-muted-foreground">{item.sub}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
