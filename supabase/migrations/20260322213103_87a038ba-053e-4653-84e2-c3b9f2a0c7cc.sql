
-- 1. Research consent fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS research_consent BOOLEAN DEFAULT NULL;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS research_consent_at TIMESTAMPTZ;

-- 2. Wearable model
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS wearable_model TEXT;

-- 3. Partner linking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS partner_user_id UUID;

-- 4. Shift type
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS shift_type TEXT DEFAULT 'none';

-- Validation trigger for shift_type instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_shift_type()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.shift_type IS NOT NULL AND NEW.shift_type NOT IN ('day_fixed','night_fixed','rotating','field_offshore','none') THEN
    RAISE EXCEPTION 'Invalid shift_type: %', NEW.shift_type;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_shift_type_trigger ON public.profiles;
CREATE TRIGGER validate_shift_type_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_shift_type();

-- 5. Patient medications table
CREATE TABLE IF NOT EXISTS public.patient_medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  medication_name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  start_date DATE,
  end_date DATE,
  prescribed_by TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.patient_medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own medications"
ON public.patient_medications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all medications"
ON public.patient_medications FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Professionals can view patient medications"
ON public.patient_medications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.patient_professionals pp
    JOIN public.professionals p ON p.id = pp.professional_id
    WHERE pp.patient_id = patient_medications.user_id
    AND p.user_id = auth.uid()
    AND pp.is_active = true
  )
);

CREATE POLICY "Professionals can insert patient medications"
ON public.patient_medications FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.patient_professionals pp
    JOIN public.professionals p ON p.id = pp.professional_id
    WHERE pp.patient_id = patient_medications.user_id
    AND p.user_id = auth.uid()
    AND pp.is_active = true
  )
);

CREATE POLICY "Professionals can update patient medications"
ON public.patient_medications FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.patient_professionals pp
    JOIN public.professionals p ON p.id = pp.professional_id
    WHERE pp.patient_id = patient_medications.user_id
    AND p.user_id = auth.uid()
    AND pp.is_active = true
  )
);
