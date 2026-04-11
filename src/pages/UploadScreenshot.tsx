import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Upload, Camera, Check, X, Loader2, FileImage, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAdminMode } from "@/hooks/useAdminMode";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/custom-client";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";

interface ExtractedData {
  screenshot_type: string;
  confidence: number;
  extracted_data: Record<string, number | string>;
  notes: string;
}

const FIELD_LABELS: Record<string, string> = {
  // Arboleaf
  weight_kg: "Peso (kg)",
  body_fat_percent: "Grasa Corporal (%)",
  body_water_percent: "Agua Corporal (%)",
  protein_percent: "Proteína (%)",
  bone_mass_percent: "Masa Ósea (%)",
  body_water_liters: "Agua Corporal (L)",
  protein_kg: "Proteína (kg)",
  body_fat_mass_kg: "Masa Grasa (kg)",
  bone_mass_kg: "Masa Ósea (kg)",
  bmi: "IMC",
  visceral_fat: "Grasa Visceral",
  obesity_percent: "Obesidad (%)",
  muscle_mass_kg: "Masa Muscular (kg)",
  muscle_mass_percent: "Masa Muscular (%)",
  bmr_kcal: "Tasa Metabólica Basal (kcal)",
  fat_free_body_weight_kg: "Peso Libre de Grasa (kg)",
  subcutaneous_fat_percent: "Grasa Subcutánea (%)",
  skeletal_muscle_percent: "Músculo Esquelético (%)",
  skeletal_muscle_kg: "Músculo Esquelético (kg)",
  smi: "SMI",
  waist_hip_ratio: "Ratio Cintura-Cadera",
  metabolic_age: "Edad Metabólica",
  body_type: "Tipo Corporal",
  normal_weight_kg: "Peso Normal (kg)",
  weight_control_kg: "Control de Peso (kg)",
  fat_mass_control_kg: "Control Masa Grasa (kg)",
  muscle_control_kg: "Control Músculo (kg)",
  health_assessment_points: "Evaluación de Salud (pts)",
  // Samsung Health Sleep
  sleep_duration_hours: "Duración de Sueño (hrs)",
  avg_bedtime: "Hora Promedio Acostarse",
  avg_wakeup: "Hora Promedio Despertar",
  deep_sleep_percent: "Sueño Profundo (%)",
  deep_sleep_minutes: "Sueño Profundo (min)",
  light_sleep_percent: "Sueño Ligero (%)",
  light_sleep_minutes: "Sueño Ligero (min)",
  rem_sleep_percent: "Sueño REM (%)",
  rem_sleep_minutes: "Sueño REM (min)",
  awake_count: "Despertares",
  awake_minutes: "Tiempo Despierto (min)",
  avg_heart_rate_bpm: "FC Promedio Sueño (bpm)",
  avg_spo2_percent: "SpO2 Promedio (%)",
  sleep_score: "Puntuación de Sueño",
  // Digital Wellbeing
  screen_time_minutes: "Tiempo en Pantalla (min)",
  screen_time_hours: "Tiempo en Pantalla (hrs)",
  unlock_count: "Desbloqueos",
  notification_count: "Notificaciones",
};

const SCREENSHOT_TYPE_LABELS: Record<string, string> = {
  arboleaf: "Arboleaf — Composición Corporal",
  samsung_health_sleep: "Samsung Health — Sueño",
  digital_wellbeing: "Digital Wellbeing — Pantalla",
  mi_fitness_sleep: "Mi Fitness — Sueño",
  unknown: "Tipo no identificado",
};

