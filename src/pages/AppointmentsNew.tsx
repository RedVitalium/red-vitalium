import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { Calendar as CalendarIcon, Clock, MapPin, Video, User, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { specialtyLabels, Specialty, useUserRoles, SubscriptionPlan } from "@/hooks/useUserRoles";
import { PageHeader } from "@/components/PageHeader";

interface Professional {
  id: string;
  user_id: string;
  specialty: Specialty;
  location: string | null;
  office_address: string | null;
  consultation_price: number | null;
  full_name: string | null;
}

const planSpecialties: Record<SubscriptionPlan, Specialty[]> = {
  plata: ['psychology'],
  oro: ['psychology', 'nutrition'],
  platino: ['psychology', 'nutrition', 'medicine'],
  black: ['psychology', 'nutrition', 'medicine', 'physiotherapy'],
};

const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "15:00", "15:30", "16:00", "16:30", "17:00",
];

export default function AppointmentsNew() {
  const [searchParams] = useSearchParams();
  const preselectedProfessional = searchParams.get('professional');
  const { user } = useAuth();
  const { subscription, isLoading: rolesLoading } = useUserRoles();

  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | ''>('');
  const [selectedProfessional, setSelectedProfessional] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState('');
  const [modality, setModality] = useState<'presencial' | 'videollamada'>('presencial');
  const queryClient = useQueryClient();

  // BUG 4 FIX: Fetch real professionals from Supabase
  const { data: allProfessionals = [], isLoading: profLoading } = useQuery({
    queryKey: ['active-professionals'],
    queryFn: async () => {
      // Get active professionals
      const { data: profs, error: profError } = await supabase
        .from('professionals')
        .select('id, user_id, specialty, location, office_address, consultation_price')
        .eq('is_active', true);

      if (profError) throw profError;
      if (!profs || profs.length === 0) return [];

      // Get their names from profiles
      const userIds = profs.map(p => p.user_id);
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      if (profileError) throw profileError;

      // Merge professional data with profile names
      return profs.map(prof => ({
        ...prof,
        full_name: profiles?.find(p => p.user_id === prof.user_id)?.full_name || 'Profesional',
      })) as Professional[];
    },
  });

  // Filter professionals by selected specialty
  const availableProfessionals = selectedSpecialty
    ? allProfessionals.filter(p => p.specialty === selectedSpecialty)
    : [];

  // Reset professional when specialty changes
  useEffect(() => {
    setSelectedProfessional('');
  }, [selectedSpecialty]);

  // useMutation for booking appointment + auto-linking patient_professionals
  const bookingMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSpecialty || !selectedProfessional || !selectedDate || !selectedTime) {
        throw new Error('Por favor completa todos los campos');
      }
      if (!user) throw new Error('Debes iniciar sesión para agendar una cita');

      const professionalData = availableProfessionals.find(p => p.id === selectedProfessional);
      if (!professionalData) throw new Error('Profesional no encontrado');

      // 1. Insert appointment
      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          user_id: user.id,
          professional_id: professionalData.id,
          appointment_date: format(selectedDate, 'yyyy-MM-dd'),
          appointment_time: selectedTime,
          modality: modality,
          status: 'pending',
          notes: `${specialtyLabels[selectedSpecialty]} - ${modality === 'videollamada' ? 'Videollamada' : professionalData.location || 'Presencial'}`,
        });

      if (appointmentError) throw appointmentError;

      // 2. Auto-upsert patient_professionals relationship
      const { error: assignError } = await supabase
        .from('patient_professionals')
        .upsert(
          {
            patient_id: user.id,
            professional_id: professionalData.id,
            specialty: professionalData.specialty,
            assigned_by: user.id,
            is_active: true,
          },
          { onConflict: 'patient_id,professional_id' }
        );

      if (assignError) {
        console.warn('Could not auto-assign professional:', assignError.message);
      }

      return professionalData;
    },
    onSuccess: (professionalData) => {
      toast.success('Cita solicitada correctamente.', {
        description: `Tu ${specialtyLabels[selectedSpecialty as Specialty]?.toLowerCase() || 'profesional'} recibirá la solicitud. ${professionalData.full_name} - ${format(selectedDate!, "d 'de' MMMM", { locale: es })} a las ${selectedTime}`,
      });
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] });
      setSelectedSpecialty('');
      setSelectedProfessional('');
      setSelectedDate(undefined);
      setSelectedTime('');
      setModality('presencial');
    },
    onError: (error: any) => {
      console.error('Error scheduling appointment:', error);
      toast.error('Error al agendar la cita', { description: error.message });
    },
  });

  const handleConfirmAppointment = () => {
    bookingMutation.mutate();
  };

  const selectedProfessionalData = availableProfessionals.find(p => p.id === selectedProfessional);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Agendar Cita" backTo="/home" />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6">
            <h2 className="text-xl font-display font-bold mb-4">Nueva Cita</h2>

            {/* Plan info banner */}
            {user && subscription && !rolesLoading && (
              <div className="mb-6 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1.5">Tu plan incluye:</p>
                <div className="flex flex-wrap gap-1.5">
                  {planSpecialties[subscription].map((spec) => (
                    <Badge key={spec} variant="secondary" className="text-xs">
                      {specialtyLabels[spec]}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-6">
              {/* Specialty Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Especialidad</label>
                <Select 
                  value={selectedSpecialty} 
                  onValueChange={(value) => setSelectedSpecialty(value as Specialty)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una especialidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(specialtyLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Warning if specialty not in plan */}
                {user && subscription && selectedSpecialty && !planSpecialties[subscription].includes(selectedSpecialty as Specialty) && (
                  <div className="flex items-start gap-2 p-2.5 bg-yellow-500/10 border border-yellow-500/30 rounded-md">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-700 dark:text-yellow-400">
                      Esta especialidad no está incluida en tu plan actual. Se aplicará el costo de consulta individual.
                    </p>
                  </div>
                )}
              </div>

              {/* Professional Selection — BUG 4 FIX: real data from Supabase */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Profesional</label>
                {profLoading && selectedSpecialty ? (
                  <Skeleton className="h-10 w-full rounded-md" />
                ) : (
                  <Select 
                    value={selectedProfessional} 
                    onValueChange={setSelectedProfessional}
                    disabled={!selectedSpecialty}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !selectedSpecialty ? "Primero selecciona especialidad" :
                        availableProfessionals.length === 0 ? "Sin profesionales disponibles" :
                        "Selecciona un profesional"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProfessionals.map((prof) => (
                        <SelectItem key={prof.id} value={prof.id}>
                          <div className="flex items-center gap-2">
                            <span>{prof.full_name}</span>
                            {prof.location && (
                              <span className="text-xs text-muted-foreground">({prof.location})</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Show selected professional info */}
              {selectedProfessionalData && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-4 bg-primary/5 border border-primary/20 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{selectedProfessionalData.full_name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {selectedProfessionalData.location || 'Ubicación no especificada'}
                      </p>
                      {selectedProfessionalData.consultation_price && (
                        <p className="text-sm text-primary font-medium">
                          ${selectedProfessionalData.consultation_price} MXN
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Modality */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Modalidad</label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={modality === 'presencial' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setModality('presencial')}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Presencial
                  </Button>
                  <Button
                    type="button"
                    variant={modality === 'videollamada' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setModality('videollamada')}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Virtual
                  </Button>
                </div>
              </div>

              {/* Date Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha</label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date() || date.getDay() === 0}
                  locale={es}
                  className="rounded-md border mx-auto"
                />
              </div>

              {/* Time Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Hora</label>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar hora" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Summary */}
              {selectedDate && selectedTime && selectedProfessionalData && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 bg-muted/50 rounded-lg"
                >
                  <h4 className="font-medium mb-2">Resumen de la cita</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {selectedProfessionalData.full_name}
                    </p>
                    <p className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      {format(selectedDate, "EEEE d 'de' MMMM, yyyy", { locale: es })}
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {selectedTime} hrs
                    </p>
                    <p className="flex items-center gap-2">
                      {modality === 'videollamada' ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                      {modality === 'videollamada' ? 'Videollamada' : selectedProfessionalData.location || 'Presencial'}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Confirm Button */}
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleConfirmAppointment}
                disabled={!selectedSpecialty || !selectedProfessional || !selectedDate || !selectedTime || bookingMutation.isPending}
              >
                {bookingMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Agendando...
                  </>
                ) : (
                  'Confirmar Cita'
                )}
              </Button>

              {/* Note for unauthenticated users */}
              {!user && (
                <p className="text-xs text-muted-foreground text-center">
                  <Link to="/auth" className="text-primary hover:underline">Inicia sesión</Link> para agendar tu cita. 
                  Si aún no tienes cuenta, tu profesional puede registrarte.
                </p>
              )}
            </div>
          </Card>

          {/* My Appointments Section */}
          {user && <MyAppointments userId={user.id} />}
        </motion.div>
      </main>
    </div>
  );
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  pending: { label: "Pendiente", variant: "default" },
  scheduled: { label: "Agendada", variant: "default" },
  completed: { label: "Completada", variant: "secondary" },
  cancelled: { label: "Cancelada", variant: "outline" },
};

function MyAppointments({ userId }: { userId: string }) {
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['my-appointments', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('id, appointment_date, appointment_time, status, modality, professional_id')
        .eq('user_id', userId)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false })
        .limit(10);

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Get professional names
      const profIds = [...new Set(data.filter(a => a.professional_id).map(a => a.professional_id!))];
      let profNames: Record<string, string> = {};

      if (profIds.length > 0) {
        const { data: profs } = await supabase
          .from('professionals')
          .select('id, user_id')
          .in('id', profIds);

        if (profs && profs.length > 0) {
          const userIds = profs.map(p => p.user_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, full_name')
            .in('user_id', userIds);

          profs.forEach(prof => {
            const profile = profiles?.find(p => p.user_id === prof.user_id);
            profNames[prof.id] = profile?.full_name || 'Profesional';
          });
        }
      }

      return data.map(a => ({
        ...a,
        professional_name: a.professional_id ? profNames[a.professional_id] || null : null,
      }));
    },
  });

  if (isLoading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mt-6"
    >
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <CalendarIcon className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-display font-bold text-foreground">Mis Citas</h3>
        </div>

        {appointments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aún no tienes citas registradas
          </p>
        ) : (
          <div className="space-y-3">
            {appointments.slice(0, 5).map(appt => {
              const cfg = statusConfig[appt.status] || statusConfig.scheduled;
              return (
                <div key={appt.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-foreground">
                      {format(new Date(appt.appointment_date + 'T00:00:00'), "d MMM yyyy", { locale: es })}
                      <span className="text-muted-foreground ml-2">{appt.appointment_time?.slice(0, 5)}</span>
                    </p>
                    {appt.professional_name && (
                      <p className="text-xs text-muted-foreground">{appt.professional_name}</p>
                    )}
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      {appt.modality === 'videollamada' ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                      {appt.modality === 'videollamada' ? 'Videollamada' : 'Presencial'}
                    </p>
                  </div>
                  <Badge variant={cfg.variant}>{cfg.label}</Badge>
                </div>
              );
            })}
            {appointments.length > 0 && (
              <p className="text-xs text-muted-foreground text-center pt-1">
                Mostrando las últimas {Math.min(appointments.length, 5)} citas
              </p>
            )}
          </div>
        )}
      </Card>
    </motion.div>
  );
}
