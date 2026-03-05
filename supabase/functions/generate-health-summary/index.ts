import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Helper: only include truthy non-zero values
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

    const { section, targetUserId } = await req.json();
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

    // Build ONLY sections that have REAL data
    const serverHealthData: Record<string, any> = {};

    // Personal context (always include if available)
    const personal: Record<string, any> = {};
    addIfValid(personal, "age", age);
    addIfValid(personal, "sex", sex);
    addIfValid(personal, "height", profile?.height);
    addIfValid(personal, "weight", profile?.weight);
    addIfValid(personal, "waistCircumference", profile?.waist_circumference);
    if (Object.keys(personal).length > 0) serverHealthData.personal = personal;

    // Habits — only include metrics with actual non-zero values
    const habits: Record<string, any> = {};
    const sleepVal = getLatestValue("sleep_hours");
    const sleepQualVal = getLatestValue("sleep_quality");
    const screenTimeVal = getLatestValue("screen_time");
    const phoneUnlocksVal = getLatestValue("phone_unlocks");
    const activityHistory = getHistory("activity_duration");

    if (sleepVal && sleepVal > 0) habits.sleep = { value: sleepVal, history: getHistory("sleep_hours") };
    if (sleepQualVal && sleepQualVal > 0) habits.sleepQuality = sleepQualVal;
    if (activityHistory.length > 0) habits.activity = { sessions: activityHistory.length, history: activityHistory };
    if (screenTimeVal && screenTimeVal > 0) habits.screenTime = { value: screenTimeVal, history: getHistory("screen_time") };
    if (phoneUnlocksVal && phoneUnlocksVal > 0) habits.phoneUnlocks = { value: phoneUnlocksVal, history: getHistory("phone_unlocks") };
    if (Object.keys(habits).length > 0) serverHealthData.habits = habits;

    // Psychological — from test results only
    const dassTests = testResults.filter((t: any) => t.test_id === "dass-21");
    const latestDASS = dassTests[0]?.scores as Record<string, any> | undefined;
    const swlsTests = testResults.filter((t: any) => t.test_id === "swls");
    const latestSWLS = swlsTests[0]?.scores as Record<string, any> | undefined;

    const psychological: Record<string, any> = {};
    if (latestDASS) {
      if (latestDASS.anxiety !== undefined && latestDASS.anxiety !== null) psychological.anxiety = latestDASS.anxiety;
      if (latestDASS.stress !== undefined && latestDASS.stress !== null) psychological.stress = latestDASS.stress;
      if (latestDASS.depression !== undefined && latestDASS.depression !== null) psychological.depression = latestDASS.depression;
      if (dassTests.length > 1) {
        psychological.anxietyHistory = dassTests.map((t: any) => ({ value: (t.scores as any).anxiety, date: t.completed_at })).reverse();
        psychological.stressHistory = dassTests.map((t: any) => ({ value: (t.scores as any).stress, date: t.completed_at })).reverse();
        psychological.depressionHistory = dassTests.map((t: any) => ({ value: (t.scores as any).depression, date: t.completed_at })).reverse();
      }
    }
    if (latestSWLS && latestSWLS.total !== undefined && latestSWLS.total !== null) {
      psychological.lifeSatisfaction = latestSWLS.total;
    }
    if (Object.keys(psychological).length > 0) serverHealthData.psychological = psychological;

    // Longevity — only real non-zero values
    const longevity: Record<string, any> = {};
    const vo2Max = getLatestValue("vo2_max");
    const gripLeft = getLatestValue("grip_strength_left");
    const gripRight = getLatestValue("grip_strength_right");
    const balanceLeft = getLatestValue("balance_left");
    const balanceRight = getLatestValue("balance_right");
    const hrv = getLatestValue("hrv");
    const restingHr = getLatestValue("resting_heart_rate");
    const bioAge = biomarkers[0]?.biological_age;
    const nonHdlVal = getLatestValue("non_hdl_cholesterol");

    if (bioAge && Number(bioAge) > 0) longevity.biologicalAge = { value: Number(bioAge), chronologicalAge: age };
    if (vo2Max && vo2Max > 0) longevity.vo2Max = { value: vo2Max, history: getHistory("vo2_max") };
    if (gripLeft && gripLeft > 0) longevity.gripLeft = { value: gripLeft, history: getHistory("grip_strength_left") };
    if (gripRight && gripRight > 0) longevity.gripRight = { value: gripRight, history: getHistory("grip_strength_right") };
    if (balanceLeft && balanceLeft > 0) longevity.balanceLeft = { value: balanceLeft, history: getHistory("balance_left") };
    if (balanceRight && balanceRight > 0) longevity.balanceRight = { value: balanceRight, history: getHistory("balance_right") };
    if (hrv && hrv > 0) longevity.hrv = { value: hrv, history: getHistory("hrv") };
    if (restingHr && restingHr > 0) longevity.restingHr = { value: restingHr, history: getHistory("resting_heart_rate") };
    if (nonHdlVal && nonHdlVal > 0) longevity.nonHdlCholesterol = { value: nonHdlVal, history: getHistory("non_hdl_cholesterol") };
    if (profile?.waist_circumference && profile?.height && profile.waist_circumference > 0 && profile.height > 0) {
      longevity.waistHeightRatio = Number((profile.waist_circumference / 100 / profile.height).toFixed(3));
    }
    if (Object.keys(longevity).length > 0) serverHealthData.longevity = longevity;

    // Body composition — only real non-zero values
    const bodyComposition: Record<string, any> = {};
    if (bodyComp.length > 0) {
      const bc = bodyComp[0];
      addIfValid(bodyComposition, "weight", bc.weight);
      addIfValid(bodyComposition, "bodyFatPercent", bc.body_fat_percent);
      addIfValid(bodyComposition, "muscleMass", bc.muscle_mass);
      addIfValid(bodyComposition, "visceralFat", bc.visceral_fat);
      addIfValid(bodyComposition, "bodyWaterPercent", bc.body_water_percent);
      addIfValid(bodyComposition, "bmr", bc.bmr);
      addIfValid(bodyComposition, "bmi", bc.bmi);
      addIfValid(bodyComposition, "boneMass", bc.bone_mass);
      addIfValid(bodyComposition, "metabolicAge", bc.metabolic_age);
      addIfValid(bodyComposition, "fatFreeMass", bc.fat_free_mass);
      addIfValid(bodyComposition, "subcutaneousFat", bc.subcutaneous_fat);
      addIfValid(bodyComposition, "protein", bc.protein);
    }
    if (Object.keys(bodyComposition).length > 0) serverHealthData.bodyComposition = bodyComposition;

    // Metabolic (biomarkers) — only real non-zero values
    const metabolic: Record<string, any> = {};
    if (biomarkers.length > 0) {
      const bm = biomarkers[0];
      addIfValid(metabolic, "glucose", bm.glucose);
      addIfValid(metabolic, "albumin", bm.albumin);
      addIfValid(metabolic, "creatinine", bm.creatinine);
      addIfValid(metabolic, "cReactiveProtein", bm.c_reactive_protein);
      addIfValid(metabolic, "lymphocytePercentage", bm.lymphocyte_percentage);
      addIfValid(metabolic, "alkalinePhosphatase", bm.alkaline_phosphatase);
      addIfValid(metabolic, "whiteBloodCellCount", bm.white_blood_cell_count);
      addIfValid(metabolic, "meanCellVolume", bm.mean_cell_volume);
      addIfValid(metabolic, "redCellDistributionWidth", bm.red_cell_distribution_width);
    }
    if (Object.keys(metabolic).length > 0) serverHealthData.metabolic = metabolic;

    // Determine which sections have actual data
    const sectionsWithData: string[] = [];
    if (serverHealthData.habits) sectionsWithData.push("habits");
    if (serverHealthData.psychological) sectionsWithData.push("psychological");
    if (serverHealthData.longevity) sectionsWithData.push("longevity");
    if (serverHealthData.bodyComposition) sectionsWithData.push("body-composition");
    if (serverHealthData.metabolic) sectionsWithData.push("metabolic");

    // Data hash for caching
    const dataHash = JSON.stringify({ section, serverHealthData, age, sex }).slice(0, 500);
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

    // No data checks
    if (section !== "overall" && section !== "achievements") {
      const sectionDataMap: Record<string, string> = {
        habits: "habits",
        psychological: "psychological",
        longevity: "longevity",
        "body-composition": "bodyComposition",
        metabolic: "metabolic",
      };
      const dataKey = sectionDataMap[section];
      if (dataKey && !serverHealthData[dataKey]) {
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

    // CRITICAL anti-hallucination instruction
    const antiHallucinationRule = `
REGLA CRÍTICA - PROHIBIDO INVENTAR DATOS:
- Los ÚNICOS datos que existen del paciente son los que aparecen en el JSON a continuación. 
- NO inventes, supongas ni infieras valores que NO están en el JSON.
- Si un marcador NO aparece en los datos, NO lo menciones ni le asignes ningún valor.
- Si un valor de ansiedad, estrés o depresión es BAJO (números bajos), eso es BUENO, no lo reportes como elevado.
- En DASS-21: puntuaciones BAJAS = mejor bienestar. Ansiedad < 8 es normal, 8-9 es leve, 10-14 moderada, 15-19 severa, ≥20 extrema.
- En DASS-21: Estrés < 15 es normal, 15-18 leve, 19-25 moderada, 26-33 severa, ≥34 extrema.
- En DASS-21: Depresión < 10 es normal, 10-13 leve, 14-20 moderada, 21-27 severa, ≥28 extrema.
- En SWLS: puntuación más ALTA = mejor satisfacción.
- Solo incluye en tu respuesta los marcadores que REALMENTE existen en los datos proporcionados.
- La puntuación general solo debe promediar secciones/marcadores con datos reales. NO penalices por datos faltantes.`;

    const percentileInstruction = `
SOBRE PERCENTILES:
- Solo incluye percentiles cuando tengas datos confiables Y conozcas edad y sexo.
- No inventes percentiles. Si no tienes referencia confiable, no lo incluyas.`;

    const trendInstruction = `
SOBRE TENDENCIAS:
- Si hay historial de más de 2 registros, indica la tendencia (mejorando/estable/empeorando).
- Si solo hay 1 registro, no incluyas tendencia.`;

    // Handle individual metric interpretation requests
    if (section.startsWith("interpret-")) {
      const interpretPrompt = `Eres un médico especialista. Interpreta este marcador de salud del paciente de forma breve (2-3 oraciones).
${antiHallucinationRule}
${percentileInstruction}
Contexto del paciente: Edad ${age || 'desconocida'}, Sexo ${sex || 'desconocido'}.
Datos del marcador: ${JSON.stringify(serverHealthData)}
RESPONDE SOLO con texto plano (NO JSON). Incluye percentil solo si tienes datos confiables de referencia para edad y sexo.`;

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
            { role: "user", content: `Interpreta este marcador de forma breve.` },
          ],
        }),
      });

      if (!interpretResponse.ok) {
        throw new Error(`AI error: ${interpretResponse.status}`);
      }

      const interpretResult = await interpretResponse.json();
      const interpretText = interpretResult.choices?.[0]?.message?.content || "No se pudo interpretar.";

      return new Response(JSON.stringify({
        summary: JSON.stringify({ summary: interpretText, score: null }),
        score: null,
        cached: false,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const sectionPrompts: Record<string, string> = {
      overall: `Eres un médico especialista en medicina preventiva. Genera un resumen integral.
${antiHallucinationRule}
${trendInstruction}
${percentileInstruction}

Las ÚNICAS secciones con datos reales son: ${sectionsWithData.join(", ")}. Solo evalúa estas.

RESPONDE en JSON:
{"score": number (0-100, promediando SOLO secciones con datos reales), "summary": "texto 2-3 oraciones", "sections": [{"name": "string", "score": number, "status": "green|yellow|red", "summary": "texto corto"}], "recommendations": ["string"] (máx 3)}`,

      habits: `Eres un especialista en hábitos saludables.
${antiHallucinationRule}
${trendInstruction}
${percentileInstruction}
Solo analiza los marcadores presentes en los datos. No menciones marcadores ausentes.
RESPONDE en JSON: {"score": number(0-100), "summary": "texto", "markers": [{"name": "string", "status": "green|yellow|red", "trend": "improving|stable|declining", "note": "string"}], "recommendations": ["string"]}`,

      psychological: `Eres un psicólogo clínico.
${antiHallucinationRule}
${trendInstruction}
${percentileInstruction}
IMPORTANTE: En DASS-21, valores BAJOS son POSITIVOS (menor patología). No confundas valores bajos con problemas.
Solo analiza los marcadores presentes en los datos.
RESPONDE en JSON: {"score": number(0-100), "summary": "texto", "markers": [{"name": "string", "status": "green|yellow|red", "trend": "improving|stable|declining", "note": "string"}], "recommendations": ["string"]}`,

      longevity: `Eres un especialista en longevidad.
${antiHallucinationRule}
${trendInstruction}
${percentileInstruction}
Solo analiza los marcadores presentes en los datos.
RESPONDE en JSON: {"score": number(0-100), "summary": "texto", "markers": [{"name": "string", "status": "green|yellow|red", "trend": "improving|stable|declining", "note": "string"}], "recommendations": ["string"]}`,

      "body-composition": `Eres un nutricionista deportivo.
${antiHallucinationRule}
${trendInstruction}
${percentileInstruction}
Solo analiza los marcadores presentes en los datos.
RESPONDE en JSON: {"score": number(0-100), "summary": "texto", "markers": [{"name": "string", "status": "green|yellow|red", "trend": "improving|stable|declining", "note": "string"}], "recommendations": ["string"]}`,

      metabolic: `Eres un médico internista.
${antiHallucinationRule}
${trendInstruction}
${percentileInstruction}
Solo analiza los marcadores presentes en los datos.
RESPONDE en JSON: {"score": number(0-100), "summary": "texto", "markers": [{"name": "string", "status": "green|yellow|red", "trend": "improving|stable|declining", "note": "string"}], "recommendations": ["string"]}`,

      achievements: `Eres un coach de bienestar.
${antiHallucinationRule}
RESPONDE en JSON: {"score": number(0-100), "summary": "texto", "highlights": ["string"], "status": "green|yellow|red"}`,
    };

    const systemPrompt = sectionPrompts[section] || sectionPrompts.overall;

    // Build user message with ONLY real data
    const contextParts: string[] = [];
    if (age) contextParts.push(`Edad: ${age} años`);
    if (sex) contextParts.push(`Sexo: ${sex}`);
    contextParts.push(`\nDATOS REALES del paciente (todo lo que NO aparece aquí NO EXISTE):\n${JSON.stringify(serverHealthData, null, 2)}`);

    const userMessage = contextParts.join("\n");

    console.log("Sending to AI - section:", section, "data keys:", Object.keys(serverHealthData));

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
