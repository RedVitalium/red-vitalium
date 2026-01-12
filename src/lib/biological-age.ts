/**
 * Biological Age Calculator based on Phenotypic Age (Levine et al.)
 * 
 * This algorithm uses blood biomarkers to estimate biological age,
 * which may differ from chronological age based on health status.
 * 
 * Reference: Levine ME, et al. (2018). "An epigenetic biomarker of aging for lifespan and healthspan"
 */

export interface BloodBiomarkers {
  // Required for phenotypic age calculation
  albumin: number;              // g/dL
  creatinine: number;           // mg/dL
  glucose: number;              // mg/dL
  crp: number;                  // mg/L (C-reactive protein)
  lymphocytePercent: number;    // %
  mcv: number;                  // fL (Mean Corpuscular Volume)
  rdw: number;                  // % (Red cell Distribution Width)
  alkalinePhosphatase: number;  // IU/L
  whiteBloodCellCount: number;  // x10^3 cells/µL
  chronologicalAge: number;     // years
}

export interface BiologicalAgeResult {
  phenotypicAge: number;
  ageDifference: number;  // Positive = biologically older, Negative = biologically younger
  healthStatus: 'excellent' | 'good' | 'average' | 'concern';
  interpretation: string;
}

// Constants from Levine's phenotypic age formula
const COEFFICIENTS = {
  b0: -19.9067,
  albumin: -0.0336,      // per g/L
  creatinine: 0.0095,    // per µmol/L
  glucose: 0.1953,       // per mmol/L
  crp: 0.0954,           // per log(mg/dL)
  lymphocytePercent: -0.0120,
  mcv: 0.0268,
  rdw: 0.3306,
  alkalinePhosphatase: 0.00188,
  whiteBloodCellCount: 0.0554,
  chronologicalAge: 0.0804
};

const MORTALITY_CONSTANTS = {
  gamma: -1.51714,
  lambda: 0.0076927,
  alpha: 141.50225,
  beta: -0.00553
};

/**
 * Converts biomarkers from clinical units to formula units
 */
function convertUnits(biomarkers: BloodBiomarkers) {
  return {
    albumin_gL: biomarkers.albumin * 10,           // g/dL to g/L
    creatinine_umolL: biomarkers.creatinine * 88.401, // mg/dL to µmol/L
    glucose_mmolL: biomarkers.glucose * 0.0555,    // mg/dL to mmol/L
    crp_mgdL: biomarkers.crp * 0.1,                // mg/L to mg/dL (for log)
    lymphocytePercent: biomarkers.lymphocytePercent,
    mcv: biomarkers.mcv,
    rdw: biomarkers.rdw,
    alkalinePhosphatase: biomarkers.alkalinePhosphatase,
    whiteBloodCellCount: biomarkers.whiteBloodCellCount,
    chronologicalAge: biomarkers.chronologicalAge
  };
}

/**
 * Calculates xb (linear combination of biomarkers)
 */
function calculateXb(converted: ReturnType<typeof convertUnits>): number {
  return (
    COEFFICIENTS.b0 +
    (COEFFICIENTS.albumin * converted.albumin_gL) +
    (COEFFICIENTS.creatinine * converted.creatinine_umolL) +
    (COEFFICIENTS.glucose * converted.glucose_mmolL) +
    (COEFFICIENTS.crp * Math.log(converted.crp_mgdL)) +
    (COEFFICIENTS.lymphocytePercent * converted.lymphocytePercent) +
    (COEFFICIENTS.mcv * converted.mcv) +
    (COEFFICIENTS.rdw * converted.rdw) +
    (COEFFICIENTS.alkalinePhosphatase * converted.alkalinePhosphatase) +
    (COEFFICIENTS.whiteBloodCellCount * converted.whiteBloodCellCount) +
    (COEFFICIENTS.chronologicalAge * converted.chronologicalAge)
  );
}

/**
 * Calculates mortality score M
 */
