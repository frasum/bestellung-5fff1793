import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, userId } = await req.json();

    if (!token || !userId) {
      return new Response(
        JSON.stringify({ error: 'Token und User-ID erforderlich' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get invitation details
    const { data: invitation, error: invError } = await supabase
      .from('b2b_customer_invitations')
      .select('id, email, supplier_account_id, expires_at, accepted_at')
      .eq('token', token)
      .single();

    if (invError || !invitation) {
      console.error('Invitation not found:', invError);
      return new Response(
        JSON.stringify({ error: 'Einladung nicht gefunden' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Einladung abgelaufen' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already accepted
    if (invitation.accepted_at) {
      return new Response(
        JSON.stringify({ error: 'Einladung bereits angenommen' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find the customer record
    const { data: customer, error: custError } = await supabase
      .from('supplier_b2b_customers')
      .select('id, company_name')
      .eq('email', invitation.email)
      .eq('supplier_account_id', invitation.supplier_account_id)
      .single();

    if (custError || !customer) {
      console.error('Customer not found:', custError);
      return new Response(
        JSON.stringify({ error: 'Kundeneintrag nicht gefunden' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update customer with user_id
    const { error: updateCustError } = await supabase
      .from('supplier_b2b_customers')
      .update({ user_id: userId })
      .eq('id', customer.id);

    if (updateCustError) {
      console.error('Error updating customer:', updateCustError);
      return new Response(
        JSON.stringify({ error: 'Fehler beim Aktualisieren des Kunden' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark invitation as accepted
    const { error: updateInvError } = await supabase
      .from('b2b_customer_invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id);

    if (updateInvError) {
      console.error('Error updating invitation:', updateInvError);
      // Continue anyway, customer is already linked
    }

    // Get supplier info for redirect
    const { data: supplier } = await supabase
      .from('supplier_b2b_accounts')
      .select('company_name, subdomain')
      .eq('id', invitation.supplier_account_id)
      .single();

    console.log(`Invitation accepted: ${invitation.email} -> ${supplier?.company_name}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        customerId: customer.id,
        supplierName: supplier?.company_name,
        subdomain: supplier?.subdomain
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in accept-b2b-customer-invitation:', error);
    return new Response(
      JSON.stringify({ error: 'Interner Serverfehler' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
