import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useCycleData } from "./useCycleData";

export function useHabitGoals(overrideUserId?: string) {
  const { user } = useAuth();
  const effectiveUserId = overrideUserId || user?.id || null;
  const { getCycleProgress } = useCycleData(effectiveUserId);
  const cycleProgress = getCycleProgress();
  
  // Calculate current month of cycle (1-based)
  const currentCycleMonth = Math.ceil(cycleProgress.daysSinceCycleStart / 28) || 1;

  // Fetch habit goals for the current month
  const { data: habitGoals = [], isLoading } = useQuery({
    queryKey: ["user-habit-goals", user?.id, currentCycleMonth],
    queryFn: async () => {
      if (!effectiveUserId) return [];
      const { data, error } = await supabase
        .from("habit_goals")
        .select("*")
        .eq("user_id", effectiveUserId)
        .eq("month", currentCycleMonth);
      if (error) throw error;
      return data || [];
    },
    enabled: !!effectiveUserId,
  });

  // Fetch activity goals
  const { data: activityGoals } = useQuery({
    queryKey: ["user-activity-goals", effectiveUserId],
    queryFn: async () => {
      if (!effectiveUserId) return null;
      const { data, error } = await supabase
        .from("activity_goals")
        .select("*")
        .eq("user_id", effectiveUserId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!effectiveUserId,
  });

  // Fetch yoga goal from unlocked_habits
  const { data: yogaHabit } = useQuery({
    queryKey: ["user-yoga-habit", effectiveUserId],
    queryFn: async () => {
      if (!effectiveUserId) return null;
      const { data, error } = await supabase
        .from("unlocked_habits")
        .select("*")
        .eq("user_id", effectiveUserId)
        .eq("habit_id", "yoga")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!effectiveUserId,
  });

  // Get specific goals with defaults
  const getScreenTimeGoal = (): number => {
    const goal = habitGoals.find(g => g.habit_type === "screen_time");
    return goal?.target_value || 90; // Default 90 min
  };

  const getPhoneUnlocksGoal = (): number => {
    const goal = habitGoals.find(g => g.habit_type === "phone_unlocks");
    return goal?.target_value || 50; // Default 50 unlocks
  };

  const getYogaGoal = (): number => {
    // First check habit_goals table (monthly goals)
    const monthlyGoal = habitGoals.find(g => g.habit_type === "yoga");
    if (monthlyGoal) return monthlyGoal.target_value;
    
    // Fall back to unlocked_habits goal
    if (yogaHabit?.target_sessions_per_week) return yogaHabit.target_sessions_per_week;
    
    return 3; // Default 3 sessions
  };

  const getSleepHoursGoal = (): number => {
    const goal = habitGoals.find(g => g.habit_type === "sleep_hours");
    return goal?.target_value || 7.5; // Default 7.5 hours
  };

  const getSleepQualityGoal = (): number => {
    const goal = habitGoals.find(g => g.habit_type === "sleep_quality");
    return goal?.target_value || 85; // Default 85 score
  };

  const getActivityGoals = () => {
    // First check habit_goals table for monthly progressive goals
    const sessionsGoal = habitGoals.find(g => g.habit_type === "activity_sessions");
    const durationGoal = habitGoals.find(g => g.habit_type === "activity_duration");
    
    return {
      sessionsPerWeek: sessionsGoal?.target_value || activityGoals?.target_sessions_per_week || 4,
      avgDurationMinutes: durationGoal?.target_value || activityGoals?.target_avg_duration_minutes || 30,
    };
  };

  return {
    isLoading,
    currentCycleMonth,
    screenTimeGoal: getScreenTimeGoal(),
    phoneUnlocksGoal: getPhoneUnlocksGoal(),
    yogaGoal: getYogaGoal(),
    sleepHoursGoal: getSleepHoursGoal(),
    sleepQualityGoal: getSleepQualityGoal(),
    activityGoals: getActivityGoals(),
    hasGoals: habitGoals.length > 0 || !!activityGoals,
  };
}
