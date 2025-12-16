import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { customer_id, email, password, organization_name, subscription_tier } = await req.json();

    if (!customer_id || !email || !password || !organization_name) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Check if customer exists and is not already upgraded
    const { data: customer, error: customerError } = await supabaseAdmin
      .from("supplier_b2b_customers")
      .select("*, b2b_customer_vendors(*), b2b_customer_vendor_articles(*)")
      .eq("id", customer_id)
      .single();

    if (customerError || !customer) {
      console.error("Customer not found:", customerError);
      return new Response(
        JSON.stringify({ error: "Customer not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (customer.upgraded_organization_id) {
      return new Response(
        JSON.stringify({ error: "Customer has already upgraded" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user already exists in auth
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    let userId: string;

    if (existingUser) {
      // User exists - update password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { password }
      );
      if (updateError) {
        console.error("Error updating user password:", updateError);
        throw updateError;
      }
      userId = existingUser.id;
      console.log("Updated existing user password:", userId);
    } else {
      // Create new user
      const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: organization_name,
          organization_name: organization_name,
        },
      });

      if (createUserError) {
        console.error("Error creating user:", createUserError);
        throw createUserError;
      }
      userId = newUser.user.id;
      console.log("Created new user:", userId);
    }

    // Check if organization already exists for this user
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("organization_id")
      .eq("id", userId)
      .single();

    let organizationId: string;

    if (existingProfile?.organization_id) {
      organizationId = existingProfile.organization_id;
      console.log("Using existing organization:", organizationId);
      
      // Update organization with source info
      await supabaseAdmin
        .from("organizations")
        .update({
          source_type: "b2b_upgrade",
          source_b2b_customer_id: customer_id,
          subscription_tier: subscription_tier || "basic",
        })
        .eq("id", organizationId);
    } else {
      // Create new organization
      const { data: newOrg, error: orgError } = await supabaseAdmin
        .from("organizations")
        .insert({
          name: organization_name,
          subscription_tier: subscription_tier || "basic",
          source_type: "b2b_upgrade",
          source_b2b_customer_id: customer_id,
        })
        .select()
        .single();

      if (orgError) {
        console.error("Error creating organization:", orgError);
        throw orgError;
      }
      organizationId = newOrg.id;
      console.log("Created new organization:", organizationId);

      // Create or update profile
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .upsert({
          id: userId,
          email,
          full_name: organization_name,
          organization_id: organizationId,
        });

      if (profileError) {
        console.error("Error creating profile:", profileError);
        throw profileError;
      }

      // Assign admin role
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .upsert({
          user_id: userId,
          role: "admin",
        });

      if (roleError) {
        console.error("Error assigning role:", roleError);
        // Non-critical, continue
      }
    }

    // Migrate vendors to suppliers
    const vendors = customer.b2b_customer_vendors || [];
    const vendorIdMap = new Map<string, string>();

    for (const vendor of vendors) {
      const { data: newSupplier, error: supplierError } = await supabaseAdmin
        .from("suppliers")
        .insert({
          organization_id: organizationId,
          name: vendor.name,
          email: vendor.email,
          phone: vendor.phone,
          address: vendor.address,
          notes: vendor.notes,
          is_active: vendor.is_active,
        })
        .select()
        .single();

      if (supplierError) {
        console.error("Error creating supplier:", supplierError);
        continue;
      }

      vendorIdMap.set(vendor.id, newSupplier.id);
      console.log(`Migrated vendor ${vendor.name} -> supplier ${newSupplier.id}`);
    }

    // Migrate articles
    const articles = customer.b2b_customer_vendor_articles || [];
    let migratedArticles = 0;

    for (const article of articles) {
      const supplierId = vendorIdMap.get(article.vendor_id);
      if (!supplierId) {
        console.log(`Skipping article ${article.name} - vendor not migrated`);
        continue;
      }

      const { error: articleError } = await supabaseAdmin
        .from("articles")
        .insert({
          organization_id: organizationId,
          supplier_id: supplierId,
          name: article.name,
          description: article.description,
          price: article.price || 0,
          unit: article.unit || "Stk",
          category: article.category,
          sku: article.sku,
          is_active: article.is_active,
        });

      if (articleError) {
        console.error("Error creating article:", articleError);
        continue;
      }

      migratedArticles++;
    }

    console.log(`Migrated ${migratedArticles} articles`);

    // Create default location
    const { error: locationError } = await supabaseAdmin
      .from("locations")
      .insert({
        organization_id: organizationId,
        name: "Hauptstandort",
        is_default: true,
      });

    if (locationError) {
      console.error("Error creating location:", locationError);
      // Non-critical
    }

    // Update customer with upgrade info
    const { error: updateCustomerError } = await supabaseAdmin
      .from("supplier_b2b_customers")
      .update({
        upgraded_organization_id: organizationId,
        upgraded_at: new Date().toISOString(),
      })
      .eq("id", customer_id);

    if (updateCustomerError) {
      console.error("Error updating customer:", updateCustomerError);
      // Non-critical
    }

    console.log("Upgrade completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        organization_id: organizationId,
        user_id: userId,
        migrated_vendors: vendorIdMap.size,
        migrated_articles: migratedArticles,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Upgrade error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
