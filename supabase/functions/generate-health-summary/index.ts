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

    const { section, targetUserId, healthData } = await req.json();
    
    // Determine the user whose data we're summarizing
    const dataUserId = targetUserId || user.id;

    // Fetch profile for age/sex context
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", dataUserId)
      .maybeSingle();

    const age = profile?.date_of_birth 
      ? Math.floor((Date.now() - new Date(profile.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null;
    const sex = profile?.sex || null;

    // Build data hash to check if we need a new summary
    const dataHash = JSON.stringify({ section, healthData, age, sex }).slice(0, 500);
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

    // Build system prompt based on section
    const sectionPrompts: Record<string, string> = {
      overall: `Eres un médico especialista en medicina preventiva y longevidad. Genera un resumen integral de salud del paciente. 
Incluye:
1. Una puntuación general de salud (0-100)
2. Un párrafo resumen general (2-3 oraciones)
3. Resúmenes por sección con puntuación (0-100) y estado (verde/amarillo/rojo) para: Hábitos, Bienestar Psicológico, Longevidad, Composición Corporal, Marcadores Metabólicos
4. Recomendaciones priorizadas (máx 3)

RESPONDE EXCLUSIVAMENTE en JSON con este formato:
{
  "score": number,
  "summary": "texto resumen general",
  "sections": [
    {"name": "string", "score": number, "status": "green|yellow|red", "summary": "texto corto"}
  ],
  "recommendations": ["string"]
}`,
      achievements: `Eres un coach de bienestar. Analiza los logros y progreso del paciente. Resume qué ha logrado, tendencias de mejora, y motivación. 
RESPONDE en JSON: {"score": number(0-100), "summary": "texto", "highlights": ["string"], "status": "green|yellow|red"}`,
      habits: `Eres un especialista en hábitos saludables. Analiza los hábitos del paciente (sueño, actividad física, tiempo en pantalla, etc). Evalúa tendencias y da recomendaciones.
RESPONDE en JSON: {"score": number(0-100), "summary": "texto", "markers": [{"name": "string", "status": "green|yellow|red", "trend": "improving|stable|declining", "note": "string"}], "recommendations": ["string"]}`,
      psychological: `Eres un psicólogo clínico. Analiza los indicadores de bienestar psicológico (ansiedad, estrés, depresión, satisfacción vital). Evalúa tendencias y riesgos.
RESPONDE en JSON: {"score": number(0-100), "summary": "texto", "markers": [{"name": "string", "status": "green|yellow|red", "trend": "improving|stable|declining", "note": "string"}], "recommendations": ["string"]}`,
      longevity: `Eres un especialista en longevidad. Analiza marcadores de longevidad (edad biológica, VO2 max, fuerza de agarre, equilibrio, VFC, colesterol). Evalúa tendencias.
RESPONDE en JSON: {"score": number(0-100), "summary": "texto", "markers": [{"name": "string", "status": "green|yellow|red", "trend": "improving|stable|declining", "note": "string"}], "recommendations": ["string"]}`,
      "body-composition": `Eres un nutricionista deportivo. Analiza la composición corporal (grasa, músculo, agua, metabolismo). Evalúa estado actual y tendencias.
RESPONDE en JSON: {"score": number(0-100), "summary": "texto", "markers": [{"name": "string", "status": "green|yellow|red", "trend": "improving|stable|declining", "note": "string"}], "recommendations": ["string"]}`,
      metabolic: `Eres un médico internista. Analiza los marcadores metabólicos sanguíneos (glucosa, HbA1c, colesterol, triglicéridos, PCR). Evalúa riesgos.
RESPONDE en JSON: {"score": number(0-100), "summary": "texto", "markers": [{"name": "string", "status": "green|yellow|red", "trend": "improving|stable|declining", "note": "string"}], "recommendations": ["string"]}`,
    };

    const systemPrompt = sectionPrompts[section] || sectionPrompts.overall;

    const contextParts: string[] = [];
    if (age) contextParts.push(`Edad: ${age} años`);
    if (sex) contextParts.push(`Sexo: ${sex}`);
    contextParts.push(`\nDatos de salud disponibles:\n${JSON.stringify(healthData, null, 2)}`);
    contextParts.push(`\nIMPORTANTE: 
- Ajusta las referencias y evaluaciones según el sexo y la edad del paciente.
- Si hay datos de más de 2 meses, prioriza la TENDENCIA (si está mejorando o no) como factor principal.
- Si no hay suficientes datos en algún área, indícalo y no inventes valores.
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
    
    // Parse JSON from AI response (may be wrapped in markdown code block)
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
