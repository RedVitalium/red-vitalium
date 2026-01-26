import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { User, Shield } from 'lucide-react';
import { useAdminMode } from '@/hooks/useAdminMode';
import { useAuth } from '@/hooks/useAuth';

interface RoleSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoleSelectionDialog({ open, onOpenChange }: RoleSelectionDialogProps) {
  const navigate = useNavigate();
  const { setCurrentMode, setShouldShowRoleSelection } = useAdminMode();
  const { user } = useAuth();

  const handleSelectPatient = () => {
    setCurrentMode('patient');
    setShouldShowRoleSelection(false);
    onOpenChange(false);
    navigate('/dashboard');
  };

  const handleSelectAdmin = () => {
    setCurrentMode('admin');
    setShouldShowRoleSelection(false);
    onOpenChange(false);
    navigate('/admin/select-patient');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-display">
            ¿Cómo deseas ingresar?
          </DialogTitle>
          <DialogDescription className="text-center">
            Tienes acceso como paciente y administrador. Elige cómo deseas usar la aplicación.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-6">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              variant="outline"
              className="w-full h-auto p-6 flex flex-col items-center gap-3 border-2 hover:border-primary hover:bg-primary/5"
              onClick={handleSelectPatient}
            >
              <div className="p-3 rounded-full bg-primary/10">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-display font-semibold text-lg">Como Paciente</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Ver mi propio dashboard y datos de salud
                </p>
              </div>
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              variant="outline"
              className="w-full h-auto p-6 flex flex-col items-center gap-3 border-2 hover:border-accent hover:bg-accent/5"
              onClick={handleSelectAdmin}
            >
              <div className="p-3 rounded-full bg-accent/10">
                <Shield className="h-8 w-8 text-accent" />
              </div>
              <div className="text-center">
                <p className="font-display font-semibold text-lg">Como Administrador</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Gestionar pacientes y ver sus dashboards
                </p>
              </div>
            </Button>
          </motion.div>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Puedes cambiar de modo en cualquier momento desde el menú
        </p>
      </DialogContent>
    </Dialog>
  );
}
