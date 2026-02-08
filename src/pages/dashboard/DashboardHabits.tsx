import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Activity, Moon, Dumbbell, Smartphone, Timer, Sparkles } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { MiniChart } from "@/components/dashboard/MiniChart";
import { LockedHabitCard } from "@/components/dashboard/LockedHabitCard";
import { HabitWeekIndicator } from "@/components/dashboard/HabitWeekIndicator";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useCycleData } from "@/hooks/useCycleData";
import { useUnlockedHabits } from "@/hooks/useUnlockedHabits";
import { useHabitGoals } from "@/hooks/useHabitGoals";
import { useAuth } from "@/hooks/useAuth";
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

const habitIcons: Record<string, typeof Activity> = {
  sauna: Activity,
  cold_bath: Activity,
  meditation: Activity,
  yoga: Activity,
};

export default function DashboardHabits() {
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";
  const { user } = useAuth();
  
  const { habitsData } = useDashboardData();
  const { getCycleProgress } = useCycleData(isDemo ? null : user?.id || null);
  const cycleProgress = isDemo 
    ? { currentWeekOfCycle: 3, hasActiveCycle: true, isTestWeek: false }
    : getCycleProgress();
    
  const { isHabitUnlocked, advancedHabits } = useUnlockedHabits();
  const { 
    screenTimeGoal, 
    phoneUnlocksGoal, 
    yogaGoal, 
    sleepHoursGoal,
    sleepQualityGoal,
    activityGoals 
  } = useHabitGoals();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/my-dashboard" className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <img src={appLogo} alt="Red Vitalium" className="h-8 w-auto" />
          <span className="text-lg font-display font-bold text-primary">Hábitos</span>
          {isDemo && (
            <span className="ml-auto text-xs bg-accent/20 text-accent px-2 py-1 rounded-full">
              Demo
            </span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Week indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <HabitWeekIndicator 
            currentWeek={cycleProgress.currentWeekOfCycle}
            isTestWeek={cycleProgress.isTestWeek}
            hasActiveCycle={cycleProgress.hasActiveCycle}
          />
        </motion.div>

        {/* Basic Habits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-2 gap-4 mb-8"
        >
          <MetricCard
            title="Sueño"
            subtitle="Horas efectivas de sueño"
            value={habitsData.sleep.value}
            unit="hrs"
            target={`> ${sleepHoursGoal} horas`}
            change={habitsData.sleep.change}
            status={getStatus(habitsData.sleep.value, sleepHoursGoal)}
            icon={<Moon className="h-5 w-5" />}
            chart={habitsData.sleep.data.length > 0 ? <MiniChart data={habitsData.sleep.data} color="success" /> : undefined}
          />
          <MetricCard
            title="Calidad de Sueño"
            subtitle="Puntuación de tracker (0-100)"
            value={habitsData.sleepQuality.value}
            target={`> ${sleepQualityGoal}`}
            change={habitsData.sleepQuality.change}
            status={getStatus(habitsData.sleepQuality.value, sleepQualityGoal)}
            icon={<Activity className="h-5 w-5" />}
          />
          <MetricCard
            title="Actividad Física"
            subtitle={`${habitsData.activity.sessionCount || 0} sesiones de ${habitsData.activity.avgDuration || 0} min`}
            value={habitsData.activity.sessionCount || 0}
            unit="sesiones"
            target={`${activityGoals.sessionsPerWeek} de ${activityGoals.avgDurationMinutes} min`}
            change={habitsData.activity.change}
            status={getStatus(habitsData.activity.sessionCount || 0, activityGoals.sessionsPerWeek)}
            icon={<Dumbbell className="h-5 w-5" />}
            chart={habitsData.activity.data.length > 0 ? <MiniChart data={habitsData.activity.data} color="success" /> : undefined}
          />
          <MetricCard
            title="Tiempo en Pantalla"
            subtitle="Promedio diario (semana anterior)"
            value={habitsData.screenTime.value}
            unit="min"
            target={`< ${screenTimeGoal} min`}
            change={habitsData.screenTime.change}
            status={getStatus(habitsData.screenTime.value, screenTimeGoal, true)}
            icon={<Smartphone className="h-5 w-5" />}
          />
          <MetricCard
            title="Desbloqueos de Teléfono"
            subtitle="Promedio diario (semana anterior)"
            value={habitsData.phoneUnlocks.value}
            unit="veces"
            target={`< ${phoneUnlocksGoal}`}
            change={habitsData.phoneUnlocks.change}
            status={getStatus(habitsData.phoneUnlocks.value, phoneUnlocksGoal, true)}
            icon={<Smartphone className="h-5 w-5" />}
          />
        </motion.div>

        {/* Advanced Habits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
            <Timer className="h-5 w-5 text-primary" />
            Hábitos Avanzados
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {advancedHabits.map((habit) => {
              const unlocked = isHabitUnlocked(habit.id);
              
              if (unlocked) {
                if (habit.id === "yoga" && habitsData.yoga) {
                  return (
                    <MetricCard
                      key={habit.id}
                      title={habit.name}
                      subtitle={`${habitsData.yoga.sessionCount || 0} sesiones (semana anterior)`}
                      value={habitsData.yoga.sessionCount || 0}
                      unit="sesiones"
                      target={`${yogaGoal} sesiones/semana`}
                      change={habitsData.yoga.change}
                      status={getStatus(habitsData.yoga.sessionCount || 0, yogaGoal)}
                      icon={<Sparkles className="h-5 w-5" />}
                    />
                  );
                }
                return (
                  <MetricCard
                    key={habit.id}
                    title={habit.name}
                    subtitle={habit.description}
                    value="Activo"
                    status="optimal"
                    icon={<Sparkles className="h-5 w-5" />}
                  />
                );
              }
              
              return (
                <LockedHabitCard
                  key={habit.id}
                  title={habit.name}
                  description={habit.description}
                  icon={Sparkles}
                />
              );
            })}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
