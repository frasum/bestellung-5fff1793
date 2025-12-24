import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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

// Helper to send email via SMTP
async function sendEmailViaSMTP(options: {
  to: string[];
  subject: string;
  html: string;
}): Promise<{ success: boolean; error?: string }> {
  const client = new SMTPClient(smtpConfig);
  try {
    await client.send({
      from: `Bestellsystem <${smtpFrom}>`,
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

interface InviteRequest {
  email: string;
  organizationName: string;
  sponsoredNote?: string;
  sponsoredFeatures: {
    suppliers: boolean;
    articles: boolean;
    orders: boolean;
    inventory: boolean;
    simple_order: boolean;
    b2b_portal: boolean;
    voice_order: boolean;
    wine_catalog: boolean;
    multi_location: boolean;
    supplier_portal: boolean;
    advanced_reports: boolean;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const appUrl = Deno.env.get("APP_URL") || "https://lclhwmxpbpmqtiwmgmgm.lovableproject.com";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { data: isSuperAdmin, error: adminError } = await supabase.rpc('is_super_admin', {
      _user_id: user.id
    });

    if (adminError || !isSuperAdmin) {
      throw new Error("Only super admins can invite sponsored accounts");
    }

    const { email, organizationName, sponsoredNote, sponsoredFeatures }: InviteRequest = await req.json();

    if (!email || !organizationName) {
      throw new Error("Email and organization name are required");
    }

    console.log(`Creating sponsored account for ${email} - ${organizationName}`);

    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (existingUser) {
      throw new Error("Ein Account mit dieser E-Mail-Adresse existiert bereits");
    }

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: organizationName,
        is_sponsored: true,
        sponsored_note: sponsoredNote || null,
        sponsored_features: sponsoredFeatures,
        subscription_tier: 'sponsored',
        source_type: 'friends_family'
      })
      .select()
      .single();

    if (orgError) {
      console.error("Error creating organization:", orgError);
      throw new Error("Failed to create organization");
    }

    console.log(`Organization created: ${org.id}`);

    const tempPassword = crypto.randomUUID().slice(0, 16);

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: organizationName,
        organization_name: organizationName
      }
    });

    if (authError) {
      console.error("Error creating auth user:", authError);
      await supabase.from('organizations').delete().eq('id', org.id);
      throw new Error(`Failed to create user: ${authError.message}`);
    }

    console.log(`Auth user created: ${authData.user.id}`);

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: email,
        full_name: organizationName,
        organization_id: org.id,
        role: 'admin'
      });

    if (profileError) {
      console.error("Error creating profile:", profileError);
      await supabase.auth.admin.deleteUser(authData.user.id);
      await supabase.from('organizations').delete().eq('id', org.id);
      throw new Error("Failed to create profile");
    }

    const { error: locationError } = await supabase
      .from('locations')
      .insert({
        name: 'Hauptstandort',
        organization_id: org.id,
        is_default: true
      });

    if (locationError) {
      console.error("Error creating default location:", locationError);
    }

    const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${appUrl}/auth`
      }
    });

    if (resetError) {
      console.error("Error generating reset link:", resetError);
    }

    const resetLink = resetData?.properties?.action_link || `${appUrl}/auth`;

    const featureLabels: Record<string, string> = {
      suppliers: 'Lieferanten',
      articles: 'Artikel',
      orders: 'Bestellungen',
      inventory: 'Inventur',
      simple_order: 'Simple Order (Mitarbeiter-App)',
      b2b_portal: 'B2B-Portal',
      voice_order: 'Sprachbestellung',
      wine_catalog: 'Weinkatalog',
      multi_location: 'Mehrere Standorte',
      supplier_portal: 'Lieferanten-Portal',
      advanced_reports: 'Erweiterte Berichte'
    };

    const enabledFeatures = Object.entries(sponsoredFeatures)
      .filter(([_, enabled]) => enabled)
      .map(([key, _]) => featureLabels[key] || key);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #e11d48; margin: 0; font-size: 28px; }
            .header p { color: #666; margin: 10px 0 0; }
            .card { background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); border-radius: 16px; padding: 30px; margin: 20px 0; }
            .features { background: white; border-radius: 12px; padding: 20px; margin-top: 20px; }
            .features h3 { margin: 0 0 15px; color: #333; }
            .feature-list { list-style: none; padding: 0; margin: 0; }
            .feature-list li { padding: 8px 0; border-bottom: 1px solid #f3f4f6; display: flex; align-items: center; }
            .feature-list li:last-child { border-bottom: none; }
            .feature-list li::before { content: "✓"; color: #10b981; font-weight: bold; margin-right: 10px; }
            .button { display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #e11d48 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎁 Friends & Family Einladung</h1>
              <p>Du wurdest zu einem kostenlosen Pro-Account eingeladen!</p>
            </div>
            
            <div class="card">
              <p>Hallo!</p>
              <p>Du wurdest eingeladen, <strong>${organizationName}</strong> kostenlos mit unserem Bestellsystem zu verwalten. Als Friends & Family Mitglied erhältst du vollen Zugang zu allen freigeschalteten Funktionen - ohne zeitliche Begrenzung und ohne Kosten.</p>
              
              <div class="features">
                <h3>Deine freigeschalteten Funktionen:</h3>
                <ul class="feature-list">
                  ${enabledFeatures.map(f => `<li>${f}</li>`).join('')}
                </ul>
              </div>
              
              <center>
                <a href="${resetLink}" class="button">Passwort festlegen & loslegen</a>
              </center>
              
              <p style="font-size: 14px; color: #666;">Klicke auf den Button oben, um dein Passwort festzulegen und dich einzuloggen.</p>
            </div>
            
            <div class="footer">
              <p>Bei Fragen melde dich einfach!</p>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      const emailResult = await sendEmailViaSMTP({
        to: [email],
        subject: `🎁 Einladung: Kostenloser Pro-Account für ${organizationName}`,
        html: emailHtml,
      });
      
      if (emailResult.success) {
        console.log("Invitation email sent successfully via SMTP");
      } else {
        console.error("Error sending email via SMTP:", emailResult.error);
      }
    } catch (emailError) {
      console.error("Error sending email:", emailError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        organizationId: org.id,
        userId: authData.user.id,
        message: "Account created and invitation sent"
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in invite-sponsored-account:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
