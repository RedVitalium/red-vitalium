-- Add columns to unlocked_habits for habit goals
ALTER TABLE public.unlocked_habits 
ADD COLUMN IF NOT EXISTS target_sessions_per_week integer DEFAULT 3,
ADD COLUMN IF NOT EXISTS target_avg_duration_minutes integer DEFAULT 30;

-- Create activity_goals table for physical activity goals per patient cycle
CREATE TABLE IF NOT EXISTS public.activity_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  target_sessions_per_week integer NOT NULL DEFAULT 4,
  target_avg_duration_minutes integer NOT NULL DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  set_by UUID,
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.activity_goals ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own activity goals" 
ON public.activity_goals 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own activity goals" 
ON public.activity_goals 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admins can view all activity goals"
ON public.activity_goals
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert activity goals"
ON public.activity_goals
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all activity goals"
ON public.activity_goals
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete activity goals"
ON public.activity_goals
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_activity_goals_updated_at
BEFORE UPDATE ON public.activity_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();