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

// Data point with date for evolution charts
export interface DataPointWithDate {
  value: number;
  date: string;
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
  depression: { value: 8, change: -5, data: [{ value: 18 }, { value: 14 }, { value: 12 }, { value: 10 }, { value: 8 }] },
  lifeSatisfaction: { value: 7.8, change: 8, data: [{ value: 5.5 }, { value: 6.2 }, { value: 6.8 }, { value: 7.2 }, { value: 7.8 }] },
};

const demoHabitsData = {
  sleep: { value: 7.8, change: 10, data: [{ value: 6.5 }, { value: 7 }, { value: 7.2 }, { value: 7.5 }, { value: 7.8 }, { value: 8 }] },
  sleepQuality: { value: 88, change: 5 },
  activity: { value: 5.5, change: 15, data: [{ value: 3 }, { value: 4 }, { value: 4.5 }, { value: 5 }, { value: 5.5 }, { value: 6 }] },
  screenTime: { value: 95, change: -8 },
  phoneUnlocks: { value: 58, change: -18, data: [{ value: 85 }, { value: 78 }, { value: 72 }, { value: 68 }, { value: 62 }, { value: 58 }] },
};

const demoLongevityData = {
  biologicalAge: { value: 42.5, change: -3, data: [{ value: 45.5 }, { value: 44.8 }, { value: 44 }, { value: 43.2 }, { value: 42.5 }] },
  waistHeightRatio: { value: 0.49, change: -2 },
  vo2Max: { value: 47, change: 5, data: [{ value: 42 }, { value: 43.5 }, { value: 45 }, { value: 46 }, { value: 47 }] },
  gripStrength: { value: 42, change: 3, data: [{ value: 38 }, { value: 39 }, { value: 40 }, { value: 41 }, { value: 42 }] },
  balanceLeft: { value: 38, change: 8, data: [{ value: 28 }, { value: 31 }, { value: 34 }, { value: 36 }, { value: 38 }] },
  balanceRight: { value: 42, change: 12, data: [{ value: 30 }, { value: 34 }, { value: 37 }, { value: 40 }, { value: 42 }] },
  nonHdlCholesterol: { value: 95, change: -5 },
  hrv: { value: 62, change: 10, data: [{ value: 48 }, { value: 52 }, { value: 56 }, { value: 59 }, { value: 62 }] },
  restingHr: { value: 58, change: -5, data: [{ value: 65 }, { value: 63 }, { value: 61 }, { value: 59 }, { value: 58 }] },
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
  depression: { value: 0, change: 0, data: [] as { value: number }[] },
  lifeSatisfaction: { value: 0, change: 0, data: [] as { value: number }[] },
};

const emptyHabitsData = {
  sleep: { value: 0, change: 0, data: [] as { value: number }[] },
  sleepQuality: { value: 0, change: 0 },
  activity: { value: 0, change: 0, data: [] as { value: number }[] },
  screenTime: { value: 0, change: 0 },
  phoneUnlocks: { value: 0, change: 0, data: [] as { value: number }[] },
};

