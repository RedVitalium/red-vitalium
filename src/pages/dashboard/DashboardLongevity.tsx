import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Heart, Timer, Dumbbell, Activity, TrendingUp, Pencil } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
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

  const EditButton = ({ metric }: { metric: MetricType }) => {
    if (!isViewingAsAdmin) return null;
    return (
      <button
        onClick={(e) => { e.stopPropagation(); setEditingMetric(metric); }}
        className="absolute top-4 right-10 p-1.5 rounded-lg hover:bg-muted transition-colors z-10"
        title="Editar"
      >
        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
    );
  };

  // Build previous values for history tab
  const getHistoryForMetric = (metric: MetricType): { value: number; date: string }[] => {
    // For demo we don't have dates, return empty
    if (isDemo) return [];
    return [];
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Link to={backPath} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <img src={appLogo} alt="Red Vitalium" className="h-8 w-auto" />
          <span className="text-lg font-display font-bold text-primary">Longevidad</span>
          {isDemo && (
            <span className="ml-auto text-xs bg-accent/20 text-accent px-2 py-1 rounded-full">
              Demo
            </span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-2 gap-4"
        >
          <div className="relative">
            <EditButton metric="biological_age" />
            <MetricCard
              title="Edad Biológica"
              subtitle={`vs Edad cronológica (${personalData.age} años)`}
              value={longevityData.biologicalAge.value}
              unit="años"
              target="Menor que cronológica"
              change={longevityData.biologicalAge.change}
              status={getStatus(longevityData.biologicalAge.value > 0 ? personalData.age - longevityData.biologicalAge.value : 0, 0)}
              icon={<TrendingUp className="h-5 w-5" />}
            />
          </div>
          <div className="relative">
            <EditButton metric="waist_circumference" />
            <MetricCard
              title="RCHA"
              subtitle="Cintura/Altura - Riesgo metabólico"
              value={longevityData.waistHeightRatio.value}
              target="< 0.5"
              change={longevityData.waistHeightRatio.change}
              status={getStatus(longevityData.waistHeightRatio.value, 0.5, true)}
              icon={<Activity className="h-5 w-5" />}
            />
          </div>
          <div className="relative">
            <EditButton metric="vo2_max" />
            <MetricCard
              title="VO2 Máx"
              subtitle="Capacidad aeróbica (ml/kg/min)"
              value={longevityData.vo2Max.value}
              target="> 45"
              change={longevityData.vo2Max.change}
              status={getStatus(longevityData.vo2Max.value, 45)}
              icon={<Heart className="h-5 w-5" />}
            />
          </div>
          <div className="relative">
            <EditButton metric="grip_strength_left" />
            <MetricCard
              title="Fuerza Agarre Izq."
              subtitle="Potencia muscular (Kg)"
              value={longevityData.gripStrengthLeft.value}
              unit="Kg"
              target="> 40 Kg"
              change={longevityData.gripStrengthLeft.change}
              status={getStatus(longevityData.gripStrengthLeft.value, 40)}
              icon={<Dumbbell className="h-5 w-5" />}
            />
          </div>
          <div className="relative">
            <EditButton metric="grip_strength_right" />
            <MetricCard
              title="Fuerza Agarre Der."
              subtitle="Potencia muscular (Kg)"
              value={longevityData.gripStrengthRight.value}
              unit="Kg"
              target="> 40 Kg"
              change={longevityData.gripStrengthRight.change}
              status={getStatus(longevityData.gripStrengthRight.value, 40)}
              icon={<Dumbbell className="h-5 w-5" />}
            />
          </div>
          <div className="relative">
            <EditButton metric="balance_left" />
            <MetricCard
              title="Equilibrio Pierna Izq."
              subtitle="Tiempo con ojos cerrados"
              value={longevityData.balanceLeft.value}
              unit="seg"
              target="> 30 seg"
              change={longevityData.balanceLeft.change}
              status={getStatus(longevityData.balanceLeft.value, 30)}
              icon={<Timer className="h-5 w-5" />}
            />
          </div>
          <div className="relative">
            <EditButton metric="balance_right" />
            <MetricCard
              title="Equilibrio Pierna Der."
              subtitle="Tiempo con ojos cerrados"
              value={longevityData.balanceRight.value}
              unit="seg"
              target="> 30 seg"
              change={longevityData.balanceRight.change}
              status={getStatus(longevityData.balanceRight.value, 30)}
              icon={<Timer className="h-5 w-5" />}
            />
          </div>
          <div className="relative">
            <EditButton metric="non_hdl_cholesterol" />
            <MetricCard
              title="Colesterol No-HDL"
              subtitle="Predictor metabólico (mg/dL)"
              value={longevityData.nonHdlCholesterol.value}
              unit="mg/dL"
              target="< 100"
              change={longevityData.nonHdlCholesterol.change}
              status={getStatus(longevityData.nonHdlCholesterol.value, 100, true)}
              icon={<Activity className="h-5 w-5" />}
            />
          </div>
          <div className="relative">
            <EditButton metric="hrv" />
            <MetricCard
              title="VFC (HRV)"
              subtitle="Variabilidad cardíaca (ms)"
              value={longevityData.hrv.value}
              unit="ms"
              target="> 50"
              change={longevityData.hrv.change}
              status={getStatus(longevityData.hrv.value, 50)}
              icon={<TrendingUp className="h-5 w-5" />}
            />
          </div>
        </motion.div>
      </main>

      {/* Editor Dialog */}
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
