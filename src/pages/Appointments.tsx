import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  CalendarDays, 
  Clock, 
  User, 
  MapPin, 
  Video, 
  Plus,
  CheckCircle2,
  Brain
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Appointment {
  id: string;
  date: Date;
  time: string;
  type: "consultation" | "followup" | "test";
  specialist: string;
  location: "presencial" | "virtual";
  status: "confirmed" | "pending" | "completed";
}

const appointments: Appointment[] = [
  {
    id: "1",
    date: new Date(2025, 0, 15),
    time: "10:00",
    type: "consultation",
    specialist: "Psicología",
    location: "presencial",
    status: "confirmed",
  },
  {
    id: "2",
    date: new Date(2025, 0, 18),
    time: "15:30",
    type: "followup",
    specialist: "Psicología",
    location: "virtual",
    status: "pending",
  },
  {
    id: "3",
    date: new Date(2025, 0, 8),
    time: "09:00",
    type: "consultation",
    specialist: "Psicología",
    location: "presencial",
    status: "completed",
  },
];

const typeLabels = {
  consultation: "Consulta",
  followup: "Seguimiento",
  test: "Evaluación",
};

const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "15:00", "15:30", "16:00", "16:30", "17:00",
];

export default function Appointments() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    date: undefined as Date | undefined,
    time: "",
    type: "consultation" as "consultation" | "followup" | "test",
    location: "presencial" as "presencial" | "virtual",
  });

  const upcomingAppointments = appointments
    .filter(apt => apt.date >= new Date() && apt.status !== "completed")
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const pastAppointments = appointments
    .filter(apt => apt.status === "completed")
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-start mb-8"
      >
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Citas
          </h1>
          <p className="text-muted-foreground">
            Gestiona tus citas de psicología
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Cita
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-display">Agendar Nueva Cita</DialogTitle>
              <DialogDescription>
                Selecciona la fecha y hora para tu cita de psicología
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Specialist - Fixed to Psychology */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Especialista</label>
                <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <Brain className="h-5 w-5 text-primary" />
                  <span className="font-medium">Psicología</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Cita</label>
                <Select
                  value={newAppointment.type}
                  onValueChange={(value: "consultation" | "followup" | "test") =>
                    setNewAppointment((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consultation">Consulta</SelectItem>
                    <SelectItem value="followup">Seguimiento</SelectItem>
                    <SelectItem value="test">Evaluación</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Modalidad</label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={newAppointment.location === "presencial" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() =>
                      setNewAppointment((prev) => ({ ...prev, location: "presencial" }))
                    }
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Presencial
                  </Button>
                  <Button
                    type="button"
                    variant={newAppointment.location === "virtual" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() =>
                      setNewAppointment((prev) => ({ ...prev, location: "virtual" }))
                    }
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Virtual
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha</label>
                <Calendar
                  mode="single"
                  selected={newAppointment.date}
                  onSelect={(date) =>
                    setNewAppointment((prev) => ({ ...prev, date }))
                  }
                  disabled={(date) => date < new Date()}
                  className="rounded-md border mx-auto"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Hora</label>
                <Select
                  value={newAppointment.time}
                  onValueChange={(value) =>
                    setNewAppointment((prev) => ({ ...prev, time: value }))
                  }
                >
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

              <Button className="w-full" onClick={() => setIsDialogOpen(false)}>
                Confirmar Cita
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Calendar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1"
        >
          <Card className="p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="mx-auto"
              locale={es}
            />
          </Card>
        </motion.div>

        {/* Appointments List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Próximas Citas
            </h2>
            <div className="space-y-4">
              {upcomingAppointments.map((apt, index) => (
                <motion.div
                  key={apt.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className={`p-3 rounded-xl ${
                          apt.status === "confirmed" 
                            ? "bg-success/10" 
                            : "bg-warning/10"
                        }`}>
                          <Brain className={`h-5 w-5 ${
                            apt.status === "confirmed" 
                              ? "text-success" 
                              : "text-warning"
                          }`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {typeLabels[apt.type]}
                          </h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <User className="h-4 w-4" />
                            {apt.specialist}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {format(apt.date, "d 'de' MMMM", { locale: es })} - {apt.time}
                            </span>
                            <span className="flex items-center gap-1">
                              {apt.location === "virtual" ? (
                                <Video className="h-4 w-4" />
                              ) : (
                                <MapPin className="h-4 w-4" />
                              )}
                              {apt.location === "virtual" ? "Virtual" : "Presencial"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        apt.status === "confirmed"
                          ? "bg-success/10 text-success"
                          : "bg-warning/10 text-warning"
                      }`}>
                        {apt.status === "confirmed" ? "Confirmada" : "Pendiente"}
                      </span>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Past Appointments */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
              Historial
            </h2>
            <div className="space-y-3">
              {pastAppointments.map((apt) => (
                <Card key={apt.id} className="p-4 opacity-60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{typeLabels[apt.type]} - {apt.specialist}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(apt.date, "d 'de' MMMM, yyyy", { locale: es })}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">Completada</span>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
