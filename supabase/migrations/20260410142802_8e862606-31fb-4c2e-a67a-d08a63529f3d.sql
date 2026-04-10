-- Allow professionals to INSERT health_data for assigned patients
CREATE POLICY "Professionals can insert patient health data"
ON public.health_data
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM patient_professionals pp
    JOIN professionals p ON p.id = pp.professional_id
    WHERE pp.patient_id = health_data.user_id
      AND p.user_id = auth.uid()
      AND pp.is_active = true
  )
);

-- Allow professionals to UPDATE profiles of assigned patients (for wearable_model, waist_circumference)
CREATE POLICY "Professionals can update assigned patient profiles"
ON public.profiles
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1
    FROM patient_professionals pp
    JOIN professionals p ON p.id = pp.professional_id
    WHERE pp.patient_id = profiles.user_id
      AND p.user_id = auth.uid()
      AND pp.is_active = true
  )
);