import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function addIfValid(obj: Record<string, any>, key: string, value: any) {
  if (value !== null && value !== undefined && value !== 0 && value !== "") {
    obj[key] = value;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Not authenticated");

    const { section, healthData: clientHealthData, targetUserId } = await req.json();
    const dataUserId = targetUserId || user.id;

    // === FETCH ALL DATA SERVER-SIDE ===
    const isClinicalSection = section.startsWith("clinical-") && section !== "clinical-unified";
    
    const isClinicalUnified = section === "clinical-unified";
    
    const fetchPromises: Promise<any>[] = [
      supabase.from("profiles").select("*").eq("user_id", dataUserId).maybeSingle().then((r: any) => r),
      supabase.from("health_data").select("*").eq("user_id", dataUserId).order("recorded_at", { ascending: false }).limit(200).then((r: any) => r),
      supabase.from("biomarkers").select("*").eq("user_id", dataUserId).order("recorded_at", { ascending: false }).limit(10).then((r: any) => r),
      supabase.from("test_results").select("*").eq("user_id", dataUserId).order("completed_at", { ascending: false }).limit(20).then((r: any) => r),
      supabase.from("body_composition").select("*").eq("user_id", dataUserId).order("recorded_at", { ascending: false }).limit(10).then((r: any) => r),
      // New: medications, daily survey, cycles (indices 5, 6, 7)
      supabase.from("patient_medications").select("*").eq("user_id", dataUserId).eq("is_active", true).order("created_at", { ascending: false }).then((r: any) => r),
      supabase.from("daily_survey_responses").select("*, daily_survey_questions(question_text, habit_category)").eq("user_id", dataUserId).order("response_date", { ascending: false }).limit(90).then((r: any) => r),
      supabase.from("user_cycles").select("*").eq("user_id", dataUserId).order("started_at", { ascending: false }).limit(5).then((r: any) => r),
    ];
    
    // For clinical sections, also fetch professional notes and subscription
    if (isClinicalSection || isClinicalUnified) {
      fetchPromises.push(
        supabase.from("professional_notes").select("*").eq("patient_id", dataUserId).order("created_at", { ascending: false }).limit(50).then((r: any) => r)
      );
      fetchPromises.push(
        supabase.from("habit_goals").select("*").eq("user_id", dataUserId).order("created_at", { ascending: false }).limit(20).then((r: any) => r)
      );
      fetchPromises.push(
        supabase.from("unlocked_habits").select("*").eq("user_id", dataUserId).then((r: any) => r)
      );
      fetchPromises.push(
        supabase.from("user_subscriptions").select("*").eq("user_id", dataUserId).eq("is_active", true).maybeSingle().then((r: any) => r)
      );
    }
    
    const results = await Promise.all(fetchPromises);
    const [profileRes, healthRes, biomarkersRes, testResultsRes, bodyCompRes] = results;

    const profile = profileRes.data;
    const healthData = healthRes.data || [];
    const biomarkers = biomarkersRes.data || [];
    const testResults = testResultsRes.data || [];
    const bodyComp = bodyCompRes.data || [];
    const professionalNotes = (isClinicalSection || isClinicalUnified) ? (results[5]?.data || []) : [];
    const habitGoals = (isClinicalSection || isClinicalUnified) ? (results[6]?.data || []) : [];
    const unlockedHabits = (isClinicalSection || isClinicalUnified) ? (results[7]?.data || []) : [];
    const subscription = (isClinicalSection || isClinicalUnified) ? (results[8]?.data || null) : null;
    const patientPlan = subscription?.plan || "plata"; // default to plata

    const age = profile?.date_of_birth
      ? Math.floor((Date.now() - new Date(profile.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null;
    const sex = profile?.sex || null;

    const getLatestValue = (dataType: string) => {
      const entry = healthData.find((h: any) => h.data_type === dataType);
      return entry ? Number(entry.value) : null;
    };

    const getHistory = (dataType: string) => {
      return healthData
        .filter((h: any) => h.data_type === dataType)
        .map((h: any) => ({ value: Number(h.value), date: h.recorded_at }))
        .slice(0, 10)
        .reverse();
    };

    // === BUILD SECTION-SPECIFIC DATA ===
    const buildHabitsData = () => {
      const d: Record<string, any> = {};
      const sleepVal = getLatestValue("sleep_hours");
      const sleepQualVal = getLatestValue("sleep_quality");
      const screenTimeVal = getLatestValue("screen_time");
      const phoneUnlocksVal = getLatestValue("phone_unlocks");
      const activityHistory = getHistory("activity_duration");
      if (sleepVal && sleepVal > 0) d.sleep = { value: sleepVal, history: getHistory("sleep_hours") };
      if (sleepQualVal && sleepQualVal > 0) d.sleepQuality = sleepQualVal;
      if (activityHistory.length > 0) d.activity = { sessions: activityHistory.length, history: activityHistory };
      if (screenTimeVal && screenTimeVal > 0) d.screenTime = { value: screenTimeVal, history: getHistory("screen_time") };
      if (phoneUnlocksVal && phoneUnlocksVal > 0) d.phoneUnlocks = { value: phoneUnlocksVal, history: getHistory("phone_unlocks") };
      return Object.keys(d).length > 0 ? d : null;
    };

    const buildPsychologicalData = () => {
      const d: Record<string, any> = {};
      const dassTests = testResults.filter((t: any) => t.test_id === "dass-21");
      const latestDASS = dassTests[0]?.scores as Record<string, any> | undefined;
      const swlsTests = testResults.filter((t: any) => t.test_id === "swls");
      const latestSWLS = swlsTests[0]?.scores as Record<string, any> | undefined;
      if (latestDASS) {
        if (latestDASS.anxiety !== undefined && latestDASS.anxiety !== null) d.anxiety = latestDASS.anxiety;
        if (latestDASS.stress !== undefined && latestDASS.stress !== null) d.stress = latestDASS.stress;
        if (latestDASS.depression !== undefined && latestDASS.depression !== null) d.depression = latestDASS.depression;
        if (dassTests.length > 1) {
          d.anxietyHistory = dassTests.map((t: any) => ({ value: (t.scores as any).anxiety, date: t.completed_at })).reverse();
          d.stressHistory = dassTests.map((t: any) => ({ value: (t.scores as any).stress, date: t.completed_at })).reverse();
          d.depressionHistory = dassTests.map((t: any) => ({ value: (t.scores as any).depression, date: t.completed_at })).reverse();
        }
      }
      if (latestSWLS && latestSWLS.total !== undefined && latestSWLS.total !== null) d.lifeSatisfaction = latestSWLS.total;
      return Object.keys(d).length > 0 ? d : null;
    };

    const buildLongevityData = () => {
      const d: Record<string, any> = {};
      const vo2Max = getLatestValue("vo2_max");
      const gripLeft = getLatestValue("grip_strength_left");
      const gripRight = getLatestValue("grip_strength_right");
      const balanceLeft = getLatestValue("balance_left");
      const balanceRight = getLatestValue("balance_right");
      const hrv = getLatestValue("hrv");
      const restingHr = getLatestValue("resting_heart_rate");
      const bioAge = biomarkers[0]?.biological_age;
      const nonHdlVal = getLatestValue("non_hdl_cholesterol");
      if (bioAge && Number(bioAge) > 0) d.biologicalAge = { value: Number(bioAge), chronologicalAge: age };
      if (vo2Max && vo2Max > 0) d.vo2Max = { value: vo2Max, history: getHistory("vo2_max") };
      if (gripLeft && gripLeft > 0) d.gripLeft = { value: gripLeft, history: getHistory("grip_strength_left") };
      if (gripRight && gripRight > 0) d.gripRight = { value: gripRight, history: getHistory("grip_strength_right") };
      if (balanceLeft && balanceLeft > 0) d.balanceLeft = { value: balanceLeft, history: getHistory("balance_left") };
      if (balanceRight && balanceRight > 0) d.balanceRight = { value: balanceRight, history: getHistory("balance_right") };
      if (hrv && hrv > 0) d.hrv = { value: hrv, history: getHistory("hrv") };
      if (restingHr && restingHr > 0) d.restingHr = { value: restingHr, history: getHistory("resting_heart_rate") };
      if (nonHdlVal && nonHdlVal > 0) d.nonHdlCholesterol = { value: nonHdlVal, history: getHistory("non_hdl_cholesterol") };
      if (profile?.waist_circumference && profile?.height && profile.waist_circumference > 0 && profile.height > 0) {
        d.waistHeightRatio = Number((profile.waist_circumference / 100 / profile.height).toFixed(3));
      }
      return Object.keys(d).length > 0 ? d : null;
    };

    const buildBodyCompData = () => {
      const d: Record<string, any> = {};
      if (bodyComp.length > 0) {
        const bc = bodyComp[0];
        addIfValid(d, "weight", bc.weight);
        addIfValid(d, "bodyFatPercent", bc.body_fat_percent);
        addIfValid(d, "muscleMass", bc.muscle_mass);
        addIfValid(d, "visceralFat", bc.visceral_fat);
        addIfValid(d, "bodyWaterPercent", bc.body_water_percent);
        addIfValid(d, "bmr", bc.bmr);
        addIfValid(d, "bmi", bc.bmi);
        addIfValid(d, "boneMass", bc.bone_mass);
        addIfValid(d, "metabolicAge", bc.metabolic_age);
        addIfValid(d, "fatFreeMass", bc.fat_free_mass);
        addIfValid(d, "subcutaneousFat", bc.subcutaneous_fat);
        addIfValid(d, "protein", bc.protein);
      }
      return Object.keys(d).length > 0 ? d : null;
    };

    const buildMetabolicData = () => {
      const d: Record<string, any> = {};
      if (biomarkers.length > 0) {
        const bm = biomarkers[0];
        addIfValid(d, "glucose", bm.glucose);
        addIfValid(d, "albumin", bm.albumin);
        addIfValid(d, "creatinine", bm.creatinine);
        addIfValid(d, "cReactiveProtein", bm.c_reactive_protein);
        addIfValid(d, "lymphocytePercentage", bm.lymphocyte_percentage);
        addIfValid(d, "alkalinePhosphatase", bm.alkaline_phosphatase);
        addIfValid(d, "whiteBloodCellCount", bm.white_blood_cell_count);
        addIfValid(d, "meanCellVolume", bm.mean_cell_volume);
        addIfValid(d, "redCellDistributionWidth", bm.red_cell_distribution_width);
      }
      return Object.keys(d).length > 0 ? d : null;
    };

    // Map section to its specific data builder
    const sectionDataBuilders: Record<string, () => Record<string, any> | null> = {
      habits: buildHabitsData,
      psychological: buildPsychologicalData,
      longevity: buildLongevityData,
      "body-composition": buildBodyCompData,
      metabolic: buildMetabolicData,
    };

    // Determine which sections have data
    const allSectionData: Record<string, any> = {};
    const sectionsWithData: string[] = [];
    for (const [key, builder] of Object.entries(sectionDataBuilders)) {
      const data = builder();
      if (data) {
        allSectionData[key] = data;
        sectionsWithData.push(key);
      }
    }

    // Data hash for caching
    const relevantData = section === "overall" ? allSectionData : (allSectionData[section] || {});
    const dataHash = JSON.stringify({ section, relevantData, age, sex }).slice(0, 500);
    const hashCode = Array.from(dataHash).reduce((s, c) => Math.imul(31, s) + c.charCodeAt(0) | 0, 0).toString(36);

    // Check cached summary
    const { data: existing } = await supabase
      .from("ai_summaries")
      .select("*")
      .eq("user_id", dataUserId)
      .eq("section", section)
      .maybeSingle();

    if (existing && existing.data_hash === hashCode) {
      return new Response(JSON.stringify({
        summary: existing.summary_text,
        score: existing.score,
        sectionScores: existing.section_scores,
        cached: true,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ======= REFERENCE TABLES FOR PERCENTILES =======
    const referenceTablesText = `
TABLAS DE REFERENCIA PARA PERCENTILES (usa SOLO si tienes edad y sexo del paciente):

VO2 Máx (ml/kg/min) - Hombres:
  20-29: Excelente >51, Bueno 43-51, Promedio 36-42, Bajo <36
  30-39: Excelente >48, Bueno 40-48, Promedio 33-39, Bajo <33
  40-49: Excelente >45, Bueno 37-45, Promedio 30-36, Bajo <30
  50-59: Excelente >42, Bueno 34-42, Promedio 27-33, Bajo <27
  60+: Excelente >39, Bueno 31-39, Promedio 24-30, Bajo <24
VO2 Máx (ml/kg/min) - Mujeres:
  20-29: Excelente >46, Bueno 38-46, Promedio 31-37, Bajo <31
  30-39: Excelente >43, Bueno 35-43, Promedio 28-34, Bajo <28
  40-49: Excelente >40, Bueno 32-40, Promedio 25-31, Bajo <25
  50-59: Excelente >37, Bueno 29-37, Promedio 22-28, Bajo <22
  60+: Excelente >34, Bueno 26-34, Promedio 19-25, Bajo <19

Fuerza de Agarre (Kg) - Hombres:
  20-29: Excelente >54, Bueno 46-54, Promedio 38-45, Bajo <38
  30-39: Excelente >53, Bueno 45-53, Promedio 37-44, Bajo <37
  40-49: Excelente >51, Bueno 43-51, Promedio 35-42, Bajo <35
  50-59: Excelente >48, Bueno 40-48, Promedio 32-39, Bajo <32
  60+: Excelente >44, Bueno 36-44, Promedio 28-35, Bajo <28
Fuerza de Agarre (Kg) - Mujeres:
  20-29: Excelente >36, Bueno 30-36, Promedio 24-29, Bajo <24
  30-39: Excelente >35, Bueno 29-35, Promedio 23-28, Bajo <23
  40-49: Excelente >33, Bueno 27-33, Promedio 21-26, Bajo <21
  50-59: Excelente >31, Bueno 25-31, Promedio 19-24, Bajo <19
  60+: Excelente >28, Bueno 22-28, Promedio 16-21, Bajo <16

Equilibrio unipodal ojos cerrados (seg):
  20-39: Excelente >45, Bueno 30-45, Promedio 15-29, Bajo <15
  40-49: Excelente >40, Bueno 25-40, Promedio 10-24, Bajo <10
  50-59: Excelente >35, Bueno 20-35, Promedio 8-19, Bajo <8
  60+: Excelente >25, Bueno 12-25, Promedio 5-11, Bajo <5

HRV (RMSSD, ms):
  20-29: Excelente >80, Bueno 55-80, Promedio 35-54, Bajo <35
  30-39: Excelente >70, Bueno 45-70, Promedio 30-44, Bajo <30
  40-49: Excelente >60, Bueno 38-60, Promedio 25-37, Bajo <25
  50-59: Excelente >55, Bueno 32-55, Promedio 20-31, Bajo <20
  60+: Excelente >50, Bueno 28-50, Promedio 15-27, Bajo <15

% Grasa Corporal - Hombres:
  20-29: Atleta 6-13, Bueno 14-17, Promedio 18-24, Alto >24
  30-39: Atleta 9-14, Bueno 15-19, Promedio 20-25, Alto >25
  40-49: Atleta 11-16, Bueno 17-21, Promedio 22-27, Alto >27
  50-59: Atleta 13-18, Bueno 19-23, Promedio 24-29, Alto >29
  60+: Atleta 14-20, Bueno 21-25, Promedio 26-31, Alto >31
% Grasa Corporal - Mujeres:
  20-29: Atleta 14-20, Bueno 21-24, Promedio 25-31, Alto >31
  30-39: Atleta 15-21, Bueno 22-25, Promedio 26-32, Alto >32
  40-49: Atleta 16-23, Bueno 24-27, Promedio 28-33, Alto >33
  50-59: Atleta 17-24, Bueno 25-28, Promedio 29-34, Alto >34
  60+: Atleta 18-25, Bueno 26-29, Promedio 30-35, Alto >35

Grasa Visceral:
  Normal: 1-9, Alto: 10-14, Muy alto: ≥15

IMC:
  Bajo peso: <18.5, Normal: 18.5-24.9, Sobrepeso: 25-29.9, Obesidad: ≥30

Ratio Cintura/Altura:
  Bajo riesgo: <0.43, Saludable: 0.43-0.52, Riesgo elevado: 0.53-0.57, Alto riesgo: >0.58

Colesterol No-HDL (mg/dL):
  Óptimo: <100, Deseable: 100-129, Límite alto: 130-159, Alto: 160-189, Muy alto: ≥190

Glucosa en ayunas (mg/dL):
  Normal: 70-99, Prediabetes: 100-125, Diabetes: ≥126

PCR (mg/L):
  Bajo riesgo: <1, Riesgo moderado: 1-3, Alto riesgo: >3

Albúmina (g/dL):
  Normal: 3.5-5.0, Baja: <3.5

Creatinina (mg/dL) - Hombres: Normal 0.7-1.3, Mujeres: Normal 0.6-1.1

DASS-21 (puntuaciones BAJAS = MEJOR):
  Depresión: Normal <10, Leve 10-13, Moderada 14-20, Severa 21-27, Extrema ≥28
  Ansiedad: Normal <8, Leve 8-9, Moderada 10-14, Severa 15-19, Extrema ≥20
  Estrés: Normal <15, Leve 15-18, Moderada 19-25, Severa 26-33, Extrema ≥34

SWLS (Satisfacción con la vida, puntuación ALTA = MEJOR):
  Muy alta: 31-35, Alta: 26-30, Ligeramente alta: 21-25, Neutral: 20, Ligeramente baja: 15-19, Baja: 10-14, Muy baja: 5-9
`;

    // CRITICAL anti-hallucination instruction
    const antiHallucinationRule = `
REGLA CRÍTICA - PROHIBIDO INVENTAR DATOS:
- Los ÚNICOS datos que existen del paciente son los del JSON proporcionado.
- NO inventes, supongas ni infieras valores que NO están en el JSON.
- Si un marcador NO aparece en los datos, NO lo menciones.
- La puntuación general solo promedia marcadores CON datos reales. NO penalices por datos faltantes.
- Usa las TABLAS DE REFERENCIA proporcionadas para clasificar cada valor según edad y sexo.
- Indica la clasificación (Excelente/Bueno/Promedio/Bajo) según la tabla correspondiente.
- Solo indica percentil aproximado si puedes calcularlo con las tablas y tienes edad+sexo.`;


    if (isClinicalSection) {
      const clinicalSpecialty = section.replace("clinical-", "");
      const specialtyNotes = professionalNotes.filter((n: any) => n.specialty === clinicalSpecialty);
      
      // Build clinical context
      const clinicalContext: Record<string, any> = {};
      if (age) clinicalContext.age = age;
      if (sex) clinicalContext.sex = sex;
      
      // Add specialty-specific data
      if (clinicalSpecialty === "psychology") {
        const psychData = buildPsychologicalData();
        if (psychData) clinicalContext.psychologicalMetrics = psychData;
        // Add personality test (BFI-10)
        const bfiResult = testResults.find((t: any) => t.test_id === "bfi-10");
        if (bfiResult) clinicalContext.personalityProfile = bfiResult.scores;
      } else if (clinicalSpecialty === "nutrition") {
        const bodyData = buildBodyCompData();
        if (bodyData) clinicalContext.bodyComposition = bodyData;
        const metabData = buildMetabolicData();
        if (metabData) clinicalContext.metabolicMarkers = metabData;
        const habitsData = buildHabitsData();
        if (habitsData) clinicalContext.habits = habitsData;
      } else if (clinicalSpecialty === "medicine") {
        const longevityData = buildLongevityData();
        if (longevityData) clinicalContext.longevityMarkers = longevityData;
        const metabData = buildMetabolicData();
        if (metabData) clinicalContext.metabolicMarkers = metabData;
        const bodyData = buildBodyCompData();
        if (bodyData) clinicalContext.bodyComposition = bodyData;
      } else if (clinicalSpecialty === "physiotherapy") {
        const longevityData = buildLongevityData();
        if (longevityData) clinicalContext.physicalMarkers = longevityData;
        const habitsData = buildHabitsData();
        if (habitsData) clinicalContext.habits = habitsData;
      }
      
      if (specialtyNotes.length > 0) {
        clinicalContext.professionalNotes = specialtyNotes.map((n: any) => ({
          content: n.content,
          date: n.created_at,
          type: n.note_type,
        }));
      }
      if (habitGoals.length > 0) {
        clinicalContext.habitGoals = habitGoals.map((g: any) => ({ type: g.habit_type, target: g.target_value, month: g.month }));
      }
      if (unlockedHabits.length > 0) {
        clinicalContext.unlockedHabits = unlockedHabits.map((h: any) => h.habit_id);
      }

      const specialtyLabelsMap: Record<string, string> = {
        psychology: "Psicología Clínica",
        nutrition: "Nutrición y Alimentación",
        medicine: "Medicina General",
        physiotherapy: "Fisioterapia y Rehabilitación",
      };

      const clinicalPromptMap: Record<string, string> = {
        psychology: `Eres un psicólogo clínico. Resume el estado psicológico del paciente.
INCLUYE:
- Interpretación de pruebas psicométricas (DASS-21: ansiedad, estrés, depresión; SWLS: satisfacción vital). Recuerda: valores BAJOS en DASS-21 = MEJOR.
- Si hay perfil de personalidad (BFI-10), interpreta los 5 rasgos y cómo influyen en el bienestar.
- Resume las notas profesionales: técnicas usadas, su eficacia observada, comportamientos relevantes.
- Recomendaciones basadas en la evidencia disponible.`,
        nutrition: `Eres un nutricionista clínico. Resume el estado nutricional y de composición corporal del paciente.
INCLUYE:
- Análisis de composición corporal si hay datos (% grasa, masa muscular, IMC, grasa visceral).
- Biomarcadores metabólicos relevantes (glucosa, albúmina, etc.).
- Hábitos alimentarios y de actividad que impactan la nutrición.
- Resume las notas profesionales: planes nutricionales, adherencia, cambios observados.
- Metas de hábitos configuradas y su progreso.`,
        medicine: `Eres un médico internista. Resume el estado médico general del paciente.
INCLUYE:
- Biomarcadores y valores de laboratorio disponibles con su clasificación.
- Marcadores de longevidad (edad biológica, VO2 Max, etc.).
- Condiciones o hallazgos relevantes de las notas profesionales.
- Medicaciones o tratamientos mencionados en notas.
- Recomendaciones de seguimiento.`,
        physiotherapy: `Eres un fisioterapeuta. Resume el estado físico y funcional del paciente.
INCLUYE:
- Marcadores físicos: VO2 Max, fuerza de agarre, equilibrio, HRV.
- Nivel de actividad física y hábitos de ejercicio.
- Resume las notas profesionales: tratamientos, ejercicios prescritos, progreso funcional.
- Hábitos desbloqueados (sauna, baño frío, meditación, yoga) y su uso.
- Metas de actividad y su cumplimiento.`,
      };

      const clinicalSystemPrompt = `${clinicalPromptMap[clinicalSpecialty] || clinicalPromptMap.medicine}
${antiHallucinationRule}
${referenceTablesText}

Solo usa datos que aparezcan en el JSON. Si no hay notas profesionales, menciona que no hay registros de notas aún.
La puntuación (0-100) refleja el estado general en esta área clínica.

RESPONDE en JSON: {"score": number(0-100) o null si no hay datos suficientes, "summary": "texto de resumen clínico completo 3-5 oraciones", "markers": [{"name": "string", "status": "green|yellow|red", "note": "breve"}], "recommendations": ["string"] (máx 3)}`;

      const clinicalUserMsg = `Paciente: ${age ? `${age} años` : 'edad desconocida'}, ${sex || 'sexo desconocido'}.
Área: ${specialtyLabelsMap[clinicalSpecialty]}

DATOS REALES del paciente (todo lo que NO aparece aquí NO EXISTE):
${JSON.stringify(clinicalContext, null, 2)}`;

      const clinicalResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: clinicalSystemPrompt },
            { role: "user", content: clinicalUserMsg },
          ],
        }),
      });

      if (!clinicalResponse.ok) throw new Error(`AI error: ${clinicalResponse.status}`);
      const clinicalResult = await clinicalResponse.json();
      const rawClinical = clinicalResult.choices?.[0]?.message?.content || "";
      
      let parsedClinical: any;
      try {
        const jsonMatch = rawClinical.match(/```json\s*([\s\S]*?)\s*```/) || rawClinical.match(/({[\s\S]*})/);
        parsedClinical = JSON.parse(jsonMatch ? jsonMatch[1] : rawClinical);
      } catch {
        parsedClinical = { score: null, summary: rawClinical };
      }

      const clinicalSummaryText = JSON.stringify(parsedClinical);
      
      // Cache
      if (existing) {
        await supabase.from("ai_summaries").update({
          summary_text: clinicalSummaryText, score: parsedClinical.score, section_scores: parsedClinical.markers || [],
          data_hash: hashCode, updated_at: new Date().toISOString(),
        }).eq("id", existing.id);
      } else {
        await supabase.from("ai_summaries").insert({
          user_id: dataUserId, section, summary_text: clinicalSummaryText,
          score: parsedClinical.score, section_scores: parsedClinical.markers || [], data_hash: hashCode,
        });
      }

      return new Response(JSON.stringify({
        summary: clinicalSummaryText, score: parsedClinical.score, cached: false,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ======= HANDLE CLINICAL UNIFIED AI SUMMARY =======
    if (isClinicalUnified) {
      const planLabels: Record<string, string> = { plata: "Plata", oro: "Oro", platino: "Platino", black: "Black" };
      
      // Build context per specialty based on plan
      const unifiedContext: Record<string, any> = {};
      if (age) unifiedContext.age = age;
      if (sex) unifiedContext.sex = sex;
      unifiedContext.plan = planLabels[patientPlan] || "Plata";
      
      // ALWAYS include: physiotherapy (initial physical assessment) + psychology
      // Plata: physical initial + psychological
      // Oro: + nutrition
      // Platino/Black: + medicine
      
      const specialtiesToInclude: string[] = ["physiotherapy", "psychology"];
      if (["oro", "platino", "black"].includes(patientPlan)) specialtiesToInclude.push("nutrition");
      if (["platino", "black"].includes(patientPlan)) specialtiesToInclude.push("medicine");
      
      const specialtyData: Record<string, any> = {};
      
      // Physiotherapy/Physical
      const longevityData = buildLongevityData();
      const habitsData = buildHabitsData();
      const physioNotes = professionalNotes.filter((n: any) => n.specialty === "physiotherapy");
      const physioContext: Record<string, any> = {};
      if (longevityData) physioContext.physicalMarkers = longevityData;
      if (habitsData) physioContext.activityHabits = habitsData;
      if (physioNotes.length > 0) physioContext.notes = physioNotes.map((n: any) => ({ content: n.content, date: n.created_at }));
      if (Object.keys(physioContext).length > 0) specialtyData.physiotherapy = physioContext;
      
      // Psychology
      const psychData = buildPsychologicalData();
      const bfiResult = testResults.find((t: any) => t.test_id === "bfi-10");
      const psychNotes = professionalNotes.filter((n: any) => n.specialty === "psychology");
      const psychContext: Record<string, any> = {};
      if (psychData) psychContext.psychometricResults = psychData;
      if (bfiResult) psychContext.personalityProfile = bfiResult.scores;
      if (psychNotes.length > 0) psychContext.notes = psychNotes.map((n: any) => ({ content: n.content, date: n.created_at }));
      if (Object.keys(psychContext).length === 0) {
        // If no clinical notes, at least note that tests are pending
        psychContext.noData = "Sin notas clínicas ni tests completados aún";
      }
      specialtyData.psychology = psychContext;
      
      // Nutrition (oro+)
      if (specialtiesToInclude.includes("nutrition")) {
        const bodyData = buildBodyCompData();
        const metabData = buildMetabolicData();
        const nutritionNotes = professionalNotes.filter((n: any) => n.specialty === "nutrition");
        const nutContext: Record<string, any> = {};
        if (bodyData) nutContext.bodyComposition = bodyData;
        if (metabData) nutContext.metabolicMarkers = metabData;
        if (nutritionNotes.length > 0) nutContext.notes = nutritionNotes.map((n: any) => ({ content: n.content, date: n.created_at }));
        if (Object.keys(nutContext).length > 0) specialtyData.nutrition = nutContext;
      }
      
      // Medicine (platino+)
      if (specialtiesToInclude.includes("medicine")) {
        const metabData = buildMetabolicData();
        const longevityD = buildLongevityData();
        const medNotes = professionalNotes.filter((n: any) => n.specialty === "medicine");
        const medContext: Record<string, any> = {};
        if (metabData) medContext.metabolicMarkers = metabData;
        if (longevityD) medContext.longevityMarkers = longevityD;
        if (medNotes.length > 0) medContext.notes = medNotes.map((n: any) => ({ content: n.content, date: n.created_at }));
        if (Object.keys(medContext).length > 0) specialtyData.medicine = medContext;
      }
      
      // Habit goals
      if (habitGoals.length > 0) {
        unifiedContext.habitGoals = habitGoals.map((g: any) => ({ type: g.habit_type, target: g.target_value, month: g.month }));
      }
      if (unlockedHabits.length > 0) {
        unifiedContext.unlockedHabits = unlockedHabits.map((h: any) => h.habit_id);
      }
      
      unifiedContext.specialtyData = specialtyData;

      const unifiedPrompt = `Eres un equipo médico multidisciplinario. Genera UN SOLO resumen clínico integral del paciente.
${antiHallucinationRule}
${referenceTablesText}

El paciente tiene plan "${unifiedContext.plan}". Solo incluye las especialidades disponibles en su plan:
- Plata: Valoración física inicial + Psicológico
- Oro: + Alimentación/Nutrición  
- Platino/Black: + Médico

INSTRUCCIONES:
- Para cada especialidad incluida, genera una subsección con título, puntuación y resumen.
- En Psicológico: interpreta BFI-10 (personalidad), DASS-21, SWLS. Si hay notas clínicas, resume técnicas y eficacia. Si NO hay notas ni tests, indica que no hay evaluaciones aún.
- En Físico: resume marcadores de longevidad (VO2 Max, fuerza, equilibrio, HRV) con clasificación por edad/sexo.
- En Alimentación: resume composición corporal, marcadores metabólicos relevantes.
- En Médico: resume biomarcadores, condiciones encontradas.
- Si una especialidad no tiene datos, indícalo brevemente pero NO inventes valores.
- La puntuación general (0-100) promedia SOLO las especialidades con datos reales.
- Máximo 4 recomendaciones generales.

RESPONDE en JSON exacto:
{
  "score": number(0-100) o null,
  "plan": "nombre del plan",
  "summary": "resumen general 2-3 oraciones",
  "specialtySections": [
    {
      "specialty": "psychology|nutrition|medicine|physiotherapy",
      "score": number(0-100) o null,
      "summary": "resumen de esta área 2-3 oraciones",
      "markers": [{"name": "string", "status": "green|yellow|red", "note": "breve"}]
    }
  ],
  "recommendations": ["string"]
}`;

      const unifiedUserMsg = `Paciente: ${age ? `${age} años` : 'edad desconocida'}, ${sex || 'sexo desconocido'}.
Plan: ${unifiedContext.plan}

DATOS REALES del paciente (todo lo que NO aparece aquí NO EXISTE):
${JSON.stringify(unifiedContext, null, 2)}`;

      const unifiedResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: unifiedPrompt },
            { role: "user", content: unifiedUserMsg },
          ],
        }),
      });

      if (!unifiedResponse.ok) throw new Error(`AI error: ${unifiedResponse.status}`);
      const unifiedResult = await unifiedResponse.json();
      const rawUnified = unifiedResult.choices?.[0]?.message?.content || "";
      
      let parsedUnified: any;
      try {
        const jsonMatch = rawUnified.match(/```json\s*([\s\S]*?)\s*```/) || rawUnified.match(/({[\s\S]*})/);
        parsedUnified = JSON.parse(jsonMatch ? jsonMatch[1] : rawUnified);
      } catch {
        parsedUnified = { score: null, summary: rawUnified };
      }

      const unifiedSummaryText = JSON.stringify(parsedUnified);
      
      if (existing) {
        await supabase.from("ai_summaries").update({
          summary_text: unifiedSummaryText, score: parsedUnified.score, section_scores: parsedUnified.specialtySections || [],
          data_hash: hashCode, updated_at: new Date().toISOString(),
        }).eq("id", existing.id);
      } else {
        await supabase.from("ai_summaries").insert({
          user_id: dataUserId, section, summary_text: unifiedSummaryText,
          score: parsedUnified.score, section_scores: parsedUnified.specialtySections || [], data_hash: hashCode,
        });
      }

      return new Response(JSON.stringify({
        summary: unifiedSummaryText, score: parsedUnified.score, cached: false,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (section !== "overall" && section !== "achievements" && !section.startsWith("interpret-")) {
      if (!allSectionData[section]) {
        return new Response(JSON.stringify({
          summary: JSON.stringify({ score: null, summary: "No hay datos disponibles en esta sección para generar un resumen.", markers: [], recommendations: [] }),
          score: null,
          cached: false,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    if (section === "overall" && sectionsWithData.length === 0) {
      return new Response(JSON.stringify({
        summary: JSON.stringify({ score: null, summary: "No hay datos de salud registrados aún. Completa tests, registra hábitos o pide a tu profesional que ingrese datos para obtener un resumen.", sections: [], recommendations: [] }),
        score: null,
        cached: false,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }



    // ======= HANDLE INDIVIDUAL METRIC INTERPRETATION =======
    if (section.startsWith("interpret-")) {
      // Parse: interpret-{sectionName}-{metricName}
      const parts = section.replace("interpret-", "").split("-");
      const sectionName = parts[0]; // e.g., "longevity", "habits", etc.
      
      // Get only the specific metric data from clientHealthData
      const metricData = clientHealthData || {};
      
      const interpretPrompt = `Eres un médico especialista. Interpreta SOLO este marcador de salud específico en 2-3 oraciones concisas.
${antiHallucinationRule}
${referenceTablesText}

Paciente: Edad ${age || 'desconocida'}, Sexo ${sex || 'desconocido'}.
Sección: ${sectionName}

INSTRUCCIONES:
- Habla SOLO del marcador específico proporcionado, no de otros.
- Clasifícalo según las tablas de referencia para su edad y sexo.
- Si tienes edad y sexo, indica en qué categoría se encuentra (Excelente/Bueno/Promedio/Bajo) y un percentil aproximado.
- Si NO tienes edad o sexo, usa rangos generales sin percentil.
- Menciona brevemente qué implica para la salud y si hay margen de mejora.
- NO menciones otros marcadores ni hagas recomendaciones generales.

Datos del marcador: ${JSON.stringify(metricData)}
RESPONDE SOLO con texto plano (NO JSON).`;

      const interpretResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: interpretPrompt },
            { role: "user", content: "Interpreta este marcador." },
          ],
        }),
      });

      if (!interpretResponse.ok) throw new Error(`AI error: ${interpretResponse.status}`);
      const interpretResult = await interpretResponse.json();
      const interpretText = interpretResult.choices?.[0]?.message?.content || "No se pudo interpretar.";

      return new Response(JSON.stringify({
        summary: JSON.stringify({ summary: interpretText, score: null }),
        score: null,
        cached: false,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ======= SECTION-SPECIFIC PROMPTS =======
    const sectionPrompts: Record<string, string> = {
      overall: `Eres un médico especialista en medicina preventiva. Genera un resumen integral de salud.
${antiHallucinationRule}
${referenceTablesText}

Las ÚNICAS secciones con datos reales son: ${sectionsWithData.join(", ")}. Solo evalúa estas.
Para cada sección con datos, clasifica cada marcador según las tablas de referencia.
La puntuación general (0-100) debe ser el promedio ponderado SOLO de las secciones que tienen datos.

RESPONDE en JSON:
{"score": number (0-100), "summary": "texto 2-3 oraciones resumen global", "sections": [{"name": "string", "score": number, "status": "green|yellow|red", "summary": "texto corto con clasificación por tablas"}], "recommendations": ["string"] (máx 3)}`,

      habits: `Eres un especialista en hábitos saludables y medicina del sueño.
${antiHallucinationRule}
${referenceTablesText}

INSTRUCCIONES: Analiza SOLO los siguientes marcadores de hábitos que tienen datos reales. 
Para cada uno clasifícalo según tablas de referencia. La puntuación (0-100) promedia SOLO los marcadores presentes.
Marcadores posibles: sueño (horas y calidad), actividad física, tiempo de pantalla, desbloqueos de teléfono.

RESPONDE en JSON: {"score": number(0-100), "summary": "texto resumen de hábitos", "markers": [{"name": "string", "status": "green|yellow|red", "trend": "improving|stable|declining", "note": "clasificación y recomendación breve"}], "recommendations": ["string"] (máx 3)}`,

      psychological: `Eres un psicólogo clínico experto en evaluación psicométrica.
${antiHallucinationRule}
${referenceTablesText}

REGLA ESPECIAL DASS-21: Valores BAJOS son POSITIVOS (menos síntomas). 
- Depresión <10 = Normal (verde), 10-13 = Leve (amarillo), ≥14 = Moderada+ (rojo)
- Ansiedad <8 = Normal (verde), 8-9 = Leve (amarillo), ≥10 = Moderada+ (rojo)
- Estrés <15 = Normal (verde), 15-18 = Leve (amarillo), ≥19 = Moderada+ (rojo)
SWLS: >25 = verde, 20-25 = amarillo, <20 = rojo

Analiza SOLO los marcadores psicológicos presentes. La puntuación (0-100) promedia SOLO los que tienen datos.

RESPONDE en JSON: {"score": number(0-100), "summary": "texto", "markers": [{"name": "string", "status": "green|yellow|red", "trend": "improving|stable|declining", "note": "clasificación según escala"}], "recommendations": ["string"] (máx 3)}`,

      longevity: `Eres un especialista en longevidad y medicina preventiva.
${antiHallucinationRule}
${referenceTablesText}

INSTRUCCIONES: Analiza SOLO los marcadores de longevidad presentes.
Para cada marcador con datos, clasifícalo según las tablas de referencia para la edad y sexo del paciente.
La puntuación (0-100) promedia SOLO los marcadores presentes ponderando su clasificación.
Si tienes edad y sexo, indica categoría (Excelente/Bueno/Promedio/Bajo) para cada marcador.

RESPONDE en JSON: {"score": number(0-100), "summary": "texto", "markers": [{"name": "string", "status": "green|yellow|red", "trend": "improving|stable|declining", "note": "clasificación por edad/sexo y breve interpretación"}], "recommendations": ["string"] (máx 3)}`,

      "body-composition": `Eres un nutricionista deportivo y especialista en composición corporal.
${antiHallucinationRule}
${referenceTablesText}

INSTRUCCIONES: Analiza SOLO los marcadores de composición corporal presentes.
Clasifica cada uno según las tablas de referencia (% grasa por edad/sexo, grasa visceral, IMC, etc.).
La puntuación (0-100) promedia SOLO los marcadores presentes.

RESPONDE en JSON: {"score": number(0-100), "summary": "texto", "markers": [{"name": "string", "status": "green|yellow|red", "trend": "improving|stable|declining", "note": "clasificación según tablas"}], "recommendations": ["string"] (máx 3)}`,

      metabolic: `Eres un médico internista especialista en biomarcadores.
${antiHallucinationRule}
${referenceTablesText}

INSTRUCCIONES: Analiza SOLO los biomarcadores metabólicos presentes.
Clasifica cada uno según rangos de referencia para edad y sexo.
La puntuación (0-100) promedia SOLO los marcadores presentes.

RESPONDE en JSON: {"score": number(0-100), "summary": "texto", "markers": [{"name": "string", "status": "green|yellow|red", "trend": "improving|stable|declining", "note": "clasificación según rangos"}], "recommendations": ["string"] (máx 3)}`,

      achievements: `Eres un coach de bienestar.
${antiHallucinationRule}
RESPONDE en JSON: {"score": number(0-100), "summary": "texto", "highlights": ["string"], "status": "green|yellow|red"}`,
    };

    const systemPrompt = sectionPrompts[section] || sectionPrompts.overall;

    // Build user message with ONLY the relevant section's data
    const contextParts: string[] = [];
    if (age) contextParts.push(`Edad: ${age} años`);
    if (sex) contextParts.push(`Sexo: ${sex}`);

    let dataForAI: any;
    if (section === "overall") {
      dataForAI = allSectionData;
    } else {
      dataForAI = allSectionData[section] || {};
    }

    contextParts.push(`\nDATOS REALES del paciente (todo lo que NO aparece aquí NO EXISTE):\n${JSON.stringify(dataForAI, null, 2)}`);
    const userMessage = contextParts.join("\n");

    console.log("Sending to AI - section:", section, "data keys:", Object.keys(dataForAI));

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Límite de solicitudes excedido. Intenta de nuevo en unos minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes para IA." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    const rawContent = aiResult.choices?.[0]?.message?.content || "";

    let parsed: any;
    try {
      const jsonMatch = rawContent.match(/```json\s*([\s\S]*?)\s*```/) || rawContent.match(/({[\s\S]*})/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[1] : rawContent);
    } catch {
      parsed = { score: 50, summary: rawContent };
    }

    const summaryText = JSON.stringify(parsed);
    const score = parsed.score || null;
    const sectionScores = parsed.sections || parsed.markers || [];

    // Upsert summary
    if (existing) {
      await supabase.from("ai_summaries").update({
        summary_text: summaryText,
        score,
        section_scores: sectionScores,
        data_hash: hashCode,
        updated_at: new Date().toISOString(),
      }).eq("id", existing.id);
    } else {
      await supabase.from("ai_summaries").insert({
        user_id: dataUserId,
        section,
        summary_text: summaryText,
        score,
        section_scores: sectionScores,
        data_hash: hashCode,
      });
    }

    return new Response(JSON.stringify({
      summary: summaryText,
      score,
      sectionScores,
      cached: false,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("generate-health-summary error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
