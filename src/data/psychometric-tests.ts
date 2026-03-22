// DASS-21 Complete Questions with Scoring
// Subscales: Depression (D), Anxiety (A), Stress (S)
// Each subscale score is multiplied by 2 for final score

export const dass21Questions = [
  { id: 1, text: "Durante la última semana, me costó mucho relajarme", subscale: "S" },
  { id: 2, text: "Durante la última semana, me di cuenta que tenía la boca seca", subscale: "A" },
  { id: 3, text: "Durante la última semana, no podía sentir ningún sentimiento positivo", subscale: "D" },
  { id: 4, text: "Durante la última semana, se me hizo difícil respirar (respirar rápido, sin hacer ejercicio)", subscale: "A" },
  { id: 5, text: "Durante la última semana, se me hizo difícil tomar la iniciativa para hacer cosas", subscale: "D" },
  { id: 6, text: "Durante la última semana, reaccioné exageradamente en ciertas situaciones", subscale: "S" },
  { id: 7, text: "Durante la última semana, sentí que mis manos temblaban", subscale: "A" },
  { id: 8, text: "Durante la última semana, sentí que tenía muchos nervios", subscale: "S" },
  { id: 9, text: "Durante la última semana, estaba preocupado por situaciones en las cuales podía tener pánico o en las que podría hacer el ridículo", subscale: "A" },
  { id: 10, text: "Durante la última semana, sentí que no tenía nada por lo que vivir", subscale: "D" },
  { id: 11, text: "Durante la última semana, noté que me agitaba fácilmente", subscale: "S" },
  { id: 12, text: "Durante la última semana, se me hizo difícil relajarme", subscale: "S" },
  { id: 13, text: "Durante la última semana, me sentí triste y deprimido", subscale: "D" },
  { id: 14, text: "Durante la última semana, no toleré nada que me impidiera seguir con lo que estaba haciendo", subscale: "S" },
  { id: 15, text: "Durante la última semana, sentí que estaba a punto de entrar en pánico", subscale: "A" },
  { id: 16, text: "Durante la última semana, no me pude entusiasmar por nada", subscale: "D" },
  { id: 17, text: "Durante la última semana, sentí que valía muy poco como persona", subscale: "D" },
  { id: 18, text: "Durante la última semana, sentí que estaba muy irritable", subscale: "S" },
  { id: 19, text: "Durante la última semana, sentí los latidos de mi corazón a pesar de no haber hecho ningún esfuerzo físico", subscale: "A" },
  { id: 20, text: "Durante la última semana, tuve miedo sin razón", subscale: "A" },
  { id: 21, text: "Durante la última semana, sentí que la vida no tenía ningún sentido", subscale: "D" },
];

// BFI-10 (Big Five Inventory - 10 items)
export const bfi10Questions = [
  { id: 1, text: "Es reservado/a", trait: "E", reversed: true },
  { id: 2, text: "Generalmente es confiado", trait: "A", reversed: false },
  { id: 3, text: "Tiende a ser perezoso/a", trait: "C", reversed: true },
  { id: 4, text: "Es relajado/a, maneja bien el estrés", trait: "N", reversed: true },
  { id: 5, text: "Tiene pocos intereses artísticos", trait: "O", reversed: true },
  { id: 6, text: "Es extrovertido/a, sociable", trait: "E", reversed: false },
  { id: 7, text: "Tiende a encontrar defectos en los demás", trait: "A", reversed: true },
  { id: 8, text: "Hace un trabajo minucioso", trait: "C", reversed: false },
  { id: 9, text: "Se pone nervioso/a fácilmente", trait: "N", reversed: false },
  { id: 10, text: "Tiene una imaginación activa", trait: "O", reversed: false },
];

// SWLS (Satisfaction With Life Scale)
export const swlsQuestions = [
  { id: 1, text: "En la mayoría de los aspectos mi vida es como quiero que sea" },
  { id: 2, text: "Las circunstancias de mi vida son muy buenas" },
  { id: 3, text: "Estoy satisfecho/a con mi vida" },
  { id: 4, text: "Hasta ahora he conseguido las cosas que para mí son importantes en la vida" },
  { id: 5, text: "Si pudiera vivir mi vida otra vez, no cambiaría casi nada" },
];

// Scoring functions
export function calculateDASS21Scores(answers: Record<number, number>): {
  depression: number;
  anxiety: number;
  stress: number;
  interpretations: {
    depression: string;
    anxiety: string;
    stress: string;
  };
} {
  let depression = 0;
  let anxiety = 0;
  let stress = 0;

  dass21Questions.forEach((q, index) => {
    const answer = answers[index] || 0;
    switch (q.subscale) {
      case "D":
        depression += answer;
        break;
      case "A":
        anxiety += answer;
        break;
      case "S":
        stress += answer;
        break;
    }
  });

  // Multiply by 2 as per DASS-21 scoring guidelines
  depression *= 2;
  anxiety *= 2;
  stress *= 2;

  return {
    depression,
    anxiety,
    stress,
    interpretations: {
      depression: interpretDepressionScore(depression),
      anxiety: interpretAnxietyScore(anxiety),
      stress: interpretStressScore(stress),
    },
  };
}

function interpretDepressionScore(score: number): string {
  if (score <= 9) return "Normal";
  if (score <= 13) return "Leve";
  if (score <= 20) return "Moderado";
  if (score <= 27) return "Severo";
  return "Extremadamente severo";
}

function interpretAnxietyScore(score: number): string {
  if (score <= 7) return "Normal";
  if (score <= 9) return "Leve";
  if (score <= 14) return "Moderado";
  if (score <= 19) return "Severo";
  return "Extremadamente severo";
}

