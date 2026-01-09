import { motion } from "framer-motion";
import { AchievementBadge } from "./AchievementBadge";
import { TrendingUp, Target, Flame } from "lucide-react";

interface WeeklyProgressProps {
  streak: number;
  weeklyGoals: { completed: number; total: number };
  improvement: number;
}

export function WeeklyProgress({ streak, weeklyGoals, improvement }: WeeklyProgressProps) {
  const progressPercentage = (weeklyGoals.completed / weeklyGoals.total) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-primary via-primary to-accent/50 rounded-3xl p-6 text-primary-foreground overflow-hidden relative"
    >
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/20 rounded-full blur-2xl" />

      <div className="relative z-10">
        <h3 className="font-display font-bold text-xl mb-6">Tu Progreso Semanal</h3>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Flame className="h-5 w-5 text-warning" />
              <span className="text-2xl font-display font-bold">{streak}</span>
            </div>
            <p className="text-xs opacity-80">Días activos</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="h-5 w-5 text-success" />
              <span className="text-2xl font-display font-bold">{weeklyGoals.completed}/{weeklyGoals.total}</span>
            </div>
            <p className="text-xs opacity-80">Metas cumplidas</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-5 w-5 text-success" />
              <span className="text-2xl font-display font-bold">+{improvement}%</span>
            </div>
            <p className="text-xs opacity-80">Mejora general</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Progreso semanal</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-full bg-white rounded-full"
            />
          </div>
        </div>

        {/* Achievements */}
        <div>
          <h4 className="text-sm font-medium mb-4 opacity-90">Logros de la semana</h4>
          <div className="flex justify-around">
            <AchievementBadge
              type="gold"
              icon="trophy"
              title="Mejor sueño"
              isNew
            />
            <AchievementBadge
              type="silver"
              icon="star"
              title="5 días activo"
            />
            <AchievementBadge
              type="bronze"
              icon="improvement"
              title="-5% estrés"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
