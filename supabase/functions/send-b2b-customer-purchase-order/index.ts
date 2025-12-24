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

interface RequestBody {
  orderId: string;
  vendorEmail: string;
  vendorName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, vendorEmail, vendorName }: RequestBody = await req.json();

    console.log("Sending purchase order email:", { orderId, vendorEmail, vendorName });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: order, error: orderError } = await supabase
      .from("b2b_customer_purchase_orders")
      .select(`
        *,
        supplier_b2b_customers(company_name, email, phone, delivery_address)
      `)
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Order not found:", orderError);
      throw new Error("Bestellung nicht gefunden");
    }

    const { data: items, error: itemsError } = await supabase
      .from("b2b_customer_purchase_order_items")
      .select("*")
      .eq("order_id", orderId)
      .order("article_name");

    if (itemsError) {
      console.error("Error fetching items:", itemsError);
      throw new Error("Fehler beim Laden der Bestellpositionen");
    }

    const customer = order.supplier_b2b_customers as any;
    const customerName = customer?.company_name || "Kunde";
    const customerEmail = customer?.email || "";
    const deliveryAddress = order.delivery_address || customer?.delivery_address || "Nicht angegeben";

    const itemsHtml = items?.map((item: any) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.article_name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity} ${item.unit}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">€${item.unit_price.toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">€${item.total_price.toFixed(2)}</td>
      </tr>
    `).join("") || "";

    const deliveryDateText = order.delivery_date 
      ? new Date(order.delivery_date).toLocaleDateString("de-DE") 
      : "Nicht angegeben";

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Neue Bestellung</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">📦 Neue Bestellung</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="margin-top: 0; color: #374151; font-size: 18px;">Bestellung ${order.order_number}</h2>
            <p><strong>Kunde:</strong> ${customerName}</p>
            <p><strong>E-Mail:</strong> ${customerEmail}</p>
            <p><strong>Lieferadresse:</strong><br>${deliveryAddress.replace(/\n/g, "<br>")}</p>
            <p><strong>Gewünschtes Lieferdatum:</strong> ${deliveryDateText}</p>
            ${order.notes ? `<p><strong>Notizen:</strong> ${order.notes}</p>` : ""}
          </div>

          <div style="background: white; padding: 20px; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #374151;">Bestellte Artikel</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="padding: 10px; text-align: left;">Artikel</th>
                  <th style="padding: 10px; text-align: center;">Menge</th>
                  <th style="padding: 10px; text-align: right;">Preis</th>
                  <th style="padding: 10px; text-align: right;">Gesamt</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr style="background: #f3f4f6;">
                  <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold;">Gesamtsumme:</td>
                  <td style="padding: 12px; text-align: right; font-weight: bold; font-size: 18px;">€${order.total_amount.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
          <p>Diese E-Mail wurde automatisch generiert.</p>
        </div>
      </body>
      </html>
    `;

    const emailResult = await sendEmailViaSMTP({
      to: [vendorEmail],
      subject: `Neue Bestellung von ${customerName} - ${order.order_number}`,
      html: emailHtml,
    });

    if (!emailResult.success) {
      throw new Error(`SMTP error: ${emailResult.error}`);
    }

    console.log("Email sent successfully via SMTP");

    await supabase
      .from("b2b_customer_purchase_orders")
      .update({
        email_sent: true,
        email_sent_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-b2b-customer-purchase-order:", error);
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
