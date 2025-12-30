import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
}): Promise<{ success: boolean; error?: string }> {
  const client = new SMTPClient(smtpConfig);
  try {
    await client.send({
      from: `Bestellung.pro <${smtpFrom}>`,
      to: options.to,
      subject: options.subject,
      content: "",
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

interface InvitationRequest {
  email: string;
  companyName: string;
  supplierName: string;
  inviteToken: string;
  supplierAccountId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, companyName, supplierName, inviteToken, supplierAccountId }: InvitationRequest = await req.json();

    console.log("Sending B2B customer invitation to:", email);

    const appUrl = Deno.env.get("APP_URL") || "https://bestellung.pro";
    const inviteLink = `${appUrl}/b2b/accept-invitation?token=${inviteToken}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Einladung zum B2B-Portal</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; margin-bottom: 20px;">
            Hallo <strong>${companyName}</strong>,
          </p>
          
          <p style="margin-bottom: 20px;">
            Sie wurden von <strong>${supplierName}</strong> eingeladen, das B2B-Bestellportal zu nutzen.
          </p>
          
          <p style="margin-bottom: 25px;">
            Mit diesem Portal können Sie bequem online bestellen und haben jederzeit Zugriff auf Ihre Bestellhistorie.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteLink}" 
               style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); 
                      color: white; 
                      padding: 14px 32px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      font-weight: 600;
                      display: inline-block;
                      font-size: 16px;">
              Einladung annehmen
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Dieser Link ist 7 Tage gültig. Falls Sie diese E-Mail nicht erwartet haben, können Sie sie ignorieren.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
            Diese E-Mail wurde automatisch von Bestellung.pro versendet.
          </p>
        </div>
      </body>
      </html>
    `;

    const emailResult = await sendEmailViaSMTP({
      to: [email],
      subject: `${supplierName} lädt Sie zum B2B-Portal ein`,
      html: htmlContent,
    });

    console.log("Email result:", emailResult);

    if (!emailResult.success) {
      throw new Error(emailResult.error || "Failed to send email");
    }

    // Log to communication_logs
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get organization_id from supplier_b2b_accounts
    const { data: accountData } = await supabase
      .from('supplier_b2b_accounts')
      .select('linked_supplier_id')
      .eq('id', supplierAccountId)
      .single();

    if (accountData?.linked_supplier_id) {
      const { data: supplierData } = await supabase
        .from('suppliers')
        .select('organization_id')
        .eq('id', accountData.linked_supplier_id)
        .single();

      if (supplierData?.organization_id) {
        await supabase.from('communication_logs').insert({
          organization_id: supplierData.organization_id,
          email_type: 'b2b_invitation',
          direction: 'outbound',
          recipient_email: email,
          recipient_name: companyName,
          subject: `${supplierName} lädt Sie zum B2B-Portal ein`,
          body_html: htmlContent,
          status: 'sent',
          supplier_id: accountData.linked_supplier_id,
          sender_email: smtpFrom,
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending B2B invitation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
