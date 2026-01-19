import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SurveyQuestion {
  id: string;
  question_text: string;
  question_type: "yes_no" | "yes_no_count";
  follow_up_label: string | null;
  follow_up_options: number[] | null;
  habit_category: string | null;
  display_order: number;
}

export interface SurveyResponse {
  id: string;
  question_id: string;
  response_date: string;
  answer: boolean;
  follow_up_value: number | null;
}

export interface DailyAchievement {
  date: string;
  totalQuestions: number;
  achievedCount: number;
  percentage: number;
  responses: SurveyResponse[];
}

export interface WeeklySurveyStats {
  weekNumber: number;
  totalDays: number;
  completedDays: number;
  averageAchievement: number;
  categoryStats: Record<string, { achieved: number; total: number; percentage: number }>;
}

export function useDailySurvey(currentWeek: number = 1) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [todayResponses, setTodayResponses] = useState<SurveyResponse[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklySurveyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasCompletedToday, setHasCompletedToday] = useState(false);

  // Load questions for current week
  const loadQuestions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("daily_survey_questions")
        .select("*")
        .eq("is_active", true)
        .lte("week_start", currentWeek)
        .gte("week_end", currentWeek)
        .order("display_order", { ascending: true });

      if (error) throw error;

      const mapped: SurveyQuestion[] = (data || []).map((q) => ({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type as "yes_no" | "yes_no_count",
        follow_up_label: q.follow_up_label,
        follow_up_options: q.follow_up_options as number[] | null,
        habit_category: q.habit_category,
        display_order: q.display_order,
      }));

      setQuestions(mapped);
    } catch (error) {
      console.error("Error loading survey questions:", error);
    }
  }, [currentWeek]);

  // Load today's responses
  const loadTodayResponses = useCallback(async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("daily_survey_responses")
        .select("*")
        .eq("user_id", user.id)
        .eq("response_date", today);

      if (error) throw error;

      const mapped: SurveyResponse[] = (data || []).map((r) => ({
        id: r.id,
        question_id: r.question_id,
        response_date: r.response_date,
        answer: r.answer,
        follow_up_value: r.follow_up_value,
      }));

      setTodayResponses(mapped);
      setHasCompletedToday(mapped.length > 0 && mapped.length >= questions.length);
    } catch (error) {
      console.error("Error loading today's responses:", error);
    }
  }, [user, questions.length]);

  // Calculate weekly stats
  const calculateWeeklyStats = useCallback(async () => {
    if (!user) return;

    try {
      // Get responses from the last 7 days
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split("T")[0];

      const { data: responses, error } = await supabase
        .from("daily_survey_responses")
        .select("*, daily_survey_questions!inner(habit_category)")
        .eq("user_id", user.id)
        .gte("response_date", weekAgoStr);

      if (error) throw error;

      if (!responses || responses.length === 0) {
        setWeeklyStats(null);
        return;
      }

      // Group by date
      const dateGroups: Record<string, typeof responses> = {};
      responses.forEach((r) => {
        if (!dateGroups[r.response_date]) {
          dateGroups[r.response_date] = [];
        }
        dateGroups[r.response_date].push(r);
      });

      // Calculate stats
      const completedDays = Object.keys(dateGroups).length;
      const achievedCounts = Object.values(dateGroups).map(
        (dayResponses) => dayResponses.filter((r) => r.answer).length / dayResponses.length
      );
      const averageAchievement =
        achievedCounts.reduce((sum, val) => sum + val, 0) / achievedCounts.length;

      // Category stats
      const categoryStats: Record<string, { achieved: number; total: number; percentage: number }> = {};
      responses.forEach((r) => {
        const category = (r.daily_survey_questions as { habit_category: string | null })?.habit_category || "other";
        if (!categoryStats[category]) {
          categoryStats[category] = { achieved: 0, total: 0, percentage: 0 };
        }
        categoryStats[category].total++;
        if (r.answer) {
          categoryStats[category].achieved++;
        }
      });

      Object.keys(categoryStats).forEach((cat) => {
        categoryStats[cat].percentage =
          Math.round((categoryStats[cat].achieved / categoryStats[cat].total) * 100);
      });

      setWeeklyStats({
        weekNumber: currentWeek,
        totalDays: 7,
        completedDays,
        averageAchievement: Math.round(averageAchievement * 100),
        categoryStats,
      });
    } catch (error) {
      console.error("Error calculating weekly stats:", error);
    }
  }, [user, currentWeek]);

  // Submit response for a question
  const submitResponse = useCallback(
    async (questionId: string, answer: boolean, followUpValue?: number): Promise<boolean> => {
      if (!user) return false;

      setIsSaving(true);
      try {
        const today = new Date().toISOString().split("T")[0];

        // Check if response already exists
        const { data: existing } = await supabase
          .from("daily_survey_responses")
          .select("id")
          .eq("user_id", user.id)
          .eq("question_id", questionId)
          .eq("response_date", today)
          .maybeSingle();

        if (existing) {
          // Update existing
          const { error } = await supabase
            .from("daily_survey_responses")
            .update({
              answer,
              follow_up_value: followUpValue || null,
            })
            .eq("id", existing.id);

          if (error) throw error;
        } else {
          // Insert new
          const { error } = await supabase.from("daily_survey_responses").insert({
            user_id: user.id,
            question_id: questionId,
            response_date: today,
            answer,
            follow_up_value: followUpValue || null,
          });

          if (error) throw error;
        }

        await loadTodayResponses();
        return true;
      } catch (error) {
        console.error("Error submitting response:", error);
        toast.error("Error al guardar respuesta");
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [user, loadTodayResponses]
  );

  // Submit all responses at once
  const submitAllResponses = useCallback(
    async (responses: Array<{ questionId: string; answer: boolean; followUpValue?: number }>): Promise<boolean> => {
      if (!user) return false;

      setIsSaving(true);
      try {
        const today = new Date().toISOString().split("T")[0];

        for (const response of responses) {
          const { data: existing } = await supabase
            .from("daily_survey_responses")
            .select("id")
            .eq("user_id", user.id)
            .eq("question_id", response.questionId)
            .eq("response_date", today)
            .maybeSingle();

          if (existing) {
            await supabase
              .from("daily_survey_responses")
              .update({
                answer: response.answer,
                follow_up_value: response.followUpValue || null,
              })
              .eq("id", existing.id);
          } else {
            await supabase.from("daily_survey_responses").insert({
              user_id: user.id,
              question_id: response.questionId,
              response_date: today,
              answer: response.answer,
              follow_up_value: response.followUpValue || null,
            });
          }
        }

        toast.success("¡Logros diarios registrados!");
        await loadTodayResponses();
        await calculateWeeklyStats();
        return true;
      } catch (error) {
        console.error("Error submitting responses:", error);
        toast.error("Error al guardar respuestas");
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [user, loadTodayResponses, calculateWeeklyStats]
  );

  // Get achievement count for the week (for integration with main achievements)
  const getWeeklyAchievementCount = useCallback((): number => {
    if (!weeklyStats) return 0;
    return weeklyStats.averageAchievement >= 80 ? 1 : 0;
  }, [weeklyStats]);

  // Load data on mount
  useEffect(() => {
    const loadAll = async () => {
      setIsLoading(true);
      await loadQuestions();
      setIsLoading(false);
    };
    loadAll();
  }, [loadQuestions]);

  useEffect(() => {
    if (questions.length > 0 && user) {
      loadTodayResponses();
      calculateWeeklyStats();
    }
  }, [questions, user, loadTodayResponses, calculateWeeklyStats]);

  return {
    questions,
    todayResponses,
    weeklyStats,
    isLoading,
    isSaving,
    hasCompletedToday,
    submitResponse,
    submitAllResponses,
    getWeeklyAchievementCount,
    refreshData: async () => {
      await loadTodayResponses();
      await calculateWeeklyStats();
    },
  };
}
