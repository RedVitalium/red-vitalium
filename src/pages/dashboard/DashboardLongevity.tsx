import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Heart, Timer, Dumbbell, Activity, TrendingUp, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { AISummaryCard } from "@/components/dashboard/AISummaryCard";
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

  const EditButton = ({ metric, label }: { metric: MetricType; label: string }) => {
    if (!isViewingAsAdmin) return null;
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        className="w-full mt-2 text-xs gap-1 text-muted-foreground hover:text-primary"
        onClick={() => setEditingMetric(metric)}
      >
        <Pencil className="h-3 w-3" />
        Editar {label}
      </Button>
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
        {/* AI Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <AISummaryCard
            section="longevity"
            healthData={{
              biologicalAge: { value: longevityData.biologicalAge.value, change: longevityData.biologicalAge.change },
              chronologicalAge: personalData.age,
              vo2Max: { value: longevityData.vo2Max.value, change: longevityData.vo2Max.change },
              gripLeft: { value: longevityData.gripStrengthLeft.value, change: longevityData.gripStrengthLeft.change },
              gripRight: { value: longevityData.gripStrengthRight.value, change: longevityData.gripStrengthRight.change },
              balanceLeft: { value: longevityData.balanceLeft.value, change: longevityData.balanceLeft.change },
              balanceRight: { value: longevityData.balanceRight.value, change: longevityData.balanceRight.change },
              hrv: { value: longevityData.hrv.value, change: longevityData.hrv.change },
              waistHeightRatio: { value: longevityData.waistHeightRatio.value, change: longevityData.waistHeightRatio.change },
              nonHdlCholesterol: { value: longevityData.nonHdlCholesterol.value, change: longevityData.nonHdlCholesterol.change },
            }}
            targetUserId={isViewingAsAdmin ? targetUserId || undefined : undefined}
            compact
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid md:grid-cols-2 gap-4"
        >
          <div>
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
            <EditButton metric="biological_age" label="Edad Biológica" />
          </div>
          <div>
            <MetricCard
              title="RCHA"
              subtitle="Cintura/Altura - Riesgo metabólico"
              value={longevityData.waistHeightRatio.value}
              target="< 0.5"
              change={longevityData.waistHeightRatio.change}
              status={getStatus(longevityData.waistHeightRatio.value, 0.5, true)}
              icon={<Activity className="h-5 w-5" />}
            />
            <EditButton metric="waist_circumference" label="RCHA" />
          </div>
          <div>
            <MetricCard
              title="VO2 Máx"
              subtitle="Capacidad aeróbica (ml/kg/min)"
              value={longevityData.vo2Max.value}
              target="> 45"
              change={longevityData.vo2Max.change}
              status={getStatus(longevityData.vo2Max.value, 45)}
              icon={<Heart className="h-5 w-5" />}
            />
            <EditButton metric="vo2_max" label="VO2 Máx" />
          </div>
          <div>
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
            <EditButton metric="grip_strength_left" label="Agarre Izq." />
          </div>
          <div>
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
            <EditButton metric="grip_strength_right" label="Agarre Der." />
          </div>
          <div>
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
            <EditButton metric="balance_left" label="Equilibrio Izq." />
          </div>
          <div>
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
            <EditButton metric="balance_right" label="Equilibrio Der." />
          </div>
          <div>
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
            <EditButton metric="non_hdl_cholesterol" label="Colesterol No-HDL" />
          </div>
          <div>
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
            <EditButton metric="hrv" label="VFC (HRV)" />
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
