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
      <Card className="p-6 bg-muted/20 border-muted/50 cursor-not-allowed overflow-hidden">
        {/* Lock overlay - more transparent */}
        <div className="absolute inset-0 bg-gradient-to-br from-muted/20 to-muted/40 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-muted-foreground/30 flex items-center justify-center backdrop-blur-sm">
              <Lock className="h-5 w-5 text-muted-foreground" />
            </div>
            <span className="text-xs font-medium text-muted-foreground bg-background/60 px-2 py-0.5 rounded">
              Bloqueado
            </span>
          </div>
        </div>

        {/* Card content (visible but greyed out) */}
        <div className="flex items-start gap-4 grayscale opacity-70">
          <div className="p-3 rounded-xl bg-muted/50">
            <Icon className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <h4 className="font-display font-semibold text-muted-foreground mb-1">
              {title}
            </h4>
            <p className="text-sm text-muted-foreground/80">
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
