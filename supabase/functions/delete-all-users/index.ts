import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { action } = await req.json();

  if (action === "list") {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    const users = data.users.map((u: any) => ({ id: u.id, email: u.email, created_at: u.created_at }));
    return new Response(JSON.stringify({ users }), { headers: corsHeaders });
  }

  if (action === "delete_all") {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    
    const results: any[] = [];
    for (const user of data.users) {
      const { error: delError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
      results.push({ id: user.id, email: user.email, deleted: !delError, error: delError?.message });
    }
    return new Response(JSON.stringify({ results }), { headers: corsHeaders });
  }

  return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: corsHeaders });
});
