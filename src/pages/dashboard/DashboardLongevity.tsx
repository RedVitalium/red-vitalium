import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Heart, Timer, Dumbbell, Activity, TrendingUp } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAdminMode } from "@/hooks/useAdminMode";
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
  const { isViewingAsAdmin } = useAdminMode();
  const backPath = isViewingAsAdmin ? "/professional/history" : "/my-dashboard";
  
  const { personalData, longevityData } = useDashboardData();

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
        {/* Metrics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-2 gap-4"
        >
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
          <MetricCard
            title="RCHA"
            subtitle="Cintura/Altura - Riesgo metabólico"
            value={longevityData.waistHeightRatio.value}
            target="< 0.5"
            change={longevityData.waistHeightRatio.change}
            status={getStatus(longevityData.waistHeightRatio.value, 0.5, true)}
            icon={<Activity className="h-5 w-5" />}
          />
          <MetricCard
            title="VO2 Máx"
            subtitle="Capacidad aeróbica (ml/kg/min)"
            value={longevityData.vo2Max.value}
            target="> 45"
            change={longevityData.vo2Max.change}
            status={getStatus(longevityData.vo2Max.value, 45)}
            icon={<Heart className="h-5 w-5" />}
          />
          <MetricCard
            title="Fuerza de Agarre"
            subtitle="Potencia muscular (Kg)"
            value={longevityData.gripStrength.value}
            unit="Kg"
            target="> 40 Kg"
            change={longevityData.gripStrength.change}
            status={getStatus(longevityData.gripStrength.value, 40)}
            icon={<Dumbbell className="h-5 w-5" />}
          />
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
        </motion.div>
      </main>
    </div>
  );
}
