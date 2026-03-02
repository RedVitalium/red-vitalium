
-- Professional SELECT policies for all patient data tables
-- Pattern: professional can view data of their assigned active patients

-- 1. profiles
CREATE POLICY "Professionals can view assigned patient profiles"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.patient_professionals pp
    JOIN public.professionals p ON p.id = pp.professional_id
    WHERE pp.patient_id = profiles.user_id
    AND p.user_id = auth.uid()
    AND pp.is_active = true
  )
);

-- 2. biomarkers
CREATE POLICY "Professionals can view assigned patient biomarkers"
ON public.biomarkers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.patient_professionals pp
    JOIN public.professionals p ON p.id = pp.professional_id
    WHERE pp.patient_id = biomarkers.user_id
    AND p.user_id = auth.uid()
    AND pp.is_active = true
  )
);

-- 3. health_data
CREATE POLICY "Professionals can view assigned patient health data"
ON public.health_data FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.patient_professionals pp
    JOIN public.professionals p ON p.id = pp.professional_id
    WHERE pp.patient_id = health_data.user_id
    AND p.user_id = auth.uid()
    AND pp.is_active = true
  )
);

-- 4. test_results (read-only for professionals)
CREATE POLICY "Professionals can view assigned patient test results"
ON public.test_results FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.patient_professionals pp
    JOIN public.professionals p ON p.id = pp.professional_id
    WHERE pp.patient_id = test_results.user_id
    AND p.user_id = auth.uid()
    AND pp.is_active = true
  )
);

-- 5. unlocked_habits (SELECT + INSERT + DELETE for professional management)
CREATE POLICY "Professionals can view assigned patient unlocked habits"
ON public.unlocked_habits FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.patient_professionals pp
    JOIN public.professionals p ON p.id = pp.professional_id
    WHERE pp.patient_id = unlocked_habits.user_id
    AND p.user_id = auth.uid()
    AND pp.is_active = true
  )
);

CREATE POLICY "Professionals can insert unlocked habits for patients"
ON public.unlocked_habits FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.patient_professionals pp
    JOIN public.professionals p ON p.id = pp.professional_id
    WHERE pp.patient_id = unlocked_habits.user_id
    AND p.user_id = auth.uid()
    AND pp.is_active = true
  )
);

CREATE POLICY "Professionals can delete unlocked habits for patients"
ON public.unlocked_habits FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.patient_professionals pp
    JOIN public.professionals p ON p.id = pp.professional_id
    WHERE pp.patient_id = unlocked_habits.user_id
    AND p.user_id = auth.uid()
    AND pp.is_active = true
  )
);

-- 6. appointments
CREATE POLICY "Professionals can view assigned patient appointments"
ON public.appointments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.patient_professionals pp
    JOIN public.professionals p ON p.id = pp.professional_id
    WHERE pp.patient_id = appointments.user_id
    AND p.user_id = auth.uid()
    AND pp.is_active = true
  )
);

-- 7. user_settings (SELECT + INSERT + UPDATE for professional management)
CREATE POLICY "Professionals can view assigned patient settings"
ON public.user_settings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.patient_professionals pp
    JOIN public.professionals p ON p.id = pp.professional_id
    WHERE pp.patient_id = user_settings.user_id
    AND p.user_id = auth.uid()
    AND pp.is_active = true
  )
);

CREATE POLICY "Professionals can insert patient settings"
ON public.user_settings FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.patient_professionals pp
    JOIN public.professionals p ON p.id = pp.professional_id
    WHERE pp.patient_id = user_settings.user_id
    AND p.user_id = auth.uid()
    AND pp.is_active = true
  )
);

CREATE POLICY "Professionals can update assigned patient settings"
ON public.user_settings FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.patient_professionals pp
    JOIN public.professionals p ON p.id = pp.professional_id
    WHERE pp.patient_id = user_settings.user_id
    AND p.user_id = auth.uid()
    AND pp.is_active = true
  )
);

-- 8. activity_goals (SELECT + INSERT + UPDATE)
CREATE POLICY "Professionals can view assigned patient activity goals"
ON public.activity_goals FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.patient_professionals pp
    JOIN public.professionals p ON p.id = pp.professional_id
    WHERE pp.patient_id = activity_goals.user_id
    AND p.user_id = auth.uid()
    AND pp.is_active = true
  )
);

CREATE POLICY "Professionals can insert patient activity goals"
ON public.activity_goals FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.patient_professionals pp
    JOIN public.professionals p ON p.id = pp.professional_id
    WHERE pp.patient_id = activity_goals.user_id
    AND p.user_id = auth.uid()
    AND pp.is_active = true
  )
);

CREATE POLICY "Professionals can update assigned patient activity goals"
ON public.activity_goals FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.patient_professionals pp
    JOIN public.professionals p ON p.id = pp.professional_id
    WHERE pp.patient_id = activity_goals.user_id
    AND p.user_id = auth.uid()
    AND pp.is_active = true
  )
);

-- 9. habit_goals (SELECT + INSERT + UPDATE)
CREATE POLICY "Professionals can view assigned patient habit goals"
ON public.habit_goals FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.patient_professionals pp
    JOIN public.professionals p ON p.id = pp.professional_id
    WHERE pp.patient_id = habit_goals.user_id
    AND p.user_id = auth.uid()
    AND pp.is_active = true
  )
);

CREATE POLICY "Professionals can insert patient habit goals"
ON public.habit_goals FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.patient_professionals pp
    JOIN public.professionals p ON p.id = pp.professional_id
    WHERE pp.patient_id = habit_goals.user_id
    AND p.user_id = auth.uid()
    AND pp.is_active = true
  )
);

CREATE POLICY "Professionals can update assigned patient habit goals"
ON public.habit_goals FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.patient_professionals pp
    JOIN public.professionals p ON p.id = pp.professional_id
    WHERE pp.patient_id = habit_goals.user_id
    AND p.user_id = auth.uid()
    AND pp.is_active = true
  )
);

-- 10. daily_survey_responses (read-only)
CREATE POLICY "Professionals can view assigned patient survey responses"
ON public.daily_survey_responses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.patient_professionals pp
    JOIN public.professionals p ON p.id = pp.professional_id
    WHERE pp.patient_id = daily_survey_responses.user_id
    AND p.user_id = auth.uid()
    AND pp.is_active = true
  )
);

-- 11. user_cycles (SELECT + INSERT + UPDATE for cycle management)
CREATE POLICY "Professionals can view assigned patient cycles"
ON public.user_cycles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.patient_professionals pp
    JOIN public.professionals p ON p.id = pp.professional_id
    WHERE pp.patient_id = user_cycles.user_id
    AND p.user_id = auth.uid()
    AND pp.is_active = true
  )
);

CREATE POLICY "Professionals can insert patient cycles"
ON public.user_cycles FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.patient_professionals pp
    JOIN public.professionals p ON p.id = pp.professional_id
    WHERE pp.patient_id = user_cycles.user_id
    AND p.user_id = auth.uid()
    AND pp.is_active = true
  )
);

CREATE POLICY "Professionals can update assigned patient cycles"
ON public.user_cycles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.patient_professionals pp
    JOIN public.professionals p ON p.id = pp.professional_id
    WHERE pp.patient_id = user_cycles.user_id
    AND p.user_id = auth.uid()
    AND pp.is_active = true
  )
);
