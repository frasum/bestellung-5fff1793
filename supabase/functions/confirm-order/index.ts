import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response(generateErrorHtml("Kein Bestätigungstoken angegeben."), {
        status: 400,
        headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
      });
    }

    console.log(`Processing confirmation for token: ${token.substring(0, 10)}...`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Find the token
    const { data: tokenData, error: tokenError } = await supabase
      .from("order_confirmation_tokens")
      .select("*, orders(id, order_number, status, suppliers(name))")
      .eq("token", token)
      .single();

    if (tokenError || !tokenData) {
      console.error("Token not found:", tokenError);
      return new Response(generateErrorHtml("Ungültiger oder nicht gefundener Bestätigungstoken."), {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
      });
    }

    // Check if already confirmed
    if (tokenData.confirmed_at) {
      console.log("Token already used");
      return new Response(generateAlreadyConfirmedHtml(tokenData.orders?.order_number || ""), {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
      });
    }

    // Check if expired
    if (new Date(tokenData.expires_at) < new Date()) {
      console.log("Token expired");
      return new Response(generateErrorHtml("Dieser Bestätigungslink ist abgelaufen. Bitte kontaktieren Sie den Besteller."), {
        status: 410,
        headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
      });
    }

    // Update order status to confirmed
    const { error: updateOrderError } = await supabase
      .from("orders")
      .update({ status: "confirmed" })
      .eq("id", tokenData.order_id);

    if (updateOrderError) {
      console.error("Error updating order:", updateOrderError);
      return new Response(generateErrorHtml("Fehler beim Aktualisieren der Bestellung."), {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
      });
    }

    // Mark token as used
    const { error: updateTokenError } = await supabase
      .from("order_confirmation_tokens")
      .update({ confirmed_at: new Date().toISOString() })
      .eq("id", tokenData.id);

    if (updateTokenError) {
      console.error("Error updating token:", updateTokenError);
    }

    console.log(`Order ${tokenData.orders?.order_number} confirmed successfully`);

    return new Response(
      generateSuccessHtml(
        tokenData.orders?.order_number || "",
        tokenData.orders?.suppliers?.name || "Lieferant"
      ),
      {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in confirm-order function:", error);
    return new Response(generateErrorHtml("Ein unerwarteter Fehler ist aufgetreten."), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
    });
  }
});
