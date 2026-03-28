import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { CalendarClock } from "lucide-react";
import { type LucideIcon } from "lucide-react";

interface DashboardEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function DashboardEmptyState({ icon: Icon, title, description }: DashboardEmptyStateProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-6 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 border-primary/20">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary/15">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-display font-bold text-foreground mb-2">
              {title}
            </h2>
            <p className="text-sm text-muted-foreground mb-1">
              {description}
            </p>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <CalendarClock className="h-4 w-4" />
              Tu psicólogo activará tu programa pronto
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
