export interface FullBodyCompositionData {
  // Core
  weight: number;
  bodyFatPercent: number;
  bodyType: string;
  visceralFat: number;
  bodyWaterPercent: number;
  muscleMass: number; // kg
  boneMass: number; // kg
  bmi: number;
  metabolicAge: number;
  bmr: number;
  fatFreeMass: number; // kg
  subcutaneousFat: number; // %
  protein: number; // %
  bodyAge: number;
  skeletalMuscle: number; // kg
  smi: number;
  waistHipRatio: number;
  // Extended (from expanded OCR)
  muscleMassPercent: number;
  boneMassPercent: number;
  bodyWaterLiters: number;
  proteinKg: number;
  bodyFatMassKg: number;
  obesityPercent: number;
  subcutaneousFatKg: number;
  skeletalMusclePercent: number;
  normalWeightKg: number;
  weightControlKg: number;
  fatMassControlKg: number;
  muscleControlKg: number;
  healthAssessment: number;
}

export interface SegmentalData {
  segment: string; // left_upper, right_upper, trunk, left_lower, right_lower
  analysisType: string; // muscle or fat
  massKg: number;
  comparedToNormal: number; // % vs normal
  bodyPercentage: number; // % of body
  status: string; // Normal, High, Low
}

export const DEMO_DATA_MALE_45: FullBodyCompositionData = {
  weight: 82,
  bodyFatPercent: 25.2,
  bodyType: "Grasa Oculta",
  visceralFat: 10,
  bodyWaterPercent: 52.8,
  muscleMass: 34.6,
  boneMass: 3.1,
  bmi: 26.5,
  metabolicAge: 47,
  bmr: 1650,
  fatFreeMass: 61.3,
  subcutaneousFat: 20.1,
  protein: 16.8,
  bodyAge: 47,
  skeletalMuscle: 28.5,
  smi: 7.8,
  waistHipRatio: 0.92,
  muscleMassPercent: 72.5,
  boneMassPercent: 3.8,
  bodyWaterLiters: 43.3,
  proteinKg: 13.8,
  bodyFatMassKg: 20.7,
  obesityPercent: 125,
  subcutaneousFatKg: 16.5,
  skeletalMusclePercent: 48,
  normalWeightKg: 74.0,
  weightControlKg: -8.0,
  fatMassControlKg: -8.0,
  muscleControlKg: 0,
  healthAssessment: 72.5,
};

export const DEMO_SEGMENTAL: SegmentalData[] = [
  { segment: "left_upper", analysisType: "muscle", massKg: 3.0, comparedToNormal: 92, bodyPercentage: 3.7, status: "Normal" },
  { segment: "right_upper", analysisType: "muscle", massKg: 3.1, comparedToNormal: 94, bodyPercentage: 3.8, status: "Normal" },
  { segment: "trunk", analysisType: "muscle", massKg: 25.0, comparedToNormal: 90, bodyPercentage: 30.5, status: "Normal" },
  { segment: "left_lower", analysisType: "muscle", massKg: 9.5, comparedToNormal: 95, bodyPercentage: 11.6, status: "Normal" },
  { segment: "right_lower", analysisType: "muscle", massKg: 9.6, comparedToNormal: 96, bodyPercentage: 11.7, status: "Normal" },
  { segment: "left_upper", analysisType: "fat", massKg: 1.2, comparedToNormal: 160, bodyPercentage: 1.5, status: "High" },
  { segment: "right_upper", analysisType: "fat", massKg: 1.2, comparedToNormal: 162, bodyPercentage: 1.5, status: "High" },
  { segment: "trunk", analysisType: "fat", massKg: 10.5, comparedToNormal: 200, bodyPercentage: 12.8, status: "High" },
  { segment: "left_lower", analysisType: "fat", massKg: 3.0, comparedToNormal: 140, bodyPercentage: 3.7, status: "Normal" },
  { segment: "right_lower", analysisType: "fat", massKg: 3.1, comparedToNormal: 142, bodyPercentage: 3.8, status: "Normal" },
];
