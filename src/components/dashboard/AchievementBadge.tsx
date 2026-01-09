import { motion } from "framer-motion";
import { Trophy, Star, Medal, TrendingUp } from "lucide-react";

type BadgeType = "gold" | "silver" | "bronze";
type AchievementType = "trophy" | "star" | "medal" | "improvement";

interface AchievementBadgeProps {
  type: BadgeType;
  icon?: AchievementType;
  title: string;
  description?: string;
  isNew?: boolean;
}

const badgeStyles = {
  gold: "bg-gradient-to-br from-yellow-400 via-amber-400 to-yellow-500 shadow-lg shadow-yellow-500/30",
  silver: "bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 shadow-md shadow-gray-400/30",
  bronze: "bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700 shadow-md shadow-orange-600/30",
};

const iconMap = {
  trophy: Trophy,
  star: Star,
  medal: Medal,
  improvement: TrendingUp,
};

export function AchievementBadge({
  type,
  icon = "medal",
  title,
  description,
  isNew = false,
}: AchievementBadgeProps) {
  const Icon = iconMap[icon];

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      className="relative flex flex-col items-center"
    >
      {isNew && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 bg-danger text-danger-foreground text-[10px] font-bold px-2 py-0.5 rounded-full z-10"
        >
          NUEVO
        </motion.span>
      )}
      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center ${badgeStyles[type]} ${
          isNew ? "animate-pulse-glow" : ""
        }`}
      >
        <Icon className={`h-8 w-8 ${type === "silver" ? "text-gray-700" : "text-white"}`} />
      </div>
      <p className="mt-2 text-sm font-medium text-foreground text-center">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground text-center">{description}</p>
      )}
    </motion.div>
  );
}
