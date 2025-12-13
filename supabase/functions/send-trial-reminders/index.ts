import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DemoOrganization {
  id: string;
  name: string;
  demo_expires_at: string;
  profiles: { email: string; full_name: string | null }[];
}

const emailTemplates = {
  "3_days": {
    subject: "Ihre Bestellung.pro Testphase endet in 3 Tagen",
    heading: "Nur noch 3 Tage!",
    message: `Ihre kostenlose Testphase bei Bestellung.pro endet in <strong>3 Tagen</strong>. 
              Nutzen Sie die verbleibende Zeit, um alle Funktionen zu testen.`,
    cta: "Jetzt upgraden und alle Funktionen behalten",
  },
  "1_day": {
    subject: "Morgen endet Ihre Bestellung.pro Testphase",
    heading: "Letzter Tag morgen!",
    message: `Ihre kostenlose Testphase bei Bestellung.pro endet <strong>morgen</strong>. 
              Upgraden Sie jetzt, um Ihre Daten und Einstellungen zu behalten.`,
    cta: "Jetzt upgraden",
  },
  "expired": {
    subject: "Ihre Bestellung.pro Testphase ist abgelaufen",
    heading: "Testphase beendet",
    message: `Ihre kostenlose Testphase bei Bestellung.pro ist <strong>abgelaufen</strong>. 
              Keine Sorge – Ihre Daten sind noch 7 Tage gespeichert. 
              Upgraden Sie jetzt, um wieder vollen Zugriff zu erhalten.`,
    cta: "Jetzt upgraden und weitermachen",
  },
};

function generateEmailHtml(
  template: keyof typeof emailTemplates,
  orgName: string,
  userName: string | null,
  appUrl: string
): string {
  const t = emailTemplates[template];
  const greeting = userName ? `Hallo ${userName}` : "Hallo";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">${t.heading}</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                ${greeting},
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                ${t.message}
              </p>
              
              <!-- Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 4px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="color: #1e40af; font-size: 14px; margin: 0;">
                      <strong>Organisation:</strong> ${orgName}
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px 0;">
                    <a href="${appUrl}/pricing" 
                       style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      ${t.cta}
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
                Mit freundlichen Grüßen,<br>
                Ihr Bestellung.pro Team
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Bestellung.pro – Einfach bestellen.
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0 0;">
                <a href="${appUrl}" style="color: #6b7280; text-decoration: underline;">bestellung.pro</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

async function sendEmail(to: string, subject: string, html: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Bestellung.pro <noreply@bestellung.pro>",
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.message || "Failed to send email" };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting trial reminder check...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const appUrl = Deno.env.get("APP_URL") || "https://bestellung.pro";
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    const oneDayFromNow = new Date(now);
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);

    // Format dates for comparison (start and end of day)
    const formatDateStart = (d: Date) => {
      const date = new Date(d);
      date.setHours(0, 0, 0, 0);
      return date.toISOString();
    };
    const formatDateEnd = (d: Date) => {
      const date = new Date(d);
      date.setHours(23, 59, 59, 999);
      return date.toISOString();
    };

    // Find demo organizations expiring in exactly 3 days
    const { data: orgsExpiring3Days, error: err3Days } = await supabase
      .from("organizations")
      .select(`
        id,
        name,
        demo_expires_at,
        profiles!profiles_organization_id_fkey(email, full_name)
      `)
      .eq("is_demo", true)
      .gte("demo_expires_at", formatDateStart(threeDaysFromNow))
      .lte("demo_expires_at", formatDateEnd(threeDaysFromNow));

    if (err3Days) {
      console.error("Error fetching 3-day orgs:", err3Days);
    }

    // Find demo organizations expiring in exactly 1 day
    const { data: orgsExpiring1Day, error: err1Day } = await supabase
      .from("organizations")
      .select(`
        id,
        name,
        demo_expires_at,
        profiles!profiles_organization_id_fkey(email, full_name)
      `)
      .eq("is_demo", true)
      .gte("demo_expires_at", formatDateStart(oneDayFromNow))
      .lte("demo_expires_at", formatDateEnd(oneDayFromNow));

    if (err1Day) {
      console.error("Error fetching 1-day orgs:", err1Day);
    }

    // Find demo organizations that expired today
    const { data: orgsExpiredToday, error: errExpired } = await supabase
      .from("organizations")
      .select(`
        id,
        name,
        demo_expires_at,
        profiles!profiles_organization_id_fkey(email, full_name)
      `)
      .eq("is_demo", true)
      .gte("demo_expires_at", formatDateStart(now))
      .lte("demo_expires_at", formatDateEnd(now));

    if (errExpired) {
      console.error("Error fetching expired orgs:", errExpired);
    }

    const emailsSent: { type: string; email: string; org: string }[] = [];

    // Send 3-day reminder emails
    if (orgsExpiring3Days && orgsExpiring3Days.length > 0) {
      console.log(`Found ${orgsExpiring3Days.length} orgs expiring in 3 days`);
      for (const org of orgsExpiring3Days as unknown as DemoOrganization[]) {
        for (const profile of org.profiles || []) {
          if (!profile.email) continue;
          
          const html = generateEmailHtml("3_days", org.name, profile.full_name, appUrl);
          const result = await sendEmail(profile.email, emailTemplates["3_days"].subject, html);

          if (!result.success) {
            console.error(`Error sending 3-day email to ${profile.email}:`, result.error);
          } else {
            console.log(`Sent 3-day reminder to ${profile.email}`);
            emailsSent.push({ type: "3_days", email: profile.email, org: org.name });
          }
        }
      }
    }

    // Send 1-day reminder emails
    if (orgsExpiring1Day && orgsExpiring1Day.length > 0) {
      console.log(`Found ${orgsExpiring1Day.length} orgs expiring in 1 day`);
      for (const org of orgsExpiring1Day as unknown as DemoOrganization[]) {
        for (const profile of org.profiles || []) {
          if (!profile.email) continue;
          
          const html = generateEmailHtml("1_day", org.name, profile.full_name, appUrl);
          const result = await sendEmail(profile.email, emailTemplates["1_day"].subject, html);

          if (!result.success) {
            console.error(`Error sending 1-day email to ${profile.email}:`, result.error);
          } else {
            console.log(`Sent 1-day reminder to ${profile.email}`);
            emailsSent.push({ type: "1_day", email: profile.email, org: org.name });
          }
        }
      }
    }

    // Send expired emails
    if (orgsExpiredToday && orgsExpiredToday.length > 0) {
      console.log(`Found ${orgsExpiredToday.length} orgs expired today`);
      for (const org of orgsExpiredToday as unknown as DemoOrganization[]) {
        for (const profile of org.profiles || []) {
          if (!profile.email) continue;
          
          const html = generateEmailHtml("expired", org.name, profile.full_name, appUrl);
          const result = await sendEmail(profile.email, emailTemplates["expired"].subject, html);

          if (!result.success) {
            console.error(`Error sending expired email to ${profile.email}:`, result.error);
          } else {
            console.log(`Sent expired notification to ${profile.email}`);
            emailsSent.push({ type: "expired", email: profile.email, org: org.name });
          }
        }
      }
    }

    console.log(`Trial reminder check complete. Sent ${emailsSent.length} emails.`);

    return new Response(
      JSON.stringify({
        success: true,
        emailsSent: emailsSent.length,
        details: emailsSent,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-trial-reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
