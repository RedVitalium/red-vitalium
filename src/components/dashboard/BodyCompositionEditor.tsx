import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const FIELDS = [
  { key: "weight", label: "Peso", unit: "kg" },
  { key: "body_fat_percent", label: "% Grasa Corporal", unit: "%" },
  { key: "visceral_fat", label: "Grasa Visceral", unit: "nivel" },
  { key: "subcutaneous_fat", label: "Grasa Subcutánea", unit: "%" },
  { key: "muscle_mass", label: "Masa Muscular", unit: "%" },
  { key: "fat_free_mass", label: "Masa Libre de Grasa", unit: "kg" },
  { key: "bone_mass", label: "Masa Ósea", unit: "kg" },
  { key: "body_water_percent", label: "Agua Corporal", unit: "%" },
  { key: "protein", label: "Proteína", unit: "%" },
  { key: "bmi", label: "IMC", unit: "kg/m²" },
  { key: "bmr", label: "Metabolismo Basal", unit: "kcal" },
  { key: "metabolic_age", label: "Edad Metabólica", unit: "años" },
  { key: "body_age", label: "Edad Corporal", unit: "años" },
  { key: "body_type", label: "Tipo Corporal", unit: "" },
] as const;

type FieldKey = typeof FIELDS[number]["key"];

export function BodyCompositionEditor({ open, onOpenChange, targetUserId }: BodyCompositionEditorProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});

  // Fetch history
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
    const numericFields = FIELDS.filter(f => f.key !== "body_type");
    const hasAnyValue = numericFields.some(f => values[f.key]) || values.body_type;
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

      for (const field of numericFields) {
        if (values[field.key]) {
          record[field.key] = parseFloat(values[field.key]);
        }
      }
      if (values.body_type) {
        record.body_type = values.body_type;
      }

      const { error } = await supabase.from("body_composition").insert(record as any);
      if (error) throw error;

      // Also update weight in profiles if provided
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

          <TabsContent value="add" className="space-y-3 mt-4">
            <p className="text-sm text-muted-foreground">
              Ingresa los valores de la última medición de la báscula. Solo los campos con valor serán guardados.
            </p>
            <div className="grid grid-cols-1 gap-3">
              {FIELDS.map(({ key, label, unit }) => (
                <div key={key} className="space-y-1">
                  <Label className="text-xs">{label}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type={key === "body_type" ? "text" : "number"}
                      step="0.1"
                      placeholder={key === "body_type" ? "Ej: Grasa Oculta" : "Valor"}
                      value={values[key] ?? ""}
                      onChange={(e) => updateValue(key, e.target.value)}
                      className="h-9"
                    />
                    {unit && <span className="text-xs text-muted-foreground whitespace-nowrap">{unit}</span>}
                  </div>
                </div>
              ))}
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
                      {entry.muscle_mass && <span>Músculo: {entry.muscle_mass}%</span>}
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