const emptyLongevityData = {
  biologicalAge: { value: 0, change: 0, data: [] as { value: number }[] },
  waistHeightRatio: { value: 0, change: 0 },
  vo2Max: { value: 0, change: 0, data: [] as { value: number }[] },
  gripStrength: { value: 0, change: 0, data: [] as { value: number }[] },
  balanceLeft: { value: 0, change: 0, data: [] as { value: number }[] },
  balanceRight: { value: 0, change: 0, data: [] as { value: number }[] },
  nonHdlCholesterol: { value: 0, change: 0 },
  hrv: { value: 0, change: 0, data: [] as { value: number }[] },
  restingHr: { value: 0, change: 0, data: [] as { value: number }[] },
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

// Helper to get health data value by type (most recent)
function getHealthDataValue(healthData: Array<{ data_type: string; value: number }> | null, dataType: string): number {
  if (!healthData) return 0;
  const entry = healthData.find(h => h.data_type === dataType);
  return entry?.value || 0;
}

// Helper to get health data history for charts with dates
function getHealthDataHistoryWithDates(
  healthData: Array<{ data_type: string; value: number; recorded_at: string }> | null, 
  dataType: string
): DataPointWithDate[] {
  if (!healthData) return [];
  return healthData
    .filter(h => h.data_type === dataType)
    .map(h => ({ value: Number(h.value), date: h.recorded_at }))
    .slice(0, 10)
    .reverse();
}

// Helper to get health data history for charts (simple)
function getHealthDataHistory(healthData: Array<{ data_type: string; value: number }> | null, dataType: string): { value: number }[] {
  if (!healthData) return [];
  return healthData
    .filter(h => h.data_type === dataType)
    .map(h => ({ value: Number(h.value) }))
    .slice(0, 6)
    .reverse();
}

// Helper to calculate change percentage
function calculateChange(data: { value: number }[]): number {
  if (data.length < 2) return 0;
  const first = data[0].value;
  const last = data[data.length - 1].value;
  if (first === 0) return 0;
  return Math.round(((last - first) / Math.abs(first)) * 100);
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
        .limit(100);
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
        .limit(10);
      if (error) throw error;
      return data || [];
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
      hasEnoughDataForAchievements: true,
      testResults: null,
    };
  }

  // Check if user has any real data
  const hasRealData = !!(healthData?.length || biomarkersData?.length || testResults?.length);

  // Build personal data from profile and biomarkers
  const realPersonalData = profileData ? {
    name: profileData.full_name || "",
    age: calculateAge(profileData.date_of_birth),
    sex: profileData.sex || "",
    height: profileData.height || 0,
    weight: profileData.weight || 0,
    waistHeightRatio: profileData.waist_circumference && profileData.height 
      ? Number((profileData.waist_circumference / 100 / profileData.height).toFixed(2))
      : 0,
    biologicalAge: biomarkersData?.[0]?.biological_age || 0,
    vo2Max: getHealthDataValue(healthData, "vo2_max"),
    hba1c: getHealthDataValue(healthData, "hba1c"),
  } : emptyPersonalData;

  // Build psychological data from test results (DASS-21 and SWLS)
  const getDASS21Scores = () => {
    const dassTests = testResults?.filter(t => t.test_id === "dass-21") || [];
    if (dassTests.length === 0) return { depression: 0, anxiety: 0, stress: 0 };
    
    const latest = dassTests[0];
    const scores = latest.scores as Record<string, any>;
    return {
      depression: scores.depression || 0,
      anxiety: scores.anxiety || 0,
      stress: scores.stress || 0,
    };
  };

  const getSWLSScore = () => {
    const swlsTests = testResults?.filter(t => t.test_id === "swls") || [];
    if (swlsTests.length === 0) return 0;
    const scores = swlsTests[0].scores as Record<string, any>;
    return scores.total || 0;
  };

  // Get historical data for psychological metrics
  const getDASS21History = (metric: 'depression' | 'anxiety' | 'stress') => {
    const dassTests = testResults?.filter(t => t.test_id === "dass-21") || [];
    return dassTests.map(t => {
      const scores = t.scores as Record<string, any>;
      return { value: scores[metric] || 0 };
    }).reverse();
  };

  const getSWLSHistory = () => {
    const swlsTests = testResults?.filter(t => t.test_id === "swls") || [];
    return swlsTests.map(t => {
      const scores = t.scores as Record<string, any>;
      return { value: scores.total || 0 };
    }).reverse();
  };

  const dassScores = getDASS21Scores();
  const swlsScore = getSWLSScore();

  const anxietyData = getDASS21History('anxiety');
  const stressData = getDASS21History('stress');
  const depressionData = getDASS21History('depression');
  const swlsData = getSWLSHistory();

  const realPsychologicalData = {
    anxiety: { 
      value: dassScores.anxiety, 
      change: calculateChange(anxietyData), 
      data: anxietyData 
    },
    stress: { 
      value: dassScores.stress, 
      change: calculateChange(stressData), 
      data: stressData 
    },
    depression: { 
      value: dassScores.depression, 
      change: calculateChange(depressionData),
      data: depressionData 
    },
    lifeSatisfaction: { 
      value: swlsScore > 0 ? (swlsScore / 35 * 10) : 0, // Normalize to 0-10 scale
      change: calculateChange(swlsData),
      data: swlsData
    },
  };

  // Build habits data from health_data
  const sleepData = getHealthDataHistory(healthData, "sleep_hours");
  const activityData = getHealthDataHistory(healthData, "activity_hours");
  const phoneUnlocksData = getHealthDataHistory(healthData, "phone_unlocks");

  const realHabitsData = {
    sleep: { 
      value: getHealthDataValue(healthData, "sleep_hours"), 
      change: calculateChange(sleepData), 
      data: sleepData 
    },
    sleepQuality: { value: getHealthDataValue(healthData, "sleep_quality"), change: 0 },
    activity: { 
      value: getHealthDataValue(healthData, "activity_hours"), 
      change: calculateChange(activityData), 
      data: activityData 
    },
    screenTime: { value: getHealthDataValue(healthData, "screen_time"), change: 0 },
    phoneUnlocks: { 
      value: getHealthDataValue(healthData, "phone_unlocks"), 
      change: calculateChange(phoneUnlocksData), 
      data: phoneUnlocksData 
    },
  };

  // Build longevity data from biomarkers and health_data
  const vo2MaxData = getHealthDataHistory(healthData, "vo2_max");
  const gripStrengthData = getHealthDataHistory(healthData, "grip_strength");
  const balanceLeftData = getHealthDataHistory(healthData, "balance_left");
  const balanceRightData = getHealthDataHistory(healthData, "balance_right");
  const hrvData = getHealthDataHistory(healthData, "hrv");
  const restingHrData = getHealthDataHistory(healthData, "resting_heart_rate");

  // Get biological age history from biomarkers
  const bioAgeData = biomarkersData?.map(b => ({ value: Number(b.biological_age) || 0 })).reverse() || [];

  const realLongevityData = {
    biologicalAge: { 
      value: biomarkersData?.[0]?.biological_age || 0, 
      change: calculateChange(bioAgeData),
      data: bioAgeData
    },
    waistHeightRatio: { value: realPersonalData.waistHeightRatio, change: 0 },
    vo2Max: { 
      value: getHealthDataValue(healthData, "vo2_max"), 
      change: calculateChange(vo2MaxData),
      data: vo2MaxData
    },
    gripStrength: { 
      value: getHealthDataValue(healthData, "grip_strength"), 
      change: calculateChange(gripStrengthData),
      data: gripStrengthData
    },
    balanceLeft: { 
      value: getHealthDataValue(healthData, "balance_left"), 
      change: calculateChange(balanceLeftData),
      data: balanceLeftData
    },
    balanceRight: { 
      value: getHealthDataValue(healthData, "balance_right"), 
      change: calculateChange(balanceRightData),
      data: balanceRightData
    },
    nonHdlCholesterol: { value: getHealthDataValue(healthData, "non_hdl_cholesterol"), change: 0 },
    hrv: { 
      value: getHealthDataValue(healthData, "hrv"), 
      change: calculateChange(hrvData),
      data: hrvData
    },
    restingHr: {
      value: getHealthDataValue(healthData, "resting_heart_rate"),
      change: calculateChange(restingHrData),
      data: restingHrData
    },
  };

  // Calculate monthly achievements based on improvements
  const hasEnoughData = (() => {
    if (!healthData?.length && !testResults?.length) return false;
    return (healthData?.length || 0) >= 2 || (testResults?.length || 0) >= 2;
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

    // Sleep improvement
    if (sleepData.length >= 2 && realHabitsData.sleep.change > 0) {
      improvements.push({ 
        id: "sleep", 
        title: "Campeón del Sueño", 
        metric: "Calidad de sueño", 
        improvement: Math.abs(realHabitsData.sleep.change), 
        icon: "trophy" 
      });
    }

    // Activity improvement
    if (activityData.length >= 2 && realHabitsData.activity.change > 0) {
      improvements.push({ 
        id: "activity", 
        title: "Activo Constante", 
        metric: "Actividad física", 
        improvement: realHabitsData.activity.change, 
        icon: "medal" 
      });
    }

    // HRV improvement
    if (hrvData.length >= 2 && realLongevityData.hrv.change > 0) {
      improvements.push({ 
        id: "hrv", 
        title: "Mejor Recuperación", 
        metric: "Variabilidad cardíaca", 
        improvement: realLongevityData.hrv.change, 
        icon: "star" 
      });
    }

    // Anxiety/stress reduction (negative change is good)
    if (anxietyData.length >= 2 && realPsychologicalData.anxiety.change < 0) {
      improvements.push({ 
        id: "stress", 
        title: "Manejo del Estrés", 
        metric: "Reducción de ansiedad", 
        improvement: Math.abs(realPsychologicalData.anxiety.change), 
        icon: "improvement" 
      });
    }

    // Sort by improvement and assign medal types
    improvements.sort((a, b) => b.improvement - a.improvement);
    
    return improvements.slice(0, 4).map((item, index) => ({
      ...item,
      type: (index === 0 ? "gold" : index === 1 ? "silver" : "bronze") as "gold" | "silver" | "bronze",
      isNew: index === 0,
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
    testResults,
  };
}
