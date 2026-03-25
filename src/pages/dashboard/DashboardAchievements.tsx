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
        {/* AI Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <AISummaryCard
            section="achievements"
            healthData={{
              streak: weeklyProgress.streak,
              weeklyGoals: weeklyProgress.weeklyGoals,
              improvement: weeklyProgress.improvement,
              achievements: achievements.map(a => ({ title: a.title, type: a.type, improvement: a.improvement })),
              cycleProgress: cycleProgress.cycleProgress,
              currentWeek: cycleProgress.currentWeekOfCycle,
            }}
            targetUserId={isViewingAsAdmin ? undefined : undefined}
            compact
            isDemo={isDemo}
          />
        </motion.div>

        {/* Monthly Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8"
        >
          <MonthlyAchievements 
            achievements={achievements} 
            hasEnoughData={hasEnoughDataForAchievements || isDemo}
            cycleProgress={cycleProgress.cycleProgress}
            currentWeek={cycleProgress.currentWeekOfCycle}
            daysRemaining={28 - cycleProgress.daysSinceCycleStart}
            hasActiveCycle={cycleProgress.hasActiveCycle}
          />
        </motion.div>

        {/* Weekly Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <WeeklyProgress 
            streak={weeklyProgress.streak}
            weeklyGoals={weeklyProgress.weeklyGoals}
            improvement={weeklyProgress.improvement}
            weeklyAchievements={achievements.slice(0, 3)}
            hasActiveCycle={cycleProgress.hasActiveCycle}
          />
        </motion.div>

        {/* Achievement History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Historial de Logros
          </h3>
          <Card className="p-6">
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Los logros históricos se mostrarán aquí</p>
              <p className="text-sm mt-1">Completa ciclos para ver tu progreso</p>
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
