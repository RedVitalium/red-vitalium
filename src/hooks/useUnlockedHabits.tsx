import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const ADVANCED_HABITS = [
  { id: "sauna", name: "Saunas", description: "Sesiones de sauna para recuperación y longevidad" },
  { id: "cold_bath", name: "Baños Fríos", description: "Exposición al frío para resiliencia metabólica" },
  { id: "meditation", name: "Meditación", description: "Práctica de mindfulness y atención plena" },
  { id: "yoga", name: "Yoga", description: "Flexibilidad, equilibrio y conexión mente-cuerpo" },
];

export function useUnlockedHabits() {
  const { user } = useAuth();

  const { data: unlockedHabitIds = [], isLoading, refetch } = useQuery({
    queryKey: ["unlocked-habits", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("unlocked_habits")
        .select("habit_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return data.map(h => h.habit_id);
    },
    enabled: !!user?.id,
  });

  const isHabitUnlocked = (habitId: string): boolean => {
    return unlockedHabitIds.includes(habitId);
  };

  const getHabitStatus = (habitId: string): "locked" | "unlocked" => {
    return isHabitUnlocked(habitId) ? "unlocked" : "locked";
  };

  return {
    unlockedHabitIds,
    isHabitUnlocked,
    getHabitStatus,
    isLoading,
    refetch,
    advancedHabits: ADVANCED_HABITS,
  };
}
