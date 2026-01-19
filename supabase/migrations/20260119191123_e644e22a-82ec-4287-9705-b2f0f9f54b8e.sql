-- Add columns for manual health data to health_data table
-- These will be stored as individual records with specific data_types:
-- 'balance_left', 'balance_right', 'grip_strength' are already supported
-- Adding VO2Max calculation fields: 'resting_heart_rate', 'max_heart_rate'

-- No schema changes needed - we use the existing health_data table with data_types:
-- balance_left, balance_right, grip_strength, resting_heart_rate, max_heart_rate, vo2_max

-- Just add a comment to document the supported data types
COMMENT ON TABLE public.health_data IS 'Stores health metrics including: sleep_hours, sleep_quality, activity_hours, steps, hrv, vo2_max, grip_strength, balance_left, balance_right, resting_heart_rate, max_heart_rate, weight, height, waist_circumference, screen_time, phone_unlocks, non_hdl_cholesterol, hba1c, waist_height_ratio';