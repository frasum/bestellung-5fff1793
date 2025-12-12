import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

serve(async (req) => {
  console.log("=== GET-ORDER-DETAILS START ===");
  console.log("Request URL:", req.url);
  console.log("Request method:", req.method);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const orderId = url.searchParams.get("orderId");
    const confirmToken = url.searchParams.get("token");

    console.log("Order ID from params:", orderId);
    console.log("Token provided:", !!confirmToken);

    if (!orderId) {
      console.error("No orderId provided");
      return new Response(
        JSON.stringify({ error: "Order ID required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // If token is provided, validate it first
    if (confirmToken) {
      console.log("Validating confirmation token...");
      const { data: tokenData, error: tokenError } = await supabase
        .from("order_confirmation_tokens")
        .select("id, order_id, expires_at, confirmed_at")
        .eq("token", confirmToken)
        .eq("order_id", orderId)
        .maybeSingle();

      if (tokenError || !tokenData) {
        console.error("Invalid or missing token:", tokenError);
        return new Response(
          JSON.stringify({ error: "Invalid confirmation token" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if token is expired
      if (new Date(tokenData.expires_at) < new Date()) {
        console.error("Token expired");
        return new Response(
          JSON.stringify({ error: "Confirmation token has expired" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Token validated successfully");
    }

    console.log("Fetching order from database...");

    // Fetch order with details - only return confirmed orders for security
    const { data: order, error } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        status,
        delivery_address,
        notes,
        total_amount,
        created_at,
        suppliers(name),
        order_items(article_name, quantity, unit, unit_price, total_price, article_id)
      `)
      .eq("id", orderId)
      .eq("status", "confirmed")
      .maybeSingle();

    if (error) {
      console.error("Error fetching order:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!order) {
      console.error("Order not found or not confirmed");
      return new Response(
        JSON.stringify({ error: "Order not found or not confirmed" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Order found:", order.order_number);
    console.log("Order items count:", order.order_items?.length || 0);

    // Fetch reference prices from articles
    const articleIds = (order.order_items || []).map((item: any) => item.article_id).filter(Boolean);
    let articleRefPrices = new Map<string, { reference_price: number | null; reference_unit: string | null }>();
    
    if (articleIds.length > 0) {
      const { data: articles } = await supabase
        .from("articles")
        .select("id, reference_price, reference_unit")
        .in("id", articleIds);
      
      articles?.forEach((a: any) => {
        articleRefPrices.set(a.id, { reference_price: a.reference_price, reference_unit: a.reference_unit });
      });
    }

    // Format the response - handle suppliers as relation
    const supplierData = order.suppliers as unknown as { name: string } | null;
    const itemsWithRefPrices = (order.order_items || []).map((item: any) => {
      const refData = articleRefPrices.get(item.article_id) || { reference_price: null, reference_unit: null };
      return {
        article_name: item.article_name,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        total_price: item.total_price,
        reference_price: refData.reference_price,
        reference_unit: refData.reference_unit,
      };
    });

    const response = {
      orderNumber: order.order_number,
      supplierName: supplierData?.name || "",
      deliveryAddress: order.delivery_address,
      notes: order.notes,
      totalAmount: order.total_amount,
      confirmedAt: new Date().toISOString(),
      items: itemsWithRefPrices,
    };

    console.log("Returning response with", response.items.length, "items");
    console.log("=== GET-ORDER-DETAILS SUCCESS ===");

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unhandled error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
