-- Add weight and height columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS weight numeric,
ADD COLUMN IF NOT EXISTS height numeric,
ADD COLUMN IF NOT EXISTS waist_circumference numeric;