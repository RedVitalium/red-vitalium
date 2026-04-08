const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { appointment_id, patient_name, appointment_date, appointment_time, modality, professional_id } = await req.json()

    if (!professional_id || !patient_name || !appointment_date || !appointment_time) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get professional's user_id
    const { data: professional, error: profError } = await supabaseAdmin
      .from('professionals')
      .select('user_id')
      .eq('id', professional_id)
      .single()

    if (profError || !professional) {
      return new Response(
        JSON.stringify({ error: 'Professional not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get professional's email from profiles
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name')
      .eq('user_id', professional.user_id)
      .single()

    if (profileError || !profile?.email) {
      return new Response(
        JSON.stringify({ error: 'Professional email not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get professional's auth email as fallback
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(professional.user_id)
    const recipientEmail = profile.email || authUser?.user?.email

    if (!recipientEmail) {
      return new Response(
        JSON.stringify({ error: 'No email found for professional' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const modalityLabel = modality === 'virtual' ? 'Videollamada' : 'Presencial'

    // For now, log the notification (email sending requires domain setup)
    console.log(`📧 Notification for ${profile.full_name || 'Professional'} (${recipientEmail}):`)
    console.log(`   Patient: ${patient_name}`)
    console.log(`   Date: ${appointment_date} at ${appointment_time}`)
    console.log(`   Modality: ${modalityLabel}`)

    // Try to send via Lovable transactional email if available
    const callbackUrl = Deno.env.get('LOVABLE_API_KEY') 
      ? `https://api.lovable.dev/v1/email/send`
      : null

    if (callbackUrl) {
      try {
        const emailResponse = await fetch(callbackUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
          },
          body: JSON.stringify({
            to: recipientEmail,
            subject: `Nueva cita agendada - ${patient_name}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1a1a1a;">Nueva Cita Agendada</h2>
                <p>Hola ${profile.full_name || 'Doctor/a'},</p>
                <p>Un paciente ha agendado una nueva cita contigo:</p>
                <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
                  <p style="margin: 4px 0;"><strong>Paciente:</strong> ${patient_name}</p>
                  <p style="margin: 4px 0;"><strong>Fecha:</strong> ${appointment_date}</p>
                  <p style="margin: 4px 0;"><strong>Hora:</strong> ${appointment_time}</p>
                  <p style="margin: 4px 0;"><strong>Modalidad:</strong> ${modalityLabel}</p>
                </div>
                <p style="color: #666; font-size: 12px;">Red Vitalium - Longevidad y Bienestar Basado en Datos</p>
              </div>
            `,
          }),
        })
        
        if (emailResponse.ok) {
          console.log('✅ Email sent successfully')
        } else {
          console.log('⚠️ Email API returned:', await emailResponse.text())
        }
      } catch (emailErr) {
        console.log('⚠️ Could not send email:', emailErr)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification processed',
        recipient: recipientEmail 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