export default function UploadScreenshot() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedPatient } = useAdminMode();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const patientId = selectedPatient?.userId;

  const [images, setImages] = useState<{ file: File; preview: string; base64: string }[]>([]);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ExtractedData | null>(null);
  const [editedData, setEditedData] = useState<Record<string, number | string>>({});
  const [saving, setSaving] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newImages = await Promise.all(
      files.slice(0, 3).map(async (file) => {
        const preview = URL.createObjectURL(file);
        const base64 = await fileToBase64(file);
        return { file, preview, base64 };
      })
    );

    setImages(prev => [...prev, ...newImages].slice(0, 3));
    setResult(null);
    setEditedData({});
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]); // Remove data:image/...;base64, prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setResult(null);
    setEditedData({});
  };

  const processImages = async () => {
    if (images.length === 0) return;
    setProcessing(true);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const response = await fetch(
        "https://huxadvolwgfdjgsnraxm.supabase.co/functions/v1/process-screenshot",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            images: images.map(img => ({
              base64: img.base64,
              mediaType: img.file.type || "image/jpeg",
            })),
            patientId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error processing screenshot");
      }

      setResult(data);
      setEditedData(data.extracted_data || {});
      toast.success(`${Object.keys(data.extracted_data || {}).length} valores extraídos`);
    } catch (error: any) {
      toast.error("Error al procesar", { description: error.message });
    } finally {
      setProcessing(false);
    }
  };

  const saveData = async () => {
    if (!patientId || !result || !user) return;
    setSaving(true);

    try {
      const now = new Date().toISOString();
      const type = result.screenshot_type;

      if (type === "arboleaf") {
        // Save to body_composition
        const bodyComp: Record<string, any> = {
          user_id: patientId,
          recorded_at: now,
          recorded_by: user.id,
          source: "screenshot_ocr",
        };

        const fieldMap: Record<string, string> = {
          weight_kg: "weight",
          body_fat_percent: "body_fat_percent",
          bmi: "bmi",
          muscle_mass_kg: "muscle_mass",
          visceral_fat: "visceral_fat",
          body_water_percent: "body_water_percent",
          bone_mass_kg: "bone_mass",
          bmr_kcal: "bmr",
          metabolic_age: "metabolic_age",
          fat_free_body_weight_kg: "fat_free_mass",
          subcutaneous_fat_percent: "subcutaneous_fat",
          protein_percent: "protein",
          body_type: "body_type",
          skeletal_muscle_kg: "skeletal_muscle",
          smi: "smi",
          waist_hip_ratio: "waist_hip_ratio",
        };

        for (const [extractedKey, dbKey] of Object.entries(fieldMap)) {
          if (editedData[extractedKey] !== undefined && editedData[extractedKey] !== "") {
            bodyComp[dbKey] = typeof editedData[extractedKey] === "string" 
              ? editedData[extractedKey] 
              : Number(editedData[extractedKey]);
          }
        }

        const { error } = await supabase.from("body_composition").insert(bodyComp);
        if (error) throw error;

        toast.success("Composición corporal guardada");

      } else if (type === "samsung_health_sleep" || type === "mi_fitness_sleep") {
        // Save sleep data to health_data
        const sleepFields: Record<string, { type: string; unit: string }> = {
          deep_sleep_minutes: { type: "sleep_deep", unit: "min" },
          light_sleep_minutes: { type: "sleep_light", unit: "min" },
          rem_sleep_minutes: { type: "sleep_rem", unit: "min" },
          awake_minutes: { type: "sleep_awake", unit: "min" },
          avg_heart_rate_bpm: { type: "resting_heart_rate", unit: "bpm" },
          avg_spo2_percent: { type: "sleep_spo2", unit: "%" },
          sleep_score: { type: "sleep_score", unit: "score" },
        };

        for (const [key, config] of Object.entries(sleepFields)) {
          if (editedData[key] !== undefined && Number(editedData[key]) > 0) {
            await supabase.from("health_data").insert({
              user_id: patientId,
              data_type: config.type,
              value: Number(editedData[key]),
              unit: config.unit,
              recorded_at: now,
              source: "screenshot_ocr",
            });
          }
        }

        toast.success("Datos de sueño guardados");

      } else if (type === "digital_wellbeing") {
        // Save screen time and unlocks
        if (editedData.screen_time_minutes && Number(editedData.screen_time_minutes) > 0) {
          await supabase.from("health_data").insert({
            user_id: patientId,
            data_type: "screen_time",
            value: Number(editedData.screen_time_minutes),
            unit: "min",
            recorded_at: now,
            source: "screenshot_ocr",
          });
        }
        if (editedData.unlock_count && Number(editedData.unlock_count) > 0) {
          await supabase.from("health_data").insert({
            user_id: patientId,
            data_type: "phone_unlocks",
            value: Number(editedData.unlock_count),
            unit: "count",
            recorded_at: now,
            source: "screenshot_ocr",
          });
        }

        toast.success("Datos de pantalla guardados");
      } else {
        toast.error("Tipo de captura no soportado para guardado automático");
        setSaving(false);
        return;
      }

      // Clear state after save
      setImages([]);
      setResult(null);
      setEditedData({});
      
    } catch (error: any) {
      toast.error("Error al guardar", { description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: string, value: string) => {
    setEditedData(prev => ({
      ...prev,
      [key]: isNaN(Number(value)) ? value : Number(value),
    }));
  };

  if (!selectedPatient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No hay paciente seleccionado</p>
          <Button className="mt-4" onClick={() => navigate("/professional")}>Volver</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Subir Captura de Pantalla" backTo="/professional/history" />

      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        {/* Patient Info */}
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Paciente:</p>
          <p className="font-display font-bold">{selectedPatient.fullName}</p>
        </Card>

        {/* Upload Area */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            {images.length === 0 ? (
              <div
                className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="font-display font-semibold text-lg mb-2">Sube capturas de pantalla</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Arboleaf, Samsung Health Sleep, o Digital Wellbeing
                </p>
                <p className="text-xs text-muted-foreground">
                  Máximo 3 imágenes. No usar scroll largo — tomar capturas parciales.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {images.map((img, i) => (
                    <div key={i} className="relative">
                      <img src={img.preview} alt={`Screenshot ${i + 1}`} className="rounded-lg w-full h-40 object-cover" />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {images.length < 3 && (
                    <div
                      className="border-2 border-dashed border-muted-foreground/30 rounded-lg h-40 flex items-center justify-center cursor-pointer hover:border-primary/50"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <Button
                  className="w-full"
                  onClick={processImages}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analizando con IA...
                    </>
                  ) : (
                    <>
                      <FileImage className="h-4 w-4 mr-2" />
                      Analizar {images.length} imagen{images.length > 1 ? "es" : ""}
                    </>
                  )}
                </Button>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Results */}
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display font-bold text-lg">
                    {SCREENSHOT_TYPE_LABELS[result.screenshot_type] || result.screenshot_type}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Confianza: {Math.round((result.confidence || 0) * 100)}% · {Object.keys(editedData).length} valores
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  (result.confidence || 0) > 0.8 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                }`}>
                  {(result.confidence || 0) > 0.8 ? "Alta" : "Media"}
                </div>
              </div>

              {result.notes && (
                <p className="text-sm text-muted-foreground mb-4 p-3 bg-muted/50 rounded-lg">
                  {result.notes}
                </p>
              )}

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {Object.entries(editedData).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-3">
                    <label className="text-sm font-medium w-1/2 text-right">
                      {FIELD_LABELS[key] || key}
                    </label>
                    <input
                      type={typeof value === "string" && isNaN(Number(value)) ? "text" : "number"}
                      step="0.01"
                      value={value}
                      onChange={(e) => updateField(key, e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-lg text-sm bg-background"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  className="flex-1"
                  onClick={saveData}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {saving ? "Guardando..." : "Confirmar y Guardar"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setResult(null); setEditedData({}); }}
                >
                  Cancelar
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
}
