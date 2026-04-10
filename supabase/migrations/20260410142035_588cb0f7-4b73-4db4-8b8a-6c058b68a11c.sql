ALTER TABLE public.body_composition 
  ADD COLUMN IF NOT EXISTS skeletal_muscle numeric,
  ADD COLUMN IF NOT EXISTS smi numeric,
  ADD COLUMN IF NOT EXISTS waist_hip_ratio numeric;