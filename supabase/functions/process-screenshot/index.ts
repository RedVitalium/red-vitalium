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

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Not authenticated");

    // Parse request
    const { images, patientId } = await req.json();
    if (!images || !Array.isArray(images) || images.length === 0) {
      throw new Error("No images provided");
    }
    if (!patientId) throw new Error("No patientId provided");

    console.log(`Processing ${images.length} screenshot(s) for patient ${patientId}`);

    // Build the vision prompt
    const systemPrompt = `Eres un asistente de extracción de datos médicos para Red Vitalium, una plataforma de salud.

Tu trabajo es analizar capturas de pantalla de apps de salud y extraer TODOS los valores numéricos visibles.

Debes identificar el TIPO de captura:
1. "arboleaf" — App de báscula Arboleaf (composición corporal: peso, grasa, músculo, agua, hueso, BMI, etc.)
2. "samsung_health_sleep" — Samsung Health sección de sueño (horas dormidas, fases, SpO2 nocturno, FC promedio)
3. "digital_wellbeing" — Digital Wellbeing de Android (tiempo en pantalla, desbloqueos, notificaciones, apps)
4. "mi_fitness_sleep" — Mi Fitness/Xiaomi sección de sueño
5. "unknown" — Si no puedes identificar la app

RESPONDE ÚNICAMENTE con un JSON válido, sin markdown, sin backticks, sin explicación. El formato es:

{
  "screenshot_type": "arboleaf|samsung_health_sleep|digital_wellbeing|mi_fitness_sleep|unknown",
  "confidence": 0.95,
  "extracted_data": {
    "campo": valor_numerico,
    ...
  },
  "notes": "observaciones relevantes"
}

REGLAS DE EXTRACCIÓN:

Para ARBOLEAF:
- weight_kg: peso en kilogramos
- body_fat_percent: porcentaje de grasa corporal
- body_water_percent: porcentaje de agua corporal (del donut chart, NO el de litros)
- protein_percent: porcentaje de proteína (del donut chart)
- bone_mass_percent: porcentaje de masa ósea (del donut chart)
- body_water_liters: agua corporal en litros (de la tabla con barras)
- protein_kg: proteína en kg
- body_fat_mass_kg: masa grasa en kg
- bone_mass_kg: masa ósea en kg
- bmi: índice de masa corporal
- visceral_fat: grasa visceral (número entero, sin unidad)
- obesity_percent: porcentaje de obesidad
- muscle_mass_kg: masa muscular en kg
- muscle_mass_percent: porcentaje de masa muscular
- bmr_kcal: tasa metabólica basal en kcal
- fat_free_body_weight_kg: peso libre de grasa en kg
- subcutaneous_fat_percent: porcentaje de grasa subcutánea
- skeletal_muscle_percent: porcentaje de músculo esquelético
- skeletal_muscle_kg: músculo esquelético en kg
- smi: índice de músculo esquelético
- waist_hip_ratio: ratio cintura-cadera
- metabolic_age: edad metabólica (años)
- body_type: tipo corporal (texto: "Muscular", "Normal", "Obese", etc.)
- normal_weight_kg: peso normal recomendado
- weight_control_kg: control de peso (puede ser negativo)
- fat_mass_control_kg: control de masa grasa (puede ser negativo)
- muscle_control_kg: control de músculo (puede ser negativo o +0)
- health_assessment_points: puntuación de evaluación de salud

Para SAMSUNG HEALTH SLEEP:
- sleep_duration_hours: duración total del sueño en horas (valor principal grande)
- avg_bedtime: hora promedio de acostarse (formato "HH:MM AM/PM")
- avg_wakeup: hora promedio de despertar (formato "HH:MM AM/PM")
- deep_sleep_percent: porcentaje de sueño profundo
- deep_sleep_minutes: minutos de sueño profundo
- light_sleep_percent: porcentaje de sueño ligero
- light_sleep_minutes: minutos de sueño ligero
- rem_sleep_percent: porcentaje de sueño REM
- rem_sleep_minutes: minutos de sueño REM
- awake_count: número de despertares
- awake_minutes: minutos despierto
- avg_heart_rate_bpm: frecuencia cardíaca promedio durante el sueño
- avg_spo2_percent: SpO2 promedio durante el sueño
- sleep_score: puntuación de sueño (si visible)

Para DIGITAL WELLBEING:
- screen_time_minutes: tiempo total en pantalla en minutos
- screen_time_hours: tiempo en pantalla en horas (si muestra "Xh Ym")
- unlock_count: número de desbloqueos
- notification_count: número de notificaciones
- top_apps: objeto con las apps más usadas {"nombre_app": minutos}

IMPORTANTE:
- Si un valor no es visible o legible, NO lo incluyas
- Usa números, no strings, para valores numéricos
- Para porcentajes, usa el número sin el símbolo % (ej: 20.5 no "20.5%")
- Si hay múltiples screenshots, combina los datos de todos en un solo JSON
- Si ves la misma métrica en diferentes partes de la imagen con valores diferentes, usa el más detallado`;

    // Build content array with all images
    const content: any[] = [];
    
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
        ? `Analiza estas ${images.length} capturas de pantalla y extrae todos los valores numéricos. Son del mismo reporte/sesión.`
        : "Analiza esta captura de pantalla y extrae todos los valores numéricos visibles.",
    });

    // Call Claude Sonnet Vision
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
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: "user", content }],
      }),
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      console.error("Anthropic Vision error:", resp.status, errorText);
      throw new Error(`Vision API error: ${resp.status}`);
    }

    const result = await resp.json();
    const rawText = result.content?.[0]?.text || "";
    console.log("Vision raw response:", rawText.substring(0, 200));

    // Parse the JSON response
    let parsedData;
    try {
      const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/) || rawText.match(/({[\s\S]*})/);
      parsedData = JSON.parse(jsonMatch ? jsonMatch[1] : rawText);
    } catch {
      parsedData = { screenshot_type: "unknown", confidence: 0, extracted_data: {}, notes: "Failed to parse AI response: " + rawText.substring(0, 100) };
    }

    console.log("Parsed screenshot type:", parsedData.screenshot_type, "confidence:", parsedData.confidence);
    console.log("Extracted fields:", Object.keys(parsedData.extracted_data || {}).length);

    return new Response(
      JSON.stringify({
        success: true,
        ...parsedData,
      }),
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
