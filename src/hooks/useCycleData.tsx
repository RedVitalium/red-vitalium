import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CycleData {
  id: string;
  user_id: string;
  started_at: string;
  started_by: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CycleProgress {
  cycleStartDate: Date | null;
  currentWeekOfCycle: number;
  daysSinceCycleStart: number;
  cycleProgress: number; // 0-100
  hasActiveCycle: boolean;
  isTestWeek: boolean;
  weeksUntilTest: number;
}

export function useCycleData(userId: string | null) {
  const [activeCycle, setActiveCycle] = useState<CycleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const fetchActiveCycle = async () => {
      try {
        const { data, error } = await supabase
          .from("user_cycles")
          .select("*")
          .eq("user_id", userId)
          .eq("is_active", true)
          .order("started_at", { ascending: false })
          .maybeSingle();

        if (error) {
          console.error("Error fetching cycle:", error);
        } else {
          setActiveCycle(data);
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveCycle();
  }, [userId]);

  const getCycleProgress = (): CycleProgress => {
    if (!activeCycle) {
      return {
        cycleStartDate: null,
        currentWeekOfCycle: 0,
        daysSinceCycleStart: 0,
        cycleProgress: 0,
        hasActiveCycle: false,
        isTestWeek: false,
        weeksUntilTest: 4,
      };
    }

    const startDate = new Date(activeCycle.started_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - startDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Each cycle is 4 weeks (28 days)
    const cycleDuration = 28;
    const currentWeek = Math.min(Math.floor(diffDays / 7) + 1, 4);
    const progress = Math.min(Math.round((diffDays / cycleDuration) * 100), 100);
    
    return {
      cycleStartDate: startDate,
      currentWeekOfCycle: currentWeek,
      daysSinceCycleStart: diffDays,
      cycleProgress: progress,
      hasActiveCycle: true,
      isTestWeek: currentWeek === 4,
      weeksUntilTest: Math.max(4 - currentWeek, 0),
    };
  };

  return {
    activeCycle,
    isLoading,
    getCycleProgress,
  };
}
