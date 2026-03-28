import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { Activity, Moon, Dumbbell, Smartphone, Timer, Sparkles } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { MiniChart } from "@/components/dashboard/MiniChart";
import { LockedHabitCard } from "@/components/dashboard/LockedHabitCard";
import { HabitWeekIndicator } from "@/components/dashboard/HabitWeekIndicator";
import { ProfessionalHabitEditor, InlineGoalEditor } from "@/components/dashboard/ProfessionalHabitEditor";
import { AISummaryCard } from "@/components/dashboard/AISummaryCard";
import { AIInterpretButton } from "@/components/dashboard/AIInterpretButton";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useCycleData } from "@/hooks/useCycleData";
import { useUnlockedHabits } from "@/hooks/useUnlockedHabits";
import { useHabitGoals } from "@/hooks/useHabitGoals";
import { useAuth } from "@/hooks/useAuth";
import { useAdminMode } from "@/hooks/useAdminMode";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";

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

export default function DashboardHabits() {
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";
  const { user } = useAuth();
  const { isViewingAsAdmin, selectedPatient, targetUserId } = useAdminMode();
  const backPath = isViewingAsAdmin ? "/professional/history" : `/my-dashboard${isDemo ? '?demo=true' : ''}`;
  
  const effectiveUserId = isViewingAsAdmin ? targetUserId : user?.id;
  
  const { habitsData, personalData } = useDashboardData(isViewingAsAdmin ? targetUserId || undefined : undefined);
  const { getCycleProgress } = useCycleData(isDemo ? null : effectiveUserId || null);
  const cycleProgress = isDemo 
    ? { currentWeekOfCycle: 3, hasActiveCycle: true, isTestWeek: false }
    : getCycleProgress();
    
  const { isHabitUnlocked, advancedHabits } = useUnlockedHabits(isViewingAsAdmin ? effectiveUserId || undefined : undefined);
  const { 
    screenTimeGoal, phoneUnlocksGoal, yogaGoal, sleepHoursGoal, sleepQualityGoal, activityGoals 
  } = useHabitGoals(isViewingAsAdmin ? effectiveUserId || undefined : undefined);

  const { data: activeCycle } = useQuery({
    queryKey: ["patient-cycle-for-month", selectedPatient?.userId],
    queryFn: async () => {
      if (!selectedPatient?.userId) return null;
      const { data } = await supabase
        .from("user_cycles").select("*").eq("user_id", selectedPatient.userId).eq("is_active", true).maybeSingle();
      return data;
    },
    enabled: !!selectedPatient?.userId && isViewingAsAdmin,
  });

  const [selectedMonth, setSelectedMonth] = useState(1);
  useEffect(() => {
    if (activeCycle) {
      const days = Math.floor((Date.now() - new Date(activeCycle.started_at).getTime()) / (1000*60*60*24));
      setSelectedMonth(Math.ceil(days / 28) || 1);
    }
  }, [activeCycle]);

  const patientId = isViewingAsAdmin ? selectedPatient?.userId : undefined;
  const personalContext = { age: personalData.age, sex: personalData.sex };

  // Filter zero values for AI
  const aiHealthData: Record<string, any> = {};
  if (habitsData.sleep.value > 0) aiHealthData.sleep = { value: habitsData.sleep.value, change: habitsData.sleep.change };
  if (habitsData.sleepQuality.value > 0) aiHealthData.sleepQuality = { value: habitsData.sleepQuality.value, change: habitsData.sleepQuality.change };
  if (habitsData.activity.sessionCount > 0) aiHealthData.activity = { sessions: habitsData.activity.sessionCount, avgDuration: habitsData.activity.avgDuration, change: habitsData.activity.change };
  if (habitsData.screenTime.value > 0) aiHealthData.screenTime = { value: habitsData.screenTime.value, change: habitsData.screenTime.change };
  if (habitsData.phoneUnlocks.value > 0) aiHealthData.phoneUnlocks = { value: habitsData.phoneUnlocks.value, change: habitsData.phoneUnlocks.change };
  if (habitsData.yoga && habitsData.yoga.sessionCount > 0) aiHealthData.yoga = { sessions: habitsData.yoga.sessionCount, change: habitsData.yoga.change };

  const sleepHoursOptions = [6, 6.5, 7, 7.5, 8, 8.5, 9];
  const sleepQualityOptions = [70, 75, 80, 85, 90, 95, 100];
  const activitySessionOptions = [1, 2, 3, 4, 5, 6, 7];
  const activityDurationOptions = [15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 75, 90];
  const screenTimeOptions = [30, 45, 60, 75, 90, 105, 120, 135, 150, 180, 210, 240];
  const phoneUnlocksOptions = [20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 150];

  const hasAnyData = !isDemo && (habitsData.sleep.value > 0 || habitsData.sleepQuality.value > 0 || (habitsData.activity.sessionCount || 0) > 0 || habitsData.screenTime.value > 0 || habitsData.phoneUnlocks.value > 0);
  const showEmpty = !isDemo && !hasAnyData && !isViewingAsAdmin;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Hábitos" backTo={backPath}>
        {isDemo && <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full">Demo</span>}
        {isViewingAsAdmin && selectedPatient && (
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">{selectedPatient.fullName}</span>
        )}
      </PageHeader>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {showEmpty ? (
          <DashboardEmptyState
            icon={Moon}
            title="Aún no hay datos de hábitos"
            description="Cuando tu programa inicie, aquí verás tu sueño, actividad física y uso de pantalla."
          />
        ) : (
        <>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <AISummaryCard
            section="habits"
            healthData={Object.keys(aiHealthData).length > 0 ? aiHealthData : undefined}
            targetUserId={isViewingAsAdmin ? effectiveUserId || undefined : undefined}
            compact
            isDemo={isDemo}
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
          <HabitWeekIndicator currentWeek={cycleProgress.currentWeekOfCycle} isTestWeek={cycleProgress.isTestWeek} hasActiveCycle={cycleProgress.hasActiveCycle} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid md:grid-cols-2 gap-4 mb-8">
          <div>
            <MetricCard title="Sueño" subtitle="Horas efectivas de sueño" value={habitsData.sleep.value} unit="hrs" target={`> ${sleepHoursGoal} horas`} change={habitsData.sleep.change} status={getStatus(habitsData.sleep.value, sleepHoursGoal)} icon={<Moon className="h-5 w-5" />} chart={habitsData.sleep.data.length > 0 ? <MiniChart data={habitsData.sleep.data} color="success" /> : undefined} />
            <AIInterpretButton metricName="Horas de Sueño" value={habitsData.sleep.value} unit="hrs" target={`> ${sleepHoursGoal}`} section="habits" context={personalContext} targetUserId={isViewingAsAdmin ? effectiveUserId || undefined : undefined} isDemo={isDemo} demoText="Tu promedio de 7.2 horas de sueño está dentro del rango recomendado. Mantener este nivel favorece la recuperación física y cognitiva." />
            {isViewingAsAdmin && patientId && <InlineGoalEditor habitType="sleep_hours" currentValue={sleepHoursGoal} options={sleepHoursOptions} unit="hrs" patientId={patientId} selectedMonth={selectedMonth} />}
          </div>
          <div>
            <MetricCard title="Calidad de Sueño" subtitle="Puntuación de tracker (0-100)" value={habitsData.sleepQuality.value} target={`> ${sleepQualityGoal}`} change={habitsData.sleepQuality.change} status={getStatus(habitsData.sleepQuality.value, sleepQualityGoal)} icon={<Activity className="h-5 w-5" />} />
            <AIInterpretButton metricName="Calidad de Sueño" value={habitsData.sleepQuality.value} unit="pts" target={`> ${sleepQualityGoal}`} section="habits" context={personalContext} targetUserId={isViewingAsAdmin ? effectiveUserId || undefined : undefined} isDemo={isDemo} demoText="Calidad de sueño de 82/100, en buen nivel. Asegurar ambiente oscuro y fresco para mantener o mejorar." />
            {isViewingAsAdmin && patientId && <InlineGoalEditor habitType="sleep_quality" currentValue={sleepQualityGoal} options={sleepQualityOptions} unit="pts" patientId={patientId} selectedMonth={selectedMonth} />}
          </div>
          <div>
            <MetricCard title="Actividad Física" subtitle={`${habitsData.activity.sessionCount || 0} sesiones de ${habitsData.activity.avgDuration || 0} min`} value={habitsData.activity.sessionCount || 0} unit="sesiones" target={`${activityGoals.sessionsPerWeek} de ${activityGoals.avgDurationMinutes} min`} change={habitsData.activity.change} status={getStatus(habitsData.activity.sessionCount || 0, activityGoals.sessionsPerWeek)} icon={<Dumbbell className="h-5 w-5" />} chart={habitsData.activity.data.length > 0 ? <MiniChart data={habitsData.activity.data} color="success" /> : undefined} />
            <AIInterpretButton metricName="Actividad Física" value={habitsData.activity.sessionCount || 0} unit="sesiones/sem" target={`${activityGoals.sessionsPerWeek} sesiones`} section="habits" context={personalContext} targetUserId={isViewingAsAdmin ? effectiveUserId || undefined : undefined} isDemo={isDemo} demoText="4 sesiones por semana cumple la meta. Mantener frecuencia y considerar variar intensidad." />
            {isViewingAsAdmin && patientId && (
              <div className="space-y-1">
                <InlineGoalEditor habitType="activity_sessions" currentValue={activityGoals.sessionsPerWeek} options={activitySessionOptions} unit="ses/sem" patientId={patientId} selectedMonth={selectedMonth} />
                <InlineGoalEditor habitType="activity_duration" currentValue={activityGoals.avgDurationMinutes} options={activityDurationOptions} unit="min" patientId={patientId} selectedMonth={selectedMonth} />
              </div>
            )}
          </div>
          <div>
            <MetricCard title="Tiempo en Pantalla" subtitle="Promedio diario (semana anterior)" value={habitsData.screenTime.value} unit="min" target={`< ${screenTimeGoal} min`} change={habitsData.screenTime.change} status={getStatus(habitsData.screenTime.value, screenTimeGoal, true)} icon={<Smartphone className="h-5 w-5" />} />
            <AIInterpretButton metricName="Tiempo en Pantalla" value={habitsData.screenTime.value} unit="min/día" target={`< ${screenTimeGoal} min`} section="habits" context={personalContext} targetUserId={isViewingAsAdmin ? effectiveUserId || undefined : undefined} isDemo={isDemo} demoText="185 min/día de pantalla supera la meta. Reducir exposición nocturna mejora calidad de sueño y bienestar." />
            {isViewingAsAdmin && patientId && <InlineGoalEditor habitType="screen_time" currentValue={screenTimeGoal} options={screenTimeOptions} unit="min" patientId={patientId} selectedMonth={selectedMonth} />}
          </div>
          <div>
            <MetricCard title="Desbloqueos de Teléfono" subtitle="Promedio diario (semana anterior)" value={habitsData.phoneUnlocks.value} unit="veces" target={`< ${phoneUnlocksGoal}`} change={habitsData.phoneUnlocks.change} status={getStatus(habitsData.phoneUnlocks.value, phoneUnlocksGoal, true)} icon={<Smartphone className="h-5 w-5" />} />
            <AIInterpretButton metricName="Desbloqueos" value={habitsData.phoneUnlocks.value} unit="veces/día" target={`< ${phoneUnlocksGoal}`} section="habits" context={personalContext} targetUserId={isViewingAsAdmin ? effectiveUserId || undefined : undefined} isDemo={isDemo} demoText="78 desbloqueos/día está por encima de la meta. Cada desbloqueo interrumpe tu concentración. Agrupar notificaciones ayuda." />
            {isViewingAsAdmin && patientId && <InlineGoalEditor habitType="phone_unlocks" currentValue={phoneUnlocksGoal} options={phoneUnlocksOptions} unit="desbloq" patientId={patientId} selectedMonth={selectedMonth} />}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
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
                    <div key={habit.id}>
                      <MetricCard title={habit.name} subtitle={`${habitsData.yoga.sessionCount || 0} sesiones (semana anterior)`} value={habitsData.yoga.sessionCount || 0} unit="sesiones" target={`${yogaGoal} sesiones/semana`} change={habitsData.yoga.change} status={getStatus(habitsData.yoga.sessionCount || 0, yogaGoal)} icon={<Sparkles className="h-5 w-5" />} />
                      <AIInterpretButton metricName="Yoga" value={habitsData.yoga.sessionCount || 0} unit="sesiones/sem" target={`${yogaGoal}`} section="habits" context={personalContext} targetUserId={isViewingAsAdmin ? effectiveUserId || undefined : undefined} isDemo={isDemo} />
                      {isViewingAsAdmin && patientId && <InlineGoalEditor habitType="yoga" currentValue={yogaGoal} options={[1,2,3,4,5,6,7]} unit="ses/sem" patientId={patientId} selectedMonth={selectedMonth} />}
                    </div>
                  );
                }
                return <MetricCard key={habit.id} title={habit.name} subtitle={habit.description} value="Activo" status="optimal" icon={<Sparkles className="h-5 w-5" />} />;
              }
              return <LockedHabitCard key={habit.id} title={habit.name} description={habit.description} icon={Sparkles} />;
            })}
          </div>
        </motion.div>

        {isViewingAsAdmin && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-8">
            <h3 className="text-lg font-display font-bold mb-4 text-primary">Panel de Gestión</h3>
            <ProfessionalHabitEditor />
          </motion.div>
        )}
        </>
        )}
      </main>
    </div>
  );
}
