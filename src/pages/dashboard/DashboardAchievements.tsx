import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Trophy, Medal, Star, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { MonthlyAchievements } from "@/components/dashboard/MonthlyAchievements";
import { WeeklyProgress } from "@/components/dashboard/WeeklyProgress";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useCycleData } from "@/hooks/useCycleData";
import { useAuth } from "@/hooks/useAuth";
import { useAdminMode } from "@/hooks/useAdminMode";
import appLogo from "@/assets/app-logo.png";

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
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Link to={backPath} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <img src={appLogo} alt="Red Vitalium" className="h-8 w-auto" />
          <span className="text-lg font-display font-bold text-primary">Logros</span>
          {isDemo && (
            <span className="ml-auto text-xs bg-accent/20 text-accent px-2 py-1 rounded-full">
              Demo
            </span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Monthly Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
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
