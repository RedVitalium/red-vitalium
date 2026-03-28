import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MetricTooltipProps {
  metric: string;
}

const tooltipData: Record<string, { description: string; range: string }> = {
  "VO2 Máx": {
    description: "Mide la capacidad máxima de tu cuerpo para transportar y utilizar oxígeno durante el ejercicio. Es el mejor predictor individual de longevidad cardiovascular.",
    range: "Rango saludable: > 40 ml/kg/min (hombres), > 35 ml/kg/min (mujeres)",
  },
  "VFC (HRV)": {
    description: "La Variabilidad de Frecuencia Cardíaca mide la variación en el tiempo entre latidos. Refleja la capacidad de tu sistema nervioso autónomo para adaptarse al estrés.",
    range: "Rango saludable: > 50 ms (adultos). Mayor = mejor recuperación y resiliencia.",
  },
  "Edad Biológica": {
    description: "Estimación de la edad funcional de tu cuerpo basada en 9 biomarcadores sanguíneos (Edad Fenotípica de Levine). Puede ser mayor o menor que tu edad cronológica.",
    range: "Ideal: igual o menor a tu edad cronológica.",
  },
  "Glucosa en ayunas": {
    description: "Nivel de azúcar en sangre tras 8+ horas de ayuno. Indicador clave de metabolismo glucémico y riesgo de diabetes tipo 2.",
    range: "Rango saludable: 70–100 mg/dL. Prediabetes: 100–125. Diabetes: ≥ 126.",
  },
  "PCR ultrasensible": {
    description: "La Proteína C Reactiva ultrasensible mide la inflamación sistémica de bajo grado. Marcador de riesgo cardiovascular e inflamación crónica.",
    range: "Rango saludable: < 1.0 mg/L. Riesgo moderado: 1–3. Alto riesgo: > 3.",
  },
};

export function MetricTooltip({ metric }: MetricTooltipProps) {
  const data = tooltipData[metric];
  if (!data) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button className="inline-flex items-center justify-center rounded-full p-0.5 text-muted-foreground hover:text-foreground transition-colors">
          <Info className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[280px] text-left">
        <p className="text-sm font-medium mb-1">{metric}</p>
        <p className="text-xs text-muted-foreground mb-1.5">{data.description}</p>
        <p className="text-xs font-medium text-primary">{data.range}</p>
      </TooltipContent>
    </Tooltip>
  );
}
