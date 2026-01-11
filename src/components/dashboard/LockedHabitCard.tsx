import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface LockedHabitCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function LockedHabitCard({ title, description, icon: Icon }: LockedHabitCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className="relative"
    >
      <Card className="p-6 bg-muted/30 border-muted opacity-60 cursor-not-allowed overflow-hidden">
        {/* Lock overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-muted/80 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-muted-foreground/20 flex items-center justify-center">
              <Lock className="h-6 w-6 text-muted-foreground" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              Bloqueado
            </span>
          </div>
        </div>

        {/* Card content (blurred/greyed out) */}
        <div className="flex items-start gap-4 filter blur-[2px] grayscale">
          <div className="p-3 rounded-xl bg-muted">
            <Icon className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <h4 className="font-display font-semibold text-muted-foreground mb-1">
              {title}
            </h4>
            <p className="text-sm text-muted-foreground/70">
              {description}
            </p>
          </div>
        </div>
      </Card>

      {/* Tooltip on hover */}
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="bg-secondary text-secondary-foreground px-3 py-1.5 rounded-lg text-xs whitespace-nowrap shadow-lg">
          Se desbloquea al estabilizar hábitos básicos
        </div>
      </div>
    </motion.div>
  );
}
