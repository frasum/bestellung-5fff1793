import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestNewLinkBody {
  supplierId: string;
}

const RATE_LIMIT_MAX = 3; // Max requests per supplier per hour
const RATE_LIMIT_WINDOW_MINUTES = 60;

serve(async (req: Request): Promise<Response> => {
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
    
    const cleanedApiKey = resendApiKey.trim().replace(/[^\x20-\x7E]/g, '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { supplierId }: RequestNewLinkBody = await req.json();

    if (!supplierId) {
      return new Response(
        JSON.stringify({ error: "Supplier ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Requesting new magic link for supplier: ${supplierId}`);

    // Check rate limit for this supplier
    const windowStart = new Date();
    windowStart.setMinutes(windowStart.getMinutes() - RATE_LIMIT_WINDOW_MINUTES);
    
    const { count: requestCount, error: countError } = await supabase
      .from('magic_link_rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('supplier_id', supplierId)
      .gte('created_at', windowStart.toISOString());

    if (countError) {
      console.error('Rate limit check error:', countError);
    }

    if (requestCount !== null && requestCount >= RATE_LIMIT_MAX) {
      console.log(`Rate limit exceeded for supplier: ${supplierId} (${requestCount}/${RATE_LIMIT_MAX})`);
      return new Response(
        JSON.stringify({ 
          error: 'Zu viele Anfragen. Bitte versuchen Sie es in einer Stunde erneut.',
          retryAfterMinutes: RATE_LIMIT_WINDOW_MINUTES 
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Record this request for rate limiting
    await supabase
      .from('magic_link_rate_limits')
      .insert({ supplier_id: supplierId });

    // Cleanup old rate limit entries periodically (5% chance per request)
    if (Math.random() < 0.05) {
      await supabase.rpc('cleanup_old_magic_link_rate_limits');
    }

    // Fetch supplier data
    const { data: supplier, error: supplierError } = await supabase
      .from("suppliers")
      .select("id, name, email, organization_id, organizations(name)")
      .eq("id", supplierId)
      .single();

    if (supplierError || !supplier) {
      console.error("Supplier not found:", supplierError);
      return new Response(
        JSON.stringify({ error: "Supplier not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if test mode is enabled
    let actualRecipient = supplier.email;
    let isTestMode = false;
    
    const { data: orgData } = await supabase
      .from("organizations")
      .select("test_mode_enabled, test_email")
      .eq("id", supplier.organization_id)
      .single();
    
    if (orgData?.test_mode_enabled && orgData?.test_email) {
      isTestMode = true;
      actualRecipient = orgData.test_email;
      console.log(`Test mode enabled - redirecting email to ${actualRecipient}`);
    }

    // Create new token
    const { data: tokenData, error: tokenError } = await supabase
      .from("supplier_portal_tokens")
      .insert({ supplier_id: supplierId })
      .select()
      .single();

    if (tokenError) {
      console.error("Error creating token:", tokenError);
      throw new Error(`Failed to create token: ${tokenError.message}`);
    }

    const appUrl = Deno.env.get("APP_URL") || "https://bestellung.pro";
    const magicLink = `${appUrl}/supplier-auth?token=${tokenData.token}`;
    const organizationName = (supplier.organizations as any)?.name || "Restaurant";

    console.log(`New magic link created for ${supplier.name}`);

    // Build email
    const subjectPrefix = isTestMode ? "[TEST] " : "";
    const testModeNotice = isTestMode 
      ? `<p style="background: #FEF3C7; border: 1px solid #F59E0B; padding: 12px; border-radius: 6px; margin-bottom: 20px;">
           <strong>🧪 Testmodus:</strong> Diese E-Mail wäre normalerweise an <strong>${supplier.email}</strong> gesendet worden.
         </p>`
      : "";

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${cleanedApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Bestellung.pro <noreply@bestellung.pro>",
        to: [actualRecipient],
        subject: `${subjectPrefix}Neuer Zugangslink - Lieferantenportal ${organizationName}`,
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
                <h1>📦 Bestellung.pro</h1>
                <h2>Neuer Zugangslink</h2>
              </div>
              
              ${testModeNotice}
              
              <p>Guten Tag,</p>
              
              <p>Sie haben einen neuen Zugangslink für das Lieferantenportal von <strong>${organizationName}</strong> angefordert.</p>
              
              <p>Klicken Sie auf den folgenden Button, um sich anzumelden:</p>
              
              <p style="text-align: center; margin: 30px 0;">
                <a href="${magicLink}" class="button">Zum Lieferantenportal</a>
              </p>
              
              <p><strong>Wichtig:</strong> Dieser Link ist 7 Tage gültig.</p>
              
              <div class="footer">
                <p>Diese E-Mail wurde automatisch von Bestellung.pro generiert.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
${isTestMode ? "[TEST] " : ""}Neuer Zugangslink - Lieferantenportal ${organizationName}
${isTestMode ? `\nTestmodus: Diese E-Mail wäre normalerweise an ${supplier.email} gesendet worden.\n` : ""}
Guten Tag,

Sie haben einen neuen Zugangslink für das Lieferantenportal von ${organizationName} angefordert.

Klicken Sie auf den folgenden Link, um sich anzumelden:
${magicLink}

Wichtig: Dieser Link ist 7 Tage gültig.
        `,
      }),
    });

    const emailResult = await emailResponse.json();
    
    if (!emailResponse.ok) {
      console.error("Resend API error:", emailResult);
      throw new Error(`Failed to send email: ${emailResult.message || 'Unknown error'}`);
    }

    console.log("New magic link email sent successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Neuer Zugangslink wurde gesendet",
        isTestMode
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in request-new-magic-link:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
