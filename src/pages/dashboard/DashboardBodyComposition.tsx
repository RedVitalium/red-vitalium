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
import { PageHeader } from "@/components/PageHeader";
import { DEMO_DATA_MALE_45, DEMO_SEGMENTAL, FullBodyCompositionData, SegmentalData } from "@/components/dashboard/body-composition/types";
import { CompositionOverviewSlide } from "@/components/dashboard/body-composition/CompositionOverviewSlide";
import { FatAnalysisSlide } from "@/components/dashboard/body-composition/FatAnalysisSlide";
import { MuscleAndLeanSlide } from "@/components/dashboard/body-composition/MuscleAndLeanSlide";
import { MetabolicProfileSlide } from "@/components/dashboard/body-composition/MetabolicProfileSlide";
import { WeightControlSlide } from "@/components/dashboard/body-composition/WeightControlSlide";
import { SegmentalAnalysisSlide } from "@/components/dashboard/body-composition/SegmentalAnalysisSlide";
import { BodyCompositionEditor } from "@/components/dashboard/BodyCompositionEditor";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { useAuth } from "@/hooks/useAuth";
import { useCycleData } from "@/hooks/useCycleData";

const SLIDE_TITLES = ["General", "Grasa", "Músculo", "Metabólico", "Control", "Segmental"];

export default function DashboardBodyComposition() {
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";
  const { isViewingAsAdmin, targetUserId } = useAdminMode();
  const backPath = isViewingAsAdmin ? "/professional/history" : `/my-dashboard${isDemo ? '?demo=true' : ''}`;
  const [currentSlide, setCurrentSlide] = useState(0);
  const [editorOpen, setEditorOpen] = useState(false);

  const { personalData } = useDashboardData();
  const { user } = useAuth();
  const effectiveUserId = isViewingAsAdmin ? targetUserId : user?.id;
  const { getCycleProgress } = useCycleData(isDemo ? null : effectiveUserId || null);
  const cycleProgress = isDemo ? { hasActiveCycle: true } : getCycleProgress();
  const showEmpty = !isDemo && !cycleProgress.hasActiveCycle && !isViewingAsAdmin;

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

  // Fetch segmental analysis data
  const { data: segmentalRaw } = useQuery({
    queryKey: ["segmental-analysis", targetUserId || "self"],
    queryFn: async () => {
      const userId = targetUserId;
      if (!userId) return [];
      const { data } = await supabase
        .from("segmental_analysis")
        .select("segment, analysis_type, mass_kg, compared_to_normal, body_percentage, status")
        .eq("user_id", userId)
        .order("recorded_at", { ascending: false })
        .limit(10);
      return data || [];
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

  const lc = latestComposition as any;

  const bodyData: FullBodyCompositionData = isDemo ? DEMO_DATA_MALE_45 : lc ? {
    weight: lc.weight || personalData.weight || 0,
    bodyFatPercent: lc.body_fat_percent || 0,
    bodyType: lc.body_type || "-",
    visceralFat: lc.visceral_fat || 0,
    bodyWaterPercent: lc.body_water_percent || 0,
    muscleMass: lc.muscle_mass || 0,
    boneMass: lc.bone_mass || 0,
    bmi: lc.bmi || 0,
    metabolicAge: lc.metabolic_age || 0,
    bmr: lc.bmr || 0,
    fatFreeMass: lc.fat_free_mass || 0,
    subcutaneousFat: lc.subcutaneous_fat || 0,
    protein: lc.protein || 0,
    bodyAge: lc.body_age || 0,
    skeletalMuscle: lc.skeletal_muscle || 0,
    smi: lc.smi || 0,
    waistHipRatio: lc.waist_hip_ratio || 0,
    // Extended fields
    muscleMassPercent: lc.muscle_mass_percent || 0,
    boneMassPercent: lc.bone_mass_percent || 0,
    bodyWaterLiters: lc.body_water_liters || 0,
    proteinKg: lc.protein_kg || 0,
    bodyFatMassKg: lc.body_fat_mass_kg || 0,
    obesityPercent: lc.obesity_percent || 0,
    subcutaneousFatKg: lc.subcutaneous_fat_kg || 0,
    skeletalMusclePercent: lc.skeletal_muscle_percent || 0,
    normalWeightKg: lc.normal_weight_kg || 0,
    weightControlKg: lc.weight_control_kg || 0,
    fatMassControlKg: lc.fat_mass_control_kg || 0,
    muscleControlKg: lc.muscle_control_kg || 0,
    healthAssessment: lc.health_assessment || 0,
  } : {
    weight: personalData.weight || getHealthValue("weight") || 0,
    bodyFatPercent: getHealthValue("body_fat"),
    bodyType: "-", visceralFat: 0, bodyWaterPercent: 0,
    muscleMass: 0, boneMass: 0, bmi: 0, metabolicAge: 0, bmr: 0,
    fatFreeMass: 0, subcutaneousFat: 0, protein: 0, bodyAge: 0,
    skeletalMuscle: 0, smi: 0, waistHipRatio: 0,
    muscleMassPercent: 0, boneMassPercent: 0, bodyWaterLiters: 0,
    proteinKg: 0, bodyFatMassKg: 0, obesityPercent: 0,
    subcutaneousFatKg: 0, skeletalMusclePercent: 0, normalWeightKg: 0,
    weightControlKg: 0, fatMassControlKg: 0, muscleControlKg: 0, healthAssessment: 0,
  };

  // Map segmental data
  const segmentalData: SegmentalData[] = isDemo ? DEMO_SEGMENTAL : (segmentalRaw || []).map((row: any) => ({
    segment: row.segment,
    analysisType: row.analysis_type,
    massKg: row.mass_kg || 0,
    comparedToNormal: row.compared_to_normal || 0,
    bodyPercentage: row.body_percentage || 0,
    status: row.status || "Normal",
  }));

  const hasData = isDemo || bodyData.bodyFatPercent > 0 || bodyData.weight > 0;
  const hasWeightControl = bodyData.normalWeightKg > 0 || bodyData.healthAssessment > 0;
  const hasSegmental = segmentalData.length > 0;

  const patientAge = personalData.age || 0;
  const patientSex = personalData.sex || "";

  // Build slides dynamically — only show Weight Control and Segmental if data exists
  const slides = [
    <CompositionOverviewSlide key="overview" data={bodyData} age={patientAge} sex={patientSex} />,
    <FatAnalysisSlide key="fat" data={bodyData} age={patientAge} sex={patientSex} />,
    <MuscleAndLeanSlide key="muscle" data={bodyData} />,
    <MetabolicProfileSlide key="metabolic" data={bodyData} chronologicalAge={patientAge} />,
  ];
  const titles = [...SLIDE_TITLES.slice(0, 4)];

  if (hasWeightControl) {
    slides.push(<WeightControlSlide key="control" data={bodyData} />);
    titles.push("Control");
  }
  if (hasSegmental) {
    slides.push(<SegmentalAnalysisSlide key="segmental" segmentalData={segmentalData} />);
    titles.push("Segmental");
  }

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
        {showEmpty ? (
          <DashboardEmptyState
            icon={Scale}
            title="Tu composición corporal está en camino"
            description="Cuando tu programa inicie, aquí verás el análisis detallado de tu composición corporal."
          />
        ) : (
          <>
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
                if (bodyData.healthAssessment > 0) aiData.healthAssessment = bodyData.healthAssessment;
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
                  {/* Slide tabs */}
                  <div className="flex items-center justify-center gap-1.5 mb-4 flex-wrap">
                    {titles.map((title, i) => (
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

                {/* Professional edit button */}
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
