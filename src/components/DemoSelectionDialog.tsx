import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User, Stethoscope, Activity, Brain, Heart, Scale, BarChart3, ClipboardList, Users } from "lucide-react";

interface DemoSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DemoSelectionDialog({ open, onOpenChange }: DemoSelectionDialogProps) {
  const navigate = useNavigate();

  const handlePatientDemo = () => {
    onOpenChange(false);
    navigate("/my-dashboard?demo=true");
  };

  const handleProfessionalDemo = () => {
    onOpenChange(false);
    navigate("/demo/professional");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-display">
            ¿Qué demo deseas explorar?
          </DialogTitle>
          <DialogDescription className="text-center">
            Elige la perspectiva que más te interesa conocer de Red Vitalium
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Patient Demo */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="outline"
              className="w-full h-auto p-5 flex gap-4 items-start border-2 hover:border-primary hover:bg-primary/5 text-left"
              onClick={handlePatientDemo}
            >
              <div className="p-2.5 rounded-xl bg-primary/10 flex-shrink-0 mt-0.5">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="font-display font-semibold text-base text-foreground leading-tight">Soy Paciente</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                  Tu tablero de salud: hábitos, longevidad, composición corporal y bienestar.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    { icon: Activity, label: "Hábitos" },
                    { icon: Heart, label: "Longevidad" },
                    { icon: Scale, label: "Composición" },
                    { icon: Brain, label: "Psicología" },
                  ].map(({ icon: Icon, label }) => (
                    <span key={label} className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full whitespace-nowrap">
                      <Icon className="h-3 w-3 flex-shrink-0" />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </Button>
          </motion.div>

          {/* Professional Demo */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="outline"
              className="w-full h-auto p-5 flex gap-4 items-start border-2 hover:border-accent hover:bg-accent/5 text-left"
              onClick={handleProfessionalDemo}
            >
              <div className="p-2.5 rounded-xl bg-accent/10 flex-shrink-0 mt-0.5">
                <Stethoscope className="h-6 w-6 text-accent" />
              </div>
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="font-display font-semibold text-base text-foreground leading-tight">Soy Profesional de la Salud</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                  Panel clínico: pacientes, edición de métricas, historial y notas de evolución.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    { icon: Users, label: "Pacientes" },
                    { icon: BarChart3, label: "Métricas" },
                    { icon: ClipboardList, label: "Historia clínica" },
                  ].map(({ icon: Icon, label }) => (
                    <span key={label} className="flex items-center gap-1 text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full whitespace-nowrap">
                      <Icon className="h-3 w-3 flex-shrink-0" />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </Button>
          </motion.div>
        </div>

        <p className="text-xs text-center text-muted-foreground pb-2">
          Todos los datos son de demostración. No se requiere cuenta.
        </p>
      </DialogContent>
    </Dialog>
  );
}
