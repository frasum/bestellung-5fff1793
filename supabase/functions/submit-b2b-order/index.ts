import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  article_id: string;
  article_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
}

interface SubmitOrderRequest {
  customer_id: string;
  supplier_account_id: string;
  items: OrderItem[];
  delivery_address?: string;
  delivery_date?: string;
  notes?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { customer_id, supplier_account_id, items, delivery_address, delivery_date, notes }: SubmitOrderRequest = await req.json();

    console.log("Processing B2B order:", { customer_id, supplier_account_id, itemCount: items.length });

    // Fetch customer info
    const { data: customer, error: customerError } = await supabase
      .from("supplier_b2b_customers")
      .select("*")
      .eq("id", customer_id)
      .single();

    if (customerError || !customer) {
      console.error("Customer not found:", customerError);
      return new Response(JSON.stringify({ error: "Customer not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch supplier account info
    const { data: supplierAccount, error: supplierError } = await supabase
      .from("supplier_b2b_accounts")
      .select("*")
      .eq("id", supplier_account_id)
      .single();

    if (supplierError || !supplierAccount) {
      console.error("Supplier account not found:", supplierError);
      return new Response(JSON.stringify({ error: "Supplier account not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate total
    const total_amount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

    // Generate order number using the B2B sequence
    const { data: orderNumberData, error: orderNumberError } = await supabase
      .rpc("generate_b2b_order_number");

    if (orderNumberError) {
      console.error("Error generating order number:", orderNumberError);
      return new Response(JSON.stringify({ error: "Failed to generate order number" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const order_number = orderNumberData;
    console.log("Generated order number:", order_number);

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from("supplier_b2b_orders")
      .insert({
        order_number,
        customer_id,
        supplier_account_id,
        total_amount,
        delivery_address: delivery_address || customer.delivery_address,
        delivery_date,
        notes,
        status: "pending",
      })
      .select()
      .single();

    if (orderError) {
      console.error("Error creating order:", orderError);
      return new Response(JSON.stringify({ error: "Failed to create order" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Order created:", order.id);

    // Create order items
    const orderItems = items.map((item) => ({
      order_id: order.id,
      article_id: item.article_id,
      article_name: item.article_name,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unit_price,
      total_price: item.quantity * item.unit_price,
    }));

    const { error: itemsError } = await supabase
      .from("supplier_b2b_order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Error creating order items:", itemsError);
      // Rollback order
      await supabase.from("supplier_b2b_orders").delete().eq("id", order.id);
      return new Response(JSON.stringify({ error: "Failed to create order items" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Order items created");

    // Generate email HTML
    const itemsHtml = items.map((item) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.article_name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity} ${item.unit}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">€${item.unit_price.toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">€${(item.quantity * item.unit_price).toFixed(2)}</td>
      </tr>
    `).join("");

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8B5CF6, #A855F7); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .footer { background: #1f2937; color: #9ca3af; padding: 15px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th { background: #f3f4f6; padding: 10px; text-align: left; }
          .total { font-size: 18px; font-weight: bold; color: #8B5CF6; }
          .test-notice { background: #fef3c7; border: 1px solid #f59e0b; padding: 10px; border-radius: 4px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">📦 Neue B2B-Bestellung</h1>
            <p style="margin: 5px 0 0 0;">Bestellnummer: ${order_number}</p>
          </div>
          <div class="content">
            <h2>Kundeninformationen</h2>
            <p><strong>Firma:</strong> ${customer.company_name}</p>
            <p><strong>Ansprechpartner:</strong> ${customer.contact_person || "-"}</p>
            <p><strong>E-Mail:</strong> ${customer.email}</p>
            ${delivery_address ? `<p><strong>Lieferadresse:</strong> ${delivery_address}</p>` : ""}
            ${delivery_date ? `<p><strong>Gewünschtes Lieferdatum:</strong> ${delivery_date}</p>` : ""}
            ${notes ? `<p><strong>Notizen:</strong> ${notes}</p>` : ""}
            
            <h2>Bestellte Artikel</h2>
            <table>
              <thead>
                <tr>
                  <th>Artikel</th>
                  <th style="text-align: center;">Menge</th>
                  <th style="text-align: right;">Einzelpreis</th>
                  <th style="text-align: right;">Gesamt</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="padding: 10px; text-align: right;"><strong>Gesamtsumme:</strong></td>
                  <td style="padding: 10px; text-align: right;" class="total">€${total_amount.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
            
            <div class="test-notice">
              <strong>🧪 TEST-MODUS:</strong> Diese E-Mail wurde an die Test-Adresse gesendet.<br>
              Im Produktivbetrieb würde diese E-Mail an den Lieferanten (${supplierAccount.email}) gehen.
            </div>
          </div>
          <div class="footer">
            B2B-Portal von ${supplierAccount.company_name}<br>
            Powered by Bestellung.pro
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email to TEST address only
    const TEST_EMAIL = "frank.schumann@me.com";
    
    try {
      const emailResponse = await resend.emails.send({
        from: "B2B Portal <onboarding@resend.dev>",
        to: [TEST_EMAIL],
        subject: `[TEST] Neue B2B-Bestellung ${order_number} von ${customer.company_name}`,
        html: emailHtml,
      });

      console.log("Email sent successfully:", emailResponse);

      // Update order with email_sent status
      await supabase
        .from("supplier_b2b_orders")
        .update({ email_sent: true, email_sent_at: new Date().toISOString() })
        .eq("id", order.id);

    } catch (emailError) {
      console.error("Error sending email:", emailError);
      // Don't fail the order if email fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        order_id: order.id,
        order_number,
        total_amount,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: unknown) {
    console.error("Error in submit-b2b-order:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
