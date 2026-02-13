
-- Create body_composition table for tracking measurements over time
CREATE TABLE public.body_composition (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  weight NUMERIC,
  body_fat_percent NUMERIC,
  body_type TEXT,
  visceral_fat NUMERIC,
  body_water_percent NUMERIC,
  muscle_mass NUMERIC,
  bone_mass NUMERIC,
  bmi NUMERIC,
  metabolic_age NUMERIC,
  bmr NUMERIC,
  fat_free_mass NUMERIC,
  subcutaneous_fat NUMERIC,
  protein NUMERIC,
  body_age NUMERIC,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  recorded_by UUID,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.body_composition ENABLE ROW LEVEL SECURITY;

-- Patients can view their own data
CREATE POLICY "Users can view their own body composition"
ON public.body_composition FOR SELECT
USING (auth.uid() = user_id);

-- Patients can insert their own data
CREATE POLICY "Users can insert their own body composition"
ON public.body_composition FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Professionals can view patient data
CREATE POLICY "Professionals can view patient body composition"
ON public.body_composition FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.patient_professionals pp
    JOIN public.professionals p ON p.id = pp.professional_id
    WHERE pp.patient_id = body_composition.user_id
    AND p.user_id = auth.uid()
    AND pp.is_active = true
  )
);

-- Professionals can insert patient data
CREATE POLICY "Professionals can insert patient body composition"
ON public.body_composition FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.patient_professionals pp
    JOIN public.professionals p ON p.id = pp.professional_id
    WHERE pp.patient_id = body_composition.user_id
    AND p.user_id = auth.uid()
    AND pp.is_active = true
  )
);

-- Professionals can update patient data
CREATE POLICY "Professionals can update patient body composition"
ON public.body_composition FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.patient_professionals pp
    JOIN public.professionals p ON p.id = pp.professional_id
    WHERE pp.patient_id = body_composition.user_id
    AND p.user_id = auth.uid()
    AND pp.is_active = true
  )
);

-- Index for efficient queries
CREATE INDEX idx_body_composition_user_date ON public.body_composition (user_id, recorded_at DESC);
