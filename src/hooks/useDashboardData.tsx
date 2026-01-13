import { useSearchParams } from "react-router-dom";
import { useAuth } from "./useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

  return {
    isDemo: false,
    userName: profileData?.full_name?.split(" ")[0] || "Usuario",
    personalData: hasRealData ? realPersonalData : emptyPersonalData,
    psychologicalData: hasRealData ? realPsychologicalData : emptyPsychologicalData,
    habitsData: hasRealData ? realHabitsData : emptyHabitsData,
    longevityData: hasRealData ? realLongevityData : emptyLongevityData,
    weeklyProgress: emptyWeeklyProgress,
    hasData: hasRealData,
  };
}
