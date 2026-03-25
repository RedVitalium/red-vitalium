import { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { MiniChart } from "@/components/dashboard/MiniChart";
import { ReminderCard } from "@/components/dashboard/ReminderCard";
import { WeeklyProgress } from "@/components/dashboard/WeeklyProgress";
import { MonthlyAchievements } from "@/components/dashboard/MonthlyAchievements";
import { HabitWeekIndicator } from "@/components/dashboard/HabitWeekIndicator";
import { LockedHabitCard } from "@/components/dashboard/LockedHabitCard";
import { NotificationSettings } from "@/components/dashboard/NotificationSettings";
import { HealthConnectCard } from "@/components/dashboard/HealthConnectCard";
import { DemoTour } from "@/components/dashboard/DemoTour";
import { DailySurveyCard } from "@/components/dashboard/DailySurveyCard";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useCycleData } from "@/hooks/useCycleData";
import { useUnlockedHabits } from "@/hooks/useUnlockedHabits";
import { useHabitGoals } from "@/hooks/useHabitGoals";
import { useAuth } from "@/hooks/useAuth";
import { useAdminMode } from "@/hooks/useAdminMode";
import { useSearchParams } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Brain, 
  Heart, 
  Moon, 
  Activity, 
  Dumbbell, 
  Smile,
  Frown,
  TrendingUp,
  Clock,
  Smartphone,
  Flame,
  Snowflake,
  Leaf,
  Timer,
  Info,
  Shield,
  Sparkles
} from "lucide-react";

