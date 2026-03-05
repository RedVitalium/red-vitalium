import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Heart, Timer, Dumbbell, Activity, TrendingUp, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { AISummaryCard } from "@/components/dashboard/AISummaryCard";
import { AIInterpretButton } from "@/components/dashboard/AIInterpretButton";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAdminMode } from "@/hooks/useAdminMode";
import { LongevityMetricEditor, type MetricType } from "@/components/dashboard/LongevityMetricEditor";
import appLogo from "@/assets/app-logo.png";

function getStatus(value: number, target: number, isLowerBetter: boolean = false): "optimal" | "warning" | "danger" {
  if (value === 0) return "warning";
  if (isLowerBetter) {
    if (value <= target) return "optimal";
    if (value <= target * 1.2) return "warning";
    return "danger";
  } else {
    if (value >= target) return "optimal";
    if (value >= target * 0.8) return "warning";
    return "danger";
  }
}

export default function DashboardLongevity() {
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";
  const { isViewingAsAdmin, targetUserId } = useAdminMode();
  const backPath = isViewingAsAdmin ? "/professional/history" : `/my-dashboard${isDemo ? '?demo=true' : ''}`;
  
  const { personalData, longevityData } = useDashboardData();
  const [editingMetric, setEditingMetric] = useState<MetricType | null>(null);

  const personalContext = { age: personalData.age, sex: personalData.sex };

  const EditButton = ({ metric, label }: { metric: MetricType; label: string }) => {
    if (!isViewingAsAdmin) return null;
    return (
      <Button 
        variant="ghost" size="sm" 
        className="w-full mt-2 text-xs gap-1 text-muted-foreground hover:text-primary"
        onClick={() => setEditingMetric(metric)}
      >
        <Pencil className="h-3 w-3" />
        Editar {label}
      </Button>
    );
  };

  // Filter out zero values for AI summary
  const aiHealthData: Record<string, any> = {};
  if (longevityData.biologicalAge.value > 0) aiHealthData.biologicalAge = { value: longevityData.biologicalAge.value, change: longevityData.biologicalAge.change };
  if (personalData.age > 0) aiHealthData.chronologicalAge = personalData.age;
  if (longevityData.vo2Max.value > 0) aiHealthData.vo2Max = { value: longevityData.vo2Max.value, change: longevityData.vo2Max.change };
  if (longevityData.gripStrengthLeft.value > 0) aiHealthData.gripLeft = { value: longevityData.gripStrengthLeft.value, change: longevityData.gripStrengthLeft.change };
  if (longevityData.gripStrengthRight.value > 0) aiHealthData.gripRight = { value: longevityData.gripStrengthRight.value, change: longevityData.gripStrengthRight.change };
  if (longevityData.balanceLeft.value > 0) aiHealthData.balanceLeft = { value: longevityData.balanceLeft.value, change: longevityData.balanceLeft.change };
  if (longevityData.balanceRight.value > 0) aiHealthData.balanceRight = { value: longevityData.balanceRight.value, change: longevityData.balanceRight.change };
  if (longevityData.hrv.value > 0) aiHealthData.hrv = { value: longevityData.hrv.value, change: longevityData.hrv.change };
  if (longevityData.waistHeightRatio.value > 0) aiHealthData.waistHeightRatio = { value: longevityData.waistHeightRatio.value, change: longevityData.waistHeightRatio.change };
  if (longevityData.nonHdlCholesterol.value > 0) aiHealthData.nonHdlCholesterol = { value: longevityData.nonHdlCholesterol.value, change: longevityData.nonHdlCholesterol.change };

  const getHistoryForMetric = (metric: MetricType): { value: number; date: string }[] => {
    if (isDemo) return [];
    return [];
  };

  const metrics = [
    { key: "bio-age", title: "Edad Biológica", subtitle: `vs Edad cronológica (${personalData.age} años)`, value: longevityData.biologicalAge.value, unit: "años", target: "Menor que cronológica", change: longevityData.biologicalAge.change, status: getStatus(longevityData.biologicalAge.value > 0 ? personalData.age - longevityData.biologicalAge.value : 0, 0), icon: <TrendingUp className="h-5 w-5" />, metric: "biological_age" as MetricType, label: "Edad Biológica", demoText: "Tu edad biológica de 48 años es 2 años mayor que tu edad cronológica de 46. Esto indica margen de mejora en marcadores metabólicos y cardiovasculares." },
    { key: "rcha", title: "RCHA", subtitle: "Cintura/Altura - Riesgo metabólico", value: longevityData.waistHeightRatio.value, target: "< 0.5", change: longevityData.waistHeightRatio.change, status: getStatus(longevityData.waistHeightRatio.value, 0.5, true), icon: <Activity className="h-5 w-5" />, metric: "waist_circumference" as MetricType, label: "RCHA", demoText: "Tu ratio cintura/altura de 0.52 está ligeramente por encima del umbral ideal de 0.5, indicando riesgo metabólico leve." },
    { key: "vo2", title: "VO2 Máx", subtitle: "Capacidad aeróbica (ml/kg/min)", value: longevityData.vo2Max.value, target: "> 45", change: longevityData.vo2Max.change, status: getStatus(longevityData.vo2Max.value, 45), icon: <Heart className="h-5 w-5" />, metric: "vo2_max" as MetricType, label: "VO2 Máx", demoText: "Tu VO2 Max de 38 ml/kg/min está por debajo de la meta de 45. Percentil ~45 para hombres de 46 años. Mejorable con entrenamiento de intervalos." },
    { key: "grip-l", title: "Fuerza Agarre Izq.", subtitle: "Potencia muscular (Kg)", value: longevityData.gripStrengthLeft.value, unit: "Kg", target: "> 40 Kg", change: longevityData.gripStrengthLeft.change, status: getStatus(longevityData.gripStrengthLeft.value, 40), icon: <Dumbbell className="h-5 w-5" />, metric: "grip_strength_left" as MetricType, label: "Agarre Izq.", demoText: "Fuerza de agarre izquierdo de 42 Kg, por encima de la meta de 40 Kg. Buen indicador de longevidad y salud muscular." },
    { key: "grip-r", title: "Fuerza Agarre Der.", subtitle: "Potencia muscular (Kg)", value: longevityData.gripStrengthRight.value, unit: "Kg", target: "> 40 Kg", change: longevityData.gripStrengthRight.change, status: getStatus(longevityData.gripStrengthRight.value, 40), icon: <Dumbbell className="h-5 w-5" />, metric: "grip_strength_right" as MetricType, label: "Agarre Der.", demoText: "Fuerza de agarre derecho de 44 Kg, buen nivel. Simetría bilateral adecuada." },
    { key: "bal-l", title: "Equilibrio Pierna Izq.", subtitle: "Tiempo con ojos cerrados", value: longevityData.balanceLeft.value, unit: "seg", target: "> 30 seg", change: longevityData.balanceLeft.change, status: getStatus(longevityData.balanceLeft.value, 30), icon: <Timer className="h-5 w-5" />, metric: "balance_left" as MetricType, label: "Equilibrio Izq.", demoText: "Equilibrio izquierdo de 25 seg, por debajo de la meta de 30. Practicar ejercicios de equilibrio diarios." },
    { key: "bal-r", title: "Equilibrio Pierna Der.", subtitle: "Tiempo con ojos cerrados", value: longevityData.balanceRight.value, unit: "seg", target: "> 30 seg", change: longevityData.balanceRight.change, status: getStatus(longevityData.balanceRight.value, 30), icon: <Timer className="h-5 w-5" />, metric: "balance_right" as MetricType, label: "Equilibrio Der.", demoText: "Equilibrio derecho de 28 seg, cercano a la meta. Buena progresión." },
    { key: "nhdl", title: "Colesterol No-HDL", subtitle: "Predictor metabólico (mg/dL)", value: longevityData.nonHdlCholesterol.value, unit: "mg/dL", target: "< 100", change: longevityData.nonHdlCholesterol.change, status: getStatus(longevityData.nonHdlCholesterol.value, 100, true), icon: <Activity className="h-5 w-5" />, metric: "non_hdl_cholesterol" as MetricType, label: "Colesterol No-HDL", demoText: "Colesterol no-HDL en rango aceptable. Este es un predictor clave de riesgo cardiovascular." },
    { key: "hrv", title: "VFC (HRV)", subtitle: "Variabilidad cardíaca (ms)", value: longevityData.hrv.value, unit: "ms", target: "> 50", change: longevityData.hrv.change, status: getStatus(longevityData.hrv.value, 50), icon: <TrendingUp className="h-5 w-5" />, metric: "hrv" as MetricType, label: "VFC (HRV)", demoText: "HRV de 45 ms, ligeramente por debajo de la meta de 50. Mejorable con manejo de estrés y sueño de calidad." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Link to={backPath} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <img src={appLogo} alt="Red Vitalium" className="h-8 w-auto" />
          <span className="text-lg font-display font-bold text-primary">Longevidad</span>
          {isDemo && (
            <span className="ml-auto text-xs bg-accent/20 text-accent px-2 py-1 rounded-full">Demo</span>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <AISummaryCard
            section="longevity"
            healthData={Object.keys(aiHealthData).length > 0 ? aiHealthData : undefined}
            targetUserId={isViewingAsAdmin ? targetUserId || undefined : undefined}
            compact
            isDemo={isDemo}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid md:grid-cols-2 gap-4"
        >
          {metrics.map((m) => (
            <div key={m.key}>
              <MetricCard
                title={m.title}
                subtitle={m.subtitle}
                value={m.value}
                unit={m.unit}
                target={m.target}
                change={m.change}
                status={m.status}
                icon={m.icon}
              />
              <AIInterpretButton
                metricName={m.title}
                value={m.value}
                unit={m.unit}
                target={m.target}
                section="longevity"
                context={personalContext}
                targetUserId={isViewingAsAdmin ? targetUserId || undefined : undefined}
                isDemo={isDemo}
                demoText={m.demoText}
              />
              <EditButton metric={m.metric} label={m.label} />
            </div>
          ))}
        </motion.div>
      </main>

      {editingMetric && targetUserId && (
        <LongevityMetricEditor
          open={!!editingMetric}
          onOpenChange={(open) => { if (!open) setEditingMetric(null); }}
          metricType={editingMetric}
          targetUserId={targetUserId}
          chronologicalAge={personalData.age}
          previousValues={getHistoryForMetric(editingMetric)}
        />
      )}
    </div>
  );
}
