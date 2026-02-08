-- 1. Update app_role enum to include 'professional'
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'professional';

-- 2. Create subscription_plan enum
CREATE TYPE public.subscription_plan AS ENUM ('plata', 'oro', 'platino', 'black');

-- 3. Create specialty enum (fixed list per business plan)
CREATE TYPE public.specialty AS ENUM ('psychology', 'nutrition', 'medicine', 'physiotherapy');

-- 4. Create user_subscriptions table
CREATE TABLE public.user_subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE,
    plan subscription_plan NOT NULL DEFAULT 'plata',
    started_at timestamp with time zone NOT NULL DEFAULT now(),
    expires_at timestamp with time zone,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on user_subscriptions
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_subscriptions
CREATE POLICY "Users can view their own subscription" 
ON public.user_subscriptions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions" 
ON public.user_subscriptions FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert subscriptions" 
ON public.user_subscriptions FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update subscriptions" 
ON public.user_subscriptions FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

-- 5. Create professionals table
CREATE TABLE public.professionals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE,
    specialty specialty NOT NULL,
    license_number text,
    bio text,
    years_experience integer,
    consultation_price numeric(10,2),
    is_verified boolean NOT NULL DEFAULT false,
    is_active boolean NOT NULL DEFAULT true,
    location text,
    office_address text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on professionals
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

-- RLS policies for professionals
CREATE POLICY "Anyone authenticated can view active professionals" 
ON public.professionals FOR SELECT 
TO authenticated
USING (is_active = true);

CREATE POLICY "Professionals can view their own profile" 
ON public.professionals FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Professionals can update their own profile" 
ON public.professionals FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all professionals" 
ON public.professionals FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- 6. Create patient_professionals relationship (which professionals attend which patients)
CREATE TABLE public.patient_professionals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id uuid NOT NULL,
    professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
    specialty specialty NOT NULL,
    assigned_at timestamp with time zone NOT NULL DEFAULT now(),
    assigned_by uuid,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(patient_id, professional_id)
);

-- Enable RLS on patient_professionals
ALTER TABLE public.patient_professionals ENABLE ROW LEVEL SECURITY;

-- RLS policies for patient_professionals
CREATE POLICY "Patients can view their assigned professionals" 
ON public.patient_professionals FOR SELECT 
USING (auth.uid() = patient_id);

CREATE POLICY "Professionals can view their assigned patients" 
ON public.patient_professionals FOR SELECT 
USING (auth.uid() IN (SELECT user_id FROM professionals WHERE id = professional_id));

CREATE POLICY "Admins can manage all patient-professional relationships" 
ON public.patient_professionals FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- 7. Create professional_notes table (notes visible to other professionals but editable only by owner)
CREATE TABLE public.professional_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id uuid NOT NULL,
    professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
    specialty specialty NOT NULL,
    note_type text NOT NULL DEFAULT 'general', -- 'history', 'comment', 'general'
    content text NOT NULL,
    is_visible_to_others boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on professional_notes
ALTER TABLE public.professional_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies for professional_notes
CREATE POLICY "Professionals can view notes of their patients" 
ON public.professional_notes FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM patient_professionals pp 
        JOIN professionals p ON pp.professional_id = p.id
        WHERE pp.patient_id = professional_notes.patient_id 
        AND p.user_id = auth.uid()
    )
);

CREATE POLICY "Professionals can insert notes for their patients" 
ON public.professional_notes FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM patient_professionals pp 
        JOIN professionals p ON pp.professional_id = p.id
        WHERE pp.patient_id = professional_notes.patient_id 
        AND p.user_id = auth.uid()
        AND professional_notes.professional_id = p.id
    )
);

CREATE POLICY "Professionals can update their own notes" 
ON public.professional_notes FOR UPDATE 
USING (
    auth.uid() IN (SELECT user_id FROM professionals WHERE id = professional_id)
);

CREATE POLICY "Professionals can delete their own notes" 
ON public.professional_notes FOR DELETE 
USING (
    auth.uid() IN (SELECT user_id FROM professionals WHERE id = professional_id)
);

CREATE POLICY "Admins can manage all notes" 
ON public.professional_notes FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- 8. Update trigger for updated_at columns
CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_professionals_updated_at
BEFORE UPDATE ON public.professionals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_professional_notes_updated_at
BEFORE UPDATE ON public.professional_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Add helper function to check if user is a professional
CREATE OR REPLACE FUNCTION public.is_professional(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.professionals
    WHERE user_id = _user_id
    AND is_active = true
  )
$$;

-- 10. Add function to get professional's specialty
CREATE OR REPLACE FUNCTION public.get_professional_specialty(_user_id uuid)
RETURNS specialty
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT specialty
  FROM public.professionals
  WHERE user_id = _user_id
  AND is_active = true
  LIMIT 1
$$;