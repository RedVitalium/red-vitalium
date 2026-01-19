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
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("[sync-health-data] Missing or invalid Authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized - Missing authentication token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's auth token to verify JWT
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the JWT and get user claims
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      console.error("[sync-health-data] Invalid token:", claimsError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authenticatedUserId = claimsData.claims.sub;
    console.log(`[sync-health-data] Authenticated user: ${authenticatedUserId}`);

    // Parse request body
    const { userId, timestamp, source } = await req.json();

    // Verify the userId matches the authenticated user
    if (userId && userId !== authenticatedUserId) {
      console.error(`[sync-health-data] User ${authenticatedUserId} attempted to access data for user ${userId}`);
      return new Response(
        JSON.stringify({ error: "Forbidden - Cannot access other user's data" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use the authenticated user's ID for all operations
    const targetUserId = authenticatedUserId;

    console.log(`[sync-health-data] Processing sync for user ${targetUserId} at ${timestamp} from ${source}`);

    // Create service client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get latest health data for the user to confirm we have data
    const { data: healthData, error: healthError } = await supabase
      .from("health_data")
      .select("data_type, value, recorded_at")
      .eq("user_id", targetUserId)
      .order("recorded_at", { ascending: false })
      .limit(10);

    if (healthError) {
      console.error("[sync-health-data] Error fetching health data:", healthError);
      throw healthError;
    }

    const response = {
      success: true,
      userId: targetUserId,
      timestamp,
      source,
      recentDataCount: healthData?.length || 0,
      message: "Sync acknowledged successfully",
    };

    console.log(`[sync-health-data] Sync completed for user ${targetUserId}`);

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[sync-health-data] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});