import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Calendar as CalendarIcon, Clock, MapPin, Video, User } from "lucide-react";
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
import { specialtyLabels, Specialty } from "@/hooks/useUserRoles";
import appLogo from "@/assets/app-logo.png";

// Dummy professionals data - will be replaced with real data
const professionalsBySpecialty: Record<Specialty, { id: string; name: string; location: string }[]> = {
  psychology: [
    { id: 'psy-1', name: 'Dra. María González Pérez', location: 'Col. Centro' },
    { id: 'psy-2', name: 'Lic. Juan Carlos Mendoza', location: 'Col. Tabasco 2000' },
  ],
  nutrition: [
    { id: 'nut-1', name: 'Lic. Ana Martínez López', location: 'Col. Tabasco 2000' },
    { id: 'nut-2', name: 'Lic. Patricia Sánchez Ruiz', location: 'Col. Centro' },
  ],
  medicine: [
    { id: 'med-1', name: 'Dr. Roberto Hernández Sánchez', location: 'Hospital Star Médica' },
    { id: 'med-2', name: 'Dra. Laura Díaz Morales', location: 'Centro Médico Vitalium' },
  ],
  physiotherapy: [
    { id: 'fis-1', name: 'Lic. Carlos Ruiz Torres', location: 'Centro de Rehabilitación' },
    { id: 'fis-2', name: 'Lic. Fernanda López García', location: 'Col. Tabasco 2000' },
  ],
};

const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "15:00", "15:30", "16:00", "16:30", "17:00",
];

export default function AppointmentsNew() {
  const [searchParams] = useSearchParams();
  const preselectedProfessional = searchParams.get('professional');

  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | ''>('');
  const [selectedProfessional, setSelectedProfessional] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState('');
  const [modality, setModality] = useState<'presencial' | 'virtual'>('presencial');

  // Get available professionals for selected specialty
  const availableProfessionals = selectedSpecialty 
    ? professionalsBySpecialty[selectedSpecialty] 
    : [];

  // Reset professional when specialty changes
  useEffect(() => {
    setSelectedProfessional('');
  }, [selectedSpecialty]);

  const handleConfirmAppointment = () => {
    if (!selectedSpecialty || !selectedProfessional || !selectedDate || !selectedTime) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    toast.success('Cita agendada exitosamente');
    // Reset form
    setSelectedSpecialty('');
    setSelectedProfessional('');
    setSelectedDate(undefined);
    setSelectedTime('');
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

              {/* Professional Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Profesional</label>
                <Select 
                  value={selectedProfessional} 
                  onValueChange={setSelectedProfessional}
                  disabled={!selectedSpecialty}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedSpecialty ? "Selecciona un profesional" : "Primero selecciona especialidad"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProfessionals.map((prof) => (
                      <SelectItem key={prof.id} value={prof.id}>
                        <div className="flex items-center gap-2">
                          <span>{prof.name}</span>
                          <span className="text-xs text-muted-foreground">({prof.location})</span>
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
                      <p className="font-medium">{selectedProfessionalData.name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {selectedProfessionalData.location}
                      </p>
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
                      {selectedProfessionalData.name}
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
                      {modality === 'virtual' ? 'Videollamada' : selectedProfessionalData.location}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Confirm Button */}
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleConfirmAppointment}
                disabled={!selectedSpecialty || !selectedProfessional || !selectedDate || !selectedTime}
              >
                Confirmar Cita
              </Button>
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
