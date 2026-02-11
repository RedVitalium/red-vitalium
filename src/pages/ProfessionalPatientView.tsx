import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  ClipboardList, 
  ChevronRight, 
  ArrowLeft,
  User
} from "lucide-react";
import { useAdminMode } from "@/hooks/useAdminMode";
import { useUserRoles, specialtyLabels } from "@/hooks/useUserRoles";
import appLogo from "@/assets/app-logo.png";
import { useEffect } from "react";

const menuItems = [
  {
    id: 'dashboard',
    label: 'Mi Tablero',
    description: 'Logros, hábitos y métricas del paciente',
    icon: LayoutDashboard,
    href: '/my-dashboard',
  },
  {
    id: 'history',
    label: 'Historial',
    description: 'Resumen clínico y notas profesionales',
    icon: ClipboardList,
    href: '/professional/history',
  },
];

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

export default function ProfessionalPatientView() {
  const navigate = useNavigate();
  const { selectedPatient, isViewingAsAdmin } = useAdminMode();
  const { professionalData } = useUserRoles();

  useEffect(() => {
    if (!isViewingAsAdmin || !selectedPatient) {
      navigate('/professional');
    }
  }, [isViewingAsAdmin, selectedPatient, navigate]);

  if (!selectedPatient) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/professional" className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <img src={appLogo} alt="Red Vitalium" className="h-8 w-auto" />
            <span className="text-lg font-display font-bold text-primary">
              Panel Profesional
            </span>
          </div>
          {professionalData && (
            <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">
              {specialtyLabels[professionalData.specialty]}
            </span>
          )}
        </div>
      </header>

      {/* Patient Banner */}
      <div className="bg-primary/5 border-b border-primary/20">
        <div className="container mx-auto px-4 py-3 max-w-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">{selectedPatient.fullName}</p>
            {selectedPatient.email && (
              <p className="text-xs text-muted-foreground">{selectedPatient.email}</p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-xl">
        <motion.nav
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.05 } }
          }}
          className="space-y-0"
        >
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div key={item.id} variants={itemVariants}>
                {index > 0 && <div className="h-px bg-border/50" />}
                <Link
                  to={item.href}
                  className="flex items-center justify-between py-5 px-2 group transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-xl transition-colors bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{item.label}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </Link>
              </motion.div>
            );
          })}
        </motion.nav>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 p-5 bg-muted/30 border border-border rounded-xl"
        >
          <p className="text-sm text-muted-foreground text-center">
            Estás viendo los datos de <strong>{selectedPatient.fullName}</strong>. 
            Podrás ver su tablero completo y gestionar notas desde el historial.
          </p>
        </motion.div>
      </main>
    </div>
  );
}
