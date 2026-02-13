export interface FullBodyCompositionData {
  weight: number;
  bodyFatPercent: number;
  bodyType: string;
  visceralFat: number;
  bodyWaterPercent: number;
  muscleMass: number;
  boneMass: number;
  bmi: number;
  metabolicAge: number;
  bmr: number;
  fatFreeMass: number;
  subcutaneousFat: number;
  protein: number;
  bodyAge: number;
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
};
