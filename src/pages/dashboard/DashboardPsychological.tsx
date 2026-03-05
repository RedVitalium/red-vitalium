import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Brain, Activity, Smile, Frown } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { MiniChart } from "@/components/dashboard/MiniChart";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AISummaryCard } from "@/components/dashboard/AISummaryCard";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAdminMode } from "@/hooks/useAdminMode";
import appLogo from "@/assets/app-logo.png";

function getStatus(value: number, target: number, isLowerBetter: boolean = false, treatZeroAsOptimal: boolean = false): "optimal" | "warning" | "danger" {
  if (value === 0) {
    if (treatZeroAsOptimal && isLowerBetter) return "optimal";
    return "warning";
  }
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

export default function DashboardPsychological() {
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";
  const { isViewingAsAdmin } = useAdminMode();
  const backPath = isViewingAsAdmin ? "/professional/history" : `/my-dashboard${isDemo ? '?demo=true' : ''}`;
  
  const { psychologicalData } = useDashboardData();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Link to={backPath} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <img src={appLogo} alt="Red Vitalium" className="h-8 w-auto" />
          <span className="text-lg font-display font-bold text-primary">Bienestar Psicológico</span>
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
            section="psychological"
            healthData={{
              anxiety: { value: psychologicalData.anxiety.value, change: psychologicalData.anxiety.change },
              stress: { value: psychologicalData.stress.value, change: psychologicalData.stress.change },
              depression: { value: psychologicalData.depression.value, change: psychologicalData.depression.change },
              lifeSatisfaction: { value: psychologicalData.lifeSatisfaction.value, change: psychologicalData.lifeSatisfaction.change },
            }}
            compact
          />
        </motion.div>

        {/* Metrics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid md:grid-cols-2 gap-4 mb-8"
        >
          <MetricCard
            title="Ansiedad"
            subtitle="Puntuación mensual (0-100)"
            value={psychologicalData.anxiety.value}
            target="< 50"
            change={psychologicalData.anxiety.change}
            status={getStatus(psychologicalData.anxiety.value, 50, true, true)}
            icon={<Brain className="h-5 w-5" />}
            chart={psychologicalData.anxiety.data.length > 0 ? <MiniChart data={psychologicalData.anxiety.data} color="success" /> : undefined}
          />
          <MetricCard
            title="Estrés"
            subtitle="Puntuación mensual (0-100)"
            value={psychologicalData.stress.value}
            target="< 50"
            change={psychologicalData.stress.change}
            status={getStatus(psychologicalData.stress.value, 50, true, true)}
            icon={<Activity className="h-5 w-5" />}
            chart={psychologicalData.stress.data.length > 0 ? <MiniChart data={psychologicalData.stress.data} color="success" /> : undefined}
          />
          <MetricCard
            title="Síntomas Depresivos"
            subtitle="Test DASS-21 (0-30)"
            value={psychologicalData.depression.value}
            target="< 10"
            change={psychologicalData.depression.change}
            status={getStatus(psychologicalData.depression.value, 10, true, true)}
            icon={<Frown className="h-5 w-5" />}
          />
          <MetricCard
            title="Satisfacción con la Vida"
            subtitle="Escala SWLS (1-10)"
            value={Number(psychologicalData.lifeSatisfaction.value.toFixed(2))}
            target="> 8"
            change={psychologicalData.lifeSatisfaction.change}
            status={getStatus(psychologicalData.lifeSatisfaction.value, 8)}
            icon={<Smile className="h-5 w-5" />}
          />
        </motion.div>

        {/* Tests Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6">
            <h3 className="font-display font-bold text-lg mb-2">Tests Psicométricos</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Completa las evaluaciones periódicas para un seguimiento preciso de tu bienestar mental.
            </p>
            <Button asChild>
              <Link to="/tests">
                <Brain className="h-4 w-4 mr-2" />
                Ver Tests Disponibles
              </Link>
            </Button>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
