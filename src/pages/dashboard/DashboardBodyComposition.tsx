import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Scale } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAdminMode } from "@/hooks/useAdminMode";
import appLogo from "@/assets/app-logo.png";
import { DEMO_DATA_MALE_45, FullBodyCompositionData } from "@/components/dashboard/body-composition/types";
import { CompositionOverviewSlide } from "@/components/dashboard/body-composition/CompositionOverviewSlide";
import { FatAnalysisSlide } from "@/components/dashboard/body-composition/FatAnalysisSlide";
import { MuscleAndLeanSlide } from "@/components/dashboard/body-composition/MuscleAndLeanSlide";
import { MetabolicProfileSlide } from "@/components/dashboard/body-composition/MetabolicProfileSlide";

const SLIDE_TITLES = ["General", "Grasa", "Músculo", "Metabólico"];

export default function DashboardBodyComposition() {
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";
  const { isViewingAsAdmin } = useAdminMode();
  const backPath = isViewingAsAdmin ? "/professional/history" : `/my-dashboard${isDemo ? '?demo=true' : ''}`;
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const { personalData } = useDashboardData();

  const bodyData: FullBodyCompositionData = isDemo ? DEMO_DATA_MALE_45 : {
    weight: personalData.weight || 0,
    bodyFatPercent: 0, bodyType: "-", visceralFat: 0, bodyWaterPercent: 0,
    muscleMass: 0, boneMass: 0, bmi: 0, metabolicAge: 0, bmr: 0,
    fatFreeMass: 0, subcutaneousFat: 0, protein: 0, bodyAge: 0,
  };

  const hasData = isDemo || bodyData.bodyFatPercent > 0;

  const slides = [
    <CompositionOverviewSlide key="overview" data={bodyData} />,
    <FatAnalysisSlide key="fat" data={bodyData} />,
    <MuscleAndLeanSlide key="muscle" data={bodyData} />,
    <MetabolicProfileSlide key="metabolic" data={bodyData} />,
  ];

  const goNext = () => setCurrentSlide((p) => (p + 1) % slides.length);
  const goPrev = () => setCurrentSlide((p) => (p - 1 + slides.length) % slides.length);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Link to={backPath} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <img src={appLogo} alt="Red Vitalium" className="h-8 w-auto" />
          <span className="text-lg font-display font-bold text-primary">Composición Corporal</span>
          {isDemo && (
            <span className="ml-auto text-xs bg-accent/20 text-accent px-2 py-1 rounded-full">Demo</span>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-3xl">
        {!hasData ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-8 text-center">
              <Scale className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-display font-bold mb-2">Sin datos de composición corporal</h3>
              <p className="text-muted-foreground">
                Conecta tu báscula inteligente o visita nuestras oficinas para obtener mediciones detalladas.
              </p>
            </Card>
          </motion.div>
        ) : (
          <Card className="p-5 relative overflow-hidden">
            {/* Slide dots */}
            <div className="flex items-center justify-center gap-2 mb-4">
              {SLIDE_TITLES.map((title, i) => (
                <button
                  key={title}
                  onClick={() => setCurrentSlide(i)}
                  className={`text-xs px-3 py-1 rounded-full transition-all ${
                    i === currentSlide
                      ? "bg-primary text-primary-foreground font-medium"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {title}
                </button>
              ))}
            </div>

            {/* Slide content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.25 }}
              >
                {slides[currentSlide]}
              </motion.div>
            </AnimatePresence>

            {/* Navigation arrows */}
            <button
              onClick={goPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-card/80 hover:bg-muted rounded-full shadow-md transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={goNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-card/80 hover:bg-muted rounded-full shadow-md transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </Card>
        )}
      </main>
    </div>
  );
}
