import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MagicLinkRequest {
  supplierId: string;
  supplierEmail: string;
  supplierName: string;
  organizationName: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    
    // Clean the API key of any invisible/non-ASCII characters
    const cleanedApiKey = resendApiKey.trim().replace(/[^\x20-\x7E]/g, '');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { supplierId, supplierEmail, supplierName, organizationName }: MagicLinkRequest = await req.json();

    console.log(`Creating magic link for supplier: ${supplierName} (${supplierEmail})`);

    // Create a new magic link token
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

    // Build the magic link URL
    const appUrl = Deno.env.get("APP_URL") || "https://lclhwmxpbpmqtiwmgmgm.lovableproject.com";
    const magicLink = `${appUrl}/supplier-auth?token=${tokenData.token}`;

    console.log(`Magic link created: ${magicLink}`);

    // Send email with magic link using fetch to Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${cleanedApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "OrderFox.pro <onboarding@resend.dev>",
        to: [supplierEmail],
        subject: `Zugang zum Lieferantenportal - ${organizationName}`,
        html: `
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
                <h1>🦊 OrderFox.pro</h1>
                <h2>Lieferantenportal</h2>
              </div>
              
              <p>Guten Tag,</p>
              
              <p><strong>${organizationName}</strong> hat Sie eingeladen, Ihre Artikel im Lieferantenportal zu verwalten.</p>
              
              <p>Klicken Sie auf den folgenden Button, um sich anzumelden und Ihre Artikel zu bearbeiten:</p>
              
              <p style="text-align: center; margin: 30px 0;">
                <a href="${magicLink}" class="button">Zum Lieferantenportal</a>
              </p>
              
              <p><strong>Wichtig:</strong> Dieser Link ist 24 Stunden gültig und kann nur einmal verwendet werden.</p>
              
              <p>Falls Sie diesen Link nicht angefordert haben, können Sie diese E-Mail ignorieren.</p>
              
              <div class="footer">
                <p>Diese E-Mail wurde automatisch von OrderFox.pro generiert.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
Lieferantenportal - ${organizationName}

Guten Tag,

${organizationName} hat Sie eingeladen, Ihre Artikel im Lieferantenportal zu verwalten.

Klicken Sie auf den folgenden Link, um sich anzumelden:
${magicLink}

Wichtig: Dieser Link ist 24 Stunden gültig und kann nur einmal verwendet werden.

Falls Sie diesen Link nicht angefordert haben, können Sie diese E-Mail ignorieren.
        `,
      }),
    });

    const emailResult = await emailResponse.json();
    
    if (!emailResponse.ok) {
      console.error("Resend API error:", emailResult);
      throw new Error(`Failed to send email: ${emailResult.message || 'Unknown error'}`);
    }

    console.log("Email sent successfully:", emailResult);

    return new Response(
      JSON.stringify({ success: true, message: "Magic link sent successfully" }),
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
