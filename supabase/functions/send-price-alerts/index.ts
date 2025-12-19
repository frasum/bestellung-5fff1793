import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const appUrl = Deno.env.get("APP_URL") || "https://lovable.dev";

    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { organization_id } = await req.json();

    console.log(`Sending price alerts for organization: ${organization_id || 'all'}`);

    // Get unsent alerts grouped by user
    let query = supabase
      .from("price_watch_alerts")
      .select(`
        id,
        user_id,
        organization_id,
        result_id,
        price_watch_results (
          article_name,
          article_category,
          found_price,
          found_supplier,
          source_url,
          current_price,
          savings_percent,
          savings_amount
        )
      `)
      .eq("email_sent", false);

    if (organization_id) {
      query = query.eq("organization_id", organization_id);
    }

    const { data: alerts, error: alertsError } = await query.limit(100);

    if (alertsError) {
      console.error("Error fetching alerts:", alertsError);
      throw alertsError;
    }

    if (!alerts || alerts.length === 0) {
      console.log("No unsent alerts found");
      return new Response(
        JSON.stringify({ success: true, message: "No alerts to send", sent_count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Group alerts by user
    const alertsByUser: Record<string, typeof alerts> = {};
    for (const alert of alerts) {
      if (!alertsByUser[alert.user_id]) {
        alertsByUser[alert.user_id] = [];
      }
      alertsByUser[alert.user_id].push(alert);
    }

    console.log(`Found ${alerts.length} alerts for ${Object.keys(alertsByUser).length} users`);

    let sentCount = 0;

    // Send email to each user
    for (const [userId, userAlerts] of Object.entries(alertsByUser)) {
      // Get user email
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", userId)
        .single();

      if (!profile?.email) {
        console.log(`No email found for user ${userId}`);
        continue;
      }

      // Check if user has email notifications enabled
      const { data: settings } = await supabase
        .from("price_watch_settings")
        .select("email_notifications")
        .eq("organization_id", userAlerts[0].organization_id)
        .single();

      if (settings && settings.email_notifications === false) {
        console.log(`Email notifications disabled for organization`);
        continue;
      }

      // Calculate total savings
      const totalSavings = userAlerts.reduce((sum, alert) => {
        return sum + (Number((alert as any).price_watch_results?.savings_amount) || 0);
      }, 0);

      // Build email HTML
      const alertRows = userAlerts.map(alert => {
        const result = (alert as any).price_watch_results;
        if (!result) return "";
        return `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px 8px; font-weight: 500;">${result.article_name}</td>
            <td style="padding: 12px 8px; text-align: right; color: #6b7280;">€${Number(result.current_price).toFixed(2)}</td>
            <td style="padding: 12px 8px; text-align: right; color: #059669; font-weight: 600;">€${Number(result.found_price).toFixed(2)}</td>
            <td style="padding: 12px 8px; text-align: right; color: #059669; font-weight: 600;">-${Number(result.savings_percent).toFixed(1)}%</td>
            <td style="padding: 12px 8px;">${result.found_supplier}</td>
          </tr>
        `;
      }).join("");

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">💰 Einsparmöglichkeiten gefunden!</h1>
          </div>
          
          <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p>Hallo ${profile.full_name || ""},</p>
            
            <p>Wir haben <strong>${userAlerts.length} günstigere Preise</strong> für Ihre Artikel gefunden!</p>
            
            <div style="background: #f0fdf4; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
              <p style="margin: 0; color: #166534; font-size: 14px;">Potentielle Ersparnis</p>
              <p style="margin: 8px 0 0 0; color: #059669; font-size: 32px; font-weight: 700;">€${totalSavings.toFixed(2)}</p>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
              <thead>
                <tr style="background: #f9fafb; border-bottom: 2px solid #e5e7eb;">
                  <th style="padding: 12px 8px; text-align: left; font-weight: 600;">Artikel</th>
                  <th style="padding: 12px 8px; text-align: right; font-weight: 600;">Aktuell</th>
                  <th style="padding: 12px 8px; text-align: right; font-weight: 600;">Gefunden</th>
                  <th style="padding: 12px 8px; text-align: right; font-weight: 600;">Ersparnis</th>
                  <th style="padding: 12px 8px; text-align: left; font-weight: 600;">Lieferant</th>
                </tr>
              </thead>
              <tbody>
                ${alertRows}
              </tbody>
            </table>
            
            <div style="text-align: center; margin-top: 24px;">
              <a href="${appUrl}/reports?tab=pricewatch" 
                 style="display: inline-block; background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Alle Ergebnisse ansehen
              </a>
            </div>
            
            <p style="margin-top: 24px; font-size: 12px; color: #6b7280;">
              Diese E-Mail wurde automatisch von der Preisüberwachung gesendet. 
              Sie können E-Mail-Benachrichtigungen in den Einstellungen deaktivieren.
            </p>
          </div>
        </body>
        </html>
      `;

      // Send email via Resend
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Preisüberwachung <noreply@resend.dev>",
          to: [profile.email],
          subject: `💰 ${userAlerts.length} günstigere Preise gefunden - Sparen Sie €${totalSavings.toFixed(2)}`,
          html: emailHtml,
        }),
      });

      if (emailResponse.ok) {
        console.log(`Email sent to ${profile.email}`);
        sentCount++;

        // Mark alerts as sent
        const alertIds = userAlerts.map(a => a.id);
        await supabase
          .from("price_watch_alerts")
          .update({ 
            email_sent: true, 
            email_sent_at: new Date().toISOString() 
          })
          .in("id", alertIds);
      } else {
        console.error(`Failed to send email to ${profile.email}:`, await emailResponse.text());
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent_count: sentCount,
        total_alerts: alerts.length,
        users_notified: Object.keys(alertsByUser).length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in send-price-alerts:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
