import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { calculateBiologicalAge, biomarkerReferenceRanges, type BloodBiomarkers } from "@/lib/biological-age";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export type MetricType = 
  | "biological_age"
  | "waist_circumference"
  | "vo2_max"
  | "grip_strength_left"
  | "grip_strength_right"
  | "balance_left"
  | "balance_right"
  | "non_hdl_cholesterol"
  | "hrv";

interface LongevityMetricEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metricType: MetricType;
  targetUserId: string;
  chronologicalAge: number;
  previousValues?: { value: number; date: string }[];
}

const metricLabels: Record<MetricType, { title: string; unit: string; frequency: string }> = {
  biological_age: { title: "Edad Biológica", unit: "años", frequency: "Cada 3 meses" },
  waist_circumference: { title: "Circunferencia de Cintura", unit: "cm", frequency: "Mensual" },
  vo2_max: { title: "VO2 Máx", unit: "ml/kg/min", frequency: "Cada 3 meses" },
  grip_strength_left: { title: "Fuerza Agarre Izq.", unit: "Kg", frequency: "Mensual" },
  grip_strength_right: { title: "Fuerza Agarre Der.", unit: "Kg", frequency: "Mensual" },
  balance_left: { title: "Equilibrio Pierna Izq.", unit: "seg", frequency: "Mensual" },
  balance_right: { title: "Equilibrio Pierna Der.", unit: "seg", frequency: "Mensual" },
  non_hdl_cholesterol: { title: "Colesterol No-HDL", unit: "mg/dL", frequency: "Cada 3 meses" },
  hrv: { title: "VFC (HRV)", unit: "ms", frequency: "Semanal (dispositivo)" },
};

export function LongevityMetricEditor({
  open,
  onOpenChange,
  metricType,
  targetUserId,
  chronologicalAge,
  previousValues = [],
}: LongevityMetricEditorProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [simpleValue, setSimpleValue] = useState("");
  const [biomarkerValues, setBiomarkerValues] = useState<Partial<BloodBiomarkers>>({});
  const label = metricLabels[metricType];

  const handleSaveSimple = async () => {
    const val = parseFloat(simpleValue);
    if (isNaN(val)) { toast.error("Ingresa un valor válido"); return; }
    setSaving(true);
    try {
      if (metricType === "waist_circumference") {
        await supabase.from("profiles").update({ waist_circumference: val }).eq("user_id", targetUserId);
      } else {
        await supabase.from("health_data").insert({
          user_id: targetUserId,
          data_type: metricType,
          value: val,
          unit: label.unit,
          source: "manual",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["health_data", targetUserId] });
      queryClient.invalidateQueries({ queryKey: ["profile", targetUserId] });
      toast.success("Valor guardado correctamente");
      setSimpleValue("");
      onOpenChange(false);
    } catch (e) {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBiomarkers = async () => {
    const required: (keyof BloodBiomarkers)[] = [
      "albumin", "creatinine", "glucose", "crp", "lymphocytePercent",
      "mcv", "rdw", "alkalinePhosphatase", "whiteBloodCellCount"
    ];
    const missing = required.filter(k => !biomarkerValues[k]);
    if (missing.length > 0) { toast.error("Completa todos los biomarcadores"); return; }

    setSaving(true);
    try {
      const fullBiomarkers: BloodBiomarkers = {
        ...(biomarkerValues as BloodBiomarkers),
        chronologicalAge,
      };
      const result = calculateBiologicalAge(fullBiomarkers);

      await supabase.from("biomarkers").insert({
        user_id: targetUserId,
        albumin: fullBiomarkers.albumin,
        creatinine: fullBiomarkers.creatinine,
        glucose: fullBiomarkers.glucose,
        c_reactive_protein: fullBiomarkers.crp,
        lymphocyte_percentage: fullBiomarkers.lymphocytePercent,
        mean_cell_volume: fullBiomarkers.mcv,
        red_cell_distribution_width: fullBiomarkers.rdw,
        alkaline_phosphatase: fullBiomarkers.alkalinePhosphatase,
        white_blood_cell_count: fullBiomarkers.whiteBloodCellCount,
        biological_age: result.phenotypicAge,
        recorded_by: user?.id,
      });

      queryClient.invalidateQueries({ queryKey: ["biomarkers", targetUserId] });
      toast.success(`Edad biológica calculada: ${result.phenotypicAge} años`);
      setBiomarkerValues({});
      onOpenChange(false);
    } catch (e) {
      toast.error("Error al calcular edad biológica");
    } finally {
      setSaving(false);
    }
  };

  const updateBiomarker = (key: keyof BloodBiomarkers, val: string) => {
    setBiomarkerValues(prev => ({ ...prev, [key]: val ? parseFloat(val) : undefined }));
  };

  const biomarkerFields: { key: keyof typeof biomarkerReferenceRanges; label: string }[] = [
    { key: "albumin", label: "Albúmina (g/dL)" },
    { key: "creatinine", label: "Creatinina (mg/dL)" },
    { key: "glucose", label: "Glucosa (mg/dL)" },
    { key: "crp", label: "Proteína C-Reactiva (mg/L)" },
    { key: "lymphocytePercent", label: "Linfocitos (%)" },
    { key: "mcv", label: "VCM (fL)" },
    { key: "rdw", label: "ADE (%)" },
    { key: "alkalinePhosphatase", label: "Fosfatasa Alcalina (IU/L)" },
    { key: "whiteBloodCellCount", label: "Leucocitos (x10³/µL)" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {label.title}
            <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {label.frequency}
            </span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="add" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="add" className="flex-1">Añadir valor</TabsTrigger>
            <TabsTrigger value="history" className="flex-1">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="add" className="space-y-4 mt-4">
            {metricType === "biological_age" ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Ingresa los 9 biomarcadores sanguíneos para calcular la edad biológica.
                </p>
                <div className="grid grid-cols-1 gap-3">
                  {biomarkerFields.map(({ key, label: fieldLabel }) => {
                    const ref = biomarkerReferenceRanges[key];
                    return (
                      <div key={key} className="space-y-1">
                        <Label className="text-xs">{fieldLabel}</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder={`${ref.min} - ${ref.max}`}
                            value={biomarkerValues[key as keyof BloodBiomarkers] ?? ""}
                            onChange={(e) => updateBiomarker(key as keyof BloodBiomarkers, e.target.value)}
                            className="h-9"
                          />
                          <span className="text-xs text-muted-foreground whitespace-nowrap">{ref.unit}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Button onClick={handleSaveBiomarkers} disabled={saving} className="w-full">
                  {saving ? "Calculando..." : "Calcular Edad Biológica"}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>
                    {metricType === "waist_circumference" 
                      ? "Circunferencia de cintura" 
                      : `Nuevo valor de ${label.title}`
                    }
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="Valor"
                      value={simpleValue}
                      onChange={(e) => setSimpleValue(e.target.value)}
                    />
                    <span className="text-sm text-muted-foreground">{label.unit}</span>
                  </div>
                </div>
                <Button onClick={handleSaveSimple} disabled={saving} className="w-full">
                  {saving ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            {previousValues.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Sin registros previos</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {previousValues.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="font-semibold">{entry.value} {label.unit}</span>
                    <span className="text-xs text-muted-foreground">
                      {entry.date ? format(new Date(entry.date), "d MMM yyyy", { locale: es }) : "-"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
