/**
 * Health Reference Values and Traffic Light Logic
 * Based on clinical standards and age/sex-adjusted norms
 */

export type StatusLevel = "optimal" | "warning" | "danger" | "neutral";

export interface ReferenceRange {
  optimalMin?: number;
  optimalMax?: number;
  warningMin?: number;
  warningMax?: number;
  unit: string;
  isLowerBetter?: boolean;
}

// Reference ranges by age group
export interface AgeAdjustedRanges {
  [ageGroup: string]: {
    male: ReferenceRange;
    female: ReferenceRange;
  };
}

// Balance reference values (seconds) by age
// Based on clinical studies - eyes closed, single leg stance
const balanceRanges: AgeAdjustedRanges = {
  "20-29": { male: { optimalMin: 30, warningMin: 20, unit: "seg" }, female: { optimalMin: 30, warningMin: 20, unit: "seg" } },
  "30-39": { male: { optimalMin: 28, warningMin: 18, unit: "seg" }, female: { optimalMin: 28, warningMin: 18, unit: "seg" } },
  "40-49": { male: { optimalMin: 25, warningMin: 15, unit: "seg" }, female: { optimalMin: 25, warningMin: 15, unit: "seg" } },
  "50-59": { male: { optimalMin: 20, warningMin: 12, unit: "seg" }, female: { optimalMin: 20, warningMin: 12, unit: "seg" } },
  "60-69": { male: { optimalMin: 15, warningMin: 8, unit: "seg" }, female: { optimalMin: 15, warningMin: 8, unit: "seg" } },
  "70+": { male: { optimalMin: 10, warningMin: 5, unit: "seg" }, female: { optimalMin: 10, warningMin: 5, unit: "seg" } },
};

// Grip strength reference values (kg) by age and sex
// Based on normative data from population studies
const gripStrengthRanges: AgeAdjustedRanges = {
  "20-29": { male: { optimalMin: 47, warningMin: 40, unit: "kg" }, female: { optimalMin: 29, warningMin: 24, unit: "kg" } },
  "30-39": { male: { optimalMin: 47, warningMin: 40, unit: "kg" }, female: { optimalMin: 29, warningMin: 24, unit: "kg" } },
  "40-49": { male: { optimalMin: 44, warningMin: 36, unit: "kg" }, female: { optimalMin: 27, warningMin: 22, unit: "kg" } },
  "50-59": { male: { optimalMin: 40, warningMin: 32, unit: "kg" }, female: { optimalMin: 25, warningMin: 20, unit: "kg" } },
  "60-69": { male: { optimalMin: 35, warningMin: 28, unit: "kg" }, female: { optimalMin: 22, warningMin: 17, unit: "kg" } },
  "70+": { male: { optimalMin: 30, warningMin: 22, unit: "kg" }, female: { optimalMin: 18, warningMin: 14, unit: "kg" } },
};

// HRV reference values (ms RMSSD) by age
const hrvRanges: AgeAdjustedRanges = {
  "20-29": { male: { optimalMin: 45, warningMin: 30, unit: "ms" }, female: { optimalMin: 50, warningMin: 35, unit: "ms" } },
  "30-39": { male: { optimalMin: 40, warningMin: 25, unit: "ms" }, female: { optimalMin: 45, warningMin: 30, unit: "ms" } },
  "40-49": { male: { optimalMin: 35, warningMin: 20, unit: "ms" }, female: { optimalMin: 40, warningMin: 25, unit: "ms" } },
  "50-59": { male: { optimalMin: 30, warningMin: 18, unit: "ms" }, female: { optimalMin: 35, warningMin: 22, unit: "ms" } },
  "60-69": { male: { optimalMin: 25, warningMin: 15, unit: "ms" }, female: { optimalMin: 30, warningMin: 18, unit: "ms" } },
  "70+": { male: { optimalMin: 20, warningMin: 12, unit: "ms" }, female: { optimalMin: 25, warningMin: 15, unit: "ms" } },
};

// Resting Heart Rate reference values (bpm)
const restingHRRanges: AgeAdjustedRanges = {
  "20-29": { male: { optimalMax: 60, warningMax: 75, unit: "bpm", isLowerBetter: true }, female: { optimalMax: 65, warningMax: 78, unit: "bpm", isLowerBetter: true } },
  "30-39": { male: { optimalMax: 62, warningMax: 77, unit: "bpm", isLowerBetter: true }, female: { optimalMax: 67, warningMax: 80, unit: "bpm", isLowerBetter: true } },
  "40-49": { male: { optimalMax: 64, warningMax: 79, unit: "bpm", isLowerBetter: true }, female: { optimalMax: 69, warningMax: 82, unit: "bpm", isLowerBetter: true } },
  "50-59": { male: { optimalMax: 66, warningMax: 81, unit: "bpm", isLowerBetter: true }, female: { optimalMax: 71, warningMax: 84, unit: "bpm", isLowerBetter: true } },
  "60-69": { male: { optimalMax: 68, warningMax: 83, unit: "bpm", isLowerBetter: true }, female: { optimalMax: 73, warningMax: 86, unit: "bpm", isLowerBetter: true } },
  "70+": { male: { optimalMax: 70, warningMax: 85, unit: "bpm", isLowerBetter: true }, female: { optimalMax: 75, warningMax: 88, unit: "bpm", isLowerBetter: true } },
};

