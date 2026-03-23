-- Índices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_daily_survey_responses_user_date 
ON public.daily_survey_responses (user_id, response_date DESC);

CREATE INDEX IF NOT EXISTS idx_health_data_user_type_date 
ON public.health_data (user_id, data_type, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_test_results_user_test 
ON public.test_results (user_id, test_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_professional_notes_patient 
ON public.professional_notes (patient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_patient_medications_user 
ON public.patient_medications (user_id, is_active);

-- Trigger para updated_at en patient_medications
CREATE OR REPLACE FUNCTION public.update_patient_medications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_patient_medications_updated_at ON public.patient_medications;

CREATE TRIGGER update_patient_medications_updated_at
BEFORE UPDATE ON public.patient_medications
FOR EACH ROW
EXECUTE FUNCTION public.update_patient_medications_updated_at();