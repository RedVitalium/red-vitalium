import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Calendar as CalendarIcon, Clock, MapPin, Video, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { useQuery } from "@tanstack/react-query";
import { specialtyLabels, Specialty } from "@/hooks/useUserRoles";
import appLogo from "@/assets/app-logo.png";

interface Professional {
  id: string;
  user_id: string;
  specialty: Specialty;
  location: string | null;
  office_address: string | null;
  consultation_price: number | null;
  full_name: string | null;
}

const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "15:00", "15:30", "16:00", "16:30", "17:00",
];

export default function AppointmentsNew() {
  const [searchParams] = useSearchParams();
  const preselectedProfessional = searchParams.get('professional');
  const { user } = useAuth();

  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | ''>('');
  const [selectedProfessional, setSelectedProfessional] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState('');
  const [modality, setModality] = useState<'presencial' | 'virtual'>('presencial');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // BUG 4 FIX: Write appointment to Supabase + auto-create patient_professionals
  const handleConfirmAppointment = async () => {
    if (!selectedSpecialty || !selectedProfessional || !selectedDate || !selectedTime) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    if (!user) {
      toast.error('Debes iniciar sesión para agendar una cita');
      return;
    }

    setIsSubmitting(true);

    try {
      const professionalData = availableProfessionals.find(p => p.id === selectedProfessional);
      if (!professionalData) throw new Error('Profesional no encontrado');

      // 1. Write the appointment
      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          user_id: user.id,
          professional_id: professionalData.id,
          appointment_date: format(selectedDate, 'yyyy-MM-dd'),
          appointment_time: selectedTime,
          modality: modality,
          status: 'scheduled',
          notes: `${specialtyLabels[selectedSpecialty]} - ${modality === 'virtual' ? 'Videollamada' : professionalData.location || 'Presencial'}`,
        });

      if (appointmentError) throw appointmentError;

      // 2. Auto-create patient_professionals relationship if it doesn't exist
      // This eliminates the need for manual admin assignment in the standard flow
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

      // Don't throw on assign error — the appointment is already created
      // The admin can fix the assignment manually if needed
      if (assignError) {
        console.warn('Could not auto-assign professional:', assignError.message);
      }

      toast.success('¡Cita agendada exitosamente!', {
        description: `${professionalData.full_name} - ${format(selectedDate, "d 'de' MMMM", { locale: es })} a las ${selectedTime}`,
      });

      // Reset form
      setSelectedSpecialty('');
      setSelectedProfessional('');
      setSelectedDate(undefined);
      setSelectedTime('');
      setModality('presencial');

    } catch (error: any) {
      console.error('Error scheduling appointment:', error);
      toast.error('Error al agendar la cita', { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProfessionalData = availableProfessionals.find(p => p.id === selectedProfessional);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/home" className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <img src={appLogo} alt="Red Vitalium" className="h-8 w-auto" />
          <span className="text-lg font-display font-bold text-primary">Agendar Cita</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6">
            <h2 className="text-xl font-display font-bold mb-6">Nueva Cita</h2>

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
              </div>

              {/* Professional Selection — BUG 4 FIX: real data from Supabase */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Profesional</label>
                <Select 
                  value={selectedProfessional} 
                  onValueChange={setSelectedProfessional}
                  disabled={!selectedSpecialty || profLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      profLoading ? "Cargando profesionales..." :
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
                    variant={modality === 'virtual' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setModality('virtual')}
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
                      {modality === 'virtual' ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                      {modality === 'virtual' ? 'Videollamada' : selectedProfessionalData.location || 'Presencial'}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Confirm Button */}
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleConfirmAppointment}
                disabled={!selectedSpecialty || !selectedProfessional || !selectedDate || !selectedTime || isSubmitting}
              >
                {isSubmitting ? (
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
        </motion.div>
      </main>
    </div>
  );
}
