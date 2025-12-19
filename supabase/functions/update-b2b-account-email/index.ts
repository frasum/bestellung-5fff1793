import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId, accountId, newEmail } = await req.json();

    if (!userId || !accountId || !newEmail) {
      return new Response(
        JSON.stringify({ error: "userId, accountId, and newEmail are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Update auth user email
    const { data: authData, error: authError } = await supabase.auth.admin.updateUserById(
      userId,
      {
        email: newEmail,
        email_confirm: true,
      }
    );

    if (authError) {
      console.error("Error updating auth user:", authError);
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update supplier_b2b_accounts email
    const { error: accountError } = await supabase
      .from("supplier_b2b_accounts")
      .update({ email: newEmail })
      .eq("id", accountId);

    if (accountError) {
      console.error("Error updating account email:", accountError);
      return new Response(
        JSON.stringify({ error: accountError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully updated email for user ${userId} to ${newEmail}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId: authData.user.id,
        newEmail: authData.user.email,
        accountId
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
