import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { Brain, Activity, Smile, Frown } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { MiniChart } from "@/components/dashboard/MiniChart";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AISummaryCard } from "@/components/dashboard/AISummaryCard";
import { AIInterpretButton } from "@/components/dashboard/AIInterpretButton";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAdminMode } from "@/hooks/useAdminMode";
import { PageHeader } from "@/components/PageHeader";

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
  const { isViewingAsAdmin, targetUserId } = useAdminMode();
  const backPath = isViewingAsAdmin ? "/professional/history" : `/my-dashboard${isDemo ? '?demo=true' : ''}`;
  
  const { psychologicalData, personalData } = useDashboardData();

  // Filter out zero/empty values for AI
  const aiHealthData: Record<string, any> = {};
  if (psychologicalData.anxiety.value > 0) aiHealthData.anxiety = { value: psychologicalData.anxiety.value, change: psychologicalData.anxiety.change };
  if (psychologicalData.stress.value > 0) aiHealthData.stress = { value: psychologicalData.stress.value, change: psychologicalData.stress.change };
  if (psychologicalData.depression.value > 0) aiHealthData.depression = { value: psychologicalData.depression.value, change: psychologicalData.depression.change };
  if (psychologicalData.lifeSatisfaction.value > 0) aiHealthData.lifeSatisfaction = { value: psychologicalData.lifeSatisfaction.value, change: psychologicalData.lifeSatisfaction.change };

  const personalContext = { age: personalData.age, sex: personalData.sex };

  const hasAnyData = isDemo || psychologicalData.anxiety.value > 0 || psychologicalData.stress.value > 0 || psychologicalData.depression.value > 0 || psychologicalData.lifeSatisfaction.value > 0;
  const showEmpty = !isDemo && !hasAnyData && !isViewingAsAdmin;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Bienestar Psicológico" backTo={backPath}>
        {isDemo && (
          <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full">Demo</span>
        )}
      </PageHeader>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {showEmpty ? (
          <DashboardEmptyState
            icon={Brain}
            title="Aún no hay datos psicológicos"
            description="Completa tus tests psicométricos para ver aquí tus niveles de ansiedad, estrés y bienestar."
          />
        ) : (
        <>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <AISummaryCard
            section="psychological"
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
          className="grid md:grid-cols-2 gap-4 mb-8"
        >
          <div>
            <MetricCard
              title="Ansiedad"
              subtitle="DASS-21 (0-42, menor = mejor)"
              value={psychologicalData.anxiety.value}
              target="< 8"
              change={psychologicalData.anxiety.change}
              status={getStatus(psychologicalData.anxiety.value, 8, true, true)}
              icon={<Brain className="h-5 w-5" />}
              chart={psychologicalData.anxiety.data.length > 0 ? <MiniChart data={psychologicalData.anxiety.data} color="success" /> : undefined}
            />
            <AIInterpretButton
              metricName="Ansiedad (DASS-21)"
              value={psychologicalData.anxiety.value}
              unit="pts"
              target="< 8 (normal)"
              section="psychological"
              context={personalContext}
              targetUserId={isViewingAsAdmin ? targetUserId || undefined : undefined}
              isDemo={isDemo}
              demoText="Tu puntuación de ansiedad DASS-21 de 6 pts está en rango normal (< 8). Esto indica un nivel bajo de síntomas ansiosos, lo cual es muy positivo."
              allowZeroValue
            />
          </div>
          <div>
            <MetricCard
              title="Estrés"
              subtitle="DASS-21 (0-42, menor = mejor)"
              value={psychologicalData.stress.value}
              target="< 15"
              change={psychologicalData.stress.change}
              status={getStatus(psychologicalData.stress.value, 15, true, true)}
              icon={<Activity className="h-5 w-5" />}
              chart={psychologicalData.stress.data.length > 0 ? <MiniChart data={psychologicalData.stress.data} color="success" /> : undefined}
            />
            <AIInterpretButton
              metricName="Estrés (DASS-21)"
              value={psychologicalData.stress.value}
              unit="pts"
              target="< 15 (normal)"
              section="psychological"
              context={personalContext}
              targetUserId={isViewingAsAdmin ? targetUserId || undefined : undefined}
              isDemo={isDemo}
              demoText="Tu nivel de estrés DASS-21 de 10 pts está en rango normal (< 15). Buen manejo del estrés percibido."
              allowZeroValue
            />
          </div>
          <div>
            <MetricCard
              title="Síntomas Depresivos"
              subtitle="DASS-21 (0-42, menor = mejor)"
              value={psychologicalData.depression.value}
              target="< 10"
              change={psychologicalData.depression.change}
              status={getStatus(psychologicalData.depression.value, 10, true, true)}
              icon={<Frown className="h-5 w-5" />}
            />
            <AIInterpretButton
              metricName="Depresión (DASS-21)"
              value={psychologicalData.depression.value}
              unit="pts"
              target="< 10 (normal)"
              section="psychological"
              context={personalContext}
              targetUserId={isViewingAsAdmin ? targetUserId || undefined : undefined}
              isDemo={isDemo}
              demoText="Tu puntuación de síntomas depresivos DASS-21 de 4 pts está en rango normal (< 10). No se detectan síntomas depresivos significativos."
              allowZeroValue
            />
          </div>
          <div>
            <MetricCard
              title="Satisfacción con la Vida"
              subtitle="Escala SWLS (1-10)"
              value={Number(psychologicalData.lifeSatisfaction.value.toFixed(2))}
              target="> 8"
              change={psychologicalData.lifeSatisfaction.change}
              status={getStatus(psychologicalData.lifeSatisfaction.value, 8)}
              icon={<Smile className="h-5 w-5" />}
            />
            <AIInterpretButton
              metricName="Satisfacción con la Vida (SWLS)"
              value={psychologicalData.lifeSatisfaction.value}
              unit="/10"
              target="> 8"
              section="psychological"
              context={personalContext}
              targetUserId={isViewingAsAdmin ? targetUserId || undefined : undefined}
              isDemo={isDemo}
              demoText="Tu satisfacción con la vida de 7.5/10 está por encima del promedio pero por debajo de la meta de 8. Espacio para mejorar en áreas de propósito y conexión social."
            />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
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
        </>
        )}
      </main>
    </div>
  );
}
