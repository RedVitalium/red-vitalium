/**
 * VO2Max Calculator using the Nes et al. (2011) formula
 * Based on age, sex, resting heart rate, and maximum heart rate
 * 
 * Formula: VO2max = 15.3 × (HRmax / HRrest)
 * Alternative (Jackson formula): VO2max = 79.9 - (0.39 × age) - (0.17 × resting HR)
 * 
 * We use a hybrid approach considering age, sex, and heart rate data
 */

export interface VO2MaxInput {
  age: number;
  sex: "male" | "female";
  restingHeartRate: number; // bpm
  maxHeartRate?: number; // bpm (optional - can be estimated from age)
}

export interface VO2MaxResult {
  vo2Max: number;
  rating: "superior" | "excellent" | "good" | "fair" | "poor";
  percentile: number;
  description: string;
}

// Reference tables based on age and sex (ACSM standards)
// Values represent VO2Max ranges for each rating category
const maleVO2MaxRanges: Record<string, { poor: number; fair: number; good: number; excellent: number; superior: number }> = {
  "20-29": { poor: 32, fair: 37, good: 42, excellent: 48, superior: 54 },
  "30-39": { poor: 30, fair: 35, good: 40, excellent: 45, superior: 50 },
  "40-49": { poor: 27, fair: 32, good: 37, excellent: 42, superior: 47 },
  "50-59": { poor: 24, fair: 29, good: 34, excellent: 39, superior: 44 },
  "60-69": { poor: 21, fair: 26, good: 31, excellent: 36, superior: 41 },
  "70+": { poor: 18, fair: 23, good: 28, excellent: 33, superior: 38 },
};

const femaleVO2MaxRanges: Record<string, { poor: number; fair: number; good: number; excellent: number; superior: number }> = {
  "20-29": { poor: 26, fair: 31, good: 36, excellent: 41, superior: 46 },
  "30-39": { poor: 24, fair: 29, good: 34, excellent: 39, superior: 44 },
  "40-49": { poor: 22, fair: 27, good: 32, excellent: 37, superior: 42 },
  "50-59": { poor: 20, fair: 25, good: 30, excellent: 35, superior: 40 },
  "60-69": { poor: 17, fair: 22, good: 27, excellent: 32, superior: 37 },
  "70+": { poor: 15, fair: 20, good: 25, excellent: 30, superior: 35 },
};

function getAgeGroup(age: number): string {
  if (age < 30) return "20-29";
  if (age < 40) return "30-39";
  if (age < 50) return "40-49";
  if (age < 60) return "50-59";
  if (age < 70) return "60-69";
  return "70+";
}

function estimateMaxHeartRate(age: number): number {
  // Fox formula: 220 - age (or more accurate: 208 - 0.7 × age for Tanaka formula)
  return Math.round(208 - 0.7 * age);
}

export function calculateVO2Max(input: VO2MaxInput): VO2MaxResult {
  const { age, sex, restingHeartRate, maxHeartRate } = input;
  
  // Estimate max HR if not provided
  const hrMax = maxHeartRate || estimateMaxHeartRate(age);
  
  // Calculate VO2Max using the Nes formula (ratio-based)
  // VO2max = 15.3 × (HRmax / HRrest)
  const vo2MaxNes = 15.3 * (hrMax / restingHeartRate);
  
  // Also calculate using Jackson formula for comparison
  // VO2max = 79.9 - (0.39 × age) - (0.17 × resting HR)
  const vo2MaxJackson = 79.9 - (0.39 * age) - (0.17 * restingHeartRate);
  
  // Average both methods
  const vo2Max = Math.round((vo2MaxNes + vo2MaxJackson) / 2 * 10) / 10;
  
  // Get reference ranges for rating
  const ageGroup = getAgeGroup(age);
  const ranges = sex === "male" ? maleVO2MaxRanges[ageGroup] : femaleVO2MaxRanges[ageGroup];
  
  // Determine rating
  let rating: VO2MaxResult["rating"];
  let percentile: number;
  let description: string;
  
  if (vo2Max >= ranges.superior) {
    rating = "superior";
    percentile = 95;
    description = "Capacidad aeróbica excepcional - Nivel de atleta élite";
  } else if (vo2Max >= ranges.excellent) {
    rating = "excellent";
    percentile = 80;
    description = "Excelente capacidad aeróbica - Por encima del promedio";
  } else if (vo2Max >= ranges.good) {
    rating = "good";
    percentile = 60;
    description = "Buena capacidad aeróbica - Dentro del rango saludable";
  } else if (vo2Max >= ranges.fair) {
    rating = "fair";
    percentile = 40;
    description = "Capacidad aeróbica moderada - Hay margen de mejora";
  } else {
    rating = "poor";
    percentile = 20;
    description = "Capacidad aeróbica baja - Recomendado aumentar actividad";
  }
  
  return {
    vo2Max,
    rating,
    percentile,
    description,
  };
}

/**
 * Get the reference range for a given age and sex
 */
export function getVO2MaxReferenceRange(age: number, sex: "male" | "female"): {
  poor: number;
  fair: number;
  good: number;
  excellent: number;
  superior: number;
} {
  const ageGroup = getAgeGroup(age);
  return sex === "male" ? maleVO2MaxRanges[ageGroup] : femaleVO2MaxRanges[ageGroup];
}

/**
 * Get the optimal target VO2Max for a given age and sex
 */
export function getOptimalVO2Max(age: number, sex: "male" | "female"): number {
  const ranges = getVO2MaxReferenceRange(age, sex);
  return ranges.excellent;
}
