import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-secret',
};

interface OrderItem {
  article_name: string;
  quantity: number;
}

interface NotifyRequest {
  organization_id: string;
  employee_name: string;
  supplier_name: string;
  location_name: string;
  items: OrderItem[];
  token?: string; // simple_order_token for validation
}

// Validate that the request comes from a valid simple_order_token
async function validateTokenForOrganization(token: string, organizationId: string): Promise<boolean> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from('simple_order_tokens')
    .select('id, organization_id, is_active, expires_at')
    .eq('token', token)
    .maybeSingle();

  if (error || !data) {
    console.log('[notify-preorder-received] Token not found');
    return false;
  }

  if (!data.is_active) {
    console.log('[notify-preorder-received] Token is inactive');
    return false;
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    console.log('[notify-preorder-received] Token has expired');
    return false;
  }

  // Ensure token belongs to the same organization
  if (data.organization_id !== organizationId) {
    console.log('[notify-preorder-received] Token organization mismatch');
    return false;
  }

  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organization_id, employee_name, supplier_name, location_name, items, token }: NotifyRequest = await req.json();

    // Check for internal calls (from submit-simple-order Edge Function)
    const internalSecret = req.headers.get('x-internal-secret');
    const expectedSecret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const isInternalCall = internalSecret && internalSecret === expectedSecret;

    // Validate token for external calls
    if (!isInternalCall) {
      if (!token) {
        console.error('[notify-preorder-received] No token provided');
        return new Response(
          JSON.stringify({ error: 'Authentication required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const isValidToken = await validateTokenForOrganization(token, organization_id);
      if (!isValidToken) {
        console.error('[notify-preorder-received] Invalid token for organization');
        return new Response(
          JSON.stringify({ error: 'Invalid or expired token' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('Sending preorder notification:', { organization_id, employee_name, supplier_name, location_name, itemCount: items.length });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    // Get all admin/manager profiles with email_preorder_received enabled
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('organization_id', organization_id);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    if (!profiles || profiles.length === 0) {
      console.log('No profiles found for organization');
      return new Response(
        JSON.stringify({ success: true, message: 'No recipients found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check notification preferences for each profile
    const recipientEmails: string[] = [];
    for (const profile of profiles) {
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('email_preorder_received')
        .eq('user_id', profile.id)
        .maybeSingle();

      // Default to true if no preferences exist, otherwise check the flag
      const shouldNotify = prefs === null || prefs.email_preorder_received !== false;
      if (shouldNotify) {
        recipientEmails.push(profile.email);
      }
    }

    if (recipientEmails.length === 0) {
      console.log('No recipients with notifications enabled');
      return new Response(
        JSON.stringify({ success: true, message: 'No recipients with notifications enabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Sending notification to ${recipientEmails.length} recipients`);

    // Build article list HTML
    const itemsHtml = items.map(item => 
      `<li>${item.article_name}: <strong>${item.quantity}</strong></li>`
    ).join('');

    const appUrl = Deno.env.get('APP_URL') || 'https://bestellung.pro';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; }
    .info-box { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border: 1px solid #e2e8f0; }
    .info-label { color: #64748b; font-size: 12px; text-transform: uppercase; margin-bottom: 4px; }
    .info-value { font-size: 16px; font-weight: 500; }
    ul { padding-left: 20px; }
    li { margin: 8px 0; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
    .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 20px;">📦 Neue EasyOrder eingegangen</h1>
    </div>
    <div class="content">
      <div class="info-box">
        <div class="info-label">Mitarbeiter</div>
        <div class="info-value">${employee_name}</div>
      </div>
      <div class="info-box">
        <div class="info-label">Standort</div>
        <div class="info-value">${location_name}</div>
      </div>
      <div class="info-box">
        <div class="info-label">Lieferant</div>
        <div class="info-value">${supplier_name}</div>
      </div>
      <div class="info-box">
        <div class="info-label">Bestellte Artikel</div>
        <ul style="margin: 10px 0 0 0;">
          ${itemsHtml}
        </ul>
      </div>
      <a href="${appUrl}/orders?tab=drafts" class="button">Vorbestellung öffnen</a>
    </div>
    <div class="footer">
      Diese E-Mail wurde automatisch von Bestellung.pro gesendet.
    </div>
  </div>
</body>
</html>`;

    const textContent = `Neue EasyOrder eingegangen

Mitarbeiter: ${employee_name}
Standort: ${location_name}
Lieferant: ${supplier_name}

Bestellte Artikel:
${items.map(item => `- ${item.article_name}: ${item.quantity}`).join('\n')}

Öffnen Sie die Vorbestellung unter: ${appUrl}/orders?tab=drafts`;

    const emailResponse = await resend.emails.send({
      from: 'Bestellung.pro <noreply@bestellung.pro>',
      to: recipientEmails,
      subject: `Neue EasyOrder von ${employee_name}`,
      html: htmlContent,
      text: textContent,
    });

    console.log('Email sent successfully:', emailResponse);

    return new Response(
      JSON.stringify({ success: true, recipientCount: recipientEmails.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in notify-preorder-received:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
