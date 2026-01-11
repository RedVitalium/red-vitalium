import { motion } from "framer-motion";
import { Trophy, Star, Medal, TrendingUp, Award, Crown } from "lucide-react";
import { AchievementBadge } from "./AchievementBadge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface Achievement {
  id: string;
  type: "gold" | "silver" | "bronze";
  icon: "trophy" | "star" | "medal" | "improvement";
  title: string;
  metric: string;
  improvement: number;
  isNew: boolean;
}

interface MonthlyAchievementsProps {
  isMonthComplete?: boolean;
}

// Sample achievements data - in real app this would come from props/API
const achievements: Achievement[] = [
  {
    id: "sleep",
    type: "gold",
    icon: "trophy",
    title: "Campeón del Sueño",
    metric: "Calidad de sueño",
    improvement: 28,
    isNew: true,
  },
  {
    id: "anxiety",
    type: "gold",
    icon: "star",
    title: "Control de Ansiedad",
    metric: "Reducción de ansiedad",
    improvement: 24,
    isNew: false,
  },
  {
    id: "activity",
    type: "silver",
    icon: "medal",
    title: "Activo Constante",
    metric: "Actividad física",
    improvement: 18,
    isNew: true,
  },
  {
    id: "stress",
    type: "bronze",
    icon: "improvement",
    title: "Manejo del Estrés",
    metric: "Reducción de estrés",
    improvement: 12,
    isNew: false,
  },
];

// Get current week of the month (1-4)
function getCurrentWeekOfMonth(): number {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const dayOfMonth = now.getDate();
  return Math.ceil((dayOfMonth + firstDay.getDay()) / 7);
}

// Get days remaining in month
function getDaysRemainingInMonth(): number {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return lastDay.getDate() - now.getDate();
}

export function MonthlyAchievements({ isMonthComplete = false }: MonthlyAchievementsProps) {
  const currentWeek = getCurrentWeekOfMonth();
  const daysRemaining = getDaysRemainingInMonth();
  const monthProgress = Math.round(((30 - daysRemaining) / 30) * 100);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 via-accent/5 to-warning/5 border-primary/20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-warning via-amber-400 to-warning shadow-lg shadow-warning/30">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-foreground">
              {isMonthComplete ? "Logros del Mes" : "Mejores Logros del Mes"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isMonthComplete 
                ? "¡Felicidades por tus logros finales!" 
                : `Semana ${currentWeek} • ${daysRemaining} días restantes`
              }
            </p>
          </div>
        </div>
        
        {!isMonthComplete && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-1">Progreso del mes</p>
            <div className="flex items-center gap-2">
              <Progress value={monthProgress} className="w-24 h-2" />
              <span className="text-sm font-semibold text-primary">{monthProgress}%</span>
            </div>
          </div>
        )}
      </div>

      {isMonthComplete && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-success/10 border border-success/20 rounded-xl text-center"
        >
          <Award className="h-8 w-8 text-success mx-auto mb-2" />
          <p className="font-display font-bold text-success">¡Mes Completado!</p>
          <p className="text-sm text-muted-foreground">Estos son tus logros finales del mes</p>
        </motion.div>
      )}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 sm:grid-cols-4 gap-6"
      >
        {achievements.map((achievement) => (
          <motion.div key={achievement.id} variants={itemVariants}>
            <AchievementBadge
              type={achievement.type}
              icon={achievement.icon}
              title={achievement.title}
              description={`+${achievement.improvement}% mejora`}
              isNew={achievement.isNew && !isMonthComplete}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Top Improvement Highlight */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-6 p-4 bg-card rounded-xl border border-border"
      >
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-lg bg-warning/10">
            <TrendingUp className="h-5 w-5 text-warning" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Mayor avance del mes</p>
            <p className="font-display font-bold text-foreground">
              Calidad de Sueño <span className="text-success">+28%</span>
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-5 w-5 text-warning fill-warning" />
            <Star className="h-5 w-5 text-warning fill-warning" />
            <Star className="h-5 w-5 text-warning fill-warning" />
          </div>
        </div>
      </motion.div>
    </Card>
  );
}
