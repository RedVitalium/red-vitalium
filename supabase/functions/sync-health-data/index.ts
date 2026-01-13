import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, timestamp, source } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Missing userId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[sync-health-data] Processing sync for user ${userId} at ${timestamp} from ${source}`);

    // Record the sync attempt
    const syncRecord = {
      user_id: userId,
      sync_type: source || 'background',
      synced_at: timestamp || new Date().toISOString(),
      status: 'completed',
    };

    // For background sync, we log the sync attempt
    // The actual health data would come from Health Connect on the device
    // This edge function serves as an endpoint for the background runner
    // to confirm sync and potentially aggregate data

    // Get latest health data for the user to confirm we have data
    const { data: healthData, error: healthError } = await supabase
      .from('health_data')
      .select('data_type, value, recorded_at')
      .eq('user_id', userId)
      .order('recorded_at', { ascending: false })
      .limit(10);

    if (healthError) {
      console.error('[sync-health-data] Error fetching health data:', healthError);
      throw healthError;
    }

    const response = {
      success: true,
      userId,
      timestamp,
      source,
      recentDataCount: healthData?.length || 0,
      message: 'Sync acknowledged successfully',
    };

    console.log(`[sync-health-data] Sync completed for user ${userId}`);

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('[sync-health-data] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
