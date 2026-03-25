import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // List all auth users
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    const results = [];

    for (const user of users) {
      const userId = user.id;
      const email = user.email;
      const fullName = user.user_metadata?.full_name || '';

      // Check if profile exists
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();

      let profileCreated = false;
      if (!existingProfile) {
        const { error: profileErr } = await supabaseAdmin
          .from('profiles')
          .insert({ user_id: userId, email, full_name: fullName });
        profileCreated = !profileErr;
        if (profileErr) console.error('Profile insert error:', profileErr);
      }

      // Check if patient role exists
      const { data: existingPatientRole } = await supabaseAdmin
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role', 'patient')
        .maybeSingle();

      let patientRoleCreated = false;
      if (!existingPatientRole) {
        const { error: roleErr } = await supabaseAdmin
          .from('user_roles')
          .insert({ user_id: userId, role: 'patient' });
        patientRoleCreated = !roleErr;
        if (roleErr) console.error('Role insert error:', roleErr);
      }

      // Get all roles
      const { data: roles } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      results.push({
        userId,
        email,
        fullName,
        profileCreated,
        patientRoleCreated,
        roles: roles?.map(r => r.role) || [],
      });
    }

    return new Response(JSON.stringify({ users: results }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
