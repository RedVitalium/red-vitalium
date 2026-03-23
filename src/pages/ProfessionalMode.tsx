import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, User, Users, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles, specialtyLabels } from "@/hooks/useUserRoles";
import { useAdminMode } from "@/hooks/useAdminMode";
import { format, differenceInHours } from "date-fns";
import { es } from "date-fns/locale";
import appLogo from "@/assets/app-logo.png";
import RegisterPatientDialog from "@/components/professional/RegisterPatientDialog";

interface Patient {
  user_id: string;
  full_name: string | null;
  email: string | null;
  date_of_birth: string | null;
}

export default function ProfessionalMode() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { professionalData, isProfessional } = useUserRoles();
  const { setSelectedPatient, setCurrentMode } = useAdminMode();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch patients assigned to this professional
  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['professional-patients', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get professional ID
      const { data: profData } = await supabase
        .from('professionals')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profData) return [];

      // Get assigned patients
      const { data: assignments } = await supabase
        .from('patient_professionals')
        .select('patient_id')
        .eq('professional_id', profData.id)
        .eq('is_active', true);

      if (!assignments || assignments.length === 0) return [];

      const patientIds = assignments.map(a => a.patient_id);

      // Get patient profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, date_of_birth')
        .in('user_id', patientIds);

      return profiles || [];
    },
    enabled: !!user && isProfessional,
  });

  // Fetch last survey date per patient
  const patientIds = patients.map((p: Patient) => p.user_id);
  const { data: lastSurveyMap = {} } = useQuery({
    queryKey: ['last-surveys', patientIds],
    queryFn: async () => {
      if (patientIds.length === 0) return {};
      const { data } = await supabase
        .from('daily_survey_responses')
        .select('user_id, response_date')
        .in('user_id', patientIds)
        .order('response_date', { ascending: false });
      const map: Record<string, string> = {};
      (data || []).forEach(r => {
        if (!map[r.user_id]) map[r.user_id] = r.response_date;
      });
      return map;
    },
    enabled: patientIds.length > 0,
  });

  // Filter patients based on search
  const filteredPatients = searchTerm.trim().length >= 2
    ? patients.filter((patient: Patient) => {
        const search = searchTerm.toLowerCase();
        return (
          patient.full_name?.toLowerCase().includes(search) ||
          patient.email?.toLowerCase().includes(search)
        );
      })
    : [];

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient({
      userId: patient.user_id,
      fullName: patient.full_name || 'Sin nombre',
      email: patient.email || undefined,
    });
    setCurrentMode('admin'); // Reuse admin mode for professional viewing
    navigate('/professional/history');
  };

  if (!isProfessional) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-xl font-display font-bold text-foreground mb-2">
            Acceso Restringido
          </h2>
          <p className="text-muted-foreground mb-4">
            No tienes permisos de profesional de salud.
          </p>
          <Button asChild>
            <Link to="/home">Volver al Inicio</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/home" className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <img src={appLogo} alt="Red Vitalium" className="h-8 w-auto" />
            <span className="text-lg font-display font-bold text-primary">
              Panel Profesional
            </span>
          </div>
          {professionalData && (
            <div className="flex items-center gap-2">
              <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">
                {specialtyLabels[professionalData.specialty]}
              </span>
              <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">
                {patients.length} pacientes
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">
            Seleccionar Paciente
          </h1>
          <p className="text-muted-foreground">
            Busca al paciente cuyo tablero deseas visualizar
          </p>
        </motion.div>

        {/* Empty state for no patients */}
        {!isLoading && patients.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-6"
          >
            <Card className="p-8 text-center bg-muted/30 border border-border">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display font-bold text-foreground mb-2">Sin pacientes asignados</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Aún no tienes pacientes vinculados a tu consulta. Puedes registrar un nuevo paciente con el botón de abajo, o pide al administrador que te asigne pacientes existentes.
              </p>
            </Card>
          </motion.div>
        )}

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </motion.div>

        {/* Results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="overflow-hidden">
            {isLoading && searchTerm.trim().length >= 2 ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Buscando pacientes...</p>
              </div>
            ) : searchTerm.trim().length < 2 ? (
              <div className="p-8 text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Escribe al menos 2 caracteres para buscar
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Solo verás pacientes asignados a ti
                </p>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="p-8 text-center">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No se encontraron pacientes con "{searchTerm}"
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredPatients.map((patient: Patient) => (
                  <button
                    key={patient.user_id}
                    onClick={() => handleSelectPatient(patient)}
                    className="w-full p-4 text-left hover:bg-muted/50 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {patient.full_name || 'Sin nombre'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {patient.email}
                        </p>
                        {(() => {
                          const lastDate = (lastSurveyMap as Record<string, string>)[patient.user_id];
                          if (!lastDate) return <p className="text-xs text-muted-foreground">Sin encuestas registradas</p>;
                          const hours = differenceInHours(new Date(), new Date(lastDate));
                          if (hours < 24) return <p className="text-xs text-green-600">Encuesta al día</p>;
                          return <p className="text-xs text-yellow-600">Última encuesta: {format(new Date(lastDate), "d MMM yyyy", { locale: es })}</p>;
                        })()}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </button>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Register Patient */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <RegisterPatientDialog />
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 p-5 bg-muted/30 border border-border rounded-xl"
        >
          <p className="text-sm text-muted-foreground text-center">
            Como profesional de {professionalData ? specialtyLabels[professionalData.specialty] : ''}, 
            podrás ver los tableros completos de tus pacientes y editar los datos relevantes a tu especialidad.
          </p>
        </motion.div>
      </main>
    </div>
  );
}
