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
  const itemRows = data.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.article_name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity} ${item.unit}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">€${item.unit_price.toFixed(2)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">€${item.total_price.toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>New Order from ${data.restaurantName}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">New Order Received</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Order #${data.orderNumber}</p>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <div style="margin-bottom: 24px;">
            <h2 style="color: #1f2937; font-size: 18px; margin: 0 0 8px 0;">Order Details</h2>
            <p style="margin: 4px 0; color: #6b7280;"><strong>From:</strong> ${data.restaurantName}</p>
            <p style="margin: 4px 0; color: #6b7280;"><strong>To:</strong> ${data.supplierName}</p>
            <p style="margin: 4px 0; color: #6b7280;"><strong>Date:</strong> ${new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>

          <div style="margin-bottom: 24px;">
            <h2 style="color: #1f2937; font-size: 18px; margin: 0 0 8px 0;">Delivery Address</h2>
            <p style="margin: 0; color: #6b7280;">${data.deliveryAddress.replace(/\n/g, '<br>')}</p>
          </div>

          ${data.notes ? `
            <div style="margin-bottom: 24px; padding: 12px; background: #fef3c7; border-radius: 8px;">
              <h2 style="color: #92400e; font-size: 14px; margin: 0 0 4px 0;">📝 Notes</h2>
              <p style="margin: 0; color: #78350f;">${data.notes}</p>
            </div>
          ` : ''}

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Article</th>
                <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Quantity</th>
                <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Unit Price</th>
                <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
            <tfoot>
              <tr style="background: #4f46e5;">
                <td colspan="3" style="padding: 16px; color: white; font-weight: 600; font-size: 16px;">Total Amount</td>
                <td style="padding: 16px; text-align: right; color: white; font-weight: 700; font-size: 18px;">€${data.totalAmount.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              This order was placed through ProcureResto.<br>
              Please confirm receipt and process accordingly.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
};

const generatePlainText = (data: OrderEmailRequest): string => {
  const itemLines = data.items.map(item => 
    `- ${item.article_name}: ${item.quantity} ${item.unit} x €${item.unit_price.toFixed(2)} = €${item.total_price.toFixed(2)}`
  ).join('\n');

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
