import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  article_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  sku?: string;
}

interface OrderEmailRequest {
  orderId: string;
  orderNumber: string;
  supplierEmail: string;
  supplierName: string;
  restaurantName: string;
  deliveryAddress: string;
  items: OrderItem[];
  totalAmount: number;
  notes?: string;
}

const generateEmailHtml = (data: OrderEmailRequest): string => {
  const itemRows = data.items.map((item, index) => {
    const bgColor = index % 2 === 0 ? '#ffffff' : '#f9fafb';
    const skuDisplay = item.sku ? `<span style="display: inline-block; background: #e5e7eb; color: #374151; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; margin-left: 8px;">${item.sku}</span>` : '';
    return `
    <tr style="background: ${bgColor};">
      <td style="padding: 16px 12px; border-bottom: 1px solid #e5e7eb; vertical-align: top;">
        <div style="font-weight: 600; color: #1f2937; font-size: 14px;">${item.article_name}</div>
        ${skuDisplay}
      </td>
      <td style="padding: 16px 12px; border-bottom: 1px solid #e5e7eb; text-align: center; vertical-align: middle;">
        <span style="display: inline-block; background: #dbeafe; color: #1e40af; font-weight: 700; padding: 6px 14px; border-radius: 6px; font-size: 15px;">${item.quantity}</span>
        <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">${item.unit}</div>
      </td>
      <td style="padding: 16px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; vertical-align: middle; color: #6b7280; font-size: 13px;">€${item.unit_price.toFixed(2)}</td>
      <td style="padding: 16px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; vertical-align: middle; font-weight: 700; color: #1f2937; font-size: 15px;">€${item.total_price.toFixed(2)}</td>
    </tr>
  `;
  }).join('');

  const itemCount = data.items.reduce((sum, item) => sum + item.quantity, 0);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Bestellung von ${data.restaurantName}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 650px; margin: 0 auto; padding: 20px; background: #f3f4f6;">
        <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding: 32px; border-radius: 16px 16px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 26px; font-weight: 700;">📦 Neue Bestellung</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 12px 0 0 0; font-size: 16px;">${data.restaurantName}</p>
        </div>
        
        <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          
          <!-- Quick Summary -->
          <div style="display: flex; margin-bottom: 28px; padding: 20px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 12px; border: 1px solid #bae6fd;">
            <div style="flex: 1; text-align: center; border-right: 1px solid #bae6fd;">
              <div style="font-size: 28px; font-weight: 700; color: #0369a1;">${data.items.length}</div>
              <div style="font-size: 12px; color: #0c4a6e; text-transform: uppercase; letter-spacing: 0.5px;">Positionen</div>
            </div>
            <div style="flex: 1; text-align: center;">
              <div style="font-size: 28px; font-weight: 700; color: #0369a1;">€${data.totalAmount.toFixed(2)}</div>
              <div style="font-size: 12px; color: #0c4a6e; text-transform: uppercase; letter-spacing: 0.5px;">Gesamtsumme</div>
            </div>
          </div>

          <!-- Order Info -->
          <div style="margin-bottom: 28px; padding: 20px; background: #fafafa; border-radius: 12px;">
            <h2 style="color: #1f2937; font-size: 14px; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Bestelldetails</h2>
            <table style="width: 100%; font-size: 14px;">
              <tr>
                <td style="padding: 6px 0; color: #6b7280; width: 120px;">Besteller:</td>
                <td style="padding: 6px 0; color: #1f2937; font-weight: 500;">${data.restaurantName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280;">Lieferant:</td>
                <td style="padding: 6px 0; color: #1f2937; font-weight: 500;">${data.supplierName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280;">Datum:</td>
                <td style="padding: 6px 0; color: #1f2937; font-weight: 500;">${new Date().toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
              </tr>
            </table>
          </div>

          <!-- Delivery Address -->
          <div style="margin-bottom: 28px; padding: 20px; background: #fafafa; border-radius: 12px;">
            <h2 style="color: #1f2937; font-size: 14px; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">📍 Lieferadresse</h2>
            <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.7;">${data.deliveryAddress.replace(/\n/g, '<br>')}</p>
          </div>

          ${data.notes ? `
            <div style="margin-bottom: 28px; padding: 20px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; border: 1px solid #f59e0b;">
              <h2 style="color: #92400e; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">📝 Hinweise</h2>
              <p style="margin: 0; color: #78350f; font-size: 14px; white-space: pre-line;">${data.notes}</p>
            </div>
          ` : ''}

          <!-- Items Table -->
          <div style="margin-bottom: 28px;">
            <h2 style="color: #1f2937; font-size: 14px; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">🛒 Bestellte Artikel</h2>
            <table style="width: 100%; border-collapse: collapse; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <thead>
                <tr style="background: #1e3a5f;">
                  <th style="padding: 14px 12px; text-align: left; font-weight: 600; color: white; font-size: 13px;">Artikel</th>
                  <th style="padding: 14px 12px; text-align: center; font-weight: 600; color: white; font-size: 13px;">Menge</th>
                  <th style="padding: 14px 12px; text-align: right; font-weight: 600; color: white; font-size: 13px;">Stückpreis</th>
                  <th style="padding: 14px 12px; text-align: right; font-weight: 600; color: white; font-size: 13px;">Gesamt</th>
                </tr>
              </thead>
              <tbody>
                ${itemRows}
              </tbody>
              <tfoot>
                <tr style="background: linear-gradient(135deg, #059669 0%, #10b981 100%);">
                  <td colspan="3" style="padding: 18px 12px; color: white; font-weight: 700; font-size: 16px;">Gesamtbetrag</td>
                  <td style="padding: 18px 12px; text-align: right; color: white; font-weight: 800; font-size: 20px;">€${data.totalAmount.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              Diese Bestellung wurde über ProcureResto aufgegeben.<br>
              Bitte bestätigen Sie den Eingang und bearbeiten Sie die Bestellung entsprechend.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
};

const generatePlainText = (data: OrderEmailRequest): string => {
  const itemLines = data.items.map(item => {
    const skuPart = item.sku ? ` (SKU: ${item.sku})` : '';
    return `- ${item.article_name}${skuPart}: ${item.quantity} ${item.unit} x €${item.unit_price.toFixed(2)} = €${item.total_price.toFixed(2)}`;
  }).join('\n');

  return `
NEW ORDER RECEIVED
==================
Order #${data.orderNumber}

From: ${data.restaurantName}
To: ${data.supplierName}
Date: ${new Date().toLocaleDateString('de-DE')}

DELIVERY ADDRESS
----------------
${data.deliveryAddress}

${data.notes ? `NOTES\n------\n${data.notes}\n` : ''}

ORDER ITEMS
-----------
${itemLines}

TOTAL: €${data.totalAmount.toFixed(2)}

---
This order was placed through ProcureResto.
Please confirm receipt and process accordingly.
  `.trim();
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: OrderEmailRequest = await req.json();
    
    console.log(`Sending order email for order ${data.orderNumber} to ${data.supplierEmail}`);

    const emailResponse = await resend.emails.send({
      from: "ProcureResto <onboarding@resend.dev>",
      to: [data.supplierEmail],
      subject: `New Order #${data.orderNumber} from ${data.restaurantName}`,
      html: generateEmailHtml(data),
      text: generatePlainText(data),
    });

    console.log("Email sent successfully:", emailResponse);

    // Update the order to mark email as sent
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { error: updateError } = await supabaseClient
      .from("orders")
      .update({ 
        email_sent: true, 
        email_sent_at: new Date().toISOString() 
      })
      .eq("id", data.orderId);

    if (updateError) {
      console.error("Error updating order email status:", updateError);
    }

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-order-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
