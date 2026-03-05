
CREATE TABLE public.ai_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  section text NOT NULL,
  summary_text text NOT NULL,
  score integer,
  section_scores jsonb DEFAULT '{}',
  data_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX ai_summaries_user_section_idx ON public.ai_summaries (user_id, section);

ALTER TABLE public.ai_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own summaries" ON public.ai_summaries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own summaries" ON public.ai_summaries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own summaries" ON public.ai_summaries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all summaries" ON public.ai_summaries FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Professionals can view patient summaries" ON public.ai_summaries FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM patient_professionals pp
    JOIN professionals p ON p.id = pp.professional_id
    WHERE pp.patient_id = ai_summaries.user_id AND p.user_id = auth.uid() AND pp.is_active = true
  )
);
