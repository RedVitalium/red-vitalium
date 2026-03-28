import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { Beaker, Lock, TrendingUp, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AISummaryCard } from "@/components/dashboard/AISummaryCard";
import { MetricTooltip } from "@/components/dashboard/MetricTooltip";
import { useUserRoles, isFeatureAvailable } from "@/hooks/useUserRoles";
import { useAdminMode } from "@/hooks/useAdminMode";
import { PageHeader } from "@/components/PageHeader";

// Metabolic markers would come from blood tests
interface MetabolicMarker {
  name: string;
  value: number | null;
  unit: string;
  referenceRange: string;
  status: 'optimal' | 'warning' | 'danger' | 'unknown';
}

const demoMarkers: MetabolicMarker[] = [
  { name: 'Glucosa en ayunas', value: 92, unit: 'mg/dL', referenceRange: '70-100', status: 'optimal' },
  { name: 'HbA1c', value: 5.4, unit: '%', referenceRange: '< 5.7', status: 'optimal' },
  { name: 'Insulina', value: 8.5, unit: 'μU/mL', referenceRange: '2.6-24.9', status: 'optimal' },
  { name: 'Colesterol Total', value: 185, unit: 'mg/dL', referenceRange: '< 200', status: 'optimal' },
  { name: 'LDL', value: 110, unit: 'mg/dL', referenceRange: '< 100', status: 'warning' },
  { name: 'HDL', value: 55, unit: 'mg/dL', referenceRange: '> 40', status: 'optimal' },
  { name: 'Triglicéridos', value: 120, unit: 'mg/dL', referenceRange: '< 150', status: 'optimal' },
  { name: 'PCR ultrasensible', value: 0.8, unit: 'mg/L', referenceRange: '< 1.0', status: 'optimal' },
];

export default function DashboardMetabolic() {
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";
  const { subscription, isLoading } = useUserRoles();
  const { isViewingAsAdmin } = useAdminMode();
  const backPath = isViewingAsAdmin ? "/professional/history" : `/my-dashboard${isDemo ? '?demo=true' : ''}`;

  // Check if user has access (Oro or higher)
  const hasAccess = isDemo || isFeatureAvailable(subscription, 'oro');
  const markers = isDemo ? demoMarkers : [];

  if (isLoading && !isDemo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Marcadores Metabólicos" backTo={backPath}>
        {isDemo && (
          <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full">Demo</span>
        )}
      </PageHeader>
      

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {!hasAccess ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-8 text-center">
              <Lock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-display font-bold mb-2">Función Bloqueada</h3>
              <p className="text-muted-foreground mb-4">
                Los marcadores metabólicos están disponibles a partir del Plan Oro. Actualiza tu plan para acceder a biomarcadores sanguíneos completos.
              </p>
              <Button asChild>
                <Link to="/upgrade">Ver Planes</Link>
              </Button>
            </Card>
          </motion.div>
        ) : markers.length === 0 && !isDemo ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-8 text-center">
              <Beaker className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-display font-bold mb-2">Sin datos de laboratorio</h3>
              <p className="text-muted-foreground mb-4">
                Tu médico ingresará los resultados de tus análisis de sangre aquí. Agenda una consulta para comenzar.
              </p>
              <Button asChild>
                <Link to="/appointments">Agendar Consulta</Link>
              </Button>
            </Card>
          </motion.div>
        ) : (
          <>
            {/* AI Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <AISummaryCard
                section="metabolic"
                healthData={{
                  markers: markers.map(m => ({ name: m.name, value: m.value, unit: m.unit, status: m.status })),
                }}
                compact
                isDemo={isDemo}
              />
            </motion.div>

            {/* Last update info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mb-6 p-4 bg-muted/50 rounded-lg flex items-center gap-3"
            >
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Última actualización: {isDemo ? 'Hace 2 semanas (Demo)' : 'Sin datos'}
              </p>
            </motion.div>

            {/* Markers Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-3"
            >
              {markers.map((marker, index) => (
                <Card key={marker.name} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium flex items-center gap-1.5">
                        {marker.name}
                        {(marker.name === 'Glucosa en ayunas' || marker.name === 'PCR ultrasensible') && (
                          <MetricTooltip metric={marker.name} />
                        )}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Ref: {marker.referenceRange} {marker.unit}
                      </p>
                        Ref: {marker.referenceRange} {marker.unit}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">
                        {marker.value !== null ? marker.value : '—'}
                        <span className="text-sm font-normal text-muted-foreground ml-1">
                          {marker.unit}
                        </span>
                      </p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        marker.status === 'optimal' ? 'bg-success/10 text-success' :
                        marker.status === 'warning' ? 'bg-warning/10 text-warning' :
                        marker.status === 'danger' ? 'bg-danger/10 text-danger' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {marker.status === 'optimal' ? 'Óptimo' :
                         marker.status === 'warning' ? 'Atención' :
                         marker.status === 'danger' ? 'Alto riesgo' : 'Sin datos'}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </motion.div>

            {/* Evolution chart placeholder */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-8"
            >
              <Card className="p-6">
                <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Evolución de Marcadores
                </h3>
                <div className="h-48 flex items-center justify-center text-muted-foreground">
                  <p>Las gráficas de evolución se mostrarán con múltiples mediciones</p>
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </main>
    </div>
  );
}
