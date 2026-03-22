import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Brain, Heart, Scale, Beaker, Activity, Trophy,
  User, FileText, ChevronRight, Sparkles
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAdminMode } from "@/hooks/useAdminMode";
import { useUserRoles, specialtyLabels } from "@/hooks/useUserRoles";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import appLogo from "@/assets/app-logo.png";

const categorySummaries = [
  { id: 'achievements', label: 'Logros', icon: Trophy, href: '/dashboard/achievements' },
  { id: 'habits', label: 'Hábitos', icon: Activity, href: '/dashboard/habits' },
  { id: 'psychological', label: 'Bienestar Psicológico', icon: Brain, href: '/dashboard/psychological' },
  { id: 'longevity', label: 'Longevidad', icon: Heart, href: '/dashboard/longevity' },
  { id: 'body-composition', label: 'Composición Corporal', icon: Scale, href: '/dashboard/body-composition' },
  { id: 'metabolic', label: 'Marcadores Metabólicos', icon: Beaker, href: '/dashboard/metabolic' },
];

export default function ProfessionalHistory() {
  const navigate = useNavigate();
  const { selectedPatient, isViewingAsAdmin } = useAdminMode();
  const { professionalData } = useUserRoles();

  useEffect(() => {
    if (!isViewingAsAdmin || !selectedPatient) {
      navigate('/professional');
    }
  }, [isViewingAsAdmin, selectedPatient, navigate]);

  if (!selectedPatient || !professionalData) return null;

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
            <span className="text-lg font-display font-bold text-primary">Resumen</span>
          </div>
          <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">
            {specialtyLabels[professionalData.specialty]}
          </span>
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

      <main className="container mx-auto px-4 py-6 max-w-xl space-y-6">
        {/* AI Summary Button */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card
            className="p-5 flex items-center justify-between cursor-pointer hover:bg-primary/5 transition-colors border-primary/20 bg-gradient-to-r from-primary/5 to-transparent"
            onClick={() => navigate('/dashboard/ai-summary')}
          >
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-primary/15 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Resumen con IA</h3>
                <p className="text-sm text-muted-foreground">Análisis integral del paciente</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-primary" />
          </Card>
        </motion.div>

        {/* Category Summaries */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
          <h2 className="text-lg font-display font-bold text-foreground mb-3">Resumen por Categoría</h2>
          <div className="grid grid-cols-2 gap-3">
            {categorySummaries.map(cat => {
              const Icon = cat.icon;
              return (
                <Card
                  key={cat.id}
                  className="p-4 flex items-center gap-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => navigate(cat.href)}
                >
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{cat.label}</p>
                    <p className="text-xs text-muted-foreground">Ver detalles →</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </motion.div>

        {/* Historia Clínica */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card
            className="p-5 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => navigate('/professional/clinical-history')}
          >
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Historia Clínica</h3>
                <p className="text-sm text-muted-foreground">Notas permanentes del paciente</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-5 bg-muted/30 border border-border rounded-xl"
        >
          <p className="text-sm text-muted-foreground text-center">
            Estás viendo los datos de <strong>{selectedPatient.fullName}</strong>.
            Selecciona una categoría o accede a la historia clínica.
          </p>
        </motion.div>
      </main>
    </div>
  );
}
