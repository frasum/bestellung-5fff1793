import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-secret',
};

// SMTP Configuration
const smtpConfig = {
  connection: {
    hostname: Deno.env.get("SMTP_HOST") || "smtps.udag.de",
    port: Number(Deno.env.get("SMTP_PORT")) || 465,
    tls: true,
    auth: {
      username: Deno.env.get("SMTP_USERNAME") || "",
      password: Deno.env.get("SMTP_PASSWORD") || "",
    },
  },
};

const smtpFrom = Deno.env.get("SMTP_FROM") || "yum@bestellung.pro";

// Helper to send email via SMTP
async function sendEmailViaSMTP(options: {
  to: string[];
  subject: string;
  html: string;
  text?: string;
}): Promise<{ success: boolean; error?: string }> {
  const client = new SMTPClient(smtpConfig);
  try {
    await client.send({
      from: `Bestellung.pro <${smtpFrom}>`,
      to: options.to,
      subject: options.subject,
      content: options.text || "",
      html: options.html,
    });
    await client.close();
    return { success: true };
  } catch (error: any) {
    console.error("SMTP send error:", error);
    try { await client.close(); } catch {}
    return { success: false, error: error.message };
  }
}

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
  token?: string;
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

    const internalSecret = req.headers.get('x-internal-secret');
    const expectedSecret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const isInternalCall = internalSecret && internalSecret === expectedSecret;

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

    // Check test mode settings
    const { data: org } = await supabase
      .from('organizations')
      .select('test_mode_enabled, test_email')
      .eq('id', organization_id)
      .single();

    const isTestMode = org?.test_mode_enabled && org?.test_email;
    const testEmail = org?.test_email;
    
    if (isTestMode) {
      console.log(`[notify-preorder-received] Test mode active, redirecting to: ${testEmail}`);
    }

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

    const finalRecipients = isTestMode ? [testEmail!] : recipientEmails;
    const originalRecipients = recipientEmails.join(', ');

    console.log(`Sending notification to ${finalRecipients.length} recipients${isTestMode ? ' (TEST MODE)' : ''}`);

    const itemsHtml = items.map(item => 
      `<li>${item.article_name}: <strong>${item.quantity}</strong></li>`
    ).join('');

    const appUrl = Deno.env.get('APP_URL') || 'https://bestellung.pro';

    const testModeNotice = isTestMode ? `
      <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
        <strong>🧪 TESTMODUS</strong><br>
        Diese E-Mail wäre normalerweise an folgende Empfänger gesendet worden:<br>
        <strong>${originalRecipients}</strong>
      </div>
    ` : '';

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
      <h1 style="margin: 0; font-size: 20px;">📦 ${isTestMode ? '[TEST] ' : ''}Neue EasyOrder eingegangen</h1>
    </div>
    <div class="content">
      ${testModeNotice}
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

    const testModeTextNotice = isTestMode 
      ? `🧪 TESTMODUS - Diese E-Mail wäre normalerweise an folgende Empfänger gesendet worden: ${originalRecipients}\n\n` 
      : '';

    const textContent = `${testModeTextNotice}${isTestMode ? '[TEST] ' : ''}Neue EasyOrder eingegangen

Mitarbeiter: ${employee_name}
Standort: ${location_name}
Lieferant: ${supplier_name}

Bestellte Artikel:
${items.map(item => `- ${item.article_name}: ${item.quantity}`).join('\n')}

Öffnen Sie die Vorbestellung unter: ${appUrl}/orders?tab=drafts`;

    const subject = isTestMode 
      ? `[TEST] Neue EasyOrder von ${employee_name}`
      : `Neue EasyOrder von ${employee_name}`;

    const emailResult = await sendEmailViaSMTP({
      to: finalRecipients,
      subject: subject,
      html: htmlContent,
      text: textContent,
    });

    console.log('Email sent:', emailResult);

    // Log to communication_logs for each recipient
    for (const email of finalRecipients) {
      const { error: logError } = await supabase
        .from("communication_logs")
        .insert({
          organization_id: organization_id,
          email_type: 'preorder_notification',
          direction: 'outgoing',
          recipient_email: email,
          recipient_name: isTestMode ? `[TEST] Original: ${originalRecipients}` : null,
          subject: subject,
          status: 'sent',
          body_html: htmlContent,
          sender_email: smtpFrom,
        });

      if (logError) {
        console.error("Error logging communication:", logError);
      }
    }

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
