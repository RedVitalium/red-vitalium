import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Not authenticated");

    const { images, patientId } = await req.json();
    if (!images || !Array.isArray(images) || images.length === 0) {
      throw new Error("No images provided");
    }
    if (!patientId) throw new Error("No patientId provided");

    console.log("Processing " + images.length + " screenshot(s) for patient " + patientId);

    const systemPrompt = [
      "Eres un asistente de extraccion de datos medicos para Red Vitalium.",
      "Analiza capturas de pantalla de apps de salud y extrae TODOS los valores numericos visibles.",
      "",
      "Identifica el TIPO de captura:",
      '1. "arboleaf" - App de bascula Arboleaf (composicion corporal)',
      '2. "samsung_health_sleep" - Samsung Health seccion de sueno',
      '3. "digital_wellbeing" - Digital Wellbeing de Android',
      '4. "mi_fitness_sleep" - Mi Fitness/Xiaomi seccion de sueno',
      '5. "unknown" - Si no puedes identificar la app',
      "",
      "RESPONDE UNICAMENTE con JSON valido. Sin markdown, sin backticks.",
      "",
      "{",
      '  "screenshot_type": "arboleaf",',
      '  "confidence": 0.95,',
      '  "extracted_data": { "campo": valor },',
      '  "notes": "observaciones"',
      "}",
      "",
      "=== ARBOLEAF: COMPOSICION CORPORAL ===",
      "weight_kg, body_fat_percent, body_water_percent, protein_percent, bone_mass_percent,",
      "body_water_liters, protein_kg, body_fat_mass_kg, bone_mass_kg, bmi, visceral_fat,",
      "obesity_percent, muscle_mass_kg, muscle_mass_percent, bmr_kcal, fat_free_body_weight_kg,",
      "subcutaneous_fat_percent, subcutaneous_fat_kg, skeletal_muscle_percent, skeletal_muscle_kg,",
      "smi, waist_hip_ratio, metabolic_age, body_type (texto), normal_weight_kg,",
      "weight_control_kg, fat_mass_control_kg, muscle_control_kg, health_assessment_points",
      "",
      "=== ARBOLEAF: MUSCLE BALANCE (segmental) ===",
      "Para cada segmento: masa_kg, porcentaje_cuerpo, comparado_vs_normal (%), estado (Normal/High/Low)",
      "Segmentos: left_upper_extremity, right_upper_extremity, trunk, left_lower_extremity, right_lower_extremity",
      "",
      "Campos musculo:",
      "left_upper_extremity_muscle_mass_kg, left_upper_extremity_muscle_mass_percent, left_upper_extremity_muscle_compared, left_upper_extremity_muscle_status,",
      "right_upper_extremity_muscle_mass_kg, right_upper_extremity_muscle_mass_percent, right_upper_extremity_muscle_compared, right_upper_extremity_muscle_status,",
      "trunk_muscle_mass_kg, trunk_muscle_mass_percent, trunk_muscle_compared, trunk_muscle_status,",
      "left_lower_extremity_muscle_mass_kg, left_lower_extremity_muscle_mass_percent, left_lower_extremity_muscle_compared, left_lower_extremity_muscle_status,",
      "right_lower_extremity_muscle_mass_kg, right_lower_extremity_muscle_mass_percent, right_lower_extremity_muscle_compared, right_lower_extremity_muscle_status",
      "",
      "=== ARBOLEAF: SEGMENTAL FAT ===",
      "left_upper_extremity_fat_mass_kg, left_upper_extremity_fat_percent, left_upper_extremity_fat_compared, left_upper_extremity_fat_status,",
      "right_upper_extremity_fat_mass_kg, right_upper_extremity_fat_percent, right_upper_extremity_fat_compared, right_upper_extremity_fat_status,",
      "trunk_fat_mass_kg, trunk_fat_percent, trunk_fat_compared, trunk_fat_status,",
      "left_lower_extremity_fat_mass_kg, left_lower_extremity_fat_percent, left_lower_extremity_fat_compared, left_lower_extremity_fat_status,",
      "right_lower_extremity_fat_mass_kg, right_lower_extremity_fat_percent, right_lower_extremity_fat_compared, right_lower_extremity_fat_status",
      "",
      "=== SAMSUNG HEALTH SLEEP ===",
      "sleep_duration_hours, deep_sleep_percent, deep_sleep_minutes, light_sleep_percent,",
      "light_sleep_minutes, rem_sleep_percent, rem_sleep_minutes, awake_count, awake_minutes,",
      "avg_heart_rate_bpm, avg_spo2_percent, sleep_score",
      "",
      "=== DIGITAL WELLBEING ===",
      "screen_time_minutes, unlock_count, notification_count",
      "",
      "REGLAS:",
      "- Solo incluir valores visibles y legibles",
      "- Numeros sin simbolo % (ej: 20.5 no \"20.5%\")",
      "- Multiples screenshots = combinar en un solo JSON",
      "- Misma metrica en distintas partes = usar el mas detallado",
      '- Status segmental: exactamente "Normal", "High", o "Low"',
    ].join("\n");

    const content = [];
    for (let i = 0; i < images.length; i++) {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: images[i].mediaType || "image/jpeg",
          data: images[i].base64,
        },
      });
    }
    content.push({
      type: "text",
      text: images.length > 1
        ? "Analiza estas " + images.length + " capturas y extrae TODOS los valores. Incluye datos segmentales de musculo y grasa si son visibles."
        : "Analiza esta captura y extrae TODOS los valores numericos visibles. Incluye segmentales si son visibles.",
    });

    console.log("Calling Claude Sonnet Vision...");
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content }],
      }),
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      console.error("Anthropic Vision error:", resp.status, errorText);
      throw new Error("Vision API error: " + resp.status);
    }

    const result = await resp.json();
    const rawText = result.content?.[0]?.text || "";
    console.log("Vision raw response:", rawText.substring(0, 300));

    let parsedData;
    try {
      const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/) || rawText.match(/({[\s\S]*})/);
      parsedData = JSON.parse(jsonMatch ? jsonMatch[1] : rawText);
    } catch {
      parsedData = {
        screenshot_type: "unknown",
        confidence: 0,
        extracted_data: {},
        notes: "Failed to parse AI response: " + rawText.substring(0, 100),
      };
    }

    const fieldCount = Object.keys(parsedData.extracted_data || {}).length;
    console.log("Parsed type:", parsedData.screenshot_type, "confidence:", parsedData.confidence, "fields:", fieldCount);

    return new Response(
      JSON.stringify({ success: true, ...parsedData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("process-screenshot error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
