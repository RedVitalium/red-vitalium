-- Add INSERT policy for admins on health_data table
CREATE POLICY "Admins can insert health data for any user"
ON public.health_data
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));