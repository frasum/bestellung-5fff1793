import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
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

interface MagicLinkRequest {
  supplierId: string;
  supplierEmail: string;
  supplierName: string;
  organizationName: string;
  organizationId: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { supplierId, supplierEmail, supplierName, organizationName, organizationId }: MagicLinkRequest = await req.json();

    console.log(`Creating magic link for supplier: ${supplierName} (${supplierEmail})`);

    let actualRecipients: string[] = [supplierEmail];
    let isTestMode = false;
    
    if (organizationId) {
      const { data: orgData } = await supabase
        .from("organizations")
        .select("test_mode_enabled, test_email, test_emails")
        .eq("id", organizationId)
        .single();
      
      if (orgData?.test_mode_enabled) {
        const testEmails = orgData.test_emails?.length > 0 
          ? orgData.test_emails 
          : (orgData.test_email ? [orgData.test_email] : null);
        
        if (testEmails && testEmails.length > 0) {
          isTestMode = true;
          actualRecipients = testEmails;
          console.log(`Test mode enabled - redirecting email from ${supplierEmail} to ${actualRecipients.join(', ')}`);
        }
      }
    }

    const { data: tokenData, error: tokenError } = await supabase
      .from("supplier_portal_tokens")
      .insert({
        supplier_id: supplierId,
      })
      .select()
      .single();

    if (tokenError) {
      console.error("Error creating token:", tokenError);
      throw new Error(`Failed to create token: ${tokenError.message}`);
    }

    const appUrl = Deno.env.get("APP_URL") || "https://bestellung.pro";
    const magicLink = `${appUrl}/supplier-auth?token=${tokenData.token}`;

    console.log(`Magic link created: ${magicLink}`);

    const subjectPrefix = isTestMode ? "[TEST] " : "";
    const testModeNotice = isTestMode 
      ? `<p style="background: #FEF3C7; border: 1px solid #F59E0B; padding: 12px; border-radius: 6px; margin-bottom: 20px;">
           <strong>🧪 Testmodus:</strong> Diese E-Mail wäre normalerweise an <strong>${supplierEmail}</strong> gesendet worden.
         </p>`
      : "";

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .button { display: inline-block; background: #4F46E5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📦 Bestellung.pro</h1>
            <h2>Lieferantenportal</h2>
          </div>
          
          ${testModeNotice}
          
          <p>Guten Tag,</p>
          
          <p><strong>${organizationName}</strong> hat Sie eingeladen, Ihre Artikel im Lieferantenportal zu verwalten.</p>
          
          <p>Klicken Sie auf den folgenden Button, um sich anzumelden und Ihre Artikel zu bearbeiten:</p>
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="${magicLink}" class="button">Zum Lieferantenportal</a>
          </p>
          
          <p><strong>Wichtig:</strong> Dieser Link ist 7 Tage gültig.</p>
          
          <p>Falls Sie diesen Link nicht angefordert haben, können Sie diese E-Mail ignorieren.</p>
          
          <div class="footer">
            <p>Diese E-Mail wurde automatisch von Bestellung.pro generiert.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
${isTestMode ? "[TEST] " : ""}Lieferantenportal - ${organizationName}
${isTestMode ? `\nTestmodus: Diese E-Mail wäre normalerweise an ${supplierEmail} gesendet worden.\n` : ""}
Guten Tag,

${organizationName} hat Sie eingeladen, Ihre Artikel im Lieferantenportal zu verwalten.

Klicken Sie auf den folgenden Link, um sich anzumelden:
${magicLink}

Wichtig: Dieser Link ist 7 Tage gültig.

Falls Sie diesen Link nicht angefordert haben, können Sie diese E-Mail ignorieren.
    `;

    const emailResult = await sendEmailViaSMTP({
      to: actualRecipients,
      subject: `${subjectPrefix}Zugang zum Lieferantenportal - ${organizationName}`,
      html: htmlContent,
      text: textContent,
    });

    if (!emailResult.success) {
      throw new Error(`Failed to send email: ${emailResult.error}`);
    }

    console.log("Email sent successfully via SMTP");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: isTestMode 
          ? `Magic link sent to test emails (${actualRecipients.join(', ')})` 
          : "Magic link sent successfully",
        isTestMode,
        actualRecipients
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-supplier-magic-link:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
