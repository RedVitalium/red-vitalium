-- Add missing UPDATE and DELETE policies for tables

-- test_results: Users can delete their own test results
CREATE POLICY "Users can delete their own test results"
ON public.test_results FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any test results"
ON public.test_results FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- health_data: Users can update and delete their own health data
CREATE POLICY "Users can update their own health data"
ON public.health_data FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own health data"
ON public.health_data FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any health data"
ON public.health_data FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete any health data"
ON public.health_data FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- unlocked_habits: Only admins can manage
CREATE POLICY "Admins can update unlocked habits"
ON public.unlocked_habits FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete unlocked habits"
ON public.unlocked_habits FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- appointments: Users can delete their own, admins can delete any
CREATE POLICY "Users can delete their own appointments"
ON public.appointments FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any appointments"
ON public.appointments FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- user_roles: Only admins can delete role assignments
CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));