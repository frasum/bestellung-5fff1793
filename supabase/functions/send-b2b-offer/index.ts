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
  fromName?: string;
}): Promise<{ success: boolean; error?: string }> {
  const client = new SMTPClient(smtpConfig);
  try {
    await client.send({
      from: `${options.fromName || 'Bestellung.pro'} <${smtpFrom}>`,
      to: options.to,
      subject: options.subject,
      content: "",
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

interface OfferItem {
  article_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { offerId } = await req.json();

    if (!offerId) {
      throw new Error("Offer ID is required");
    }

    console.log("Sending offer:", offerId);

    const { data: offer, error: offerError } = await supabase
      .from("supplier_b2b_offers")
      .select(`
        *,
        customer:supplier_b2b_customers(company_name, email, contact_person),
        account:supplier_b2b_accounts(company_name, email, primary_color)
      `)
      .eq("id", offerId)
      .single();

    if (offerError || !offer) {
      console.error("Error fetching offer:", offerError);
      throw new Error("Offer not found");
    }

    const { data: items, error: itemsError } = await supabase
      .from("supplier_b2b_offer_items")
      .select("*")
      .eq("offer_id", offerId);

    if (itemsError) {
      console.error("Error fetching offer items:", itemsError);
      throw new Error("Could not fetch offer items");
    }

    const supplierName = offer.account.company_name;
    const customerName = offer.customer.company_name;
    const customerEmail = offer.customer.email;
    const contactPerson = offer.customer.contact_person;
    const primaryColor = offer.account.primary_color || "#3b82f6";

    const itemsHtml = (items || [])
      .map(
        (item: OfferItem) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.article_name}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${item.quantity} ${item.unit}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">€${item.unit_price.toFixed(2)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">€${item.total_price.toFixed(2)}</td>
        </tr>
      `
      )
      .join("");

    const validUntilText = offer.valid_until
      ? `<p style="margin: 0 0 16px 0; color: #6b7280;">Gültig bis: ${new Date(offer.valid_until).toLocaleDateString("de-DE")}</p>`
      : "";

    const notesText = offer.notes
      ? `<p style="margin: 16px 0; padding: 12px; background-color: #f9fafb; border-radius: 8px; color: #374151;">${offer.notes}</p>`
      : "";

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Angebot ${offer.offer_number}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden;">
              <div style="background-color: ${primaryColor}; padding: 24px; text-align: center;">
                <h1 style="margin: 0; color: white; font-size: 24px;">Angebot</h1>
                <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">${offer.offer_number}</p>
              </div>
              
              <div style="padding: 24px;">
                <p style="margin: 0 0 16px 0; color: #374151;">
                  ${contactPerson ? `Sehr geehrte(r) ${contactPerson}` : `Sehr geehrte Damen und Herren`},
                </p>
                
                <p style="margin: 0 0 24px 0; color: #374151;">
                  vielen Dank für Ihr Interesse. Gerne unterbreiten wir Ihnen folgendes Angebot:
                </p>

                ${validUntilText}
                
                <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
                  <thead>
                    <tr style="background-color: #f9fafb;">
                      <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; color: #374151;">Artikel</th>
                      <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb; color: #374151;">Menge</th>
                      <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb; color: #374151;">Preis</th>
                      <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb; color: #374151;">Gesamt</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                  <tfoot>
                    <tr style="background-color: #f9fafb;">
                      <td colspan="3" style="padding: 12px; text-align: right; font-weight: 600; color: #374151;">Gesamtsumme:</td>
                      <td style="padding: 12px; text-align: right; font-weight: 700; color: ${primaryColor}; font-size: 18px;">€${offer.total_amount.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>

                ${notesText}
                
                <p style="margin: 24px 0 0 0; color: #374151;">
                  Bei Fragen stehen wir Ihnen gerne zur Verfügung.
                </p>
                
                <p style="margin: 16px 0 0 0; color: #374151;">
                  Mit freundlichen Grüßen,<br>
                  <strong>${supplierName}</strong>
                </p>
              </div>
              
              <div style="background-color: #f9fafb; padding: 16px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; font-size: 12px; color: #6b7280;">
                  Dieses Angebot wurde von ${supplierName} über Bestellung.pro erstellt.
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResult = await sendEmailViaSMTP({
      to: [customerEmail],
      subject: `Angebot ${offer.offer_number} von ${supplierName}`,
      html: emailHtml,
      fromName: supplierName,
    });

    if (!emailResult.success) {
      console.error("Error sending email:", emailResult.error);
      throw new Error("Failed to send email");
    }

    console.log("Offer email sent successfully via SMTP to:", customerEmail);

    return new Response(
      JSON.stringify({ success: true, message: "Offer sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error in send-b2b-offer function:", message);
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
