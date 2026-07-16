import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

export default defineTool({
  name: "get_order",
  title: "Get order details",
  description:
    "Fetch a single order (with its line items) by order id or order_number, scoped to the signed-in user's organization.",
  inputSchema: {
    order_id: z.string().optional().describe("Order UUID."),
    order_number: z.string().optional().describe("Human-readable order number (e.g. ORD-2026-01-0001)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ order_id, order_number }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    if (!order_id && !order_number) {
      return {
        content: [{ type: "text", text: "Provide order_id or order_number." }],
        isError: true,
      };
    }
    const sb = supabaseForUser(ctx);
    let query = sb
      .from("orders")
      .select(
        "id, order_number, supplier_id, status, total_amount, notes, created_at, updated_at, order_items(id, article_id, article_name, quantity, unit_price, total_price, unit)",
      )
      .limit(1);
    if (order_id) query = query.eq("id", order_id);
    else if (order_number) query = query.eq("order_number", order_number);
    const { data, error } = await query.maybeSingle();
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    if (!data) {
      return { content: [{ type: "text", text: "Order not found." }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { order: data },
    };
  },
});
