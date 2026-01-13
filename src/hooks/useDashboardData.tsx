import { useSearchParams } from "react-router-dom";
import { useAuth } from "./useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Achievement type for monthly achievements
export interface Achievement {
  id: string;
  type: "gold" | "silver" | "bronze";
  icon: "trophy" | "star" | "medal" | "improvement";
  title: string;
  metric: string;
  improvement: number;
  isNew: boolean;
}

// Demo data for John Doe
const demoPersonalData = {
  name: "John Doe",
  age: 46,
  sex: "Masculino",
  height: 1.75,
  weight: 72.5,
  waistHeightRatio: 0.49,
  biologicalAge: 42.5,
  vo2Max: 47,
  hba1c: 5.1,
};

const demoPsychologicalData = {
  anxiety: { value: 42, change: -12, data: [{ value: 65 }, { value: 58 }, { value: 52 }, { value: 48 }, { value: 45 }, { value: 42 }] },
  stress: { value: 44, change: -15, data: [{ value: 70 }, { value: 62 }, { value: 55 }, { value: 50 }, { value: 48 }, { value: 44 }] },
  depression: { value: 8, change: -5 },
  lifeSatisfaction: { value: 7.8, change: 8 },
};

const demoHabitsData = {
  sleep: { value: 7.8, change: 10, data: [{ value: 6.5 }, { value: 7 }, { value: 7.2 }, { value: 7.5 }, { value: 7.8 }, { value: 8 }] },
  sleepQuality: { value: 88, change: 5 },
  activity: { value: 5.5, change: 15, data: [{ value: 3 }, { value: 4 }, { value: 4.5 }, { value: 5 }, { value: 5.5 }, { value: 6 }] },
  screenTime: { value: 95, change: -8 },
  phoneUnlocks: { value: 58, change: -18, data: [{ value: 85 }, { value: 78 }, { value: 72 }, { value: 68 }, { value: 62 }, { value: 58 }] },
};

const demoLongevityData = {
  biologicalAge: { value: 42.5, change: -3 },
  waistHeightRatio: { value: 0.49, change: -2 },
  vo2Max: { value: 47, change: 5 },
  gripStrength: { value: 42, change: 3 },
  balanceLeft: { value: 38, change: 8 },
  balanceRight: { value: 42, change: 12 },
  nonHdlCholesterol: { value: 95, change: -5 },
  hrv: { value: 62, change: 10 },
};

const demoWeeklyProgress = {
  streak: 5,
  weeklyGoals: { completed: 4, total: 6 },
  improvement: 12,
};

const demoAchievements: Achievement[] = [
  {
    id: "sleep",
    type: "gold",
    icon: "trophy",
    title: "Campeón del Sueño",
    metric: "Calidad de sueño",
    improvement: 28,
    isNew: true,
  },
  {
    id: "anxiety",
    type: "gold",
    icon: "star",
    title: "Control de Ansiedad",
    metric: "Reducción de ansiedad",
    improvement: 24,
    isNew: false,
  },
  {
    id: "activity",
    type: "silver",
    icon: "medal",
    title: "Activo Constante",
    metric: "Actividad física",
    improvement: 18,
    isNew: true,
  },
  {
    id: "stress",
    type: "bronze",
    icon: "improvement",
    title: "Manejo del Estrés",
    metric: "Reducción de estrés",
    improvement: 12,
    isNew: false,
  },
];

// Empty data for new users
const emptyPersonalData = {
  name: "",
  age: 0,
  sex: "",
  height: 0,
  weight: 0,
  waistHeightRatio: 0,
  biologicalAge: 0,
  vo2Max: 0,
  hba1c: 0,
};

const emptyPsychologicalData = {
  anxiety: { value: 0, change: 0, data: [] as { value: number }[] },
  stress: { value: 0, change: 0, data: [] as { value: number }[] },
  depression: { value: 0, change: 0 },
  lifeSatisfaction: { value: 0, change: 0 },
};

const emptyHabitsData = {
  sleep: { value: 0, change: 0, data: [] as { value: number }[] },
  sleepQuality: { value: 0, change: 0 },
  activity: { value: 0, change: 0, data: [] as { value: number }[] },
  screenTime: { value: 0, change: 0 },
  phoneUnlocks: { value: 0, change: 0, data: [] as { value: number }[] },
};

const emptyLongevityData = {
  biologicalAge: { value: 0, change: 0 },
  waistHeightRatio: { value: 0, change: 0 },
  vo2Max: { value: 0, change: 0 },
  gripStrength: { value: 0, change: 0 },
  balanceLeft: { value: 0, change: 0 },
  balanceRight: { value: 0, change: 0 },
  nonHdlCholesterol: { value: 0, change: 0 },
  hrv: { value: 0, change: 0 },
};

const emptyWeeklyProgress = {
  streak: 0,
  weeklyGoals: { completed: 0, total: 6 },
  improvement: 0,
};

const emptyAchievements: Achievement[] = [];

