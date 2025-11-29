import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationEmailRequest {
  inviteeEmail: string;
  inviterName: string;
  organizationName: string;
  role: string;
  inviteToken: string;
}

const roleDescriptions: Record<string, string> = {
  admin: "full administrative access",
  manager: "manage suppliers and articles",
  purchaser: "place orders",
  viewer: "view orders and articles",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { inviteeEmail, inviterName, organizationName, role, inviteToken }: InvitationEmailRequest = await req.json();

    console.log(`Sending invitation email to ${inviteeEmail} for organization ${organizationName}`);

    // Get the app URL from environment or use a default
    const appUrl = Deno.env.get("APP_URL") || "https://lovable.dev";
    const signupUrl = `${appUrl}/signup?invite=${inviteToken}`;

    const roleDescription = roleDescriptions[role] || role;

    const emailResponse = await resend.emails.send({
      from: "OrderFlow <onboarding@resend.dev>",
      to: [inviteeEmail],
      subject: `You've been invited to join ${organizationName} on OrderFlow`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .button { display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            .role-badge { display: inline-block; background: #e5e7eb; padding: 4px 12px; border-radius: 20px; font-size: 14px; color: #374151; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">You're Invited!</h1>
            </div>
            <div class="content">
              <p>Hi there,</p>
              <p><strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> on OrderFlow.</p>
              <p>You've been assigned the role of <span class="role-badge">${role}</span>, which allows you to ${roleDescription}.</p>
              <p style="text-align: center;">
                <a href="${signupUrl}" class="button">Accept Invitation</a>
              </p>
              <p style="font-size: 14px; color: #6b7280;">If you don't have an account yet, you'll be able to create one when you click the button above.</p>
              <p style="font-size: 14px; color: #6b7280;">This invitation will expire in 7 days.</p>
            </div>
            <div class="footer">
              <p>OrderFlow - Streamline your restaurant supply ordering</p>
              <p style="font-size: 12px;">If you didn't expect this invitation, you can safely ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
You've been invited to join ${organizationName} on OrderFlow!

${inviterName} has invited you to join their organization with the role of ${role}, which allows you to ${roleDescription}.

Click here to accept the invitation: ${signupUrl}

If you don't have an account yet, you'll be able to create one when you click the link above.

This invitation will expire in 7 days.

---
OrderFlow - Streamline your restaurant supply ordering

If you didn't expect this invitation, you can safely ignore this email.
      `,
    });

    console.log("Invitation email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending invitation email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
