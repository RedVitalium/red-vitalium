import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { MetricTooltip } from "./MetricTooltip";

type StatusLevel = "optimal" | "warning" | "danger" | "neutral";

interface MetricCardProps {
  title: string;
  subtitle?: string;
  value: number | string;
  unit?: string;
  target?: string;
  change?: number;
  status: StatusLevel;
  icon?: React.ReactNode;
  chart?: React.ReactNode;
  tooltip?: string;
}

const statusColors = {
  optimal: "border-success/30 bg-success/5",
  warning: "border-warning/30 bg-warning/5",
  danger: "border-danger/30 bg-danger/5",
  neutral: "border-border bg-card",
};

const statusIndicator = {
  optimal: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  neutral: "bg-muted",
};

export function MetricCard({
  title,
  subtitle,
  value,
  unit,
  target,
  change,
  status,
  icon,
  chart,
  tooltip,
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (change === undefined || change === 0) {
      return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
    if (change > 0) {
      return <TrendingUp className="h-4 w-4 text-success" />;
    }
    return <TrendingDown className="h-4 w-4 text-danger" />;
  };

  const getTrendColor = () => {
    if (change === undefined || change === 0) return "text-muted-foreground";
    if (change > 0) return "text-success";
    return "text-danger";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative rounded-2xl p-6 border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 min-h-[180px] flex flex-col",
        statusColors[status]
      )}
    >
      {/* Status Indicator */}
      <div className={cn("absolute top-4 right-4 w-3 h-3 rounded-full", statusIndicator[status])} />

      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        {icon && (
          <div className="p-2 rounded-xl bg-primary/10 text-primary">{icon}</div>
        )}
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="font-display font-semibold text-foreground">{title}</h3>
            {tooltip && <MetricTooltip metric={tooltip} />}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Value */}
      <div className="flex items-end gap-2 mb-2">
        <span className="text-3xl font-display font-bold text-foreground">{typeof value === 'number' ? Math.round(value * 10) / 10 : value}</span>
        {unit && <span className="text-sm text-muted-foreground mb-1">{unit}</span>}
      </div>

      {/* Change & Target */}
      <div className="flex items-center justify-between text-sm">
        {change !== undefined && (
          <div className={cn("flex items-center gap-1 font-medium", getTrendColor())}>
            {getTrendIcon()}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
        {target && (
          <span className="text-xs text-muted-foreground">Meta: {target}</span>
        )}
      </div>

      {/* Optional Chart */}
      {chart && <div className="mt-4">{chart}</div>}
    </motion.div>
  );
}
