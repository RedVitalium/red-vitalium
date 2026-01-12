-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  date_of_birth DATE,
  sex TEXT CHECK (sex IN ('male', 'female')),
  role TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
);

CREATE POLICY "Admins can update all profiles" 
ON public.profiles FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
);

-- Create test_results table for psychometric tests
CREATE TABLE public.test_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_id TEXT NOT NULL,
  test_name TEXT NOT NULL,
  scores JSONB NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on test_results
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

-- Test results policies
CREATE POLICY "Users can view their own test results" 
ON public.test_results FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own test results" 
ON public.test_results FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all test results" 
ON public.test_results FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
);

-- Create biomarkers table for blood test results
CREATE TABLE public.biomarkers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  albumin DECIMAL,
  creatinine DECIMAL,
  glucose DECIMAL,
  c_reactive_protein DECIMAL,
  lymphocyte_percentage DECIMAL,
  mean_cell_volume DECIMAL,
  red_cell_distribution_width DECIMAL,
  alkaline_phosphatase DECIMAL,
  white_blood_cell_count DECIMAL,
  biological_age DECIMAL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  recorded_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on biomarkers
ALTER TABLE public.biomarkers ENABLE ROW LEVEL SECURITY;

-- Biomarkers policies
CREATE POLICY "Users can view their own biomarkers" 
ON public.biomarkers FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all biomarkers" 
ON public.biomarkers FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
);

CREATE POLICY "Admins can insert biomarkers" 
ON public.biomarkers FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
);

-- Create health_data table for wearable/Health Connect data
CREATE TABLE public.health_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL,
  value DECIMAL NOT NULL,
  unit TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source TEXT DEFAULT 'health_connect'
);

-- Enable RLS on health_data
ALTER TABLE public.health_data ENABLE ROW LEVEL SECURITY;

-- Health data policies
CREATE POLICY "Users can view their own health data" 
ON public.health_data FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own health data" 
ON public.health_data FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all health data" 
ON public.health_data FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
);

-- Create unlocked_habits table for advanced habits
CREATE TABLE public.unlocked_habits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unlocked_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, habit_id)
);

-- Enable RLS on unlocked_habits
ALTER TABLE public.unlocked_habits ENABLE ROW LEVEL SECURITY;

-- Unlocked habits policies
CREATE POLICY "Users can view their own unlocked habits" 
ON public.unlocked_habits FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all unlocked habits" 
ON public.unlocked_habits FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
);

CREATE POLICY "Admins can insert unlocked habits" 
ON public.unlocked_habits FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Appointments policies
CREATE POLICY "Users can view their own appointments" 
ON public.appointments FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own appointments" 
ON public.appointments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appointments" 
ON public.appointments FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all appointments" 
ON public.appointments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
);

CREATE POLICY "Admins can update all appointments" 
ON public.appointments FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();