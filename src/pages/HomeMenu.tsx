import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { 
  User, 
  LayoutDashboard, 
  Calendar, 
  MapPin, 
  Brain, 
  Stethoscope,
  ChevronRight,
  Lock
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles, isFeatureAvailable } from "@/hooks/useUserRoles";
import appLogo from "@/assets/app-logo.png";

interface MenuItem {
  id: string;
  label: string;
  description: string;
  icon: typeof User;
  href: string;
  requiresPlan?: 'plata' | 'oro' | 'platino' | 'black';
  showForProfessional?: boolean;
}

const menuItems: MenuItem[] = [
  {
    id: 'profile',
    label: 'Mi Perfil',
    description: 'Datos personales y configuración',
    icon: User,
    href: '/profile',
  },
  {
    id: 'dashboard',
    label: 'Mi Tablero',
    description: 'Logros, hábitos y métricas de salud',
    icon: LayoutDashboard,
    href: '/my-dashboard',
  },
  {
    id: 'appointments',
    label: 'Agendar Citas',
    description: 'Programa consultas con profesionales',
    icon: Calendar,
    href: '/appointments',
  },
  {
    id: 'find-professionals',
    label: 'Busca Profesionales Cerca',
    description: 'Encuentra especialistas en tu zona',
    icon: MapPin,
    href: '/find-professionals',
  },
  {
    id: 'tests',
    label: 'Tests Psicométricos',
    description: 'Evaluaciones de bienestar mental',
    icon: Brain,
    href: '/tests',
  },
  {
    id: 'professional-mode',
    label: 'Entrar como Profesional',
    description: 'Accede al panel de profesionales',
    icon: Stethoscope,
    href: '/professional',
    showForProfessional: true,
  },
];

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

export default function HomeMenu() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { subscription, isProfessional, isLoading } = useUserRoles();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Filter menu items based on user type
  const visibleItems = menuItems.filter(item => {
    if (item.showForProfessional && !isProfessional) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={appLogo} alt="Red Vitalium" className="h-10 w-auto" />
            <span className="text-xl font-display font-bold text-primary">RED VITALIUM</span>
          </div>
          <button
            onClick={handleSignOut}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-xl">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <p className="text-muted-foreground">Bienvenido</p>
          <h1 className="text-2xl font-display font-bold text-foreground">
            {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario'}
          </h1>
          {subscription && (
            <span className="inline-block mt-2 text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary">
              {subscription === 'plata' && 'Plan Plata'}
              {subscription === 'oro' && 'Plan Oro'}
              {subscription === 'platino' && 'Plan Platino'}
              {subscription === 'black' && 'Plan Black'}
            </span>
          )}
        </motion.div>

        {/* Menu Items */}
        <motion.nav
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: { staggerChildren: 0.05 }
            }
          }}
          className="space-y-0"
        >
          {visibleItems.map((item, index) => {
            const Icon = item.icon;
            const isLocked = item.requiresPlan && !isFeatureAvailable(subscription, item.requiresPlan);
            
            return (
              <motion.div key={item.id} variants={itemVariants}>
                {index > 0 && <div className="h-px bg-border/50" />}
                
                <Link
                  to={isLocked ? '#' : item.href}
                  className={`flex items-center justify-between py-5 px-2 group transition-colors ${
                    isLocked 
                      ? 'cursor-not-allowed' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={(e) => {
                    if (isLocked) e.preventDefault();
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl transition-colors ${
                      isLocked 
                        ? 'bg-muted text-muted-foreground' 
                        : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className={`font-medium ${isLocked ? 'text-muted-foreground' : 'text-foreground'}`}>
                        {item.label}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  
                  {isLocked ? (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  )}
                </Link>
              </motion.div>
            );
          })}
        </motion.nav>

        {/* Upgrade prompt for plata users */}
        {subscription === 'plata' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 p-5 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-xl text-center"
          >
            <p className="text-sm font-medium text-foreground mb-2">
              ¿Quieres acceder a más funciones?
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Actualiza tu plan para desbloquear nutrición, medicina y más
            </p>
            <Link
              to="/upgrade"
              className="inline-block text-sm font-medium text-primary hover:underline"
            >
              Ver planes disponibles →
            </Link>
          </motion.div>
        )}
      </main>
    </div>
  );
}
