import { motion } from "framer-motion";
import { Clock, Utensils, Moon, BedDouble } from "lucide-react";
import { cn } from "@/lib/utils";

type ReminderType = "meal" | "prepare-sleep" | "bedtime";

interface ReminderCardProps {
  type: ReminderType;
  time: string;
  isActive?: boolean;
  isCompleted?: boolean;
}

const reminderConfig = {
  "meal": {
    icon: Utensils,
    title: "Última comida del día",
    description: "Prepara tu última comida 3h antes de dormir",
    color: "text-warning",
    bg: "bg-warning/10",
  },
  "prepare-sleep": {
    icon: Moon,
    title: "Preparar para dormir",
    description: "Reduce exposición a pantallas",
    color: "text-accent",
    bg: "bg-accent/10",
  },
  "bedtime": {
    icon: BedDouble,
    title: "Hora de dormir",
    description: "Mantén un horario consistente",
    color: "text-primary",
    bg: "bg-primary/10",
  },
};

export function ReminderCard({ type, time, isActive = false, isCompleted = false }: ReminderCardProps) {
  const config = reminderConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl border transition-all",
        isActive && "ring-2 ring-primary/50 bg-primary/5",
        isCompleted && "opacity-60",
        !isActive && !isCompleted && "bg-card border-border hover:border-primary/30"
      )}
    >
      <div className={cn("p-3 rounded-xl", config.bg)}>
        <Icon className={cn("h-5 w-5", config.color)} />
      </div>
      
      <div className="flex-1">
        <h4 className="font-medium text-foreground">{config.title}</h4>
        <p className="text-sm text-muted-foreground">{config.description}</p>
      </div>

      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-lg font-display font-semibold text-foreground">{time}</span>
      </div>

      {isCompleted && (
        <div className="h-6 w-6 rounded-full bg-success flex items-center justify-center">
          <svg className="h-4 w-4 text-success-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </motion.div>
  );
}
