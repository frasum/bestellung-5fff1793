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

// Helper to send email via SMTP
async function sendEmailViaSMTP(options: {
  to: string[];
  subject: string;
  html: string;
}): Promise<void> {
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
  } catch (error: unknown) {
    console.error("SMTP send error:", error instanceof Error ? error.message : error);
    try { await client.close(); } catch {}
    throw error;
  }
}

// App URL for redirects
const APP_URL = Deno.env.get('APP_URL') || 'https://bestellung.pro';

interface OrderItem {
  article_name: string;
  quantity: number;
  unit: string;
  order_unit?: string | null;
  unit_price: number;
  total_price: number;
}

// Helper function to create redirect response
const createRedirectResponse = (status: string, orderNumber: string = "", supplierName: string = "", orderId: string = ""): Response => {
  const params = new URLSearchParams({ status });
  if (orderNumber) params.set("order", orderNumber);
  if (supplierName) params.set("supplier", supplierName);
  if (orderId) params.set("orderId", orderId);
  
  const redirectUrl = `${APP_URL}/order-confirmed?${params.toString()}`;
  console.log("Redirecting to:", redirectUrl);
  
  return new Response(null, {
    status: 302,
    headers: {
      ...corsHeaders,
      "Location": redirectUrl,
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
};

const generateConfirmationNotificationHtml = (
  orderNumber: string,
  supplierName: string,
  confirmedAt: string,
  items: OrderItem[],
  totalAmount: number
): string => {
  // Generate item rows without whitespace to prevent =20 encoding issues
  const itemRows = items.map((item, index) => {
    const bgColor = index % 2 === 0 ? '#ffffff' : '#f9fafb';
    return `<tr style="background: ${bgColor};"><td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #1f2937;">${item.article_name}</td><td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb; text-align: center; font-weight: 600; color: #1e40af;">${item.quantity}× ${item.order_unit || item.unit}</td><td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #6b7280;">€${item.unit_price.toFixed(2)}</td><td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #1f2937;">€${item.total_price.toFixed(2)}</td></tr>`;
  }).join('');

  // Build HTML and remove all whitespace between tags to prevent =20 encoding
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Bestellung bestätigt</title></head><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 650px; margin: 0 auto; padding: 20px; background: #f3f4f6;"><div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px; border-radius: 16px 16px 0 0;"><h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">✅ Bestellung bestätigt!</h1><p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">${orderNumber}</p></div><div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);"><p style="font-size: 16px; margin-bottom: 24px;">Gute Nachrichten! <strong>${supplierName}</strong> hat Ihre Bestellung bestätigt.</p><div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 24px;"><table style="width: 100%; font-size: 14px;"><tr><td style="padding: 6px 0; color: #6b7280;">Lieferant:</td><td style="padding: 6px 0; color: #1f2937; font-weight: 600;">${supplierName}</td></tr><tr><td style="padding: 6px 0; color: #6b7280;">Bestätigt am:</td><td style="padding: 6px 0; color: #1f2937; font-weight: 600;">${confirmedAt}</td></tr></table></div><div style="margin-bottom: 24px;"><h2 style="color: #1f2937; font-size: 14px; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">🛒 Bestellte Artikel</h2><table style="width: 100%; border-collapse: collapse; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"><thead><tr style="background: #1e3a5f;"><th style="padding: 12px 10px; text-align: left; font-weight: 600; color: white; font-size: 12px;">Artikel</th><th style="padding: 12px 10px; text-align: center; font-weight: 600; color: white; font-size: 12px;">Menge</th><th style="padding: 12px 10px; text-align: right; font-weight: 600; color: white; font-size: 12px;">Stückpreis</th><th style="padding: 12px 10px; text-align: right; font-weight: 600; color: white; font-size: 12px;">Gesamt</th></tr></thead><tbody>${itemRows}</tbody><tfoot><tr style="background: linear-gradient(135deg, #059669 0%, #10b981 100%);"><td colspan="3" style="padding: 14px 10px; color: white; font-weight: 700; font-size: 14px;">Gesamtbetrag</td><td style="padding: 14px 10px; text-align: right; color: white; font-weight: 800; font-size: 16px;">€${totalAmount.toFixed(2)}</td></tr></tfoot></table></div><p style="color: #6b7280; font-size: 14px;">Der Lieferant wird Ihre Bestellung nun bearbeiten. Sie können den Status jederzeit in Bestellung.pro einsehen.</p><div style="text-align: center; padding-top: 24px; border-top: 1px solid #e5e7eb; margin-top: 24px;"><p style="color: #9ca3af; font-size: 12px; margin: 0;">Diese Benachrichtigung wurde automatisch von Bestellung.pro versendet.</p></div></div></body></html>`;

  return html;
};

async function sendConfirmationNotification(
  recipientEmail: string,
  orderNumber: string,
  supplierName: string,
  items: OrderItem[],
  totalAmount: number
): Promise<void> {
  const confirmedAt = new Date().toLocaleDateString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  try {
    await sendEmailViaSMTP({
      to: [recipientEmail],
      subject: `✅ Bestellung ${orderNumber} wurde von ${supplierName} bestätigt`,
      html: generateConfirmationNotificationHtml(orderNumber, supplierName, confirmedAt, items, totalAmount),
    });
    console.log(`Confirmation notification sent to ${recipientEmail} via SMTP`);
  } catch (err) {
    console.error("Error sending confirmation notification:", err);
  }
}

serve(async (req) => {
  console.log("=== CONFIRM-ORDER DEBUG START ===");
  console.log("Request method:", req.method);
  console.log("Request URL:", req.url);

  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    console.log("Token from query params:", token ? `${token.substring(0, 10)}... (length: ${token.length})` : "NULL");

    if (!token) {
      console.log("ERROR: No token provided");
      return createRedirectResponse("error");
    }

    console.log(`Processing confirmation for token: ${token.substring(0, 10)}...`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    console.log("SUPABASE_URL configured:", supabaseUrl ? "YES" : "NO");
    console.log("SERVICE_ROLE_KEY configured:", serviceRoleKey ? "YES" : "NO");

    const supabase = createClient(
      supabaseUrl ?? "",
      serviceRoleKey ?? ""
    );

    console.log("Querying order_confirmation_tokens table for token...");
    const { data: tokenData, error: tokenError } = await supabase
      .from("order_confirmation_tokens")
      .select("*, orders(id, order_number, status, user_id, total_amount, suppliers(name), order_items(article_name, quantity, unit, order_unit, unit_price, total_price))")
      .eq("token", token)
      .single();

    console.log("Token query result - data:", tokenData ? "FOUND" : "NULL");
    console.log("Token query result - error:", tokenError ? JSON.stringify(tokenError) : "NONE");

    if (tokenError || !tokenData) {
      console.error("Token not found:", tokenError);
      return createRedirectResponse("not_found");
    }

    const order = tokenData.orders;
    const orderNumber = order?.order_number || "";
    const supplierName = order?.suppliers?.name || "";
    
    console.log("Token found! Order ID:", tokenData.order_id);
    console.log("Order number:", orderNumber);
    console.log("Supplier:", supplierName);
    console.log("Token expires_at:", tokenData.expires_at);
    console.log("Token confirmed_at:", tokenData.confirmed_at);

    if (tokenData.confirmed_at) {
      console.log("Token already used at:", tokenData.confirmed_at);
      return createRedirectResponse("already_confirmed", orderNumber, supplierName);
    }

    const expiresAt = new Date(tokenData.expires_at);
    const now = new Date();
    console.log("Token expires at:", expiresAt.toISOString());
    console.log("Current time:", now.toISOString());
    console.log("Token expired?", now > expiresAt);
    
    if (now > expiresAt) {
      console.log("Token has expired");
      return createRedirectResponse("expired", orderNumber, supplierName);
    }

    console.log("Updating order status to 'confirmed'...");
    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: "confirmed" })
      .eq("id", tokenData.order_id);

    if (updateError) {
      console.error("Failed to update order:", updateError);
      return createRedirectResponse("error", orderNumber, supplierName);
    }
    console.log("Order status updated successfully");

    console.log("Marking token as used...");
    await supabase
      .from("order_confirmation_tokens")
      .update({ confirmed_at: new Date().toISOString() })
      .eq("id", tokenData.id);
    console.log("Token marked as used");

    const { data: orderForLog } = await supabase
      .from("orders")
      .select("organization_id")
      .eq("id", tokenData.order_id)
      .single();

    if (orderForLog?.organization_id) {
      const { error: updateLogError } = await supabase
        .from("communication_logs")
        .update({ 
          status: 'confirmed',
          confirmed_at: new Date().toISOString()
        })
        .eq("order_id", tokenData.order_id)
        .eq("email_type", "order_sent");

      if (updateLogError) {
        console.error("Error updating communication log:", updateLogError);
      } else {
        console.log("Communication log updated to confirmed");
      }
    }

    console.log(`Order ${orderNumber} confirmed successfully`);

    console.log("Fetching order creator profile for notification...");
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", order.user_id)
      .single();

    if (profile?.email) {
      console.log("Sending confirmation notification to:", profile.email);
      const items = order.order_items || [];
      await sendConfirmationNotification(
        profile.email,
        orderNumber,
        supplierName,
        items,
        order.total_amount
      );

      if (orderForLog?.organization_id) {
        const confirmedAt = new Date().toLocaleDateString('de-DE', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        const notificationHtml = generateConfirmationNotificationHtml(orderNumber, supplierName, confirmedAt, items, order.total_amount);

        const { error: logError } = await supabase
          .from("communication_logs")
          .insert({
            organization_id: orderForLog.organization_id,
            email_type: 'confirmation_notification',
            direction: 'outgoing',
            recipient_email: profile.email,
            subject: `✅ Bestellung ${orderNumber} wurde von ${supplierName} bestätigt`,
            order_id: tokenData.order_id,
            status: 'sent',
            body_html: notificationHtml,
            sender_email: smtpFrom,
          });

        if (logError) {
          console.error("Error logging confirmation notification:", logError);
        }
      }
    }

    console.log("=== CONFIRM-ORDER SUCCESS ===");
    return createRedirectResponse("success", orderNumber, supplierName, tokenData.order_id);

  } catch (error: any) {
    console.error("Unhandled error in confirm-order:", error);
    return createRedirectResponse("error");
  }
});
