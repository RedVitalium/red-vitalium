-- Create table for daily survey questions (admin-defined)
CREATE TABLE public.daily_survey_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'yes_no', -- 'yes_no', 'yes_no_count'
  follow_up_label TEXT, -- Label for follow-up (e.g., "¿Cuántas bebidas?")
  follow_up_options JSONB, -- Array of options for dropdown [1,2,3,4,5...]
  week_start INTEGER NOT NULL DEFAULT 1, -- Week when this question starts (1-4)
  week_end INTEGER NOT NULL DEFAULT 4, -- Week when this question ends (1-4)
  habit_category TEXT, -- Category like 'nutrition', 'sleep', 'activity'
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for user survey responses
CREATE TABLE public.daily_survey_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question_id UUID NOT NULL REFERENCES public.daily_survey_questions(id) ON DELETE CASCADE,
  response_date DATE NOT NULL DEFAULT CURRENT_DATE,
  answer BOOLEAN NOT NULL, -- true = yes/achieved, false = no
  follow_up_value INTEGER, -- numeric value if answer is false
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id, response_date)
);

-- Create table for user breakfast time setting
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS breakfast_time TIME DEFAULT '08:00'::TIME;

-- Enable RLS on both tables
ALTER TABLE public.daily_survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_survey_responses ENABLE ROW LEVEL SECURITY;

-- Policies for daily_survey_questions (read by all authenticated, write by admin)
CREATE POLICY "Authenticated users can view active questions"
ON public.daily_survey_questions
FOR SELECT
USING (auth.role() = 'authenticated' AND is_active = true);

CREATE POLICY "Admins can manage all questions"
ON public.daily_survey_questions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policies for daily_survey_responses
CREATE POLICY "Users can view their own responses"
ON public.daily_survey_responses
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own responses"
ON public.daily_survey_responses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own responses"
ON public.daily_survey_responses
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all responses"
ON public.daily_survey_responses
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default questions for month 1
INSERT INTO public.daily_survey_questions (question_text, question_type, follow_up_label, follow_up_options, habit_category, display_order) VALUES
('¿Lograste pasar el día de ayer sin tomar ninguna bebida azucarada?', 'yes_no_count', '¿Cuántas bebidas azucaradas consumiste?', '[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]', 'nutrition', 1),
('¿Lograste comer tu último alimento 3 o más horas antes de irte a la cama?', 'yes_no_count', '¿Cuántas horas antes comiste?', '[0.5, 1, 1.5, 2, 2.5]', 'nutrition', 2),
('¿Realizaste al menos 30 minutos de actividad física ayer?', 'yes_no', NULL, NULL, 'activity', 3),
('¿Lograste desconectarte de pantallas 1 hora antes de dormir?', 'yes_no', NULL, NULL, 'sleep', 4),
('¿Tomaste al menos 8 vasos de agua ayer?', 'yes_no_count', '¿Cuántos vasos tomaste?', '[1, 2, 3, 4, 5, 6, 7]', 'nutrition', 5);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_daily_survey_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_daily_survey_questions_updated_at
BEFORE UPDATE ON public.daily_survey_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_daily_survey_questions_updated_at();