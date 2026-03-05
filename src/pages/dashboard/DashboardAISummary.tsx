import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import { AISummaryCard } from "@/components/dashboard/AISummaryCard";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAdminMode } from "@/hooks/useAdminMode";
import appLogo from "@/assets/app-logo.png";

export default function DashboardAISummary() {
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";
  const { isViewingAsAdmin, targetUserId, selectedPatient } = useAdminMode();
  const backPath = isViewingAsAdmin ? "/professional/history" : `/my-dashboard${isDemo ? '?demo=true' : ''}`;

  const { personalData, habitsData, psychologicalData, longevityData } = useDashboardData(
    isViewingAsAdmin ? targetUserId || undefined : undefined
  );

  const overallHealthData = {
    personal: { age: personalData.age, sex: personalData.sex, height: personalData.height, weight: personalData.weight },
    habits: {
      sleep: habitsData.sleep.value,
      sleepChange: habitsData.sleep.change,
      sleepQuality: habitsData.sleepQuality.value,
      activitySessions: habitsData.activity.sessionCount,
      activityDuration: habitsData.activity.avgDuration,
      screenTime: habitsData.screenTime.value,
      phoneUnlocks: habitsData.phoneUnlocks.value,
    },
    psychological: {
      anxiety: psychologicalData.anxiety.value,
      anxietyChange: psychologicalData.anxiety.change,
      stress: psychologicalData.stress.value,
      stressChange: psychologicalData.stress.change,
      depression: psychologicalData.depression.value,
      lifeSatisfaction: psychologicalData.lifeSatisfaction.value,
    },
    longevity: {
      biologicalAge: longevityData.biologicalAge.value,
      vo2Max: longevityData.vo2Max.value,
      gripLeft: longevityData.gripStrengthLeft.value,
      gripRight: longevityData.gripStrengthRight.value,
      balanceLeft: longevityData.balanceLeft.value,
      balanceRight: longevityData.balanceRight.value,
      hrv: longevityData.hrv.value,
      waistHeightRatio: longevityData.waistHeightRatio.value,
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Link to={backPath} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <img src={appLogo} alt="Red Vitalium" className="h-8 w-auto" />
          <span className="text-lg font-display font-bold text-primary">Resumen Integral IA</span>
          {isDemo && (
            <span className="ml-auto text-xs bg-accent/20 text-accent px-2 py-1 rounded-full">Demo</span>
          )}
          {isViewingAsAdmin && selectedPatient && (
            <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
              {selectedPatient.fullName}
            </span>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <AISummaryCard
            section="overall"
            healthData={overallHealthData}
            targetUserId={isViewingAsAdmin ? targetUserId || undefined : undefined}
            autoLoad={true}
            isDemo={isDemo}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 p-5 bg-muted/30 border border-border rounded-xl"
        >
          <p className="text-sm text-muted-foreground text-center">
            Este resumen se genera con inteligencia artificial analizando todos tus datos de salud. 
            Se actualiza automáticamente cuando hay nuevos datos disponibles.
          </p>
        </motion.div>
      </main>
    </div>
  );
}
