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
  name: "search_articles",
  title: "Search articles",
  description:
    "Search articles in the signed-in user's organization by name (case-insensitive). Optionally filter by supplier_id.",
  inputSchema: {
    query: z.string().describe("Substring to match against the article name."),
    supplier_id: z.string().optional().describe("Optional supplier UUID filter."),
    limit: z.number().int().optional().describe("Max results. Defaults to 25."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, supplier_id, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const capped = Math.min(Math.max(limit ?? 25, 1), 100);
    let q = supabaseForUser(ctx)
      .from("articles")
      .select("id, name, sku, unit, price, packaging_unit, category, top_category, supplier_id, is_active")
      .eq("is_active", true)
      .ilike("name", `%${query}%`)
      .order("name", { ascending: true })
      .limit(capped);
    if (supplier_id) q = q.eq("supplier_id", supplier_id);
    const { data, error } = await q;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { articles: data ?? [] },
    };
  },
});
