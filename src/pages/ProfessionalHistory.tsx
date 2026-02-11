import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Brain, Heart, Scale, Beaker, Activity, Trophy,
  Plus, Edit2, Save, X, User, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAdminMode } from "@/hooks/useAdminMode";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles, specialtyLabels, Specialty } from "@/hooks/useUserRoles";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import appLogo from "@/assets/app-logo.png";
import { useEffect } from "react";

const categorySummaries = [
  { id: 'achievements', label: 'Logros', icon: Trophy, color: 'primary' },
  { id: 'habits', label: 'Hábitos', icon: Activity, color: 'primary' },
  { id: 'psychological', label: 'Bienestar Psicológico', icon: Brain, color: 'primary' },
  { id: 'longevity', label: 'Longevidad', icon: Heart, color: 'primary' },
  { id: 'body-composition', label: 'Composición Corporal', icon: Scale, color: 'primary' },
  { id: 'metabolic', label: 'Marcadores Metabólicos', icon: Beaker, color: 'primary' },
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

export default function ProfessionalHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedPatient, isViewingAsAdmin } = useAdminMode();
  const { professionalData } = useUserRoles();
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    if (!isViewingAsAdmin || !selectedPatient) {
      navigate('/professional');
    }
  }, [isViewingAsAdmin, selectedPatient, navigate]);

  // Fetch professional ID
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

  // Fetch all notes for this patient (from all professionals)
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

  const addNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!professionalId || !selectedPatient || !professionalData) throw new Error("Missing data");
      const { error } = await supabase.from('professional_notes').insert({
        patient_id: selectedPatient.userId,
        professional_id: professionalId,
        specialty: professionalData.specialty,
        content,
        note_type: 'general',
        is_visible_to_others: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional-notes'] });
      setNewNote("");
      toast.success("Nota agregada");
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

  if (!selectedPatient || !professionalData) return null;

  const myNotes = notes.filter(n => n.professional_id === professionalId);
  const otherNotes = notes.filter(n => n.professional_id !== professionalId && n.is_visible_to_others);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/professional/patient" className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <img src={appLogo} alt="Red Vitalium" className="h-8 w-auto" />
            <span className="text-lg font-display font-bold text-primary">Historial</span>
          </div>
          <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">
            {specialtyLabels[professionalData.specialty]}
          </span>
        </div>
      </header>

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

      <main className="container mx-auto px-4 py-6 max-w-xl space-y-6">
        {/* Category Summaries */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h2 className="text-lg font-display font-bold text-foreground mb-3">Resumen por Categoría</h2>
          <div className="grid grid-cols-2 gap-3">
            {categorySummaries.map(cat => {
              const Icon = cat.icon;
              return (
                <Card key={cat.id} className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{cat.label}</p>
                    <p className="text-xs text-muted-foreground">Ver detalles →</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </motion.div>

        {/* My Notes */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="text-lg font-display font-bold text-foreground mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Mis Notas ({specialtyLabels[professionalData.specialty]})
          </h2>

          {/* Add new note */}
          <Card className="p-4 mb-4">
            <Textarea
              placeholder="Escribir nueva nota sobre el paciente..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="mb-3"
              rows={3}
            />
            <Button
              size="sm"
              onClick={() => addNoteMutation.mutate(newNote)}
              disabled={!newNote.trim() || addNoteMutation.isPending}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Agregar Nota
            </Button>
          </Card>

          {/* Existing notes */}
          {myNotes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aún no tienes notas para este paciente
            </p>
          ) : (
            <div className="space-y-3">
              {myNotes.map(note => (
                <Card key={note.id} className="p-4">
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
                      <p className="text-sm text-foreground whitespace-pre-wrap">{note.content}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(note.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                        </p>
                        <Button size="sm" variant="ghost" onClick={() => { setEditingNoteId(note.id); setEditContent(note.content); }} className="gap-1 h-7 text-xs">
                          <Edit2 className="h-3 w-3" /> Editar
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </motion.div>

        {/* Notes from other professionals */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-lg font-display font-bold text-foreground mb-3">
            Notas de Otros Profesionales
          </h2>
          {otherNotes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay notas de otros profesionales
            </p>
          ) : (
            <div className="space-y-3">
              {otherNotes.map(note => (
                <Card key={note.id} className="p-4 bg-muted/30">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-medium">
                      {specialtyLabels[note.specialty]}
                    </span>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{note.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {format(new Date(note.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
