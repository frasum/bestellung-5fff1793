import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to create HTML responses with proper headers
const createHtmlResponse = (html: string, status: number = 200): Response => {
  const headers = new Headers();
  headers.set("Content-Type", "text/html; charset=utf-8");
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Headers", "authorization, x-client-info, apikey, content-type");
  headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
  
  return new Response(html, { status, headers });
};

interface OrderItem {
  article_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
}

const generateConfirmationNotificationHtml = (
  orderNumber: string,
  supplierName: string,
  confirmedAt: string,
  items: OrderItem[],
  totalAmount: number
): string => {
  const itemRows = items.map((item, index) => {
    const bgColor = index % 2 === 0 ? '#ffffff' : '#f9fafb';
    return `
      <tr style="background: ${bgColor};">
        <td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #1f2937;">${item.article_name}</td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb; text-align: center; font-weight: 600; color: #1e40af;">${item.quantity} ${item.unit}</td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #6b7280;">€${item.unit_price.toFixed(2)}</td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #1f2937;">€${item.total_price.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Bestellung bestätigt</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 650px; margin: 0 auto; padding: 20px; background: #f3f4f6;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px; border-radius: 16px 16px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">✅ Bestellung bestätigt!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">${orderNumber}</p>
        </div>
        
        <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; margin-bottom: 24px;">
            Gute Nachrichten! <strong>${supplierName}</strong> hat Ihre Bestellung bestätigt.
          </p>
          
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <table style="width: 100%; font-size: 14px;">
              <tr>
                <td style="padding: 6px 0; color: #6b7280;">Lieferant:</td>
                <td style="padding: 6px 0; color: #1f2937; font-weight: 600;">${supplierName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280;">Bestätigt am:</td>
                <td style="padding: 6px 0; color: #1f2937; font-weight: 600;">${confirmedAt}</td>
              </tr>
            </table>
          </div>

          <!-- Order Items Table -->
          <div style="margin-bottom: 24px;">
            <h2 style="color: #1f2937; font-size: 14px; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">🛒 Bestellte Artikel</h2>
            <table style="width: 100%; border-collapse: collapse; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <thead>
                <tr style="background: #1e3a5f;">
                  <th style="padding: 12px 10px; text-align: left; font-weight: 600; color: white; font-size: 12px;">Artikel</th>
                  <th style="padding: 12px 10px; text-align: center; font-weight: 600; color: white; font-size: 12px;">Menge</th>
                  <th style="padding: 12px 10px; text-align: right; font-weight: 600; color: white; font-size: 12px;">Stückpreis</th>
                  <th style="padding: 12px 10px; text-align: right; font-weight: 600; color: white; font-size: 12px;">Gesamt</th>
                </tr>
              </thead>
              <tbody>
                ${itemRows}
              </tbody>
              <tfoot>
                <tr style="background: linear-gradient(135deg, #059669 0%, #10b981 100%);">
                  <td colspan="3" style="padding: 14px 10px; color: white; font-weight: 700; font-size: 14px;">Gesamtbetrag</td>
                  <td style="padding: 14px 10px; text-align: right; color: white; font-weight: 800; font-size: 16px;">€${totalAmount.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            Der Lieferant wird Ihre Bestellung nun bearbeiten. Sie können den Status jederzeit in OrderFox.pro einsehen.
          </p>
          
          <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e5e7eb; margin-top: 24px;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              Diese Benachrichtigung wurde automatisch von OrderFox.pro versendet.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
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
    const { error } = await resend.emails.send({
      from: "OrderFox.pro <onboarding@resend.dev>",
      to: [recipientEmail],
      subject: `✅ Bestellung ${orderNumber} wurde von ${supplierName} bestätigt`,
      html: generateConfirmationNotificationHtml(orderNumber, supplierName, confirmedAt, items, totalAmount),
    });

    if (error) {
      console.error("Failed to send confirmation notification:", error);
    } else {
      console.log(`Confirmation notification sent to ${recipientEmail}`);
    }
  } catch (err) {
    console.error("Error sending confirmation notification:", err);
  }
}

const generateSuccessHtml = (orderNumber: string, supplierName: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="de">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Bestellung bestätigt - OrderFox.pro</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container {
            background: white;
            border-radius: 24px;
            padding: 48px;
            max-width: 500px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
          }
          .icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            font-size: 40px;
          }
          h1 {
            color: #1f2937;
            font-size: 28px;
            margin-bottom: 16px;
          }
          .order-info {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 12px;
            padding: 16px;
            margin: 24px 0;
          }
          .order-number {
            font-size: 14px;
            color: #6b7280;
          }
          .order-value {
            font-size: 20px;
            font-weight: 700;
            color: #059669;
          }
          p {
            color: #6b7280;
            line-height: 1.6;
            margin-bottom: 16px;
          }
          .footer {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
            color: #9ca3af;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">✓</div>
          <h1>Bestellung bestätigt!</h1>
          <p>Vielen Dank, ${supplierName}! Sie haben die Bestellung erfolgreich bestätigt.</p>
          <div class="order-info">
            <div class="order-number">Bestellnummer</div>
            <div class="order-value">${orderNumber}</div>
          </div>
          <p>Der Kunde wurde über Ihre Bestätigung informiert. Bitte bearbeiten Sie die Bestellung entsprechend.</p>
          <div class="footer">
            Powered by OrderFox.pro
          </div>
        </div>
      </body>
    </html>
  `;
};

const generateErrorHtml = (message: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="de">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Fehler - OrderFox.pro</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container {
            background: white;
            border-radius: 24px;
            padding: 48px;
            max-width: 500px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
          }
          .icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            font-size: 40px;
          }
          h1 {
            color: #1f2937;
            font-size: 28px;
            margin-bottom: 16px;
          }
          .error-box {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 12px;
            padding: 16px;
            margin: 24px 0;
            color: #dc2626;
          }
          p {
            color: #6b7280;
            line-height: 1.6;
          }
          .footer {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
            color: #9ca3af;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">✕</div>
          <h1>Bestätigung fehlgeschlagen</h1>
          <div class="error-box">${message}</div>
          <p>Bitte kontaktieren Sie den Besteller für weitere Informationen.</p>
          <div class="footer">
            Powered by OrderFox.pro
          </div>
        </div>
      </body>
    </html>
  `;
};

const generateAlreadyConfirmedHtml = (orderNumber: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="de">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Bereits bestätigt - OrderFox.pro</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container {
            background: white;
            border-radius: 24px;
            padding: 48px;
            max-width: 500px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
          }
          .icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            font-size: 40px;
          }
          h1 {
            color: #1f2937;
            font-size: 28px;
            margin-bottom: 16px;
          }
          .info-box {
            background: #fffbeb;
            border: 1px solid #fde68a;
            border-radius: 12px;
            padding: 16px;
            margin: 24px 0;
          }
          .order-number {
            font-size: 14px;
            color: #6b7280;
          }
          .order-value {
            font-size: 20px;
            font-weight: 700;
            color: #d97706;
          }
          p {
            color: #6b7280;
            line-height: 1.6;
          }
          .footer {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
            color: #9ca3af;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">ℹ</div>
          <h1>Bereits bestätigt</h1>
          <p>Diese Bestellung wurde bereits bestätigt.</p>
          <div class="info-box">
            <div class="order-number">Bestellnummer</div>
            <div class="order-value">${orderNumber}</div>
          </div>
          <p>Es ist keine weitere Aktion erforderlich.</p>
          <div class="footer">
            Powered by OrderFox.pro
          </div>
        </div>
      </body>
    </html>
  `;
};

serve(async (req) => {
  console.log("=== CONFIRM-ORDER DEBUG START ===");
  console.log("Request method:", req.method);
  console.log("Request URL:", req.url);
  console.log("Request headers:", JSON.stringify(Object.fromEntries(req.headers.entries())));

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    console.log("Parsed URL:", url.toString());
    console.log("Token from query params:", token ? `${token.substring(0, 10)}... (length: ${token.length})` : "NULL");

    if (!token) {
      console.log("ERROR: No token provided");
      const response = createHtmlResponse(generateErrorHtml("Kein Bestätigungstoken angegeben."), 400);
      console.log("Response status:", response.status);
      console.log("Response headers:", JSON.stringify(Object.fromEntries(response.headers.entries())));
      return response;
    }

    console.log(`Processing confirmation for token: ${token.substring(0, 10)}...`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    console.log("SUPABASE_URL configured:", supabaseUrl ? "YES" : "NO");
    console.log("SERVICE_ROLE_KEY configured:", serviceRoleKey ? "YES (length: " + serviceRoleKey.length + ")" : "NO");

    const supabase = createClient(
      supabaseUrl ?? "",
      serviceRoleKey ?? ""
    );

    // Find the token with order, user details and order items
    console.log("Querying order_confirmation_tokens table for token...");
    const { data: tokenData, error: tokenError } = await supabase
      .from("order_confirmation_tokens")
      .select("*, orders(id, order_number, status, user_id, total_amount, suppliers(name), order_items(article_name, quantity, unit, unit_price, total_price))")
      .eq("token", token)
      .single();

    console.log("Token query result - data:", tokenData ? "FOUND" : "NULL");
    console.log("Token query result - error:", tokenError ? JSON.stringify(tokenError) : "NONE");

    if (tokenError || !tokenData) {
      console.error("Token not found:", tokenError);
      const response = createHtmlResponse(generateErrorHtml("Ungültiger oder nicht gefundener Bestätigungstoken."), 404);
      console.log("Returning 404 response");
      console.log("Response Content-Type:", response.headers.get("Content-Type"));
      return response;
    }

    console.log("Token found! Order ID:", tokenData.order_id);
    console.log("Token expires_at:", tokenData.expires_at);
    console.log("Token confirmed_at:", tokenData.confirmed_at);

    // Check if already confirmed
    if (tokenData.confirmed_at) {
      console.log("Token already used at:", tokenData.confirmed_at);
      const response = createHtmlResponse(generateAlreadyConfirmedHtml(tokenData.orders?.order_number || ""));
      console.log("Response Content-Type:", response.headers.get("Content-Type"));
      return response;
    }

    // Check if expired
    const expiresAt = new Date(tokenData.expires_at);
    const now = new Date();
    console.log("Token expires at:", expiresAt.toISOString());
    console.log("Current time:", now.toISOString());
    console.log("Token expired?", expiresAt < now);

    if (expiresAt < now) {
      console.log("Token expired");
      const response = createHtmlResponse(generateErrorHtml("Dieser Bestätigungslink ist abgelaufen. Bitte kontaktieren Sie den Besteller."), 410);
      console.log("Response Content-Type:", response.headers.get("Content-Type"));
      return response;
    }

    // Update order status to confirmed
    console.log("Updating order status to 'confirmed'...");
    const { error: updateOrderError } = await supabase
      .from("orders")
      .update({ status: "confirmed" })
      .eq("id", tokenData.order_id);

    if (updateOrderError) {
      console.error("Error updating order:", updateOrderError);
      const response = createHtmlResponse(generateErrorHtml("Fehler beim Aktualisieren der Bestellung."), 500);
      console.log("Response Content-Type:", response.headers.get("Content-Type"));
      return response;
    }
    console.log("Order status updated successfully");

    // Mark token as used
    console.log("Marking token as used...");
    const { error: updateTokenError } = await supabase
      .from("order_confirmation_tokens")
      .update({ confirmed_at: new Date().toISOString() })
      .eq("id", tokenData.id);

    if (updateTokenError) {
      console.error("Error updating token:", updateTokenError);
    } else {
      console.log("Token marked as used");
    }

    console.log(`Order ${tokenData.orders?.order_number} confirmed successfully`);

    // Send notification to the order creator (restaurant)
    if (tokenData.orders?.user_id) {
      console.log("Fetching order creator profile for notification...");
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", tokenData.orders.user_id)
        .single();

      if (profile?.email) {
        console.log("Sending confirmation notification to:", profile.email);
        const orderItems = tokenData.orders.order_items || [];
        const totalAmount = Number(tokenData.orders.total_amount) || 0;
        
        // Send email notification (don't await to not block response)
        sendConfirmationNotification(
          profile.email,
          tokenData.orders.order_number || "",
          tokenData.orders.suppliers?.name || "Lieferant",
          orderItems,
          totalAmount
        );
      } else {
        console.log("No email found for order creator");
      }
    }

    console.log("=== RETURNING SUCCESS HTML ===");
    const successResponse = createHtmlResponse(
      generateSuccessHtml(
        tokenData.orders?.order_number || "",
        tokenData.orders?.suppliers?.name || "Lieferant"
      )
    );
    console.log("Success response status:", successResponse.status);
    console.log("Success response Content-Type:", successResponse.headers.get("Content-Type"));
    console.log("Success response headers:", JSON.stringify(Object.fromEntries(successResponse.headers.entries())));
    console.log("=== CONFIRM-ORDER DEBUG END ===");
    return successResponse;

  } catch (error: any) {
    console.error("=== UNHANDLED ERROR ===");
    console.error("Error type:", error?.constructor?.name);
    console.error("Error message:", error?.message);
    console.error("Error stack:", error?.stack);
    const errorResponse = createHtmlResponse(generateErrorHtml("Ein unerwarteter Fehler ist aufgetreten."), 500);
    console.log("Error response Content-Type:", errorResponse.headers.get("Content-Type"));
    console.log("=== CONFIRM-ORDER DEBUG END ===");
    return errorResponse;
  }
});
