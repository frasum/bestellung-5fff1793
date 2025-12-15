import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type DeleteDemoOrganizationBody = {
  organizationId: string;
};

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function requireEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (req.method !== "POST") {
      return jsonResponse(405, { error: "Method not allowed" });
    }

    const supabaseUrl = requireEnv("SUPABASE_URL");
    const supabaseServiceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse(401, { error: "No authorization header" });

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) return jsonResponse(401, { error: "Invalid user" });

    const { organizationId }: DeleteDemoOrganizationBody = await req.json();
    if (!organizationId) return jsonResponse(400, { error: "Missing organizationId" });

    // Safety: only allow deleting demo orgs
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id, is_demo")
      .eq("id", organizationId)
      .maybeSingle();

    if (orgError) throw orgError;
    if (!org) return jsonResponse(404, { error: "Organization not found" });
    if (!org.is_demo) return jsonResponse(403, { error: "Only demo organizations can be deleted" });

    // Authorization: super admin OR admin of that same org
    const { data: isSuperAdmin, error: superErr } = await supabase.rpc("is_super_admin", {
      _user_id: user.id,
    });

    if (superErr) throw superErr;

    let allowed = Boolean(isSuperAdmin);

    if (!allowed) {
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profileErr) throw profileErr;

      const { data: isAdmin, error: roleErr } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });

      if (roleErr) throw roleErr;

      allowed = Boolean(isAdmin) && profile?.organization_id === organizationId;
    }

    if (!allowed) return jsonResponse(403, { error: "Not authorized" });

    const assertOk = (context: string, error: unknown) => {
      if (error) {
        const message = (error as { message?: string })?.message || String(error);
        throw new Error(`${context}: ${message}`);
      }
    };

    // Capture user ids for optional auth user cleanup
    const { data: orgProfiles, error: profilesErr } = await supabase
      .from("profiles")
      .select("id")
      .eq("organization_id", organizationId);

    assertOk("Load profiles", profilesErr);
    const userIds = (orgProfiles || []).map((p) => p.id);

    // 1) Orders
    const { data: orders, error: ordersErr } = await supabase
      .from("orders")
      .select("id")
      .eq("organization_id", organizationId);

    assertOk("Load orders", ordersErr);
    const orderIds = (orders || []).map((o) => o.id);

    if (orderIds.length) {
      assertOk(
        "Delete order_items",
        (await supabase.from("order_items").delete().in("order_id", orderIds)).error,
      );
      assertOk(
        "Delete order_confirmation_tokens",
        (await supabase.from("order_confirmation_tokens").delete().in("order_id", orderIds)).error,
      );
    }

    assertOk(
      "Delete orders",
      (await supabase.from("orders").delete().eq("organization_id", organizationId)).error,
    );

    // 2) Cart drafts
    const { data: drafts, error: draftsErr } = await supabase
      .from("cart_drafts")
      .select("id")
      .eq("organization_id", organizationId);

    assertOk("Load cart drafts", draftsErr);
    const draftIds = (drafts || []).map((d) => d.id);

    if (draftIds.length) {
      assertOk(
        "Delete cart_draft_items",
        (await supabase.from("cart_draft_items").delete().in("draft_id", draftIds)).error,
      );
    }

    assertOk(
      "Delete cart_drafts",
      (await supabase.from("cart_drafts").delete().eq("organization_id", organizationId)).error,
    );

    // 3) Inventory sessions/items
    const { data: sessions, error: sessionsErr } = await supabase
      .from("inventory_sessions")
      .select("id")
      .eq("organization_id", organizationId);

    assertOk("Load inventory sessions", sessionsErr);
    const sessionIds = (sessions || []).map((s) => s.id);

    if (sessionIds.length) {
      assertOk(
        "Delete inventory_items",
        (await supabase.from("inventory_items").delete().in("session_id", sessionIds)).error,
      );
    }

    assertOk(
      "Delete inventory_sessions",
      (await supabase.from("inventory_sessions").delete().eq("organization_id", organizationId)).error,
    );

    // 4) Simple order tokens + join table
    const { data: simpleTokens, error: tokensErr } = await supabase
      .from("simple_order_tokens")
      .select("id")
      .eq("organization_id", organizationId);

    assertOk("Load simple order tokens", tokensErr);
    const tokenIds = (simpleTokens || []).map((t) => t.id);

    if (tokenIds.length) {
      assertOk(
        "Delete simple_order_token_suppliers",
        (await supabase.from("simple_order_token_suppliers").delete().in("token_id", tokenIds)).error,
      );
    }

    assertOk(
      "Delete simple_order_tokens",
      (await supabase.from("simple_order_tokens").delete().eq("organization_id", organizationId)).error,
    );

    // 5) Photo capture tokens
    assertOk(
      "Delete photo_capture_tokens",
      (await supabase.from("photo_capture_tokens").delete().eq("organization_id", organizationId)).error,
    );

    // 6) Supplier-related
    const { data: suppliers, error: suppliersErr } = await supabase
      .from("suppliers")
      .select("id")
      .eq("organization_id", organizationId);

    assertOk("Load suppliers", suppliersErr);
    const supplierIds = (suppliers || []).map((s) => s.id);

    if (supplierIds.length) {
      assertOk(
        "Delete supplier_locations",
        (await supabase.from("supplier_locations").delete().in("supplier_id", supplierIds)).error,
      );
      assertOk(
        "Delete supplier_portal_tokens",
        (await supabase.from("supplier_portal_tokens").delete().in("supplier_id", supplierIds)).error,
      );
      assertOk(
        "Delete supplier_portal_drafts",
        (await supabase.from("supplier_portal_drafts").delete().in("supplier_id", supplierIds)).error,
      );
      assertOk(
        "Delete magic_link_rate_limits",
        (await supabase.from("magic_link_rate_limits").delete().in("supplier_id", supplierIds)).error,
      );
      assertOk(
        "Delete supplier_article_changes",
        (await supabase.from("supplier_article_changes").delete().in("supplier_id", supplierIds)).error,
      );
      assertOk(
        "Delete suggested_articles",
        (await supabase.from("suggested_articles").delete().in("supplier_id", supplierIds)).error,
      );
    }

    // 7) Org-scoped tables
    assertOk(
      "Delete article_price_history",
      (await supabase.from("article_price_history").delete().eq("organization_id", organizationId)).error,
    );
    assertOk(
      "Delete supplier_article_changes (org)",
      (await supabase.from("supplier_article_changes").delete().eq("organization_id", organizationId)).error,
    );
    assertOk(
      "Delete suggested_articles (org)",
      (await supabase.from("suggested_articles").delete().eq("organization_id", organizationId)).error,
    );

    // 8) Articles then suppliers
    assertOk(
      "Delete articles",
      (await supabase.from("articles").delete().eq("organization_id", organizationId)).error,
    );
    assertOk(
      "Delete suppliers",
      (await supabase.from("suppliers").delete().eq("organization_id", organizationId)).error,
    );

    // 9) Categories/Units/Order units
    assertOk(
      "Delete categories",
      (await supabase.from("categories").delete().eq("organization_id", organizationId)).error,
    );
    assertOk(
      "Delete units",
      (await supabase.from("units").delete().eq("organization_id", organizationId)).error,
    );
    assertOk(
      "Delete order_units",
      (await supabase.from("order_units").delete().eq("organization_id", organizationId)).error,
    );

    // 10) Delivery addresses + user preferences
    const { data: addresses, error: addressesErr } = await supabase
      .from("delivery_addresses")
      .select("id")
      .eq("organization_id", organizationId);

    assertOk("Load delivery_addresses", addressesErr);
    const addressIds = (addresses || []).map((a) => a.id);

    if (addressIds.length) {
      assertOk(
        "Delete user_delivery_preferences (by address)",
        (await supabase.from("user_delivery_preferences").delete().in("delivery_address_id", addressIds)).error,
      );
    }

    assertOk(
      "Delete delivery_addresses",
      (await supabase.from("delivery_addresses").delete().eq("organization_id", organizationId)).error,
    );

    // 11) Locations
    assertOk(
      "Delete locations",
      (await supabase.from("locations").delete().eq("organization_id", organizationId)).error,
    );

    // 12) Templates & portal settings
    assertOk(
      "Delete email_templates",
      (await supabase.from("email_templates").delete().eq("organization_id", organizationId)).error,
    );
    assertOk(
      "Delete supplier_portal_settings",
      (await supabase.from("supplier_portal_settings").delete().eq("organization_id", organizationId)).error,
    );

    // 13) Employees
    const { data: employees, error: employeesErr } = await supabase
      .from("employees")
      .select("id")
      .eq("organization_id", organizationId);

    assertOk("Load employees", employeesErr);
    const employeeIds = (employees || []).map((e) => e.id);

    if (employeeIds.length) {
      assertOk(
        "Delete employee_locations",
        (await supabase.from("employee_locations").delete().in("employee_id", employeeIds)).error,
      );
      assertOk(
        "Delete employee_location_suppliers",
        (await supabase.from("employee_location_suppliers").delete().in("employee_id", employeeIds)).error,
      );
      assertOk(
        "Delete employee_article_favorites",
        (await supabase.from("employee_article_favorites").delete().in("employee_id", employeeIds)).error,
      );
    }

    assertOk(
      "Delete employees",
      (await supabase.from("employees").delete().eq("organization_id", organizationId)).error,
    );

    // 14) Invitations
    assertOk(
      "Delete team_invitations",
      (await supabase.from("team_invitations").delete().eq("organization_id", organizationId)).error,
    );

    // 15) User roles + notification preferences + preferences by user
    if (userIds.length) {
      assertOk(
        "Delete user_roles",
        (await supabase.from("user_roles").delete().in("user_id", userIds)).error,
      );
      assertOk(
        "Delete notification_preferences",
        (await supabase.from("notification_preferences").delete().in("user_id", userIds)).error,
      );
      assertOk(
        "Delete user_delivery_preferences (by user)",
        (await supabase.from("user_delivery_preferences").delete().in("user_id", userIds)).error,
      );
    }

    // 16) Profiles
    assertOk(
      "Delete profiles",
      (await supabase.from("profiles").delete().eq("organization_id", organizationId)).error,
    );

    // 17) Organization
    assertOk(
      "Delete organization",
      (await supabase.from("organizations").delete().eq("id", organizationId)).error,
    );

    // 18) Cleanup auth users (best effort)
    for (const uid of userIds) {
      const { error: deleteAuthErr } = await supabase.auth.admin.deleteUser(uid);
      if (deleteAuthErr) {
        console.warn(`Failed to delete auth user ${uid}:`, deleteAuthErr.message);
      }
    }

    return jsonResponse(200, { success: true });
  } catch (error) {
    console.error("delete-demo-organization error:", error);
    return jsonResponse(500, { error: (error as { message?: string })?.message || "An unexpected error occurred" });
  }
});
