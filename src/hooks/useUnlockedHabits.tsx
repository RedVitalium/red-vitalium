import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const ADVANCED_HABITS = [
  { id: "sauna", name: "Saunas", description: "Sesiones de sauna para recuperación y longevidad" },
  { id: "cold_bath", name: "Baños Fríos", description: "Exposición al frío para resiliencia metabólica" },
  { id: "meditation", name: "Meditación", description: "Práctica de mindfulness y atención plena" },
  { id: "yoga", name: "Yoga", description: "Flexibilidad, equilibrio y conexión mente-cuerpo" },
];

export function useUnlockedHabits(overrideUserId?: string) {
  const { user } = useAuth();
  const effectiveUserId = overrideUserId || user?.id;

  const { data: unlockedHabitIds = [], isLoading, refetch } = useQuery({
    queryKey: ["unlocked-habits", effectiveUserId],
    queryFn: async () => {
      if (!effectiveUserId) return [];
      const { data, error } = await supabase
        .from("unlocked_habits")
        .select("habit_id")
        .eq("user_id", effectiveUserId);
      if (error) throw error;
      return data.map(h => h.habit_id);
    },
    enabled: !!effectiveUserId,
  });

  return {
    unlockedHabitIds,
    isHabitUnlocked: (id: string) => unlockedHabitIds.includes(id),
    getHabitStatus: (id: string) => unlockedHabitIds.includes(id) ? "unlocked" : "locked",
    isLoading,
    refetch,
    advancedHabits: ADVANCED_HABITS,
  };
}
