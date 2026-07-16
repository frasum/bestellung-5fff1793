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
  name: "list_suppliers",
  title: "List suppliers",
  description:
    "List active suppliers in the signed-in user's organization. Returns id, name, email, phone, and contact_person.",
  inputSchema: {
    limit: z
      .number()
      .int()
      .optional()
      .describe("Max number of suppliers to return. Defaults to 50."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const capped = Math.min(Math.max(limit ?? 50, 1), 200);
    const { data, error } = await supabaseForUser(ctx)
      .from("suppliers")
      .select("id, name, email, phone, contact_person, is_active")
      .eq("is_active", true)
      .order("name", { ascending: true })
      .limit(capped);
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { suppliers: data ?? [] },
    };
  },
});