// Helper to determine status based on value and target
function getStatus(value: number, target: number, isLowerBetter: boolean = false, treatZeroAsOptimalForLower: boolean = false): "optimal" | "warning" | "danger" {
  // For metrics where lower is better (like anxiety, stress), 0 can be optimal
  if (value === 0) {
    if (treatZeroAsOptimalForLower && isLowerBetter) return "optimal";
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function Dashboard() {
const [searchParams] = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";
  const { user, isAdmin } = useAuth();
  const { isViewingAsAdmin, selectedPatient, targetUserId } = useAdminMode();
  const [tourCompleted, setTourCompleted] = useState(false);
  
  const { 
    userName, 
    personalData, 
    psychologicalData, 
    habitsData, 
    longevityData, 
    weeklyProgress, 
    achievements,
    hasData,
    hasEnoughDataForAchievements
  } = useDashboardData();

  // Get cycle data - use targetUserId when viewing as admin, otherwise current user
  const cycleUserId = isViewingAsAdmin ? targetUserId : (isDemo ? null : user?.id || null);
  const { getCycleProgress } = useCycleData(cycleUserId);
  const cycleProgress = isDemo 
    ? { cycleStartDate: new Date(), currentWeekOfCycle: 3, daysSinceCycleStart: 18, cycleProgress: 64, hasActiveCycle: true, isTestWeek: false, weeksUntilTest: 1 }
    : getCycleProgress();

  // Get unlocked habits
  const { isHabitUnlocked, advancedHabits: habitsList } = useUnlockedHabits();
  
  // Get habit goals from admin
  const { 
    screenTimeGoal, 
    phoneUnlocksGoal, 
    yogaGoal, 
    sleepHoursGoal,
    sleepQualityGoal,
    activityGoals 
  } = useHabitGoals();
  // Icon mapping for habits
  const habitIcons: Record<string, typeof Flame> = {
    sauna: Flame,
    cold_bath: Snowflake,
    meditation: Brain,
    yoga: Leaf,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Demo Tour */}
      {isDemo && (
        <DemoTour onComplete={() => setTourCompleted(true)} />
      )}
      
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">
          {isDemo ? (
            <>Bienvenido, <span className="gradient-text">John</span> <span className="text-sm font-normal text-muted-foreground">(Demo)</span></>
          ) : isViewingAsAdmin && selectedPatient ? (
            <>Dashboard de <span className="gradient-text">{selectedPatient.fullName}</span> <span className="text-sm font-normal text-muted-foreground">(Vista Admin)</span></>
          ) : (
            <>Bienvenido, <span className="gradient-text">{userName}</span></>
          )}
        </h1>
        <p className="text-muted-foreground">
          {isDemo 
            ? "Explora el dashboard con datos de ejemplo" 
            : isViewingAsAdmin
              ? "Estás viendo este dashboard con permisos de administrador"
              : "Aquí está tu resumen de salud y bienestar"
          }
        </p>
      </motion.div>

      {/* No Data Alert for Real Users */}
      {!isDemo && !hasData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Aún no tienes datos registrados. Conecta tu dispositivo wearable o espera a que tu médico ingrese tus biomarcadores para comenzar a ver tu progreso.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Monthly Achievements - Gamification */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
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

      {/* Weekly Progress & Quick Stats */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <WeeklyProgress 
            streak={weeklyProgress.streak}
            weeklyGoals={weeklyProgress.weeklyGoals}
            improvement={weeklyProgress.improvement}
            weeklyAchievements={achievements.slice(0, 3)}
            hasActiveCycle={cycleProgress.hasActiveCycle}
          />
        </div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          {/* Habit Week Indicator */}
          <HabitWeekIndicator 
            currentWeek={cycleProgress.currentWeekOfCycle}
            isTestWeek={cycleProgress.isTestWeek}
            hasActiveCycle={cycleProgress.hasActiveCycle}
          />
          
          {/* Notification Settings - only shows on native */}
          <NotificationSettings 
            hasActiveCycle={cycleProgress.hasActiveCycle}
            currentWeek={cycleProgress.currentWeekOfCycle}
          />
          
          {/* Health Connect Card */}
          <HealthConnectCard />
          
          {/* Daily Survey - shows during all 4 weeks */}
          <DailySurveyCard 
            currentWeek={cycleProgress.currentWeekOfCycle}
            hasActiveCycle={cycleProgress.hasActiveCycle}
          />
          
          {/* Show reminders only for weeks 1-3 when cycle is active */}
          {cycleProgress.hasActiveCycle && cycleProgress.currentWeekOfCycle <= 3 ? (
            <>
              <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Recordatorios de hoy
              </h3>
              <ReminderCard type="meal" time="19:00" isCompleted />
              <ReminderCard type="prepare-sleep" time="21:00" isActive />
              <ReminderCard type="bedtime" time="22:30" />
            </>
          ) : cycleProgress.hasActiveCycle ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-accent/10 border border-accent/20 rounded-xl text-center"
            >
              <p className="text-sm font-medium text-accent">
                🎯 Semana de prueba
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Sin recordatorios - ¡Confía en tus nuevos hábitos!
              </p>
            </motion.div>
          ) : null}
        </motion.div>
      </div>

{/* Tabs for Categories */}
      <Tabs defaultValue="psychological" className="w-full">
        <TabsList className={`w-full max-w-2xl mx-auto grid ${(isAdmin || isViewingAsAdmin) ? 'grid-cols-5' : 'grid-cols-4'} mb-8 bg-muted/50 p-1 rounded-xl`}>
          <TabsTrigger 
            value="personal" 
            className="font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg"
          >
            Personal
          </TabsTrigger>
          <TabsTrigger 
            value="psychological" 
            className="font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg"
          >
            Psicológico
          </TabsTrigger>
          <TabsTrigger 
            value="habits" 
            className="font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg"
          >
            Hábitos
          </TabsTrigger>
          <TabsTrigger 
            value="longevity" 
            className="font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg"
          >
            Longevidad
          </TabsTrigger>
          {(isAdmin || isViewingAsAdmin) && (
            <TabsTrigger 
              value="admin" 
              className="font-medium data-[state=active]:bg-accent data-[state=active]:text-accent-foreground rounded-lg flex items-center gap-1"
            >
              <Shield className="h-4 w-4" />
              {isViewingAsAdmin ? 'Editar' : 'Admin'}
            </TabsTrigger>
          )}
        </TabsList>

        {/* Personal Tab */}
        <TabsContent value="personal">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="bg-card rounded-2xl p-6 border border-border"
          >
            <motion.h3 variants={itemVariants} className="text-xl font-display font-bold mb-6">
              Información Personal
            </motion.h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <motion.div variants={itemVariants} className="space-y-1">
                <p className="text-sm text-muted-foreground">Nombre</p>
                <p className="font-medium">{personalData.name || "Sin datos"}</p>
              </motion.div>
              <motion.div variants={itemVariants} className="space-y-1">
                <p className="text-sm text-muted-foreground">Edad</p>
                <p className="font-medium">{personalData.age > 0 ? `${personalData.age} años` : "Sin datos"}</p>
              </motion.div>
              <motion.div variants={itemVariants} className="space-y-1">
                <p className="text-sm text-muted-foreground">Sexo</p>
                <p className="font-medium">{personalData.sex || "Sin datos"}</p>
              </motion.div>
              <motion.div variants={itemVariants} className="space-y-1">
                <p className="text-sm text-muted-foreground">Altura</p>
                <p className="font-medium">{personalData.height > 0 ? `${personalData.height} m` : "Sin datos"}</p>
              </motion.div>
              <motion.div variants={itemVariants} className="space-y-1">
                <p className="text-sm text-muted-foreground">Peso Actual</p>
                <p className="font-medium">{personalData.weight > 0 ? `${personalData.weight} Kg` : "Sin datos"}</p>
              </motion.div>
              <motion.div variants={itemVariants} className="space-y-1">
                <p className="text-sm text-muted-foreground">RCHA (Cintura/Altura)</p>
                <p className="font-medium">
                  {personalData.waistHeightRatio > 0 ? (
                    <>{personalData.waistHeightRatio} <span className={personalData.waistHeightRatio < 0.5 ? "text-success" : "text-warning"}>(
                      {personalData.waistHeightRatio < 0.5 ? "Óptimo" : "Precaución"}
                    )</span></>
                  ) : "Sin datos"}
                </p>
              </motion.div>
            </div>
            
            <motion.div 
              variants={itemVariants}
              className="mt-8 p-5 bg-primary/5 border border-primary/20 rounded-xl"
            >
              <h4 className="font-display font-semibold text-primary mb-3">
                Marcadores Clave de Longevidad
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${personalData.biologicalAge > 0 ? "bg-success" : "bg-muted"}`} />
                  <strong>Edad Biológica:</strong> {personalData.biologicalAge > 0 
                    ? `${personalData.biologicalAge} años (${(personalData.age - personalData.biologicalAge).toFixed(1)} años ${personalData.biologicalAge < personalData.age ? "menos" : "más"} que cronológica)`
                    : "Sin datos"}
                </li>
                <li className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${personalData.vo2Max > 0 ? "bg-success" : "bg-muted"}`} />
                  <strong>VO2 Máx:</strong> {personalData.vo2Max > 0 ? `${personalData.vo2Max} ml/kg/min` : "Sin datos"}
                </li>
                <li className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${personalData.hba1c > 0 ? "bg-success" : "bg-muted"}`} />
                  <strong>HbA1c:</strong> {personalData.hba1c > 0 ? `${personalData.hba1c}%` : "Sin datos"}
                </li>
              </ul>
            </motion.div>
          </motion.div>
        </TabsContent>

        {/* Psychological Tab */}
        <TabsContent value="psychological">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-2 gap-6"
          >
            <motion.div variants={itemVariants}>
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
            </motion.div>
            <motion.div variants={itemVariants}>
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
            </motion.div>
            <motion.div variants={itemVariants}>
              <MetricCard
                title="Síntomas Depresivos"
                subtitle="Test DASS-21 (0-30)"
                value={psychologicalData.depression.value}
                target="< 10"
                change={psychologicalData.depression.change}
                status={getStatus(psychologicalData.depression.value, 10, true, true)}
                icon={<Frown className="h-5 w-5" />}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
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
          </motion.div>
        </TabsContent>

        {/* Habits Tab */}
        <TabsContent value="habits">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Active Habits */}
            <div className="grid md:grid-cols-2 gap-6">
              <motion.div variants={itemVariants}>
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
              </motion.div>
              <motion.div variants={itemVariants}>
                <MetricCard
                  title="Calidad de Sueño"
                  subtitle="Puntuación de tracker (0-100)"
                  value={habitsData.sleepQuality.value}
                  target={`> ${sleepQualityGoal}`}
                  change={habitsData.sleepQuality.change}
                  status={getStatus(habitsData.sleepQuality.value, sleepQualityGoal)}
                  icon={<Heart className="h-5 w-5" />}
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <MetricCard
                  title="Actividad Física"
                  subtitle={`${habitsData.activity.sessionCount || 0} sesiones de ${habitsData.activity.avgDuration || 0} min (semana)`}
                  value={habitsData.activity.sessionCount || 0}
                  unit="sesiones"
                  target={`${activityGoals.sessionsPerWeek} de ${activityGoals.avgDurationMinutes} min`}
                  change={habitsData.activity.change}
                  status={getStatus(habitsData.activity.sessionCount || 0, activityGoals.sessionsPerWeek)}
                  icon={<Dumbbell className="h-5 w-5" />}
                  chart={habitsData.activity.data.length > 0 ? <MiniChart data={habitsData.activity.data} color="success" /> : undefined}
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <MetricCard
                  title="Tiempo en Pantalla"
                  subtitle="Promedio diario (semana anterior)"
                  value={habitsData.screenTime.value}
                  unit="min"
                  target={`< ${screenTimeGoal} min`}
                  change={habitsData.screenTime.change}
                  status={getStatus(habitsData.screenTime.value, screenTimeGoal, true)}
                  icon={<Activity className="h-5 w-5" />}
                  chart={habitsData.screenTime.data && habitsData.screenTime.data.length > 0 ? <MiniChart data={habitsData.screenTime.data} color="warning" /> : undefined}
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <MetricCard
                  title="Desbloqueos de Teléfono"
                  subtitle="Promedio diario (semana anterior)"
                  value={habitsData.phoneUnlocks.value}
                  unit="veces"
                  target={`< ${phoneUnlocksGoal}`}
                  change={habitsData.phoneUnlocks.change}
                  status={getStatus(habitsData.phoneUnlocks.value, phoneUnlocksGoal, true)}
                  icon={<Smartphone className="h-5 w-5" />}
                  chart={habitsData.phoneUnlocks.data.length > 0 ? <MiniChart data={habitsData.phoneUnlocks.data} color="warning" /> : undefined}
                />
              </motion.div>
            </div>

            {/* Advanced Habits - Dynamic based on unlock status */}
            <div>
              <h3 className="text-lg font-display font-bold mb-4 text-muted-foreground flex items-center gap-2">
                <Timer className="h-5 w-5" />
                Hábitos Avanzados
                {!habitsList.some(h => isHabitUnlocked(h.id)) && (
                  <span className="text-xs font-normal bg-muted px-2 py-1 rounded-full ml-2">
                    Se desbloquean al estabilizar hábitos básicos
                  </span>
                )}
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {habitsList.map((habit) => {
                  const Icon = habitIcons[habit.id] || Sparkles;
                  const unlocked = isHabitUnlocked(habit.id);
                  
                  if (unlocked) {
                    // Special case for yoga - show session data
                    if (habit.id === "yoga" && habitsData.yoga) {
                      return (
                        <motion.div key={habit.id} variants={itemVariants}>
                          <MetricCard
                            title={habit.name}
                            subtitle={`${habitsData.yoga.sessionCount || 0} sesiones (semana anterior)`}
                            value={habitsData.yoga.sessionCount || 0}
                            unit="sesiones"
                            target={`${yogaGoal} sesiones/semana`}
                            change={habitsData.yoga.change}
                            status={getStatus(habitsData.yoga.sessionCount || 0, yogaGoal)}
                            icon={<Icon className="h-5 w-5" />}
                            chart={habitsData.yoga.data.length > 0 ? <MiniChart data={habitsData.yoga.data} color="success" /> : undefined}
                          />
                        </motion.div>
                      );
                    }
                    
                    return (
                      <motion.div key={habit.id} variants={itemVariants}>
                        <MetricCard
                          title={habit.name}
                          subtitle={habit.description}
                          value="Activo"
                          status="optimal"
                          icon={<Icon className="h-5 w-5" />}
                        />
                      </motion.div>
                    );
                  }
                  
                  return (
                    <LockedHabitCard
                      key={habit.id}
                      title={habit.name}
                      description={habit.description}
                      icon={Icon}
                    />
                  );
                })}
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* Longevity Tab */}
        <TabsContent value="longevity">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-2 gap-6"
          >
            <motion.div variants={itemVariants}>
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
            </motion.div>
            <motion.div variants={itemVariants}>
              <MetricCard
                title="RCHA"
                subtitle="Cintura/Altura - Riesgo metabólico"
                value={longevityData.waistHeightRatio.value}
                target="< 0.5"
                change={longevityData.waistHeightRatio.change}
                status={getStatus(longevityData.waistHeightRatio.value, 0.5, true)}
                icon={<Activity className="h-5 w-5" />}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <MetricCard
                title="VO2 Máx"
                subtitle="Capacidad aeróbica (ml/kg/min)"
                value={longevityData.vo2Max.value}
                target="> 45"
                change={longevityData.vo2Max.change}
                status={getStatus(longevityData.vo2Max.value, 45)}
                icon={<Heart className="h-5 w-5" />}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <MetricCard
                title="Fuerza Agarre Izq."
                subtitle="Potencia muscular (Kg)"
                value={longevityData.gripStrengthLeft.value}
                unit="Kg"
                target="> 40 Kg"
                change={longevityData.gripStrengthLeft.change}
                status={getStatus(longevityData.gripStrengthLeft.value, 40)}
                icon={<Dumbbell className="h-5 w-5" />}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <MetricCard
                title="Fuerza Agarre Der."
                subtitle="Potencia muscular (Kg)"
                value={longevityData.gripStrengthRight.value}
                unit="Kg"
                target="> 40 Kg"
                change={longevityData.gripStrengthRight.change}
                status={getStatus(longevityData.gripStrengthRight.value, 40)}
                icon={<Dumbbell className="h-5 w-5" />}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
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
            </motion.div>
            <motion.div variants={itemVariants}>
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
            </motion.div>
            <motion.div variants={itemVariants}>
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
            </motion.div>
            <motion.div variants={itemVariants}>
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
          </motion.div>
        </TabsContent>

        {/* Admin Tab - Redirect to Admin page */}
        {(isAdmin || isViewingAsAdmin) && (
          <TabsContent value="admin">
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">La administración se ha movido a una página dedicada.</p>
              <Button onClick={() => navigate("/admin")} className="gap-2">
                Ir al Panel de Administración
              </Button>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