function getAgeGroup(age: number): string {
  if (age < 30) return "20-29";
  if (age < 40) return "30-39";
  if (age < 50) return "40-49";
  if (age < 60) return "50-59";
  if (age < 70) return "60-69";
  return "70+";
}

/**
 * Get the traffic light status for a health metric
 */
export function getMetricStatus(
  value: number,
  metricType: "balance" | "gripStrength" | "hrv" | "restingHR" | "vo2Max" | "waistHeight" | "sleep" | "activity",
  age: number = 40,
  sex: "male" | "female" = "male"
): StatusLevel {
  if (value === 0) return "neutral";

  const ageGroup = getAgeGroup(age);

  switch (metricType) {
    case "balance": {
      const range = balanceRanges[ageGroup][sex];
      if (value >= (range.optimalMin || 0)) return "optimal";
      if (value >= (range.warningMin || 0)) return "warning";
      return "danger";
    }
    case "gripStrength": {
      const range = gripStrengthRanges[ageGroup][sex];
      if (value >= (range.optimalMin || 0)) return "optimal";
      if (value >= (range.warningMin || 0)) return "warning";
      return "danger";
    }
    case "hrv": {
      const range = hrvRanges[ageGroup][sex];
      if (value >= (range.optimalMin || 0)) return "optimal";
      if (value >= (range.warningMin || 0)) return "warning";
      return "danger";
    }
    case "restingHR": {
      const range = restingHRRanges[ageGroup][sex];
      if (value <= (range.optimalMax || 100)) return "optimal";
      if (value <= (range.warningMax || 100)) return "warning";
      return "danger";
    }
    case "vo2Max": {
      // VO2Max uses its own reference tables in vo2max-calculator.ts
      // Simplified thresholds here
      const optimalThreshold = sex === "male" ? (45 - (age - 30) * 0.3) : (38 - (age - 30) * 0.3);
      const warningThreshold = optimalThreshold * 0.8;
      if (value >= optimalThreshold) return "optimal";
      if (value >= warningThreshold) return "warning";
      return "danger";
    }
    case "waistHeight": {
      if (value <= 0.5) return "optimal";
      if (value <= 0.55) return "warning";
      return "danger";
    }
    case "sleep": {
      if (value >= 7.5) return "optimal";
      if (value >= 6) return "warning";
      return "danger";
    }
    case "activity": {
      if (value >= 5) return "optimal";
      if (value >= 2.5) return "warning";
      return "danger";
    }
    default:
      return "neutral";
  }
}

/**
 * Get reference range for display
 */
export function getReferenceRange(
  metricType: "balance" | "gripStrength" | "hrv" | "restingHR",
  age: number,
  sex: "male" | "female"
): { optimal: string; warning: string; danger: string } {
  const ageGroup = getAgeGroup(age);

  let ranges: AgeAdjustedRanges;
  switch (metricType) {
    case "balance":
      ranges = balanceRanges;
      break;
    case "gripStrength":
      ranges = gripStrengthRanges;
      break;
    case "hrv":
      ranges = hrvRanges;
      break;
    case "restingHR":
      ranges = restingHRRanges;
      break;
  }

  const range = ranges[ageGroup][sex];

  if (range.isLowerBetter) {
    return {
      optimal: `≤ ${range.optimalMax} ${range.unit}`,
      warning: `${range.optimalMax}-${range.warningMax} ${range.unit}`,
      danger: `> ${range.warningMax} ${range.unit}`,
    };
  }

  return {
    optimal: `≥ ${range.optimalMin} ${range.unit}`,
    warning: `${range.warningMin}-${range.optimalMin} ${range.unit}`,
    danger: `< ${range.warningMin} ${range.unit}`,
  };
}

/**
 * Calculate improvement percentage and difference
 */
export function calculateImprovement(
  currentValue: number,
  previousValue: number,
  isLowerBetter: boolean = false
): { percentage: number; difference: number; improved: boolean } {
  if (previousValue === 0) {
    return { percentage: 0, difference: 0, improved: false };
  }

  const difference = currentValue - previousValue;
  const percentage = Math.round((difference / previousValue) * 100 * 10) / 10;
  const improved = isLowerBetter ? difference < 0 : difference > 0;

  return {
    percentage: Math.abs(percentage),
    difference,
    improved,
  };
}