function calculateMortalityScore(xb: number): number {
  return 1 - Math.exp((MORTALITY_CONSTANTS.gamma * Math.exp(xb)) / MORTALITY_CONSTANTS.lambda);
}

/**
 * Main function to calculate Phenotypic (Biological) Age
 */
export function calculateBiologicalAge(biomarkers: BloodBiomarkers): BiologicalAgeResult {
  const converted = convertUnits(biomarkers);
  const xb = calculateXb(converted);
  const M = calculateMortalityScore(xb);
  
  // Phenotypic Age calculation
  const phenotypicAge = MORTALITY_CONSTANTS.alpha + 
    (Math.log(MORTALITY_CONSTANTS.beta * Math.log(1 - M)) / 0.09165);
  
  const ageDifference = phenotypicAge - biomarkers.chronologicalAge;
  
  // Determine health status
  let healthStatus: BiologicalAgeResult['healthStatus'];
  let interpretation: string;
  
  if (ageDifference <= -5) {
    healthStatus = 'excellent';
    interpretation = `Tu edad biológica es ${Math.abs(ageDifference).toFixed(1)} años menor que tu edad cronológica. ¡Excelente estado de salud!`;
  } else if (ageDifference <= 0) {
    healthStatus = 'good';
    interpretation = `Tu edad biológica es ${Math.abs(ageDifference).toFixed(1)} años menor que tu edad cronológica. Buen estado de salud.`;
  } else if (ageDifference <= 5) {
    healthStatus = 'average';
    interpretation = `Tu edad biológica es ${ageDifference.toFixed(1)} años mayor que tu edad cronológica. Hay margen de mejora.`;
  } else {
    healthStatus = 'concern';
    interpretation = `Tu edad biológica es ${ageDifference.toFixed(1)} años mayor que tu edad cronológica. Se recomienda consultar con un especialista.`;
  }
  
  return {
    phenotypicAge: Math.round(phenotypicAge * 10) / 10,
    ageDifference: Math.round(ageDifference * 10) / 10,
    healthStatus,
    interpretation
  };
}

/**
 * Reference ranges for blood biomarkers (for validation and display)
 */
export const biomarkerReferenceRanges = {
  albumin: { min: 3.5, max: 5.0, unit: 'g/dL', name: 'Albúmina' },
  creatinine: { min: 0.6, max: 1.2, unit: 'mg/dL', name: 'Creatinina' },
  glucose: { min: 70, max: 100, unit: 'mg/dL', name: 'Glucosa' },
  crp: { min: 0, max: 3.0, unit: 'mg/L', name: 'Proteína C-Reactiva' },
  lymphocytePercent: { min: 20, max: 40, unit: '%', name: 'Linfocitos' },
  mcv: { min: 80, max: 100, unit: 'fL', name: 'VCM' },
  rdw: { min: 11.5, max: 14.5, unit: '%', name: 'ADE' },
  alkalinePhosphatase: { min: 44, max: 147, unit: 'IU/L', name: 'Fosfatasa Alcalina' },
  whiteBloodCellCount: { min: 4.5, max: 11.0, unit: 'x10³/µL', name: 'Leucocitos' }
};

/**
 * Validates biomarker values are within reasonable bounds
 */
export function validateBiomarkers(biomarkers: Partial<BloodBiomarkers>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  Object.entries(biomarkers).forEach(([key, value]) => {
    if (key === 'chronologicalAge') {
      if (value !== undefined && (value < 18 || value > 120)) {
        errors.push('La edad debe estar entre 18 y 120 años');
      }
      return;
    }
    
    const range = biomarkerReferenceRanges[key as keyof typeof biomarkerReferenceRanges];
    if (range && value !== undefined) {
      // Allow values up to 3x the normal range for clinical cases
      if (value < range.min * 0.3 || value > range.max * 3) {
        errors.push(`${range.name} fuera del rango esperado`);
      }
    }
  });
  
  return { valid: errors.length === 0, errors };
}
