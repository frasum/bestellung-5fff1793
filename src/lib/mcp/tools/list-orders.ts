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
  name: "list_orders",
  title: "List recent orders",
  description:
    "List recent orders for the signed-in user's organization, newest first. Optionally filter by status.",
  inputSchema: {
    limit: z.number().int().optional().describe("Max orders to return. Defaults to 20."),
    status: z
      .string()
      .optional()
      .describe("Optional status filter (e.g. pending, confirmed, delivered, cancelled)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, status }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const capped = Math.min(Math.max(limit ?? 20, 1), 100);
    let query = supabaseForUser(ctx)
      .from("orders")
      .select("id, order_number, supplier_id, status, total_amount, notes, created_at")
      .order("created_at", { ascending: false })
      .limit(capped);
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { orders: data ?? [] },
    };
  },
});
