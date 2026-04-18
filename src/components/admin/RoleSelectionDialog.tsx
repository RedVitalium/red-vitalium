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
import { User, Shield, Stethoscope } from 'lucide-react';
import { useAdminMode, ActiveRole } from '@/hooks/useAdminMode';

interface RoleSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const roleConfig: Record<ActiveRole, {
  icon: typeof User;
  label: string;
  description: string;
  colorClass: string;
  bgClass: string;
  route: string;
}> = {
  patient: {
    icon: User,
    label: 'Como Paciente',
    description: 'Ver mi propio dashboard y datos de salud',
    colorClass: 'text-primary',
    bgClass: 'bg-primary/10 hover:border-primary hover:bg-primary/5',
    route: '/home',
  },
  admin: {
    icon: Shield,
    label: 'Como Administrador',
    description: 'Gestionar pacientes y ver sus dashboards',
    colorClass: 'text-accent',
    bgClass: 'bg-accent/10 hover:border-accent hover:bg-accent/5',
    route: '/admin',
  },
  professional: {
    icon: Stethoscope,
    label: 'Como Profesional',
    description: 'Atender pacientes desde tu especialidad',
    colorClass: 'text-success',
    bgClass: 'bg-success/10 hover:border-success hover:bg-success/5',
    route: '/professional',
  },
};

export function RoleSelectionDialog({ open, onOpenChange }: RoleSelectionDialogProps) {
  const navigate = useNavigate();
  const { setCurrentMode, setShouldShowRoleSelection, userRoles } = useAdminMode();

  const handleSelectRole = (role: ActiveRole) => {
    setCurrentMode(role);
    setShouldShowRoleSelection(false);
    onOpenChange(false);
    navigate(roleConfig[role].route);
  };

  // Only show roles the user actually has
  const availableRoles = userRoles.filter(r => roleConfig[r]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!left-4 !right-4 !translate-x-0 !w-auto sm:!left-[50%] sm:!right-auto sm:!translate-x-[-50%] sm:!w-full sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-display">
            ¿Cómo deseas ingresar?
          </DialogTitle>
          <DialogDescription className="text-center">
            Tienes acceso a múltiples roles. Elige cómo deseas usar la aplicación.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {availableRoles.map((role) => {
            const config = roleConfig[role];
            const Icon = config.icon;

            return (
              <motion.div
                key={role}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="outline"
                  className={`w-full h-auto p-5 flex items-center gap-4 border-2 ${config.bgClass}`}
                  onClick={() => handleSelectRole(role)}
                >
                  <div className={`p-2.5 rounded-full ${config.bgClass}`}>
                    <Icon className={`h-6 w-6 ${config.colorClass}`} />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-display font-semibold">{config.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {config.description}
                    </p>
                  </div>
                </Button>
              </motion.div>
            );
          })}
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Puedes cambiar de modo en cualquier momento desde el menú
        </p>
      </DialogContent>
    </Dialog>
  );
}
