-- Create table to track user cycle start dates (managed by admin)
CREATE TABLE public.user_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  started_by uuid,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_cycles ENABLE ROW LEVEL SECURITY;

-- Users can view their own cycles
CREATE POLICY "Users can view their own cycles"
ON public.user_cycles
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all cycles
CREATE POLICY "Admins can view all cycles"
ON public.user_cycles
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can insert cycles
CREATE POLICY "Admins can insert cycles"
ON public.user_cycles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Admins can update cycles
CREATE POLICY "Admins can update cycles"
ON public.user_cycles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Admins can delete cycles
CREATE POLICY "Admins can delete cycles"
ON public.user_cycles
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Create index for faster lookups
CREATE INDEX idx_user_cycles_user_id ON public.user_cycles(user_id);
CREATE INDEX idx_user_cycles_active ON public.user_cycles(is_active) WHERE is_active = true;