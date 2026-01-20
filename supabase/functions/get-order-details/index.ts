import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";

// Type definitions for Supabase relations
interface OrderItem {
  article_name: string;
  quantity: number;
  unit: string | null;
  unit_price: number;
  total_price: number;
  article_id: string | null;
}

interface SupplierData {
  name: string;
}

interface ArticleData {
  id: string;
  reference_price: number | null;
  reference_unit: string | null;
  order_unit_id: string | null;
}

interface OrderUnitData {
  id: string;
  name: string;
  quantity: number;
}

serve(async (req) => {
  console.log("=== GET-ORDER-DETAILS START ===");
  console.log("Request URL:", req.url);
  console.log("Request method:", req.method);

  // Handle CORS preflight
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const url = new URL(req.url);
    const orderId = url.searchParams.get("orderId");
    const confirmToken = url.searchParams.get("token");

    console.log("Order ID from params:", orderId);
    console.log("Token provided:", !!confirmToken);

    if (!orderId) {
      console.error("No orderId provided");
      return errorResponse("Order ID required", 400);
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
        return errorResponse("Invalid confirmation token", 403);
      }

      // Check if token is expired
      if (new Date(tokenData.expires_at) < new Date()) {
        console.error("Token expired");
        return errorResponse("Confirmation token has expired", 403);
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
      return errorResponse("Failed to fetch order", 500);
    }

    if (!order) {
      console.error("Order not found or not confirmed");
      return errorResponse("Order not found or not confirmed", 404);
    }

    console.log("Order found:", order.order_number);
    const orderItems = (order.order_items || []) as OrderItem[];
    console.log("Order items count:", orderItems.length);

    // Fetch reference prices and order units from articles
    const articleIds = orderItems.map((item) => item.article_id).filter((id): id is string => id !== null);
    const articleDataMap = new Map<string, { reference_price: number | null; reference_unit: string | null; order_unit_id: string | null }>();
    
    if (articleIds.length > 0) {
      const { data: articles } = await supabase
        .from("articles")
        .select("id, reference_price, reference_unit, order_unit_id")
        .in("id", articleIds);
      
      const typedArticles = (articles || []) as ArticleData[];
      typedArticles.forEach((a) => {
        articleDataMap.set(a.id, { 
          reference_price: a.reference_price, 
          reference_unit: a.reference_unit,
          order_unit_id: a.order_unit_id
        });
      });
    }

    // Fetch order units to resolve order_unit_id to display format
    const orderUnitIds = Array.from(articleDataMap.values())
      .map(a => a.order_unit_id)
      .filter((id): id is string => id !== null);
    
    const orderUnitsMap = new Map<string, { name: string; quantity: number }>();
    if (orderUnitIds.length > 0) {
      const { data: orderUnits } = await supabase
        .from("order_units")
        .select("id, name, quantity")
        .in("id", orderUnitIds);
      
      const typedOrderUnits = (orderUnits || []) as OrderUnitData[];
      typedOrderUnits.forEach((ou) => {
        orderUnitsMap.set(ou.id, { name: ou.name, quantity: ou.quantity });
      });
    }

    // Format the response - handle suppliers as relation
    const supplierData = order.suppliers as unknown as SupplierData | null;
    const itemsWithRefPrices = orderItems.map((item) => {
      const artData = item.article_id ? articleDataMap.get(item.article_id) : null;
      const defaultArtData = { reference_price: null, reference_unit: null, order_unit_id: null };
      const finalArtData = artData || defaultArtData;
      const orderUnit = finalArtData.order_unit_id ? orderUnitsMap.get(finalArtData.order_unit_id) : null;
      return {
        article_name: item.article_name,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        total_price: item.total_price,
        reference_price: finalArtData.reference_price,
        reference_unit: finalArtData.reference_unit,
        order_unit: orderUnit ? `${orderUnit.quantity}× ${orderUnit.name}` : null,
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

    return jsonResponse(response);

  } catch (error) {
    console.error("Unhandled error:", error);
    return errorResponse("Internal server error", 500);
  }
});
