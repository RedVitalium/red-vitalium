import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Scale, Edit } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAdminMode } from "@/hooks/useAdminMode";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/custom-client";
import { AISummaryCard } from "@/components/dashboard/AISummaryCard";
import { AIInterpretButton } from "@/components/dashboard/AIInterpretButton";
import { PageHeader } from "@/components/PageHeader";
import { DEMO_DATA_MALE_45, FullBodyCompositionData } from "@/components/dashboard/body-composition/types";
import { CompositionOverviewSlide } from "@/components/dashboard/body-composition/CompositionOverviewSlide";
import { FatAnalysisSlide } from "@/components/dashboard/body-composition/FatAnalysisSlide";
import { MuscleAndLeanSlide } from "@/components/dashboard/body-composition/MuscleAndLeanSlide";
import { MetabolicProfileSlide } from "@/components/dashboard/body-composition/MetabolicProfileSlide";
import { BodyCompositionEditor } from "@/components/dashboard/BodyCompositionEditor";

const SLIDE_TITLES = ["General", "Grasa", "Músculo", "Metabólico"];

export default function DashboardBodyComposition() {
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";
  const { isViewingAsAdmin, targetUserId } = useAdminMode();
  const backPath = isViewingAsAdmin ? "/professional/history" : `/my-dashboard${isDemo ? '?demo=true' : ''}`;
  const [currentSlide, setCurrentSlide] = useState(0);
  const [editorOpen, setEditorOpen] = useState(false);
  
  const { personalData } = useDashboardData();

  // Fetch latest body composition from DB
  const { data: latestComposition } = useQuery({
    queryKey: ["body-composition", targetUserId || "self"],
    queryFn: async () => {
      const userId = targetUserId;
      if (!userId) return null;
      const { data } = await supabase
        .from("body_composition")
        .select("*")
        .eq("user_id", userId)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !isDemo && !!targetUserId,
  });

  // Fetch body metrics from health_data (Health Connect)
  const { data: healthBodyData } = useQuery({
    queryKey: ["health-body-data", targetUserId || "self"],
    queryFn: async () => {
      const userId = targetUserId;
      if (!userId) return null;
      const { data } = await supabase
        .from("health_data")
        .select("data_type, value")
        .eq("user_id", userId)
        .in("data_type", ["weight", "body_fat"])
        .order("recorded_at", { ascending: false })
        .limit(10);
      return data;
    },
    enabled: !isDemo && !!targetUserId,
  });

  const getHealthValue = (type: string) => {
    const entry = healthBodyData?.find(h => h.data_type === type);
    return entry ? Number(entry.value) : 0;
  };

  const bodyData: FullBodyCompositionData = isDemo ? DEMO_DATA_MALE_45 : latestComposition ? {
    weight: latestComposition.weight || personalData.weight || 0,
    bodyFatPercent: latestComposition.body_fat_percent || 0,
    bodyType: latestComposition.body_type || "-",
    visceralFat: latestComposition.visceral_fat || 0,
    bodyWaterPercent: latestComposition.body_water_percent || 0,
    muscleMass: latestComposition.muscle_mass || 0,
    boneMass: latestComposition.bone_mass || 0,
    bmi: latestComposition.bmi || 0,
    metabolicAge: latestComposition.metabolic_age || 0,
    bmr: latestComposition.bmr || 0,
    fatFreeMass: latestComposition.fat_free_mass || 0,
    subcutaneousFat: latestComposition.subcutaneous_fat || 0,
    protein: latestComposition.protein || 0,
    bodyAge: latestComposition.body_age || 0,
    skeletalMuscle: (latestComposition as any).skeletal_muscle || 0,
    smi: (latestComposition as any).smi || 0,
    waistHipRatio: (latestComposition as any).waist_hip_ratio || 0,
  } : {
    weight: personalData.weight || getHealthValue("weight") || 0,
    bodyFatPercent: getHealthValue("body_fat"), bodyType: "-", visceralFat: 0, bodyWaterPercent: 0,
    muscleMass: 0, boneMass: 0, bmi: 0, metabolicAge: 0, bmr: 0,
    fatFreeMass: 0, subcutaneousFat: 0, protein: 0, bodyAge: 0,
    skeletalMuscle: 0, smi: 0, waistHipRatio: 0,
  };

  const hasData = isDemo || bodyData.bodyFatPercent > 0 || bodyData.weight > 0;

  const patientAge = personalData.age || 0;
  const patientSex = personalData.sex || "";

  const slides = [
    <CompositionOverviewSlide key="overview" data={bodyData} />,
    <FatAnalysisSlide key="fat" data={bodyData} age={patientAge} sex={patientSex} />,
    <MuscleAndLeanSlide key="muscle" data={bodyData} />,
    <MetabolicProfileSlide key="metabolic" data={bodyData} chronologicalAge={patientAge} />,
  ];

  const goNext = () => setCurrentSlide((p) => (p + 1) % slides.length);
  const goPrev = () => setCurrentSlide((p) => (p - 1 + slides.length) % slides.length);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Composición Corporal" backTo={backPath}>
        {isDemo && (
          <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full">Demo</span>
        )}
      </PageHeader>

      <main className="container mx-auto px-4 py-6 max-w-3xl">
        {/* AI Summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          {(() => {
            const aiData: Record<string, any> = {};
            if (bodyData.weight > 0) aiData.weight = bodyData.weight;
            if (bodyData.bodyFatPercent > 0) aiData.bodyFatPercent = bodyData.bodyFatPercent;
            if (bodyData.muscleMass > 0) aiData.muscleMass = bodyData.muscleMass;
            if (bodyData.visceralFat > 0) aiData.visceralFat = bodyData.visceralFat;
            if (bodyData.bodyWaterPercent > 0) aiData.bodyWaterPercent = bodyData.bodyWaterPercent;
            if (bodyData.bmi > 0) aiData.bmi = bodyData.bmi;
            if (bodyData.metabolicAge > 0) aiData.metabolicAge = bodyData.metabolicAge;
            if (bodyData.bmr > 0) aiData.bmr = bodyData.bmr;
            if (bodyData.boneMass > 0) aiData.boneMass = bodyData.boneMass;
            return (
              <AISummaryCard
                section="body-composition"
                healthData={Object.keys(aiData).length > 0 ? aiData : undefined}
                targetUserId={isViewingAsAdmin ? targetUserId || undefined : undefined}
                compact
                isDemo={isDemo}
              />
            );
          })()}
        </motion.div>

        {!hasData ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-8 text-center">
              <Scale className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-display font-bold mb-2">Sin datos de composición corporal</h3>
              <p className="text-muted-foreground mb-4">
                Conecta tu báscula inteligente o visita nuestras oficinas para obtener mediciones detalladas.
              </p>
              {isViewingAsAdmin && targetUserId && (
                <Button onClick={() => setEditorOpen(true)} className="gap-2">
                  <Edit className="h-4 w-4" />
                  Añadir primera medición
                </Button>
              )}
            </Card>
          </motion.div>
        ) : (
          <>
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

            {/* Professional edit button - same style as habits */}
            {isViewingAsAdmin && targetUserId && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full mt-2 text-xs gap-1 text-muted-foreground hover:text-primary"
                onClick={() => setEditorOpen(true)}
              >
                <Edit className="h-3 w-3" />
                Añadir / editar datos de composición corporal
              </Button>
            )}
          </>
        )}
      </main>

      {/* Editor Dialog */}
      {targetUserId && (
        <BodyCompositionEditor
          open={editorOpen}
          onOpenChange={setEditorOpen}
          targetUserId={targetUserId}
        />
      )}
    </div>
  );
}
