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
  name: "create_order",
  title: "Create order",
  description:
    "Create a new order for a supplier with one or more line items. Prices, units and totals are looked up from the article records — never trusted from the caller. Runs as the signed-in user; RLS enforces that the supplier and articles belong to the user's organization. If no delivery_address is provided, the organization's default location address is used.",
  inputSchema: {
    supplier_id: z.string().uuid().describe("Supplier UUID the order is placed with."),
    items: z
      .array(
        z.object({
          article_id: z.string().uuid().describe("Article UUID."),
          quantity: z.number().int().positive().describe("Quantity of packaging units to order."),
        }),
      )
      .min(1)
      .describe("Line items. At least one required."),
    location_id: z
      .string()
      .uuid()
      .optional()
      .describe("Optional location UUID this order is booked against."),
    delivery_address: z
      .string()
      .optional()
      .describe("Delivery address. Defaults to the organization's default location address."),
    notes: z.string().optional().describe("Optional free-text note attached to the order."),
    is_test_order: z
      .boolean()
      .optional()
      .describe("Mark as test order (safely deletable by admins/managers). Defaults to false."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (
    { supplier_id, items, location_id, delivery_address, notes, is_test_order },
    ctx,
  ) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }

    const supabase = supabaseForUser(ctx);
    const userId = ctx.getUserId();

    // Resolve organization from the caller's profile (RLS-scoped).
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", userId)
      .single();
    if (profileError) {
      return { content: [{ type: "text", text: profileError.message }], isError: true };
    }
    const organizationId = profile?.organization_id as string | null;
    if (!organizationId) {
      return { content: [{ type: "text", text: "No organization for user" }], isError: true };
    }

    // Resolve delivery address if not supplied.
    let resolvedAddress = delivery_address?.trim();
    if (!resolvedAddress) {
      const defaultLocationQuery = supabase
        .from("locations")
        .select("id, address, name, is_default")
        .eq("organization_id", organizationId);
      const { data: locations, error: locError } = location_id
        ? await defaultLocationQuery.eq("id", location_id).limit(1)
        : await defaultLocationQuery.eq("is_default", true).limit(1);
      if (locError) {
        return { content: [{ type: "text", text: locError.message }], isError: true };
      }
      const loc = locations?.[0] as { address?: string | null; name?: string | null } | undefined;
      resolvedAddress = (loc?.address ?? loc?.name ?? "").trim();
    }
    if (!resolvedAddress) {
      return {
        content: [
          {
            type: "text",
            text: "delivery_address is required (no default location address available).",
          },
        ],
        isError: true,
      };
    }

    // Load articles — RLS ensures only articles in the caller's org are visible,
    // and the supplier match guards against cross-supplier line items.
    const articleIds = Array.from(new Set(items.map((i) => i.article_id)));
    const { data: articles, error: articlesError } = await supabase
      .from("articles")
      .select("id, name, price, unit, packaging_unit, order_unit_id, supplier_id, is_active")
      .in("id", articleIds);
    if (articlesError) {
      return { content: [{ type: "text", text: articlesError.message }], isError: true };
    }
    type ArticleRow = {
      id: string;
      name: string;
      price: number | string;
      unit: string;
      packaging_unit: number | string | null;
      order_unit_id: string | null;
      supplier_id: string;
      is_active: boolean | null;
    };
    const articleMap = new Map<string, ArticleRow>();
    for (const a of (articles ?? []) as ArticleRow[]) articleMap.set(a.id, a);

    for (const id of articleIds) {
      const a = articleMap.get(id);
      if (!a) {
        return {
          content: [{ type: "text", text: `Article ${id} not found or not accessible.` }],
          isError: true,
        };
      }
      if (a.supplier_id !== supplier_id) {
        return {
          content: [
            {
              type: "text",
              text: `Article ${id} does not belong to supplier ${supplier_id}.`,
            },
          ],
          isError: true,
        };
      }
      if (a.is_active === false) {
        return {
          content: [{ type: "text", text: `Article ${id} is inactive.` }],
          isError: true,
        };
      }
    }

    // Optional: resolve order_unit labels for line items.
    const orderUnitIds = Array.from(
      new Set(
        (articles ?? [])
          .map((a) => (a as ArticleRow).order_unit_id)
          .filter((v): v is string => Boolean(v)),
      ),
    );
    const orderUnitNameById = new Map<string, string>();
    if (orderUnitIds.length > 0) {
      const { data: units } = await supabase
        .from("order_units")
        .select("id, name")
        .in("id", orderUnitIds);
      for (const u of (units ?? []) as { id: string; name: string }[]) {
        orderUnitNameById.set(u.id, u.name);
      }
    }

    // Generate order number via the same RPC the UI uses.
    const { data: orderNumber, error: orderNumberError } = await supabase.rpc(
      "generate_order_number",
    );
    if (orderNumberError) {
      return { content: [{ type: "text", text: orderNumberError.message }], isError: true };
    }

    // Compute totals server-side.
    const lineTotals = items.map(({ article_id, quantity }) => {
      const a = articleMap.get(article_id)!;
      const price = Number(a.price);
      const pack = Number(a.packaging_unit ?? 1) || 1;
      return {
        article: a,
        quantity,
        unit_price: price,
        total_price: price * pack * quantity,
      };
    });
    const totalAmount = lineTotals.reduce((sum, l) => sum + l.total_price, 0);

    // Insert the order.
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        organization_id: organizationId,
        supplier_id,
        user_id: userId,
        location_id: location_id ?? null,
        total_amount: totalAmount,
        delivery_address: resolvedAddress,
        notes: notes ?? null,
        is_test_order: is_test_order ?? false,
      })
      .select("id, order_number, status, total_amount, created_at")
      .single();
    if (orderError) {
      return { content: [{ type: "text", text: orderError.message }], isError: true };
    }

    // Insert order items.
    const orderItemsPayload = lineTotals.map(({ article, quantity, unit_price, total_price }) => ({
      order_id: order.id,
      article_id: article.id,
      article_name: article.name,
      quantity,
      unit: article.unit,
      order_unit: article.order_unit_id
        ? orderUnitNameById.get(article.order_unit_id) ?? null
        : null,
      unit_price,
      total_price,
      is_free_text_item: false,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItemsPayload);
    if (itemsError) {
      // Best-effort cleanup so no order sits without its items.
      await supabase.from("orders").delete().eq("id", order.id);
      return { content: [{ type: "text", text: itemsError.message }], isError: true };
    }

    const result = {
      id: order.id,
      order_number: order.order_number,
      status: order.status,
      total_amount: order.total_amount,
      created_at: order.created_at,
      item_count: orderItemsPayload.length,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
      structuredContent: { order: result },
    };
  },
});