// Helper to calculate age from date of birth
function calculateAge(dateOfBirth: string | null): number {
  if (!dateOfBirth) return 0;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// Helper to get health data value by type
function getHealthDataValue(healthData: Array<{ data_type: string; value: number }> | null, dataType: string): number {
  if (!healthData) return 0;
  const entry = healthData.find(h => h.data_type === dataType);
  return entry?.value || 0;
}

// Helper to get health data history for charts
function getHealthDataHistory(healthData: Array<{ data_type: string; value: number }> | null, dataType: string): { value: number }[] {
  if (!healthData) return [];
  return healthData
    .filter(h => h.data_type === dataType)
    .map(h => ({ value: h.value }))
    .slice(0, 6);
}

export function useDashboardData() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const isDemo = searchParams.get("demo") === "true";

  // Fetch real user profile data
  const { data: profileData } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !isDemo,
  });

  // Fetch real health data
  const { data: healthData } = useQuery({
    queryKey: ["health_data", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("health_data")
        .select("*")
        .eq("user_id", user.id)
        .order("recorded_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !isDemo,
  });

  // Fetch biomarkers
  const { data: biomarkersData } = useQuery({
    queryKey: ["biomarkers", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("biomarkers")
        .select("*")
        .eq("user_id", user.id)
        .order("recorded_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!user?.id && !isDemo,
  });

  // Fetch test results
  const { data: testResults } = useQuery({
    queryKey: ["test_results", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("test_results")
        .select("*")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !isDemo,
  });

  if (isDemo) {
    return {
      isDemo: true,
      userName: "John",
      personalData: demoPersonalData,
      psychologicalData: demoPsychologicalData,
      habitsData: demoHabitsData,
      longevityData: demoLongevityData,
      weeklyProgress: demoWeeklyProgress,
      achievements: demoAchievements,
      hasData: true,
    };
  }

  // Check if user has any real data
  const hasRealData = !!(healthData?.length || biomarkersData || testResults?.length);

  // Build personal data from profile and biomarkers
  const realPersonalData = profileData ? {
    name: profileData.full_name || "",
    age: calculateAge(profileData.date_of_birth),
    sex: profileData.sex || "",
    height: getHealthDataValue(healthData, "height"),
    weight: getHealthDataValue(healthData, "weight"),
    waistHeightRatio: getHealthDataValue(healthData, "waist_height_ratio"),
    biologicalAge: biomarkersData?.biological_age || 0,
    vo2Max: getHealthDataValue(healthData, "vo2_max"),
    hba1c: getHealthDataValue(healthData, "hba1c"),
  } : emptyPersonalData;

  // Build psychological data from test results (scores is JSON)
  const getTestScore = (testName: string): number => {
    const test = testResults?.find(t => t.test_name.toLowerCase().includes(testName.toLowerCase()));
    if (!test?.scores) return 0;
    const scores = test.scores as Record<string, number>;
    return scores.total || scores.score || Object.values(scores)[0] || 0;
  };

  const realPsychologicalData = {
    anxiety: { value: getTestScore("ansiedad") || getTestScore("anxiety"), change: 0, data: [] as { value: number }[] },
    stress: { value: getTestScore("estrés") || getTestScore("stress"), change: 0, data: [] as { value: number }[] },
    depression: { value: getTestScore("depresión") || getTestScore("depression"), change: 0 },
    lifeSatisfaction: { value: getTestScore("satisfacción") || getTestScore("satisfaction"), change: 0 },
  };

  // Build habits data from health_data
  const realHabitsData = {
    sleep: { 
      value: getHealthDataValue(healthData, "sleep_hours"), 
      change: 0, 
      data: getHealthDataHistory(healthData, "sleep_hours") 
    },
    sleepQuality: { value: getHealthDataValue(healthData, "sleep_quality"), change: 0 },
    activity: { 
      value: getHealthDataValue(healthData, "activity_hours"), 
      change: 0, 
      data: getHealthDataHistory(healthData, "activity_hours") 
    },
    screenTime: { value: getHealthDataValue(healthData, "screen_time"), change: 0 },
    phoneUnlocks: { 
      value: getHealthDataValue(healthData, "phone_unlocks"), 
      change: 0, 
      data: getHealthDataHistory(healthData, "phone_unlocks") 
    },
  };

  // Build longevity data from biomarkers and health_data
  const realLongevityData = {
    biologicalAge: { value: biomarkersData?.biological_age || 0, change: 0 },
    waistHeightRatio: { value: getHealthDataValue(healthData, "waist_height_ratio"), change: 0 },
    vo2Max: { value: getHealthDataValue(healthData, "vo2_max"), change: 0 },
    gripStrength: { value: getHealthDataValue(healthData, "grip_strength"), change: 0 },
    balanceLeft: { value: getHealthDataValue(healthData, "balance_left"), change: 0 },
    balanceRight: { value: getHealthDataValue(healthData, "balance_right"), change: 0 },
    nonHdlCholesterol: { value: getHealthDataValue(healthData, "non_hdl_cholesterol"), change: 0 },
    hrv: { value: getHealthDataValue(healthData, "hrv"), change: 0 },
  };

  // Calculate monthly achievements based on improvements
  // For now, we need historical data to calculate real changes
  // Get the month's start to filter data
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Check if user has at least 7 days of data (minimum for achievements)
  const hasEnoughData = (() => {
    if (!healthData?.length) return false;
    const sortedDates = healthData
      .map(h => new Date(h.recorded_at))
      .sort((a, b) => a.getTime() - b.getTime());
    if (sortedDates.length < 2) return false;
    const daysDiff = Math.floor((sortedDates[sortedDates.length - 1].getTime() - sortedDates[0].getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff >= 7;
  })();

  // Calculate real achievements from data improvements
  const calculateRealAchievements = (): Achievement[] => {
    if (!hasEnoughData) return [];
    
    const improvements: Array<{
      id: string;
      title: string;
      metric: string;
      improvement: number;
      icon: "trophy" | "star" | "medal" | "improvement";
    }> = [];

    // Calculate sleep improvement
    const sleepData = healthData?.filter(h => h.data_type === "sleep_hours" || h.data_type === "sleep_quality") || [];
    if (sleepData.length >= 2) {
      const oldAvg = sleepData.slice(-3).reduce((sum, h) => sum + Number(h.value), 0) / Math.min(3, sleepData.length);
      const newAvg = sleepData.slice(0, 3).reduce((sum, h) => sum + Number(h.value), 0) / Math.min(3, sleepData.length);
      if (oldAvg > 0) {
        const improvement = Math.round(((newAvg - oldAvg) / oldAvg) * 100);
        if (improvement > 0) {
          improvements.push({ id: "sleep", title: "Campeón del Sueño", metric: "Calidad de sueño", improvement, icon: "trophy" });
        }
      }
    }

    // Calculate activity improvement
    const activityData = healthData?.filter(h => h.data_type === "activity_hours" || h.data_type === "steps") || [];
    if (activityData.length >= 2) {
      const oldAvg = activityData.slice(-3).reduce((sum, h) => sum + Number(h.value), 0) / Math.min(3, activityData.length);
      const newAvg = activityData.slice(0, 3).reduce((sum, h) => sum + Number(h.value), 0) / Math.min(3, activityData.length);
      if (oldAvg > 0) {
        const improvement = Math.round(((newAvg - oldAvg) / oldAvg) * 100);
        if (improvement > 0) {
          improvements.push({ id: "activity", title: "Activo Constante", metric: "Actividad física", improvement, icon: "medal" });
        }
      }
    }

    // Calculate HRV improvement
    const hrvData = healthData?.filter(h => h.data_type === "hrv") || [];
    if (hrvData.length >= 2) {
      const oldAvg = hrvData.slice(-3).reduce((sum, h) => sum + Number(h.value), 0) / Math.min(3, hrvData.length);
      const newAvg = hrvData.slice(0, 3).reduce((sum, h) => sum + Number(h.value), 0) / Math.min(3, hrvData.length);
      if (oldAvg > 0) {
        const improvement = Math.round(((newAvg - oldAvg) / oldAvg) * 100);
        if (improvement > 0) {
          improvements.push({ id: "hrv", title: "Mejor Recuperación", metric: "Variabilidad cardíaca", improvement, icon: "star" });
        }
      }
    }

    // Calculate stress/anxiety reduction from test results
    if (testResults && testResults.length >= 2) {
      const anxietyTests = testResults.filter(t => 
        t.test_name.toLowerCase().includes("ansiedad") || 
        t.test_name.toLowerCase().includes("anxiety") ||
        t.test_name.toLowerCase().includes("estrés") ||
        t.test_name.toLowerCase().includes("stress")
      );
      if (anxietyTests.length >= 2) {
        const newestScore = (anxietyTests[0].scores as Record<string, number>).total || 0;
        const oldestScore = (anxietyTests[anxietyTests.length - 1].scores as Record<string, number>).total || 0;
        if (oldestScore > 0 && newestScore < oldestScore) {
          const improvement = Math.round(((oldestScore - newestScore) / oldestScore) * 100);
          if (improvement > 0) {
            improvements.push({ id: "stress", title: "Manejo del Estrés", metric: "Reducción de estrés", improvement, icon: "improvement" });
          }
        }
      }
    }

    // Sort by improvement and assign medal types
    improvements.sort((a, b) => b.improvement - a.improvement);
    
    return improvements.slice(0, 4).map((item, index) => ({
      ...item,
      type: (index === 0 ? "gold" : index === 1 ? "silver" : "bronze") as "gold" | "silver" | "bronze",
      isNew: index === 0, // Mark the top achievement as new
    }));
  };

  const realAchievements = calculateRealAchievements();

  return {
    isDemo: false,
    userName: profileData?.full_name?.split(" ")[0] || "Usuario",
    personalData: hasRealData ? realPersonalData : emptyPersonalData,
    psychologicalData: hasRealData ? realPsychologicalData : emptyPsychologicalData,
    habitsData: hasRealData ? realHabitsData : emptyHabitsData,
    longevityData: hasRealData ? realLongevityData : emptyLongevityData,
    weeklyProgress: emptyWeeklyProgress,
    achievements: hasEnoughData ? realAchievements : emptyAchievements,
    hasData: hasRealData,
    hasEnoughDataForAchievements: hasEnoughData,
  };
}
