import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error("SMTP send error:", message);
    try { await client.close(); } catch {}
    return { success: false, error: message };
  }
}

interface InvitationEmailRequest {
  inviteeEmail: string;
  inviterName: string;
  organizationName: string;
  role: string;
  inviteToken: string;
  language?: string;
}

type TranslationKey = 'de' | 'en' | 'fr' | 'it' | 'th' | 'vi';

const translations: Record<TranslationKey, {
  subject: (orgName: string) => string;
  header: string;
  greeting: string;
  invitedBy: string;
  onPlatform: string;
  roleAssigned: string;
  whichAllows: string;
  acceptButton: string;
  noAccount: string;
  expires: string;
  footer: string;
  ignore: string;
  roleDescriptions: Record<string, string>;
}> = {
  de: {
    subject: (orgName) => `Sie wurden eingeladen, ${orgName} auf Bestellung.pro beizutreten`,
    header: "Sie sind eingeladen!",
    greeting: "Hallo,",
    invitedBy: "hat Sie eingeladen,",
    onPlatform: "auf Bestellung.pro beizutreten.",
    roleAssigned: "Sie haben die Rolle",
    whichAllows: "erhalten, die Ihnen erlaubt,",
    acceptButton: "Einladung annehmen",
    noAccount: "Falls Sie noch kein Konto haben, können Sie eines erstellen, wenn Sie auf den Button klicken.",
    expires: "Diese Einladung läuft in 7 Tagen ab.",
    footer: "Bestellung.pro - Vereinfachen Sie Ihre Restaurant-Bestellungen",
    ignore: "Falls Sie diese Einladung nicht erwartet haben, können Sie diese E-Mail ignorieren.",
    roleDescriptions: {
      admin: "vollen administrativen Zugriff zu haben",
      manager: "Lieferanten und Artikel zu verwalten",
      purchaser: "Bestellungen aufzugeben",
      viewer: "Bestellungen und Artikel einzusehen",
    }
  },
  en: {
    subject: (orgName) => `You've been invited to join ${orgName} on Bestellung.pro`,
    header: "You're Invited!",
    greeting: "Hi there,",
    invitedBy: "has invited you to join",
    onPlatform: "on Bestellung.pro.",
    roleAssigned: "You've been assigned the role of",
    whichAllows: "which allows you to",
    acceptButton: "Accept Invitation",
    noAccount: "If you don't have an account yet, you'll be able to create one when you click the button above.",
    expires: "This invitation will expire in 7 days.",
    footer: "Bestellung.pro - Streamline your restaurant supply ordering",
    ignore: "If you didn't expect this invitation, you can safely ignore this email.",
    roleDescriptions: {
      admin: "full administrative access",
      manager: "manage suppliers and articles",
      purchaser: "place orders",
      viewer: "view orders and articles",
    }
  },
  fr: {
    subject: (orgName) => `Vous avez été invité(e) à rejoindre ${orgName} sur Bestellung.pro`,
    header: "Vous êtes invité(e) !",
    greeting: "Bonjour,",
    invitedBy: "vous a invité(e) à rejoindre",
    onPlatform: "sur Bestellung.pro.",
    roleAssigned: "Vous avez reçu le rôle de",
    whichAllows: "qui vous permet de",
    acceptButton: "Accepter l'invitation",
    noAccount: "Si vous n'avez pas encore de compte, vous pourrez en créer un en cliquant sur le bouton ci-dessus.",
    expires: "Cette invitation expirera dans 7 jours.",
    footer: "Bestellung.pro - Simplifiez vos commandes de restaurant",
    ignore: "Si vous n'attendiez pas cette invitation, vous pouvez ignorer cet e-mail.",
    roleDescriptions: {
      admin: "un accès administratif complet",
      manager: "gérer les fournisseurs et les articles",
      purchaser: "passer des commandes",
      viewer: "consulter les commandes et les articles",
    }
  },
  it: {
    subject: (orgName) => `Sei stato invitato a unirti a ${orgName} su Bestellung.pro`,
    header: "Sei invitato!",
    greeting: "Ciao,",
    invitedBy: "ti ha invitato a unirti a",
    onPlatform: "su Bestellung.pro.",
    roleAssigned: "Ti è stato assegnato il ruolo di",
    whichAllows: "che ti permette di",
    acceptButton: "Accetta l'invito",
    noAccount: "Se non hai ancora un account, potrai crearne uno cliccando il pulsante qui sopra.",
    expires: "Questo invito scadrà tra 7 giorni.",
    footer: "Bestellung.pro - Semplifica gli ordini del tuo ristorante",
    ignore: "Se non ti aspettavi questo invito, puoi ignorare questa email.",
    roleDescriptions: {
      admin: "accesso amministrativo completo",
      manager: "gestire fornitori e articoli",
      purchaser: "effettuare ordini",
      viewer: "visualizzare ordini e articoli",
    }
  },
  th: {
    subject: (orgName) => `คุณได้รับเชิญให้เข้าร่วม ${orgName} บน Bestellung.pro`,
    header: "คุณได้รับเชิญ!",
    greeting: "สวัสดี,",
    invitedBy: "ได้เชิญคุณให้เข้าร่วม",
    onPlatform: "บน Bestellung.pro",
    roleAssigned: "คุณได้รับบทบาทเป็น",
    whichAllows: "ซึ่งอนุญาตให้คุณ",
    acceptButton: "ยอมรับคำเชิญ",
    noAccount: "หากคุณยังไม่มีบัญชี คุณสามารถสร้างได้เมื่อคลิกปุ่มด้านบน",
    expires: "คำเชิญนี้จะหมดอายุใน 7 วัน",
    footer: "Bestellung.pro - จัดระเบียบการสั่งซื้อร้านอาหารของคุณ",
    ignore: "หากคุณไม่ได้คาดหวังคำเชิญนี้ คุณสามารถเพิกเฉยอีเมลนี้ได้",
    roleDescriptions: {
      admin: "สิทธิ์การเข้าถึงระดับผู้ดูแลระบบเต็มรูปแบบ",
      manager: "จัดการซัพพลายเออร์และสินค้า",
      purchaser: "ทำการสั่งซื้อ",
      viewer: "ดูคำสั่งซื้อและสินค้า",
    }
  },
  vi: {
    subject: (orgName) => `Bạn được mời tham gia ${orgName} trên Bestellung.pro`,
    header: "Bạn được mời!",
    greeting: "Xin chào,",
    invitedBy: "đã mời bạn tham gia",
    onPlatform: "trên Bestellung.pro.",
    roleAssigned: "Bạn đã được gán vai trò",
    whichAllows: "cho phép bạn",
    acceptButton: "Chấp nhận lời mời",
    noAccount: "Nếu bạn chưa có tài khoản, bạn có thể tạo tài khoản khi nhấp vào nút ở trên.",
    expires: "Lời mời này sẽ hết hạn sau 7 ngày.",
    footer: "Bestellung.pro - Đơn giản hóa đặt hàng nhà hàng của bạn",
    ignore: "Nếu bạn không mong đợi lời mời này, bạn có thể bỏ qua email này.",
    roleDescriptions: {
      admin: "quyền truy cập quản trị đầy đủ",
      manager: "quản lý nhà cung cấp và sản phẩm",
      purchaser: "đặt hàng",
      viewer: "xem đơn hàng và sản phẩm",
    }
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { inviteeEmail, inviterName, organizationName, role, inviteToken, language }: InvitationEmailRequest = await req.json();

    console.log(`Sending invitation email to ${inviteeEmail} for organization ${organizationName} in language ${language}`);

    const lang = (language && translations[language as TranslationKey]) ? language as TranslationKey : 'de';
    const t = translations[lang];

    const appUrl = Deno.env.get("APP_URL") || "https://bestellung.pro";
    console.log(`APP_URL from env: ${Deno.env.get("APP_URL")}`);
    console.log(`Using appUrl: ${appUrl}`);
    const signupUrl = `${appUrl}/signup?invite=${inviteToken}`;
    console.log(`Generated signup URL: ${signupUrl}`);

    const roleDescription = t.roleDescriptions[role] || role;

    const htmlContent = `
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
              <h1 style="margin: 0;">${t.header}</h1>
            </div>
            <div class="content">
              <p>${t.greeting}</p>
              <p><strong>${inviterName}</strong> ${t.invitedBy} <strong>${organizationName}</strong> ${t.onPlatform}</p>
              <p>${t.roleAssigned} <span class="role-badge">${role}</span>, ${t.whichAllows} ${roleDescription}.</p>
              <p style="text-align: center;">
                <a href="${signupUrl}" class="button">${t.acceptButton}</a>
              </p>
              <p style="font-size: 14px; color: #6b7280;">${t.noAccount}</p>
              <p style="font-size: 14px; color: #6b7280;">${t.expires}</p>
            </div>
            <div class="footer">
              <p>${t.footer}</p>
              <p style="font-size: 12px;">${t.ignore}</p>
            </div>
          </div>
        </body>
        </html>
      `;

    const textContent = `
${t.header}

${t.greeting}

${inviterName} ${t.invitedBy} ${organizationName} ${t.onPlatform}

${t.roleAssigned} ${role}, ${t.whichAllows} ${roleDescription}.

${t.acceptButton}: ${signupUrl}

${t.noAccount}

${t.expires}

---
${t.footer}

${t.ignore}
    `;

    const emailResult = await sendEmailViaSMTP({
      to: [inviteeEmail],
      subject: t.subject(organizationName),
      html: htmlContent,
      text: textContent,
    });

    if (!emailResult.success) {
      throw new Error(`SMTP error: ${emailResult.error}`);
    }

    console.log("Invitation email sent successfully via SMTP");

    // Log to communication_logs
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (supabaseUrl && serviceRoleKey) {
      const supabase = createClient(supabaseUrl, serviceRoleKey);
      
      const { data: invitation } = await supabase
        .from("team_invitations")
        .select("organization_id")
        .eq("token", inviteToken)
        .single();

      if (invitation?.organization_id) {
        const { error: logError } = await supabase
          .from("communication_logs")
          .insert({
            organization_id: invitation.organization_id,
            email_type: 'team_invitation',
            direction: 'outgoing',
            recipient_email: inviteeEmail,
            subject: t.subject(organizationName),
            status: 'sent',
            body_html: htmlContent,
            sender_email: smtpFrom,
          });

        if (logError) {
          console.error("Error logging communication:", logError);
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
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
