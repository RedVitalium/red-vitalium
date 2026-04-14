import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { AISummaryCard } from "@/components/dashboard/AISummaryCard";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { useAdminMode } from "@/hooks/useAdminMode";
import { useAuth } from "@/hooks/useAuth";
import { useCycleData } from "@/hooks/useCycleData";
import { PageHeader } from "@/components/PageHeader";

export default function DashboardAISummary() {
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";
  const { user } = useAuth();
  const { isViewingAsAdmin, targetUserId, selectedPatient } = useAdminMode();
  const backPath = isViewingAsAdmin ? "/professional/history" : `/my-dashboard${isDemo ? '?demo=true' : ''}`;
  
  const effectiveUserId = isViewingAsAdmin ? targetUserId : user?.id;
  const { getCycleProgress } = useCycleData(isDemo ? null : effectiveUserId || null);
  const cycleProgress = isDemo ? { hasActiveCycle: true } : getCycleProgress();
  const showEmpty = !isDemo && !cycleProgress.hasActiveCycle && !isViewingAsAdmin;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Resumen Integral IA" backTo={backPath}>
        {isDemo && (
          <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full">Demo</span>
        )}
        {isViewingAsAdmin && selectedPatient && (
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
            {selectedPatient.fullName}
          </span>
        )}
      </PageHeader>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {showEmpty ? (
          <DashboardEmptyState
            icon={Sparkles}
            title="Tu resumen de IA está en preparación"
            description="Cuando tu programa inicie, aquí verás un análisis integral de todos tus datos de salud generado con inteligencia artificial."
          />
        ) : (
        <>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <AISummaryCard
            section="overall"
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
        </>
        )}
      </main>
    </div>
  );
}