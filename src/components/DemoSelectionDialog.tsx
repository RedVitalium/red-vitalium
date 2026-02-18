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

        <div className="grid gap-3 py-2">
          {/* Patient Demo */}
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <button
              className="w-full p-4 flex gap-3 items-center border-2 border-border hover:border-primary hover:bg-primary/5 text-left rounded-lg transition-all"
              onClick={handlePatientDemo}
            >
              <div className="p-2 rounded-xl bg-primary/10 flex-shrink-0">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-semibold text-sm text-foreground">Soy Paciente</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  Hábitos, longevidad, composición corporal y bienestar
                </p>
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {[
                    { icon: Activity, label: "Hábitos" },
                    { icon: Heart, label: "Longevidad" },
                    { icon: Scale, label: "Composición" },
                    { icon: Brain, label: "Psicología" },
                  ].map(({ icon: Icon, label }) => (
                    <span key={label} className="flex items-center gap-0.5 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                      <Icon className="h-2.5 w-2.5 flex-shrink-0" />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          </motion.div>

          {/* Professional Demo */}
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <button
              className="w-full p-4 flex gap-3 items-center border-2 border-border hover:border-accent hover:bg-accent/5 text-left rounded-lg transition-all"
              onClick={handleProfessionalDemo}
            >
              <div className="p-2 rounded-xl bg-accent/10 flex-shrink-0">
                <Stethoscope className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-semibold text-sm text-foreground">Soy Profesional de la Salud</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  Panel clínico, edición de métricas y notas de evolución
                </p>
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {[
                    { icon: Users, label: "Pacientes" },
                    { icon: BarChart3, label: "Métricas" },
                    { icon: ClipboardList, label: "Historial" },
                  ].map(({ icon: Icon, label }) => (
                    <span key={label} className="flex items-center gap-0.5 text-xs bg-accent/10 text-accent px-1.5 py-0.5 rounded-full">
                      <Icon className="h-2.5 w-2.5 flex-shrink-0" />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          </motion.div>
        </div>

        <p className="text-xs text-center text-muted-foreground pb-2">
          Todos los datos son de demostración. No se requiere cuenta.
        </p>
      </DialogContent>
    </Dialog>
  );
}
