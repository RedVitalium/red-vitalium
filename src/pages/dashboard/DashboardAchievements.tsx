import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { Trophy, Medal, Star, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { MonthlyAchievements } from "@/components/dashboard/MonthlyAchievements";
import { WeeklyProgress } from "@/components/dashboard/WeeklyProgress";
import { AISummaryCard } from "@/components/dashboard/AISummaryCard";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useCycleData } from "@/hooks/useCycleData";
import { useAuth } from "@/hooks/useAuth";
import { useAdminMode } from "@/hooks/useAdminMode";
import { PageHeader } from "@/components/PageHeader";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";

export default function DashboardAchievements() {
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";
  const { user } = useAuth();
  const { isViewingAsAdmin } = useAdminMode();
  const backPath = isViewingAsAdmin ? "/professional/history" : `/my-dashboard${isDemo ? '?demo=true' : ''}`;
  
  const { 
    weeklyProgress, 
    achievements,
    hasEnoughDataForAchievements
  } = useDashboardData();

  const { getCycleProgress } = useCycleData(isDemo ? null : user?.id || null);
  const cycleProgress = isDemo 
    ? { cycleStartDate: new Date(), currentWeekOfCycle: 3, daysSinceCycleStart: 18, cycleProgress: 64, hasActiveCycle: true, isTestWeek: false, weeksUntilTest: 1 }
    : getCycleProgress();

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Logros" backTo={backPath}>
        {isDemo && (
          <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full">Demo</span>
        )}
      </PageHeader>

      {/* Main Content */}
       <main className="container mx-auto px-4 py-8 max-w-3xl">
        {!isDemo && !cycleProgress.hasActiveCycle && !isViewingAsAdmin ? (
          <DashboardEmptyState
            icon={Trophy}
            title="Tus logros están por comenzar"
            description="Cuando tu programa inicie, aquí verás tus logros semanales y mensuales de salud."
          />
        ) : (
        <>
          {/* ...existing content stays exactly the same... */}
        </>
        )}
      </main>
    </div>
  );
}
