import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { 
  Trophy, 
  Activity, 
  Brain, 
  Heart, 
  Scale,
  Beaker,
  ChevronRight,
  ArrowLeft,
  Lock,
  Sparkles
} from "lucide-react";
import { useUserRoles, isFeatureAvailable, SubscriptionPlan } from "@/hooks/useUserRoles";
import appLogo from "@/assets/app-logo.png";

interface DashboardSection {
  id: string;
  label: string;
  description: string;
  icon: typeof Trophy;
  href: string;
  requiresPlan?: SubscriptionPlan;
}

const dashboardSections: DashboardSection[] = [
  {
    id: 'ai-summary',
    label: 'Resumen Integral con IA',
    description: 'Puntuación general y análisis completo',
    icon: Sparkles,
    href: '/dashboard/ai-summary',
  },
  {
    id: 'achievements',
    label: 'Logros',
    description: 'Logros de la semana y mes',
    icon: Trophy,
    href: '/dashboard/achievements',
  },
  {
    id: 'habits',
    label: 'Hábitos',
    description: 'Gráficas de hábitos en seguimiento',
    icon: Activity,
    href: '/dashboard/habits',
  },
  {
    id: 'psychological',
    label: 'Bienestar Psicológico',
    description: 'Pruebas psicométricas y evolución',
    icon: Brain,
    href: '/dashboard/psychological',
  },
  {
    id: 'longevity',
    label: 'Longevidad',
    description: 'Marcadores de longevidad',
    icon: Heart,
    href: '/dashboard/longevity',
  },
  {
    id: 'body-composition',
    label: 'Composición Corporal',
    description: 'Datos de báscula inteligente',
    icon: Scale,
    href: '/dashboard/body-composition',
  },
  {
    id: 'metabolic',
    label: 'Marcadores Metabólicos',
    description: 'Biomarcadores sanguíneos',
    icon: Beaker,
    href: '/dashboard/metabolic',
    requiresPlan: 'oro',
  },
];

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

export default function MyDashboard() {
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";
  const { subscription, isLoading } = useUserRoles();

  // Use demo subscription for demo mode
  const effectiveSubscription = isDemo ? 'plata' : subscription;

  if (isLoading && !isDemo) {
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
            <Link to={isDemo ? "/" : "/home"} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <img src={appLogo} alt="Red Vitalium" className="h-8 w-auto" />
            <span className="text-lg font-display font-bold text-primary">Mi Tablero</span>
          </div>
          {isDemo && (
            <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full">
              Demo
            </span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-xl">
        {/* Section List */}
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
          {dashboardSections.map((section, index) => {
            const Icon = section.icon;
            const isLocked = section.requiresPlan && !isFeatureAvailable(effectiveSubscription, section.requiresPlan);
            
            return (
              <motion.div key={section.id} variants={itemVariants}>
                {index > 0 && <div className="h-px bg-border/50" />}
                
                <Link
                  to={isLocked ? '#' : `${section.href}${isDemo ? '?demo=true' : ''}`}
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
                        {section.label}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {section.description}
                      </p>
                    </div>
                  </div>
                  
                  {isLocked ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Plan {section.requiresPlan}
                      </span>
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  )}
                </Link>
              </motion.div>
            );
          })}
        </motion.nav>

        {/* Info card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 p-5 bg-muted/30 border border-border rounded-xl"
        >
          <p className="text-sm text-muted-foreground text-center">
            Tu progreso se actualiza automáticamente con los datos de tu dispositivo y las entradas de tu equipo de profesionales.
          </p>
        </motion.div>
      </main>
    </div>
  );
}
