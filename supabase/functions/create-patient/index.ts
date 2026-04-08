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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify calling user is a professional
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: callingUser } } = await supabaseUser.auth.getUser();
    if (!callingUser) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller is a professional
    const { data: profData } = await supabaseAdmin
      .from("professionals")
      .select("id, specialty")
      .eq("user_id", callingUser.id)
      .eq("is_active", true)
      .maybeSingle();

    if (!profData) {
      return new Response(JSON.stringify({ error: "No eres profesional activo" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, fullName, dateOfBirth } = await req.json();

    if (!email || !fullName) {
      return new Response(JSON.stringify({ error: "Email y nombre son requeridos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create the user with a random password (patient can reset later)
    const tempPassword = crypto.randomUUID().slice(0, 16) + "Aa1!";
    
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createError) {
      // Check if user already exists
      if (createError.message?.includes("already been registered")) {
        return new Response(JSON.stringify({ error: "Este email ya está registrado. Usa la opción de buscar paciente existente." }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw createError;
    }

    const patientUserId = newUser.user.id;

    // Update profile with date of birth if provided
    if (dateOfBirth) {
      await supabaseAdmin
        .from("profiles")
        .update({ date_of_birth: dateOfBirth })
        .eq("user_id", patientUserId);
    }

    // Assign patient to professional
    await supabaseAdmin
      .from("patient_professionals")
      .insert({
        patient_id: patientUserId,
        professional_id: profData.id,
        specialty: profData.specialty,
        assigned_by: callingUser.id,
        is_active: true,
      });

    return new Response(JSON.stringify({ 
      success: true, 
      patientId: patientUserId,
      message: "Paciente creado y asignado correctamente" 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating patient:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
