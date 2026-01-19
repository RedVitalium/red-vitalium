-- Add monthly habit goals table for progressive targets
CREATE TABLE public.habit_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  habit_type TEXT NOT NULL, -- 'screen_time', 'phone_unlocks', 'yoga'
  month INTEGER NOT NULL, -- Month of the cycle (1-4 or beyond for extended tracking)
  target_value INTEGER NOT NULL, -- Target value for the month
  set_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, habit_type, month)
);

-- Enable RLS
ALTER TABLE public.habit_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all habit goals" ON public.habit_goals FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert habit goals" ON public.habit_goals FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update habit goals" ON public.habit_goals FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete habit goals" ON public.habit_goals FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view their own habit goals" ON public.habit_goals FOR SELECT USING (auth.uid() = user_id);