-- Change target_value to numeric to support decimal values like sleep hours (6.5)
ALTER TABLE public.habit_goals 
ALTER COLUMN target_value TYPE numeric USING target_value::numeric;