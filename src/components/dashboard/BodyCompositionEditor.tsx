import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/custom-client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Scale } from "lucide-react";

interface BodyCompositionEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUserId: string;
}

const STEP1_FIELDS = [
  { key: "bmi", label: "IMC", unit: "kg/m²" },
  { key: "muscle_mass", label: "Masa Muscular", unit: "kg" },
  { key: "visceral_fat", label: "Grasa Visceral", unit: "nivel" },
  { key: "bmr", label: "Metabolismo Basal (TMB)", unit: "kcal" },
  { key: "metabolic_age", label: "Edad Metabólica", unit: "años" },
] as const;

const STEP2_FIELDS = [
  { key: "body_water_percent", label: "Agua Corporal", unit: "%" },
  { key: "protein", label: "Proteína", unit: "%" },
  { key: "bone_mass", label: "Masa Ósea", unit: "%" },
  { key: "fat_free_mass", label: "Peso Sin Grasa", unit: "kg" },
  { key: "subcutaneous_fat", label: "Grasa Subcutánea", unit: "%" },
  { key: "skeletal_muscle", label: "Músculo Esquelético", unit: "%" },
  { key: "smi", label: "SMI (Índice Músculo Esquelético)", unit: "" },
  { key: "waist_hip_ratio", label: "Relación Cintura-Cadera", unit: "" },
] as const;

const EXTRA_FIELDS = [
  { key: "weight", label: "Peso", unit: "kg" },
  { key: "body_fat_percent", label: "% Grasa Corporal", unit: "%" },
  { key: "body_age", label: "Edad Corporal", unit: "años" },
] as const;

const BODY_TYPE_OPTIONS = ["Muscular", "Normal", "Obeso", "Atlético", "Delgado"];

const ALL_NUMERIC_KEYS = [
  ...STEP1_FIELDS.map(f => f.key),
  ...STEP2_FIELDS.map(f => f.key),
  ...EXTRA_FIELDS.map(f => f.key),
];

export function BodyCompositionEditor({ open, onOpenChange, targetUserId }: BodyCompositionEditorProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});

  const { data: history = [] } = useQuery({
    queryKey: ["body-composition-history", targetUserId],
    queryFn: async () => {
      const { data } = await supabase
        .from("body_composition")
        .select("*")
        .eq("user_id", targetUserId)
        .order("recorded_at", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: open && !!targetUserId,
  });

  const updateValue = (key: string, val: string) => {
    setValues(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = async () => {
    const hasAnyValue = ALL_NUMERIC_KEYS.some(k => values[k]) || values.body_type;
    if (!hasAnyValue) {
      toast.error("Ingresa al menos un valor");
      return;
    }

    setSaving(true);
    try {
      const record: Record<string, unknown> = {
        user_id: targetUserId,
        recorded_by: user?.id,
        source: "manual",
      };

      for (const key of ALL_NUMERIC_KEYS) {
        if (values[key]) {
          record[key] = parseFloat(values[key]);
        }
      }
      if (values.body_type) {
        record.body_type = values.body_type;
      }

      const { error } = await supabase.from("body_composition").insert(record as any);
      if (error) throw error;

      if (values.weight) {
        await supabase.from("profiles").update({ weight: parseFloat(values.weight) }).eq("user_id", targetUserId);
      }

      queryClient.invalidateQueries({ queryKey: ["body-composition-history", targetUserId] });
      queryClient.invalidateQueries({ queryKey: ["body-composition", targetUserId] });
      queryClient.invalidateQueries({ queryKey: ["profile", targetUserId] });
      toast.success("Datos de composición corporal guardados");
      setValues({});
      onOpenChange(false);
    } catch (e) {
      toast.error("Error al guardar los datos");
    } finally {
      setSaving(false);
    }
  };

  const renderNumericField = (field: { key: string; label: string; unit: string }) => (
    <div key={field.key} className="space-y-1">
      <Label className="text-xs">{field.label}</Label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          step="0.1"
          placeholder="Valor"
          value={values[field.key] ?? ""}
          onChange={(e) => updateValue(field.key, e.target.value)}
          className="h-9"
        />
        {field.unit && <span className="text-xs text-muted-foreground whitespace-nowrap">{field.unit}</span>}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Composición Corporal
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="add" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="add" className="flex-1">Añadir medición</TabsTrigger>
            <TabsTrigger value="history" className="flex-1">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="add" className="space-y-4 mt-4">
            {/* Extra fields: weight, body fat, body age */}
            <div className="grid grid-cols-1 gap-3">
              {EXTRA_FIELDS.map(renderNumericField)}
            </div>

            {/* Step 1: Principal data */}
            <div>
              <h4 className="text-sm font-semibold text-primary mb-2">Datos Principales</h4>
              <div className="grid grid-cols-1 gap-3">
                {STEP1_FIELDS.map(renderNumericField)}
              </div>
            </div>

            {/* Step 2: Secondary data */}
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">Datos Secundarios</h4>
              <div className="grid grid-cols-1 gap-3">
                {STEP2_FIELDS.map(renderNumericField)}
              </div>
            </div>

            {/* Step 3: Body Type selector */}
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">Tipo Corporal</h4>
              <Select value={values.body_type || ""} onValueChange={(v) => updateValue("body_type", v)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecciona tipo corporal" />
                </SelectTrigger>
                <SelectContent>
                  {BODY_TYPE_OPTIONS.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Guardando..." : "Guardar Medición"}
            </Button>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Sin registros previos</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {history.map((entry: any) => (
                  <div key={entry.id} className="p-3 rounded-lg bg-muted/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-primary">
                        {format(new Date(entry.recorded_at), "d MMM yyyy, HH:mm", { locale: es })}
                      </span>
                      {entry.weight && (
                        <span className="text-sm font-bold">{entry.weight} kg</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                      {entry.body_fat_percent && <span>Grasa: {entry.body_fat_percent}%</span>}
                      {entry.muscle_mass && <span>Músculo: {entry.muscle_mass} kg</span>}
                      {entry.visceral_fat && <span>Visceral: {entry.visceral_fat}</span>}
                      {entry.bmi && <span>IMC: {entry.bmi}</span>}
                      {entry.metabolic_age && <span>Edad Met.: {entry.metabolic_age}</span>}
                      {entry.body_water_percent && <span>Agua: {entry.body_water_percent}%</span>}
                    </div>
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
