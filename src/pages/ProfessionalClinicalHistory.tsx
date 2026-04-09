import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { 
  Brain, Apple, Stethoscope, Dumbbell,
  Plus, Edit2, Save, X, User, FileText, Sparkles, Pill
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAdminMode } from "@/hooks/useAdminMode";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles, specialtyLabels, Specialty } from "@/hooks/useUserRoles";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/custom-client";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { PageHeader } from "@/components/PageHeader";
import { useEffect } from "react";
import ClinicalAISummaryTab from "@/components/professional/ClinicalAISummaryTab";

const clinicalSections: { id: Specialty; label: string; icon: React.ElementType }[] = [
  { id: 'psychology', label: 'Psicológico', icon: Brain },
  { id: 'nutrition', label: 'Alimentación', icon: Apple },
  { id: 'medicine', label: 'Médico', icon: Stethoscope },
  { id: 'physiotherapy', label: 'Físico', icon: Dumbbell },
];

interface ProfessionalNote {
  id: string;
  content: string;
  note_type: string;
  specialty: Specialty;
  is_visible_to_others: boolean;
  created_at: string;
  updated_at: string;
  professional_id: string;
}

export default function ProfessionalClinicalHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedPatient, isViewingAsAdmin } = useAdminMode();
  const { professionalData } = useUserRoles();
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState("");
  const [isVisibleToOthers, setIsVisibleToOthers] = useState(true);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [showMedDialog, setShowMedDialog] = useState(false);
  const [medForm, setMedForm] = useState({ medication_name: "", dosage: "", frequency: "", start_date: "", notes: "" });

  useEffect(() => {
    if (!isViewingAsAdmin || !selectedPatient) {
      navigate('/professional');
    }
  }, [isViewingAsAdmin, selectedPatient, navigate]);

  const { data: professionalId } = useQuery({
    queryKey: ['professional-id', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('professionals')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle();
      return data?.id || null;
    },
    enabled: !!user,
  });

  const { data: notes = [] } = useQuery({
    queryKey: ['professional-notes', selectedPatient?.userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('professional_notes')
        .select('*')
        .eq('patient_id', selectedPatient!.userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ProfessionalNote[];
    },
    enabled: !!selectedPatient,
  });

  const { data: medications = [] } = useQuery({
    queryKey: ['patient-medications', selectedPatient?.userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patient_medications')
        .select('*')
        .eq('user_id', selectedPatient!.userId)
        .order('is_active', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedPatient,
  });

  // Fetch BFI-10 personality test results for the patient
  const { data: bfiResult } = useQuery({
    queryKey: ['bfi-result', selectedPatient?.userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('test_results')
        .select('*')
        .eq('user_id', selectedPatient!.userId)
        .eq('test_id', 'bfi-10')
        .order('completed_at', { ascending: false })
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedPatient,
  });

  // Check if the professional is assigned to this patient
  const { data: isAssigned } = useQuery({
    queryKey: ['is-assigned', professionalId, selectedPatient?.userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('patient_professionals')
        .select('id')
        .eq('professional_id', professionalId!)
        .eq('patient_id', selectedPatient!.userId)
        .eq('is_active', true)
        .maybeSingle();
      return !!data;
    },
    enabled: !!professionalId && !!selectedPatient,
  });

  const addNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!professionalId || !selectedPatient || !professionalData) throw new Error("Missing data");
      const { error } = await supabase.from('professional_notes').insert({
        patient_id: selectedPatient.userId,
        professional_id: professionalId,
        specialty: professionalData.specialty,
        content,
        note_type: 'clinical',
        is_visible_to_others: isVisibleToOthers,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional-notes'] });
      setNewNote("");
      toast.success("Nota agregada a la historia clínica");
    },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const { error } = await supabase.from('professional_notes')
        .update({ content })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional-notes'] });
      setEditingNoteId(null);
      toast.success("Nota actualizada");
    },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const addMedMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPatient) throw new Error("No patient selected");
      const { error } = await supabase.from('patient_medications').insert({
        user_id: selectedPatient.userId,
        medication_name: medForm.medication_name,
        dosage: medForm.dosage || null,
        frequency: medForm.frequency || null,
        start_date: medForm.start_date || null,
        notes: medForm.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-medications'] });
      setShowMedDialog(false);
      setMedForm({ medication_name: "", dosage: "", frequency: "", start_date: "", notes: "" });
      toast.success("Medicación registrada");
    },
    onError: (e) => toast.error("Error: " + e.message),
  });

  if (!selectedPatient || !professionalData) return null;

  const mySpecialty = professionalData.specialty;

  const specialtyColors: Record<Specialty, string> = {
    psychology: 'border-l-blue-500',
    nutrition: 'border-l-green-500',
    medicine: 'border-l-red-500',
    physiotherapy: 'border-l-orange-500',
  };

  const specialtyBadgeColors: Record<Specialty, string> = {
    psychology: 'bg-blue-100 text-blue-700',
    nutrition: 'bg-green-100 text-green-700',
    medicine: 'bg-red-100 text-red-700',
    physiotherapy: 'bg-orange-100 text-orange-700',
  };

  const traitLabels: Record<string, string> = {
    extraversion: "Extraversión",
    agreeableness: "Amabilidad",
    conscientiousness: "Responsabilidad",
    neuroticism: "Neuroticismo",
    openness: "Apertura",
  };

  const renderPersonalityResults = () => {
    if (!bfiResult) {
      return (
        <Card className="p-4 mb-4 bg-muted/30">
          <p className="text-sm text-muted-foreground text-center">
            El paciente aún no ha completado el test de personalidad (BFI-10)
          </p>
        </Card>
      );
    }

    const scores = bfiResult.scores as Record<string, number>;

    return (
      <Card className="p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            Perfil de Personalidad (BFI-10)
          </h3>
          <span className="text-xs text-muted-foreground">
            {format(new Date(bfiResult.completed_at), "d MMM yyyy", { locale: es })}
          </span>
        </div>
        <div className="space-y-3">
          {Object.entries(traitLabels).map(([key, label]) => {
            const value = scores[key] || 0;
            const percentage = (value / 5) * 100;
            return (
              <div key={key}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-foreground">{value.toFixed(1)} / 5</span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })}
        </div>
      </Card>
    );
  };

  const renderNotesForSpecialty = (specialty: Specialty) => {
    const sectionNotes = notes.filter(n => 
      n.specialty === specialty || (n.specialty !== specialty && n.is_visible_to_others)
    );
    const isMySpecialty = specialty === mySpecialty;

    return (
      <div className="space-y-4">
        {isMySpecialty && (
          <Card className="p-4">
            <Textarea
              placeholder="Escribir nueva nota clínica..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="mb-3"
              rows={3}
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id="visible-toggle"
                  checked={isVisibleToOthers}
                  onCheckedChange={setIsVisibleToOthers}
                />
                <Label htmlFor="visible-toggle" className="text-xs text-muted-foreground cursor-pointer">
                  Visible para otros profesionales
                </Label>
              </div>
              <Button
                size="sm"
                onClick={() => addNoteMutation.mutate(newNote)}
                disabled={!newNote.trim() || addNoteMutation.isPending}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Agregar
              </Button>
            </div>
          </Card>
        )}

        {sectionNotes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No hay notas en esta sección
          </p>
        ) : (
          <div className="space-y-3">
            {sectionNotes.map(note => {
              const isOwn = note.professional_id === professionalId;
              const isFromOtherSpecialty = note.specialty !== specialty;
              return (
                <Card 
                  key={note.id} 
                  className={`p-4 ${!isOwn ? 'bg-muted/30' : ''} ${isFromOtherSpecialty ? `border-l-4 ${specialtyColors[note.specialty]}` : ''}`}
                >
                  {editingNoteId === note.id ? (
                    <div>
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        className="mb-2"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => updateNoteMutation.mutate({ id: note.id, content: editContent })} disabled={updateNoteMutation.isPending} className="gap-1">
                          <Save className="h-3 w-3" /> Guardar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingNoteId(null)} className="gap-1">
                          <X className="h-3 w-3" /> Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {isFromOtherSpecialty && (
                        <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full mb-2 ${specialtyBadgeColors[note.specialty]}`}>
                          {specialtyLabels[note.specialty]}
                        </span>
                      )}
                      <p className="text-sm text-foreground whitespace-pre-wrap">{note.content}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(note.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                        </p>
                        {isOwn && (
                          <Button size="sm" variant="ghost" onClick={() => { setEditingNoteId(note.id); setEditContent(note.content); }} className="gap-1 h-7 text-xs">
                            <Edit2 className="h-3 w-3" /> Editar
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderMedicationsTab = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center gap-2 mb-4">
        <Pill className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-display font-bold text-foreground">Medicación</h2>
        {isAssigned && (
          <Button size="sm" variant="outline" className="ml-auto gap-1" onClick={() => setShowMedDialog(true)}>
            <Plus className="h-4 w-4" /> Agregar
          </Button>
        )}
      </div>

      {medications.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          Sin medicación registrada para este paciente
        </p>
      ) : (
        <div className="space-y-3">
          {medications.map(med => (
            <Card key={med.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">{med.medication_name}</p>
                  {med.dosage && <p className="text-sm text-muted-foreground">Dosis: {med.dosage}</p>}
                  {med.frequency && <p className="text-sm text-muted-foreground">Frecuencia: {med.frequency}</p>}
                  {med.start_date && (
                    <p className="text-xs text-muted-foreground">
                      Desde: {format(new Date(med.start_date), "d MMM yyyy", { locale: es })}
                    </p>
                  )}
                  {med.notes && <p className="text-xs text-muted-foreground italic mt-1">{med.notes}</p>}
                </div>
                <Badge variant={med.is_active ? "default" : "secondary"}>
                  {med.is_active ? "Activa" : "Inactiva"}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Historia Clínica" backTo="/professional/history">
        <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">
          {specialtyLabels[professionalData.specialty]}
        </span>
      </PageHeader>

      {/* Patient Banner */}
      <div className="bg-primary/5 border-b border-primary/20">
        <div className="container mx-auto px-4 py-3 max-w-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">{selectedPatient.fullName}</p>
            {selectedPatient.email && (
              <p className="text-xs text-muted-foreground">{selectedPatient.email}</p>
            )}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 max-w-xl">
        <Tabs defaultValue="ai-summary" className="w-full">
          <TabsList className="w-full grid grid-cols-6 mb-4">
            <TabsTrigger value="ai-summary" className="flex flex-col items-center gap-1 text-xs py-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">IA</span>
            </TabsTrigger>
            <TabsTrigger value="medications" className="flex flex-col items-center gap-1 text-xs py-2">
              <Pill className="h-4 w-4" />
              <span className="hidden sm:inline">Med</span>
            </TabsTrigger>
            {clinicalSections.map(section => {
              const Icon = section.icon;
              return (
                <TabsTrigger key={section.id} value={section.id} className="flex flex-col items-center gap-1 text-xs py-2">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{section.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="ai-summary">
            <ClinicalAISummaryTab 
              patientUserId={selectedPatient.userId} 
              patientName={selectedPatient.fullName || "el paciente"}
            />
          </TabsContent>

          <TabsContent value="medications">
            {renderMedicationsTab()}
          </TabsContent>

          {clinicalSections.map(section => (
            <TabsContent key={section.id} value={section.id}>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center gap-2 mb-4">
                  <section.icon className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-display font-bold text-foreground">{section.label}</h2>
                  {section.id === mySpecialty && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-auto">
                      Tu especialidad
                    </span>
                  )}
                </div>

                {/* Personality results - only in psychology tab */}
                {section.id === 'psychology' && renderPersonalityResults()}

                {renderNotesForSpecialty(section.id)}
              </motion.div>
            </TabsContent>
          ))}
        </Tabs>
      </main>

      {/* Add Medication Dialog */}
      <Dialog open={showMedDialog} onOpenChange={setShowMedDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-primary" />
              Agregar Medicación
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="med-name">Nombre del medicamento *</Label>
              <Input
                id="med-name"
                placeholder="Ej: Metformina"
                value={medForm.medication_name}
                onChange={(e) => setMedForm(f => ({ ...f, medication_name: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="med-dosage">Dosis</Label>
                <Input
                  id="med-dosage"
                  placeholder="Ej: 500mg"
                  value={medForm.dosage}
                  onChange={(e) => setMedForm(f => ({ ...f, dosage: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="med-frequency">Frecuencia</Label>
                <Input
                  id="med-frequency"
                  placeholder="Ej: 2 veces/día"
                  value={medForm.frequency}
                  onChange={(e) => setMedForm(f => ({ ...f, frequency: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="med-start">Fecha de inicio</Label>
              <Input
                id="med-start"
                type="date"
                value={medForm.start_date}
                onChange={(e) => setMedForm(f => ({ ...f, start_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="med-notes">Notas</Label>
              <Textarea
                id="med-notes"
                placeholder="Observaciones adicionales..."
                value={medForm.notes}
                onChange={(e) => setMedForm(f => ({ ...f, notes: e.target.value }))}
                rows={2}
              />
            </div>
            <Button
              className="w-full"
              disabled={!medForm.medication_name.trim() || addMedMutation.isPending}
              onClick={() => addMedMutation.mutate()}
            >
              {addMedMutation.isPending ? "Guardando..." : "Guardar Medicación"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
