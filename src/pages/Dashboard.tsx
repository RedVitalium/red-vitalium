import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { MiniChart } from "@/components/dashboard/MiniChart";
import { ReminderCard } from "@/components/dashboard/ReminderCard";
import { WeeklyProgress } from "@/components/dashboard/WeeklyProgress";
import { MonthlyAchievements } from "@/components/dashboard/MonthlyAchievements";
import { HabitWeekIndicator } from "@/components/dashboard/HabitWeekIndicator";
import { 
  Brain, 
  Heart, 
  Moon, 
  Activity, 
  Dumbbell, 
  Smile,
  Frown,
  TrendingUp,
  Clock
} from "lucide-react";

// Get current week of the month (1-4)
function getCurrentWeekOfMonth(): number {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const dayOfMonth = now.getDate();
  return Math.ceil((dayOfMonth + firstDay.getDay()) / 7);
}

// Sample data
const anxietyData = [{ value: 65 }, { value: 58 }, { value: 52 }, { value: 48 }, { value: 45 }, { value: 42 }];
const stressData = [{ value: 70 }, { value: 62 }, { value: 55 }, { value: 50 }, { value: 48 }, { value: 44 }];
const sleepData = [{ value: 6.5 }, { value: 7 }, { value: 7.2 }, { value: 7.5 }, { value: 7.8 }, { value: 8 }];
const activityData = [{ value: 3 }, { value: 4 }, { value: 4.5 }, { value: 5 }, { value: 5.5 }, { value: 6 }];

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
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">
          Bienvenido, <span className="gradient-text">John</span>
        </h1>
        <p className="text-muted-foreground">
          Aquí está tu resumen de salud y bienestar
        </p>
      </motion.div>

      {/* Monthly Achievements - Gamification */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <MonthlyAchievements />
      </motion.div>

      {/* Weekly Progress & Quick Stats */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <WeeklyProgress 
            streak={5}
            weeklyGoals={{ completed: 4, total: 6 }}
            improvement={12}
          />
        </div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          {/* Habit Week Indicator */}
          <HabitWeekIndicator />
          
          {/* Show reminders only for weeks 1-3 */}
          {getCurrentWeekOfMonth() <= 3 ? (
            <>
              <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Recordatorios de hoy
              </h3>
              <ReminderCard type="meal" time="19:00" isCompleted />
              <ReminderCard type="prepare-sleep" time="21:00" isActive />
              <ReminderCard type="bedtime" time="22:30" />
            </>
          ) : (
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
          )}
        </motion.div>
      </div>

      {/* Tabs for Categories */}
      <Tabs defaultValue="psychological" className="w-full">
        <TabsList className="w-full max-w-2xl mx-auto grid grid-cols-4 mb-8 bg-muted/50 p-1 rounded-xl">
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
                <p className="font-medium">John Doe</p>
              </motion.div>
              <motion.div variants={itemVariants} className="space-y-1">
                <p className="text-sm text-muted-foreground">Edad</p>
                <p className="font-medium">46 años</p>
              </motion.div>
              <motion.div variants={itemVariants} className="space-y-1">
                <p className="text-sm text-muted-foreground">Sexo</p>
                <p className="font-medium">Masculino</p>
              </motion.div>
              <motion.div variants={itemVariants} className="space-y-1">
                <p className="text-sm text-muted-foreground">Altura</p>
                <p className="font-medium">1.75 m</p>
              </motion.div>
              <motion.div variants={itemVariants} className="space-y-1">
                <p className="text-sm text-muted-foreground">Peso Actual</p>
                <p className="font-medium">72.5 Kg</p>
              </motion.div>
              <motion.div variants={itemVariants} className="space-y-1">
                <p className="text-sm text-muted-foreground">RCHA (Cintura/Altura)</p>
                <p className="font-medium">0.49 <span className="text-success">(Óptimo)</span></p>
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
                  <span className="w-2 h-2 rounded-full bg-success" />
                  <strong>Edad Biológica:</strong> 42.5 años (4.0 años menos que cronológica)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  <strong>VO2 Máx:</strong> 47 ml/kg/min (Excelente)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  <strong>HbA1c:</strong> 5.1% (Ideal)
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
                value={42}
                target="< 50"
                change={-12}
                status="optimal"
                icon={<Brain className="h-5 w-5" />}
                chart={<MiniChart data={anxietyData} color="success" />}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <MetricCard
                title="Estrés"
                subtitle="Puntuación mensual (0-100)"
                value={44}
                target="< 50"
                change={-15}
                status="optimal"
                icon={<Activity className="h-5 w-5" />}
                chart={<MiniChart data={stressData} color="success" />}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <MetricCard
                title="Síntomas Depresivos"
                subtitle="Test DASS-21 (0-30)"
                value={8}
                target="< 10"
                change={-5}
                status="optimal"
                icon={<Frown className="h-5 w-5" />}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <MetricCard
                title="Satisfacción con la Vida"
                subtitle="Escala SWLS (1-10)"
                value={7.8}
                target="> 8"
                change={8}
                status="warning"
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
            className="grid md:grid-cols-2 gap-6"
          >
            <motion.div variants={itemVariants}>
              <MetricCard
                title="Sueño"
                subtitle="Horas efectivas de sueño"
                value={7.8}
                unit="hrs"
                target="> 7.5 horas"
                change={10}
                status="optimal"
                icon={<Moon className="h-5 w-5" />}
                chart={<MiniChart data={sleepData} color="success" />}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <MetricCard
                title="Calidad de Sueño"
                subtitle="Puntuación de tracker (0-100)"
                value={88}
                target="> 85"
                change={5}
                status="optimal"
                icon={<Heart className="h-5 w-5" />}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <MetricCard
                title="Actividad Física"
                subtitle="Horas por semana"
                value={5.5}
                unit="hrs"
                target="> 5 horas"
                change={15}
                status="optimal"
                icon={<Dumbbell className="h-5 w-5" />}
                chart={<MiniChart data={activityData} color="success" />}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <MetricCard
                title="Tiempo en Pantalla"
                subtitle="Uso no laboral diario"
                value={95}
                unit="min"
                target="< 90 min"
                change={-8}
                status="warning"
                icon={<Activity className="h-5 w-5" />}
              />
            </motion.div>
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
                subtitle="vs Edad cronológica (46 años)"
                value={42.5}
                unit="años"
                target="Menor que cronológica"
                change={-3}
                status="optimal"
                icon={<TrendingUp className="h-5 w-5" />}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <MetricCard
                title="RCHA"
                subtitle="Cintura/Altura - Riesgo metabólico"
                value={0.49}
                target="< 0.5"
                change={-2}
                status="optimal"
                icon={<Activity className="h-5 w-5" />}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <MetricCard
                title="VO2 Máx"
                subtitle="Capacidad aeróbica (ml/kg/min)"
                value={47}
                target="> 45"
                change={5}
                status="optimal"
                icon={<Heart className="h-5 w-5" />}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <MetricCard
                title="Fuerza de Agarre"
                subtitle="Potencia muscular (Kg)"
                value={42}
                unit="Kg"
                target="> 40 Kg"
                change={3}
                status="optimal"
                icon={<Dumbbell className="h-5 w-5" />}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <MetricCard
                title="Colesterol No-HDL"
                subtitle="Predictor metabólico (mg/dL)"
                value={95}
                unit="mg/dL"
                target="< 100"
                change={-8}
                status="optimal"
                icon={<Activity className="h-5 w-5" />}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <MetricCard
                title="HbA1c"
                subtitle="Glucosa promedio (%)"
                value={5.1}
                unit="%"
                target="< 5.4%"
                change={-2}
                status="optimal"
                icon={<TrendingUp className="h-5 w-5" />}
              />
            </motion.div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
