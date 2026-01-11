import { motion } from "framer-motion";
import { Bell, BellOff, CheckCircle2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

interface HabitWeekIndicatorProps {
  className?: string;
}

// Get current week of the month (1-4)
function getCurrentWeekOfMonth(): number {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const dayOfMonth = now.getDate();
  return Math.ceil((dayOfMonth + firstDay.getDay()) / 7);
}

export function HabitWeekIndicator({ className }: HabitWeekIndicatorProps) {
  const currentWeek = getCurrentWeekOfMonth();
  const isTestWeek = currentWeek === 4;
  const weeksWithReminders = [1, 2, 3];

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isTestWeek ? (
            <BellOff className="h-5 w-5 text-accent" />
          ) : (
            <Bell className="h-5 w-5 text-primary" />
          )}
          <h3 className="font-display font-semibold text-foreground">
            Ciclo de Hábitos
          </h3>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
          Semana {currentWeek}
        </span>
      </div>

      <div className="flex gap-2 mb-4">
        {[1, 2, 3, 4].map((week) => (
          <motion.div
            key={week}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: week * 0.1 }}
            className={`flex-1 h-2 rounded-full ${
              week === currentWeek
                ? week === 4
                  ? "bg-accent"
                  : "bg-primary"
                : week < currentWeek
                ? "bg-success"
                : "bg-muted"
            }`}
          />
        ))}
      </div>

      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${isTestWeek ? "bg-accent/10" : "bg-primary/10"}`}>
          {isTestWeek ? (
            <AlertCircle className="h-4 w-4 text-accent" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-primary" />
          )}
        </div>
        <div>
          {isTestWeek ? (
            <>
              <p className="text-sm font-medium text-foreground">
                Semana de prueba de hábitos
              </p>
              <p className="text-xs text-muted-foreground">
                Sin recordatorios esta semana. ¡Veamos si tus hábitos ya están arraigados!
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-foreground">
                Recordatorios activos
              </p>
              <p className="text-xs text-muted-foreground">
                {3 - currentWeek + 1} semana(s) más con recordatorios antes de la prueba
              </p>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
