import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, UserPlus, UserCheck, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/custom-client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface ExistingPatient {
  user_id: string;
  full_name: string | null;
  email: string | null;
}

export default function RegisterPatientDialog() {
  const { user } = useAuth();
  const { professionalData } = useUserRoles();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // Search existing tab
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<ExistingPatient[]>([]);
  const [searching, setSearching] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);

  // New patient tab
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newDob, setNewDob] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (searchTerm.trim().length >= 2) {
      searchExistingPatients();
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const searchExistingPatients = async () => {
    if (searchTerm.trim().length < 2 || !user) return;
    setSearching(true);
    try {
      // Get professional id
      const { data: profData } = await supabase
        .from("professionals")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();


      // Get already assigned patient ids
      const { data: assigned } = await supabase
        .from("patient_professionals")
        .select("patient_id")
        .eq("professional_id", profData?.id || "")
        .eq("is_active", true);

      const assignedIds = (assigned || []).map((a) => a.patient_id);

      // Search profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .limit(20);

      // Filter out already assigned and the professional themselves
      const filtered = (profiles || []).filter(
        (p) => !assignedIds.includes(p.user_id) && p.user_id !== user.id
      );
      setSearchResults(filtered);
    } catch (err) {
      console.error(err);
      toast.error("Error al buscar pacientes");
    } finally {
      setSearching(false);
    }
  };

  const assignExistingPatient = async (patient: ExistingPatient) => {
    if (!user) return;
    setAssigning(patient.user_id);
    try {
      const { data: profData } = await supabase
        .from("professionals")
        .select("id, specialty")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profData) throw new Error("No professional data");
      console.log('profData:', profData?.id, 'user.id:', user.id);

      // Check if there's an inactive assignment we can reactivate
      const { data: existing } = await supabase
        .from("patient_professionals")
        .select("id, is_active")
        .eq("patient_id", patient.user_id)
        .eq("professional_id", profData.id)
        .maybeSingle();

      if (existing && !existing.is_active) {
        await supabase
          .from("patient_professionals")
          .update({ is_active: true })
          .eq("id", existing.id);
      } else if (!existing) {
        await supabase.from("patient_professionals").insert({
          patient_id: patient.user_id,
          professional_id: profData.id,
          specialty: profData.specialty,
          assigned_by: user.id,
          is_active: true,
        });
      }

      toast.success(`${patient.full_name || patient.email} asignado correctamente`);
      queryClient.invalidateQueries({ queryKey: ["professional-patients"] });
      setSearchTerm("");
      setSearchResults([]);
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Error al asignar paciente");
    } finally {
      setAssigning(null);
    }
  };

  const createNewPatient = async () => {
    if (!newName.trim() || !newEmail.trim()) {
      toast.error("Nombre y email son requeridos");
      return;
    }
    setCreating(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-patient`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: newEmail.trim(),
            fullName: newName.trim(),
            dateOfBirth: newDob || null,
          }),
        }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Error al crear paciente");
      }

      toast.success("Paciente creado y asignado correctamente");
      queryClient.invalidateQueries({ queryKey: ["professional-patients"] });
      setNewName("");
      setNewEmail("");
      setNewDob("");
      setOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al crear paciente");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full gap-2" size="lg">
          <UserPlus className="h-5 w-5" />
          Dar de Alta Paciente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dar de Alta Paciente</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="existing" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing" className="gap-1.5 text-xs sm:text-sm">
              <UserCheck className="h-4 w-4" />
              Buscar Existente
            </TabsTrigger>
            <TabsTrigger value="new" className="gap-1.5 text-xs sm:text-sm">
              <UserPlus className="h-4 w-4" />
              Registrar Nuevo
            </TabsTrigger>
          </TabsList>

          {/* Search existing patients */}
          <TabsContent value="existing" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Busca un paciente ya registrado en Vitalium para asignarlo a tu consulta.
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchExistingPatients()}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={searchExistingPatients}
                disabled={searchTerm.trim().length < 2 || searching}
                size="icon"
              >
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>

            <AnimatePresence mode="wait">
              {searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2 max-h-60 overflow-y-auto"
                >
                  {searchResults.map((p) => (
                    <Card
                      key={p.user_id}
                      className="p-3 flex items-center justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {p.full_name || "Sin nombre"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {p.email}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => assignExistingPatient(p)}
                        disabled={assigning === p.user_id}
                        className="ml-2 shrink-0"
                      >
                        {assigning === p.user_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Asignar"
                        )}
                      </Button>
                    </Card>
                  ))}
                </motion.div>
              )}
              {searchResults.length === 0 && searchTerm.trim().length >= 2 && !searching && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-muted-foreground text-center py-4"
                >
                  No se encontraron pacientes no asignados con "{searchTerm}"
                </motion.p>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* Register new patient */}
          <TabsContent value="new" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Registra un nuevo paciente. Se creará su cuenta y se asignará automáticamente a tu consulta.
            </p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="new-name">Nombre completo *</Label>
                <Input
                  id="new-name"
                  placeholder="Juan García López"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-email">Email *</Label>
                <Input
                  id="new-email"
                  type="email"
                  placeholder="paciente@email.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-dob">Fecha de nacimiento</Label>
                <Input
                  id="new-dob"
                  type="date"
                  value={newDob}
                  onChange={(e) => setNewDob(e.target.value)}
                />
              </div>
            </div>
            <Button
              onClick={createNewPatient}
              disabled={creating || !newName.trim() || !newEmail.trim()}
              className="w-full gap-2"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              Crear y Asignar Paciente
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              El paciente recibirá un email para configurar su contraseña.
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
