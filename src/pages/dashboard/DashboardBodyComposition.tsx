import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Scale, Droplets, Bone, Dumbbell, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAdminMode } from "@/hooks/useAdminMode";
import appLogo from "@/assets/app-logo.png";

// Body composition data would come from smart scale integration
interface BodyCompositionData {
  weight: number;
  fatPercentage: number;
  musclePercentage: number;
  waterPercentage: number;
  boneMass: number;
  visceralFat: number;
  bmr: number;
  metabolicAge: number;
}

export default function DashboardBodyComposition() {
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";
  const { isViewingAsAdmin } = useAdminMode();
  const backPath = isViewingAsAdmin ? "/professional/history" : "/my-dashboard";
  
  const { personalData } = useDashboardData();

  // Demo data for body composition
  const bodyData: BodyCompositionData = isDemo ? {
    weight: 75.5,
    fatPercentage: 18.5,
    musclePercentage: 42.3,
    waterPercentage: 55.2,
    boneMass: 3.2,
    visceralFat: 8,
    bmr: 1680,
    metabolicAge: 32,
  } : {
    weight: personalData.weight || 0,
    fatPercentage: 0,
    musclePercentage: 0,
    waterPercentage: 0,
    boneMass: 0,
    visceralFat: 0,
    bmr: 0,
    metabolicAge: 0,
  };

  const hasData = isDemo || bodyData.fatPercentage > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Link to={backPath} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <img src={appLogo} alt="Red Vitalium" className="h-8 w-auto" />
          <span className="text-lg font-display font-bold text-primary">Composición Corporal</span>
          {isDemo && (
            <span className="ml-auto text-xs bg-accent/20 text-accent px-2 py-1 rounded-full">
              Demo
            </span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {!hasData ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-8 text-center">
              <Scale className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-display font-bold mb-2">Sin datos de composición corporal</h3>
              <p className="text-muted-foreground mb-4">
                Conecta tu báscula inteligente o visita nuestras oficinas de captación para obtener mediciones detalladas.
              </p>
            </Card>
          </motion.div>
        ) : (
          <>
            {/* Body Silhouette Visualization */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <Card className="p-6">
                <h3 className="font-display font-bold text-lg mb-4 text-center">Distribución Corporal</h3>
                <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                  {/* Silhouette placeholder */}
                  <div className="relative w-40 h-64 bg-gradient-to-b from-primary/20 to-primary/5 rounded-full flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-3xl font-bold">{bodyData.weight}</p>
                      <p className="text-sm text-muted-foreground">kg</p>
                    </div>
                  </div>
                  
                  {/* Composition bars */}
                  <div className="flex-1 space-y-4 w-full max-w-xs">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="flex items-center gap-2">
                          <Droplets className="h-4 w-4 text-blue-500" />
                          Agua
                        </span>
                        <span className="font-medium">{bodyData.waterPercentage}%</span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${bodyData.waterPercentage}%` }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="flex items-center gap-2">
                          <Dumbbell className="h-4 w-4 text-red-500" />
                          Músculo
                        </span>
                        <span className="font-medium">{bodyData.musclePercentage}%</span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-red-500 rounded-full" 
                          style={{ width: `${bodyData.musclePercentage}%` }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-yellow-500" />
                          Grasa
                        </span>
                        <span className="font-medium">{bodyData.fatPercentage}%</span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-yellow-500 rounded-full" 
                          style={{ width: `${bodyData.fatPercentage}%` }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="flex items-center gap-2">
                          <Bone className="h-4 w-4 text-gray-500" />
                          Masa Ósea
                        </span>
                        <span className="font-medium">{bodyData.boneMass} kg</span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gray-500 rounded-full" 
                          style={{ width: `${(bodyData.boneMass / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Additional metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 gap-4"
            >
              <Card className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Grasa Visceral</p>
                <p className="text-2xl font-bold">{bodyData.visceralFat}</p>
                <p className="text-xs text-muted-foreground">Nivel</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Tasa Metabólica Basal</p>
                <p className="text-2xl font-bold">{bodyData.bmr}</p>
                <p className="text-xs text-muted-foreground">kcal/día</p>
              </Card>
              <Card className="p-4 text-center col-span-2">
                <p className="text-sm text-muted-foreground">Edad Metabólica</p>
                <p className="text-3xl font-bold">{bodyData.metabolicAge}</p>
                <p className="text-xs text-muted-foreground">años</p>
              </Card>
            </motion.div>
          </>
        )}
      </main>
    </div>
  );
}
