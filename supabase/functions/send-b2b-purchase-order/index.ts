import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
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
  fromName?: string;
}): Promise<{ success: boolean; error?: string }> {
  const client = new SMTPClient(smtpConfig);
  try {
    await client.send({
      from: `${options.fromName || 'Bestellung.pro'} <${smtpFrom}>`,
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

interface OrderItem {
  name: string;
  quantity: number;
  unit: string;
  price: number;
  total: number;
}

interface PurchaseOrderRequest {
  orderId: string;
  vendorEmail: string;
  vendorName: string;
  orderNumber: string;
  deliveryDate?: string;
  deliveryAddress?: string;
  notes?: string;
  items: OrderItem[];
  total: number;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-b2b-purchase-order function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const {
      orderId,
      vendorEmail,
      vendorName,
      orderNumber,
      deliveryDate,
      deliveryAddress,
      notes,
      items,
      total,
    }: PurchaseOrderRequest = await req.json();

    console.log(`Processing order ${orderNumber} for vendor ${vendorName}`);

    const { data: orderData } = await supabaseClient
      .from('b2b_supplier_purchase_orders')
      .select('supplier_account_id')
      .eq('id', orderId)
      .single();

    let senderName = 'Bestellung.pro';
    if (orderData?.supplier_account_id) {
      const { data: accountData } = await supabaseClient
        .from('supplier_b2b_accounts')
        .select('company_name')
        .eq('id', orderData.supplier_account_id)
        .single();
      
      if (accountData?.company_name) {
        senderName = accountData.company_name;
      }
    }

    const itemsTable = items.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity} ${item.unit}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">€${item.price.toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">€${item.total.toFixed(2)}</td>
      </tr>
    `).join('');

    const formattedDeliveryDate = deliveryDate 
      ? new Date(deliveryDate).toLocaleDateString('de-DE', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      : null;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .order-info { background: #fff; border: 1px solid #eee; border-radius: 8px; padding: 15px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f8f9fa; padding: 10px; text-align: left; }
    .total-row { font-weight: bold; background: #f8f9fa; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; color: #333;">Bestellung ${orderNumber}</h1>
      <p style="margin: 10px 0 0 0; color: #666;">von ${senderName}</p>
    </div>

    <p>Guten Tag,</p>
    <p>hiermit senden wir Ihnen unsere Bestellung:</p>

    ${formattedDeliveryDate || deliveryAddress ? `
    <div class="order-info">
      ${formattedDeliveryDate ? `<p><strong>Gewünschtes Lieferdatum:</strong> ${formattedDeliveryDate}</p>` : ''}
      ${deliveryAddress ? `<p><strong>Lieferadresse:</strong><br>${deliveryAddress.replace(/\n/g, '<br>')}</p>` : ''}
    </div>
    ` : ''}

    <table>
      <thead>
        <tr>
          <th>Artikel</th>
          <th style="text-align: center;">Menge</th>
          <th style="text-align: right;">Preis</th>
          <th style="text-align: right;">Gesamt</th>
        </tr>
      </thead>
      <tbody>
        ${itemsTable}
        <tr class="total-row">
          <td colspan="3" style="padding: 10px; text-align: right;">Gesamtsumme:</td>
          <td style="padding: 10px; text-align: right;">€${total.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    ${notes ? `
    <div class="order-info" style="margin-top: 20px;">
      <p><strong>Anmerkungen:</strong></p>
      <p>${notes.replace(/\n/g, '<br>')}</p>
    </div>
    ` : ''}

    <p>Vielen Dank für Ihre Zusammenarbeit.</p>
    <p>Mit freundlichen Grüßen,<br>${senderName}</p>

    <div class="footer">
      <p>Diese Bestellung wurde über Bestellung.pro gesendet.</p>
    </div>
  </div>
</body>
</html>
    `;

    const textContent = `
Bestellung ${orderNumber}
von ${senderName}

Guten Tag,

hiermit senden wir Ihnen unsere Bestellung:

${formattedDeliveryDate ? `Gewünschtes Lieferdatum: ${formattedDeliveryDate}\n` : ''}
${deliveryAddress ? `Lieferadresse: ${deliveryAddress}\n` : ''}

Bestellte Artikel:
${items.map(item => `- ${item.name}: ${item.quantity} ${item.unit} à €${item.price.toFixed(2)} = €${item.total.toFixed(2)}`).join('\n')}

Gesamtsumme: €${total.toFixed(2)}

${notes ? `Anmerkungen:\n${notes}\n` : ''}

Vielen Dank für Ihre Zusammenarbeit.

Mit freundlichen Grüßen,
${senderName}
    `;

    console.log(`Sending email to ${vendorEmail} via SMTP`);

    const emailResult = await sendEmailViaSMTP({
      to: [vendorEmail],
      subject: `Bestellung ${orderNumber} von ${senderName}`,
      html: htmlContent,
      text: textContent,
      fromName: senderName,
    });

    if (!emailResult.success) {
      throw new Error(`SMTP error: ${emailResult.error}`);
    }

    console.log("Email sent successfully via SMTP");

    if (orderData?.supplier_account_id) {
      await supabaseClient
        .from('communication_logs')
        .insert({
          organization_id: orderData.supplier_account_id,
          email_type: 'b2b_purchase_order',
          direction: 'outgoing',
          recipient_email: vendorEmail,
          recipient_name: vendorName,
          subject: `Bestellung ${orderNumber} von ${senderName}`,
          body_html: htmlContent,
          status: 'sent',
          sender_email: smtpFrom,
        });
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-b2b-purchase-order:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
