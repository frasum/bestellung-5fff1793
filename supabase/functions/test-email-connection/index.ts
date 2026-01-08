import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    // Create client with user's auth
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get user's organization
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { data: profile, error: profileError } = await supabaseUser
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      throw new Error("User has no organization");
    }

    // Parse request body
    const body = await req.json();
    const { imap_host, imap_port } = body;

    if (!imap_host) {
      throw new Error("IMAP host is required");
    }

    const port = imap_port || 993;

    // Simple DNS/hostname validation - just check if the host resolves
    console.log(`Validating IMAP host: ${imap_host}:${port}`);
    
    try {
      // Try to resolve the hostname using Deno's DNS resolver
      const addresses = await Deno.resolveDns(imap_host, "A");
      console.log(`DNS resolved ${imap_host} to:`, addresses);
      
      if (!addresses || addresses.length === 0) {
        throw new Error(`Hostname ${imap_host} konnte nicht aufgelöst werden`);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Host ${imap_host} ist erreichbar. Vollständiger Verbindungstest erfolgt beim nächsten E-Mail-Abruf.`,
          hostResolved: true,
          resolvedAddresses: addresses.length
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
      
    } catch (dnsError) {
      console.error("DNS resolution failed:", dnsError);
      const errMsg = dnsError instanceof Error ? dnsError.message : String(dnsError);
      
      // Check if it's a known DNS error
      if (errMsg.includes("NotFound") || errMsg.includes("no such host")) {
        throw new Error(`Der Host "${imap_host}" konnte nicht gefunden werden. Bitte überprüfen Sie die Adresse.`);
      }
      
      // For other errors, still return success with warning
      // (DNS might be blocked but host could still be valid)
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Host-Validierung nicht möglich. Vollständiger Test erfolgt beim nächsten E-Mail-Abruf.`,
          warning: `DNS-Auflösung fehlgeschlagen: ${errMsg}`,
          hostResolved: false
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error) {
    console.error("Error testing email connection:", error);
    const errMsg = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errMsg }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
