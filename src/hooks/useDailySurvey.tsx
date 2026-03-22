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

export interface WeeklySurveyStats {
  weekNumber: number;
  totalDays: number;
  completedDays: number;
  averageAchievement: number;
  categoryStats: Record<string, { achieved: number; total: number; percentage: number }>;
}

/**
 * Returns today's date in YYYY-MM-DD format using LOCAL timezone.
 *
 * BUG 8 FIX: The old code used `new Date().toISOString().split('T')[0]`
 * which returns UTC date. In Villahermosa (UTC-6), a patient submitting
 * at 11PM local would get tomorrow's UTC date recorded.
 * `toLocaleDateString('en-CA')` returns YYYY-MM-DD in the device's local timezone.
 */
function getLocalToday(): string {
  return new Date().toLocaleDateString('en-CA');
}

export function useDailySurvey(currentWeek: number = 1) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [todayResponses, setTodayResponses] = useState<SurveyResponse[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklySurveyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasCompletedToday, setHasCompletedToday] = useState(false);

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

      setQuestions(
        (data || []).map((q) => ({
          id: q.id,
          question_text: q.question_text,
          question_type: q.question_type as "yes_no" | "yes_no_count",
          follow_up_label: q.follow_up_label,
          follow_up_options: q.follow_up_options as number[] | null,
          habit_category: q.habit_category,
          display_order: q.display_order,
        }))
      );
    } catch (error) {
      console.error("Error loading survey questions:", error);
    }
  }, [currentWeek]);

  const loadTodayResponses = useCallback(async () => {
    if (!user) return;
    try {
      const today = getLocalToday(); // BUG 8 FIX
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

  // BUG 7 FIX: Calculate weekly stats from the last 7 days of responses
  const loadWeeklyStats = useCallback(async () => {
    if (!user || questions.length === 0) return;
    try {
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toLocaleDateString('en-CA');
      const todayStr = getLocalToday();

      const { data, error } = await supabase
        .from("daily_survey_responses")
        .select("question_id, answer, response_date")
        .eq("user_id", user.id)
        .gte("response_date", weekAgoStr)
        .lte("response_date", todayStr);

      if (error) throw error;
      if (!data || data.length === 0) {
        setWeeklyStats(null);
        return;
      }

      // Count unique days with responses
      const daysWithResponses = new Set(data.map(r => r.response_date));
      const completedDays = daysWithResponses.size;

      // Count achievements (answer = true)
      const totalResponses = data.length;
      const achievedResponses = data.filter(r => r.answer).length;
      const averageAchievement = totalResponses > 0
        ? Math.round((achievedResponses / totalResponses) * 100)
        : 0;

      // Category stats: map question_id to habit_category
      const categoryMap: Record<string, string> = {};
      questions.forEach(q => {
        if (q.habit_category) {
          categoryMap[q.id] = q.habit_category;
        }
      });

      const categoryAccum: Record<string, { achieved: number; total: number }> = {};
      data.forEach(r => {
        const category = categoryMap[r.question_id] || "other";
        if (!categoryAccum[category]) {
          categoryAccum[category] = { achieved: 0, total: 0 };
        }
        categoryAccum[category].total++;
        if (r.answer) categoryAccum[category].achieved++;
      });

      const categoryStats: Record<string, { achieved: number; total: number; percentage: number }> = {};
      Object.entries(categoryAccum).forEach(([cat, stats]) => {
        categoryStats[cat] = {
          ...stats,
          percentage: stats.total > 0 ? Math.round((stats.achieved / stats.total) * 100) : 0,
        };
      });

      setWeeklyStats({
        weekNumber: currentWeek,
        totalDays: 7,
        completedDays,
        averageAchievement,
        categoryStats,
      });
    } catch (error) {
      console.error("Error loading weekly stats:", error);
    }
  }, [user, questions, currentWeek]);

  /**
   * Submit a single response (upsert pattern).
   */
  const submitResponse = useCallback(
    async (questionId: string, answer: boolean, followUpValue?: number): Promise<boolean> => {
      if (!user) return false;
      setIsSaving(true);
      try {
        const today = getLocalToday(); // BUG 8 FIX

        const { data: existing } = await supabase
          .from("daily_survey_responses")
          .select("id")
          .eq("user_id", user.id)
          .eq("question_id", questionId)
          .eq("response_date", today)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("daily_survey_responses")
            .update({ answer, follow_up_value: followUpValue || null })
            .eq("id", existing.id);
        } else {
          await supabase.from("daily_survey_responses").insert({
            user_id: user.id,
            question_id: questionId,
            response_date: today,
            answer,
            follow_up_value: followUpValue || null,
          });
        }

        await loadTodayResponses();
        return true;
      } catch {
        toast.error("Error al guardar respuesta");
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [user, loadTodayResponses]
  );

  /**
   * BUG 6 FIX: Submit all responses at once.
   * DailySurveyCard calls this with an array of responses after the user
   * completes all questions. The old hook only exported `submitResponse`
   * (singular) — this function was missing, causing the "Guardar" button
   * to silently fail (calling undefined).
   */
  const submitAllResponses = useCallback(
    async (
      responses: { questionId: string; answer: boolean; followUpValue?: number }[]
    ): Promise<boolean> => {
      if (!user) return false;
      setIsSaving(true);
      try {
        const today = getLocalToday(); // BUG 8 FIX

        for (const response of responses) {
          const { data: existing } = await supabase
            .from("daily_survey_responses")
            .select("id")
            .eq("user_id", user.id)
            .eq("question_id", response.questionId)
            .eq("response_date", today)
            .maybeSingle();

          if (existing) {
            const { error } = await supabase
              .from("daily_survey_responses")
              .update({
                answer: response.answer,
                follow_up_value: response.followUpValue || null,
              })
              .eq("id", existing.id);
            if (error) throw error;
          } else {
            const { error } = await supabase
              .from("daily_survey_responses")
              .insert({
                user_id: user.id,
                question_id: response.questionId,
                response_date: today,
                answer: response.answer,
                follow_up_value: response.followUpValue || null,
              });
            if (error) throw error;
          }
        }

        await loadTodayResponses();
        await loadWeeklyStats();
        toast.success("¡Logros del día registrados!");
        return true;
      } catch (error) {
        console.error("Error submitting survey responses:", error);
        toast.error("Error al guardar respuestas");
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [user, loadTodayResponses, loadWeeklyStats]
  );

  // Load questions on mount / week change
  useEffect(() => {
    const loadAll = async () => {
      setIsLoading(true);
      await loadQuestions();
      setIsLoading(false);
    };
    loadAll();
  }, [loadQuestions]);

  // Load today's responses + weekly stats when questions are ready
  useEffect(() => {
    if (questions.length > 0 && user) {
      loadTodayResponses();
      loadWeeklyStats();
    }
  }, [questions, user, loadTodayResponses, loadWeeklyStats]);

  return {
    questions,
    todayResponses,
    weeklyStats,
    isLoading,
    isSaving,
    hasCompletedToday,
    submitResponse,
    submitAllResponses, // BUG 6 FIX: was missing, DailySurveyCard needs this
    refreshData: async () => {
      await loadTodayResponses();
      await loadWeeklyStats();
    },
  };
}