function interpretStressScore(score: number): string {
  if (score <= 14) return "Normal";
  if (score <= 18) return "Leve";
  if (score <= 25) return "Moderado";
  if (score <= 33) return "Severo";
  return "Extremadamente severo";
}

export function calculateSWLSScore(answers: Record<number, number>): {
  total: number;
  interpretation: string;
} {
  let total = 0;
  swlsQuestions.forEach((_, index) => {
    total += (answers[index] || 1);
  });

  return {
    total,
    interpretation: interpretSWLSScore(total),
  };
}

function interpretSWLSScore(score: number): string {
  if (score >= 31) return "Extremadamente satisfecho";
  if (score >= 26) return "Satisfecho";
  if (score >= 21) return "Ligeramente satisfecho";
  if (score === 20) return "Neutral";
  if (score >= 15) return "Ligeramente insatisfecho";
  if (score >= 10) return "Insatisfecho";
  return "Extremadamente insatisfecho";
}

export function calculateBFI10Scores(answers: Record<number, number>): {
  extraversion: number;
  agreeableness: number;
  conscientiousness: number;
  neuroticism: number;
  openness: number;
} {
  const getScore = (index: number, reversed: boolean) => {
    const answer = answers[index] || 3;
    return reversed ? 6 - answer : answer;
  };

  return {
    extraversion: (getScore(0, true) + getScore(5, false)) / 2,
    agreeableness: (getScore(1, false) + getScore(6, true)) / 2,
    conscientiousness: (getScore(2, true) + getScore(7, false)) / 2,
    neuroticism: (getScore(3, true) + getScore(8, false)) / 2,
    openness: (getScore(4, true) + getScore(9, false)) / 2,
  };
}

// Test frequency restrictions (in days)
export const testFrequencyLimits = {
  "dass-21": 30, // Once per month
  "bfi-10": 170, // Only at program start (T0) and end (T3, month 6)
  "swls": 90, // Every 3 months
};

// Reference values by age and sex for biomarkers
export const biomarkerReferences = {
  sleep: {
    male: {
      "18-25": { min: 7, optimal: 8, max: 9 },
      "26-40": { min: 7, optimal: 7.5, max: 8.5 },
      "41-55": { min: 6.5, optimal: 7, max: 8 },
      "56-70": { min: 6, optimal: 7, max: 8 },
      "71+": { min: 6, optimal: 7, max: 8 },
    },
    female: {
      "18-25": { min: 7, optimal: 8.5, max: 9.5 },
      "26-40": { min: 7, optimal: 8, max: 9 },
      "41-55": { min: 6.5, optimal: 7.5, max: 8.5 },
      "56-70": { min: 6, optimal: 7, max: 8 },
      "71+": { min: 6, optimal: 7, max: 8 },
    },
  },
  vo2max: {
    male: {
      "18-25": { poor: 35, fair: 42, good: 48, excellent: 55 },
      "26-35": { poor: 33, fair: 40, good: 46, excellent: 52 },
      "36-45": { poor: 31, fair: 38, good: 44, excellent: 50 },
      "46-55": { poor: 28, fair: 35, good: 41, excellent: 47 },
      "56-65": { poor: 25, fair: 32, good: 38, excellent: 44 },
      "65+": { poor: 22, fair: 28, good: 34, excellent: 40 },
    },
    female: {
      "18-25": { poor: 28, fair: 34, good: 40, excellent: 46 },
      "26-35": { poor: 26, fair: 32, good: 38, excellent: 44 },
      "36-45": { poor: 24, fair: 30, good: 36, excellent: 42 },
      "46-55": { poor: 22, fair: 28, good: 34, excellent: 40 },
      "56-65": { poor: 20, fair: 26, good: 32, excellent: 38 },
      "65+": { poor: 18, fair: 24, good: 30, excellent: 36 },
    },
  },
  gripStrength: {
    male: {
      "20-29": { low: 36, normal: 45, high: 55 },
      "30-39": { low: 35, normal: 45, high: 55 },
      "40-49": { low: 34, normal: 43, high: 53 },
      "50-59": { low: 31, normal: 40, high: 49 },
      "60-69": { low: 28, normal: 36, high: 44 },
      "70+": { low: 24, normal: 31, high: 38 },
    },
    female: {
      "20-29": { low: 22, normal: 28, high: 35 },
      "30-39": { low: 22, normal: 28, high: 35 },
      "40-49": { low: 21, normal: 27, high: 33 },
      "50-59": { low: 19, normal: 24, high: 30 },
      "60-69": { low: 17, normal: 22, high: 27 },
      "70+": { low: 14, normal: 19, high: 23 },
    },
  },
  legBalance: {
    // One-leg balance in seconds
    male: {
      "20-29": { poor: 20, fair: 35, good: 50, excellent: 60 },
      "30-39": { poor: 18, fair: 30, good: 45, excellent: 55 },
      "40-49": { poor: 15, fair: 25, good: 40, excellent: 50 },
      "50-59": { poor: 12, fair: 20, good: 30, excellent: 40 },
      "60-69": { poor: 8, fair: 15, good: 25, excellent: 35 },
      "70+": { poor: 5, fair: 10, good: 18, excellent: 28 },
    },
    female: {
      "20-29": { poor: 18, fair: 32, good: 48, excellent: 58 },
      "30-39": { poor: 16, fair: 28, good: 42, excellent: 52 },
      "40-49": { poor: 13, fair: 23, good: 38, excellent: 48 },
      "50-59": { poor: 10, fair: 18, good: 28, excellent: 38 },
      "60-69": { poor: 6, fair: 13, good: 22, excellent: 32 },
      "70+": { poor: 4, fair: 8, good: 15, excellent: 25 },
    },
  },
};
