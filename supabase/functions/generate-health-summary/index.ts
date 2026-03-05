import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const { section, targetUserId, healthData: clientHealthData } = await req.json();
    const dataUserId = targetUserId || user.id;

    // === FETCH ALL DATA SERVER-SIDE ===
    const [profileRes, healthRes, biomarkersRes, testResultsRes, bodyCompRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", dataUserId).maybeSingle(),
      supabase.from("health_data").select("*").eq("user_id", dataUserId).order("recorded_at", { ascending: false }).limit(200),
      supabase.from("biomarkers").select("*").eq("user_id", dataUserId).order("recorded_at", { ascending: false }).limit(10),
      supabase.from("test_results").select("*").eq("user_id", dataUserId).order("completed_at", { ascending: false }).limit(20),
      supabase.from("body_composition").select("*").eq("user_id", dataUserId).order("recorded_at", { ascending: false }).limit(10),
    ]);

    const profile = profileRes.data;
    const healthData = healthRes.data || [];
    const biomarkers = biomarkersRes.data || [];
    const testResults = testResultsRes.data || [];
    const bodyComp = bodyCompRes.data || [];

    const age = profile?.date_of_birth
      ? Math.floor((Date.now() - new Date(profile.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null;
    const sex = profile?.sex || null;

    // Build comprehensive health data object from DB
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

    // Get DASS-21 scores
    const dassTests = testResults.filter((t: any) => t.test_id === "dass-21");
    const latestDASS = dassTests[0]?.scores as Record<string, any> | undefined;
    const swlsTests = testResults.filter((t: any) => t.test_id === "swls");
    const latestSWLS = swlsTests[0]?.scores as Record<string, any> | undefined;

    // Build section-specific data
    const serverHealthData: Record<string, any> = {};

    // Personal context
    if (profile) {
      serverHealthData.personal = {
        age,
        sex,
        height: profile.height,
        weight: profile.weight,
        waistCircumference: profile.waist_circumference,
      };
    }

    // Habits
    const sleepVal = getLatestValue("sleep_hours");
    const sleepQualVal = getLatestValue("sleep_quality");
    const screenTimeVal = getLatestValue("screen_time");
    const phoneUnlocksVal = getLatestValue("phone_unlocks");
    const activityHistory = getHistory("activity_duration");

    if (sleepVal !== null || screenTimeVal !== null || activityHistory.length > 0) {
      serverHealthData.habits = {};
      if (sleepVal !== null) serverHealthData.habits.sleep = { value: sleepVal, history: getHistory("sleep_hours") };
      if (sleepQualVal !== null) serverHealthData.habits.sleepQuality = sleepQualVal;
      if (activityHistory.length > 0) serverHealthData.habits.activity = { sessions: activityHistory.length, history: activityHistory };
      if (screenTimeVal !== null) serverHealthData.habits.screenTime = { value: screenTimeVal, history: getHistory("screen_time") };
      if (phoneUnlocksVal !== null) serverHealthData.habits.phoneUnlocks = { value: phoneUnlocksVal, history: getHistory("phone_unlocks") };
    }

    // Psychological
    if (latestDASS || latestSWLS) {
      serverHealthData.psychological = {};
      if (latestDASS) {
        if (latestDASS.anxiety !== undefined) serverHealthData.psychological.anxiety = latestDASS.anxiety;
        if (latestDASS.stress !== undefined) serverHealthData.psychological.stress = latestDASS.stress;
        if (latestDASS.depression !== undefined) serverHealthData.psychological.depression = latestDASS.depression;
        // History
        if (dassTests.length > 1) {
          serverHealthData.psychological.anxietyHistory = dassTests.map((t: any) => ({ value: (t.scores as any).anxiety, date: t.completed_at })).reverse();
          serverHealthData.psychological.stressHistory = dassTests.map((t: any) => ({ value: (t.scores as any).stress, date: t.completed_at })).reverse();
        }
      }
      if (latestSWLS) {
        serverHealthData.psychological.lifeSatisfaction = latestSWLS.total;
      }
    }

    // Longevity
    const vo2Max = getLatestValue("vo2_max");
    const gripLeft = getLatestValue("grip_strength_left");
    const gripRight = getLatestValue("grip_strength_right");
    const balanceLeft = getLatestValue("balance_left");
    const balanceRight = getLatestValue("balance_right");
    const hrv = getLatestValue("hrv");
    const restingHr = getLatestValue("resting_heart_rate");
    const bioAge = biomarkers[0]?.biological_age;

    if (vo2Max !== null || gripLeft !== null || hrv !== null || bioAge) {
      serverHealthData.longevity = {};
      if (bioAge) serverHealthData.longevity.biologicalAge = { value: Number(bioAge), chronologicalAge: age };
      if (vo2Max !== null) serverHealthData.longevity.vo2Max = { value: vo2Max, history: getHistory("vo2_max") };
      if (gripLeft !== null) serverHealthData.longevity.gripLeft = { value: gripLeft, history: getHistory("grip_strength_left") };
      if (gripRight !== null) serverHealthData.longevity.gripRight = { value: gripRight, history: getHistory("grip_strength_right") };
      if (balanceLeft !== null) serverHealthData.longevity.balanceLeft = { value: balanceLeft, history: getHistory("balance_left") };
      if (balanceRight !== null) serverHealthData.longevity.balanceRight = { value: balanceRight, history: getHistory("balance_right") };
      if (hrv !== null) serverHealthData.longevity.hrv = { value: hrv, history: getHistory("hrv") };
      if (restingHr !== null) serverHealthData.longevity.restingHr = { value: restingHr, history: getHistory("resting_heart_rate") };
      if (profile?.waist_circumference && profile?.height) {
        serverHealthData.longevity.waistHeightRatio = Number((profile.waist_circumference / 100 / profile.height).toFixed(3));
      }
    }

    // Body composition
    if (bodyComp.length > 0) {
      const bc = bodyComp[0];
      serverHealthData.bodyComposition = {};
      if (bc.weight) serverHealthData.bodyComposition.weight = bc.weight;
      if (bc.body_fat_percent) serverHealthData.bodyComposition.bodyFatPercent = bc.body_fat_percent;
      if (bc.muscle_mass) serverHealthData.bodyComposition.muscleMass = bc.muscle_mass;
      if (bc.visceral_fat) serverHealthData.bodyComposition.visceralFat = bc.visceral_fat;
      if (bc.body_water_percent) serverHealthData.bodyComposition.bodyWaterPercent = bc.body_water_percent;
      if (bc.bmr) serverHealthData.bodyComposition.bmr = bc.bmr;
      if (bc.bmi) serverHealthData.bodyComposition.bmi = bc.bmi;
      if (bc.bone_mass) serverHealthData.bodyComposition.boneMass = bc.bone_mass;
      if (bc.metabolic_age) serverHealthData.bodyComposition.metabolicAge = bc.metabolic_age;
    }

    // Metabolic (biomarkers)
    if (biomarkers.length > 0) {
      const bm = biomarkers[0];
      serverHealthData.metabolic = {};
      if (bm.glucose) serverHealthData.metabolic.glucose = bm.glucose;
      if (bm.albumin) serverHealthData.metabolic.albumin = bm.albumin;
      if (bm.creatinine) serverHealthData.metabolic.creatinine = bm.creatinine;
      if (bm.c_reactive_protein) serverHealthData.metabolic.cReactiveProtein = bm.c_reactive_protein;
      if (bm.lymphocyte_percentage) serverHealthData.metabolic.lymphocytePercentage = bm.lymphocyte_percentage;
      if (bm.alkaline_phosphatase) serverHealthData.metabolic.alkalinePhosphatase = bm.alkaline_phosphatase;
      if (bm.white_blood_cell_count) serverHealthData.metabolic.whiteBloodCellCount = bm.white_blood_cell_count;
    }

    // Use server data, fall back to client data for backward compat
    const finalHealthData = Object.keys(serverHealthData).length > 1 ? serverHealthData : (clientHealthData || serverHealthData);

    // Check what sections have data
    const sectionsWithData: string[] = [];
    if (finalHealthData.habits && Object.keys(finalHealthData.habits).length > 0) sectionsWithData.push("habits");
    if (finalHealthData.psychological && Object.keys(finalHealthData.psychological).length > 0) sectionsWithData.push("psychological");
    if (finalHealthData.longevity && Object.keys(finalHealthData.longevity).length > 0) sectionsWithData.push("longevity");
    if (finalHealthData.bodyComposition && Object.keys(finalHealthData.bodyComposition).length > 0) sectionsWithData.push("body-composition");
    if (finalHealthData.metabolic && Object.keys(finalHealthData.metabolic).length > 0) sectionsWithData.push("metabolic");

    // Build data hash
    const dataHash = JSON.stringify({ section, finalHealthData, age, sex }).slice(0, 500);
    const hashCode = Array.from(dataHash).reduce((s, c) => Math.imul(31, s) + c.charCodeAt(0) | 0, 0).toString(36);

    // Check existing summary
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

    // If no data at all for the requested section, return a helpful message
    if (section !== "overall" && section !== "achievements") {
      const sectionDataMap: Record<string, string> = {
        habits: "habits",
        psychological: "psychological",
        longevity: "longevity",
        "body-composition": "bodyComposition",
        metabolic: "metabolic",
      };
      const dataKey = sectionDataMap[section];
      if (dataKey && (!finalHealthData[dataKey] || Object.keys(finalHealthData[dataKey]).length === 0)) {
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

    // Build system prompt based on section
    const percentileInstruction = `
IMPORTANTE SOBRE PERCENTILES:
- Si tienes suficientes datos confiables de un marcador y conoces la edad y sexo del paciente, indica en qué percentil aproximado se encuentra respecto a la población de su edad y sexo.
- Solo incluye percentiles cuando tengas datos confiables y referencias clínicas válidas. No inventes percentiles.
- Formato: "Percentil ~XX para [sexo] de [edad] años" en la nota del marcador.`;

    const scoringInstruction = `
IMPORTANTE SOBRE PUNTUACIÓN:
- Si una sección o subsección NO tiene datos, NO la incluyas en el cálculo de puntuación ni en el resultado. Solo evalúa las secciones con datos reales.
- La puntuación general solo debe promediar secciones que tienen datos. No penalices por secciones sin datos.
- Si no hay datos suficientes para dar una puntuación confiable a un marcador, no lo incluyas.`;

    const trendInstruction = `
IMPORTANTE SOBRE TENDENCIAS:
- Si hay datos de más de 2 meses, la TENDENCIA (mejorando/empeorando) es el factor MÁS importante en la evaluación.
- Indica claramente si el paciente está mejorando o no en cada marcador con historial.`;

    const sectionPrompts: Record<string, string> = {
      overall: `Eres un médico especialista en medicina preventiva y longevidad. Genera un resumen integral de salud del paciente.
${scoringInstruction}
${trendInstruction}
${percentileInstruction}

Las secciones disponibles con datos son: ${sectionsWithData.join(", ")}. Solo incluye estas secciones en tu evaluación.

RESPONDE EXCLUSIVAMENTE en JSON con este formato:
{
  "score": number (0-100, promediando SOLO secciones con datos),
  "summary": "texto resumen general (2-3 oraciones)",
  "sections": [
    {"name": "string", "score": number, "status": "green|yellow|red", "summary": "texto corto"}
  ],
  "recommendations": ["string"] (máx 3)
}`,
      achievements: `Eres un coach de bienestar. Analiza los logros y progreso del paciente.
${scoringInstruction}
RESPONDE en JSON: {"score": number(0-100), "summary": "texto", "highlights": ["string"], "status": "green|yellow|red"}`,
      habits: `Eres un especialista en hábitos saludables. Analiza los hábitos del paciente.
${scoringInstruction}
${trendInstruction}
${percentileInstruction}
RESPONDE en JSON: {"score": number(0-100), "summary": "texto", "markers": [{"name": "string", "status": "green|yellow|red", "trend": "improving|stable|declining", "note": "string (incluir percentil si aplica)"}], "recommendations": ["string"]}`,
      psychological: `Eres un psicólogo clínico. Analiza los indicadores de bienestar psicológico.
${scoringInstruction}
${trendInstruction}
${percentileInstruction}
RESPONDE en JSON: {"score": number(0-100), "summary": "texto", "markers": [{"name": "string", "status": "green|yellow|red", "trend": "improving|stable|declining", "note": "string (incluir percentil si aplica)"}], "recommendations": ["string"]}`,
      longevity: `Eres un especialista en longevidad. Analiza marcadores de longevidad.
${scoringInstruction}
${trendInstruction}
${percentileInstruction}
RESPONDE en JSON: {"score": number(0-100), "summary": "texto", "markers": [{"name": "string", "status": "green|yellow|red", "trend": "improving|stable|declining", "note": "string (incluir percentil si aplica)"}], "recommendations": ["string"]}`,
      "body-composition": `Eres un nutricionista deportivo. Analiza la composición corporal.
${scoringInstruction}
${trendInstruction}
${percentileInstruction}
RESPONDE en JSON: {"score": number(0-100), "summary": "texto", "markers": [{"name": "string", "status": "green|yellow|red", "trend": "improving|stable|declining", "note": "string (incluir percentil si aplica)"}], "recommendations": ["string"]}`,
      metabolic: `Eres un médico internista. Analiza los marcadores metabólicos sanguíneos.
${scoringInstruction}
${trendInstruction}
${percentileInstruction}
RESPONDE en JSON: {"score": number(0-100), "summary": "texto", "markers": [{"name": "string", "status": "green|yellow|red", "trend": "improving|stable|declining", "note": "string (incluir percentil si aplica)"}], "recommendations": ["string"]}`,
    };

    const systemPrompt = sectionPrompts[section] || sectionPrompts.overall;

    const contextParts: string[] = [];
    if (age) contextParts.push(`Edad: ${age} años`);
    if (sex) contextParts.push(`Sexo: ${sex}`);
    contextParts.push(`\nDatos de salud disponibles:\n${JSON.stringify(finalHealthData, null, 2)}`);
    contextParts.push(`\nIMPORTANTE:
- Ajusta las referencias y evaluaciones según el sexo y la edad del paciente.
- Si hay datos de más de 2 meses, prioriza la TENDENCIA como factor principal.
- Si no hay suficientes datos en algún área, indícalo y no inventes valores.
- No incluyas secciones sin datos en la puntuación.
- Sé conciso pero informativo.`);

    const userMessage = contextParts.join("\n");

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
