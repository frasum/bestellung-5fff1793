import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encryptPassword, decryptPassword } from "../_shared/encryption.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's organization and check admin role
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return new Response(JSON.stringify({ error: "No organization found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: userRole } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!userRole) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const organizationId = profile.organization_id;
    const encryptionKey = Deno.env.get("EMAIL_ENCRYPTION_KEY");

    if (!encryptionKey) {
      console.error("EMAIL_ENCRYPTION_KEY not configured");
      return new Response(JSON.stringify({ error: "Encryption not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service client for database operations
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json().catch(() => ({}));
    const action = body.action || "get";

    console.info(`[manage-email-settings] Action: ${action}, Org: ${organizationId}`);

    // GET - Retrieve settings (password masked)
    if (action === "get") {
      const { data: settings, error } = await serviceClient
        .from("organization_email_settings")
        .select("*")
        .eq("organization_id", organizationId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching settings:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Mask password if settings exist
      if (settings) {
        return new Response(JSON.stringify({
          ...settings,
          imap_password_encrypted: undefined,
          password_set: true,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(null), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // SAVE - Create or update settings
    if (action === "save") {
      const { imap_host, imap_port, imap_user, imap_password, mailbox, is_active } = body;

      if (!imap_host || !imap_user) {
        return new Response(JSON.stringify({ error: "imap_host and imap_user are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if settings already exist
      const { data: existing } = await serviceClient
        .from("organization_email_settings")
        .select("id, imap_password_encrypted")
        .eq("organization_id", organizationId)
        .maybeSingle();

      // Encrypt password if provided, otherwise keep existing
      let encryptedPassword: string;
      if (imap_password) {
        encryptedPassword = await encryptPassword(imap_password, encryptionKey);
        console.info("Password encrypted successfully");
      } else if (existing?.imap_password_encrypted) {
        encryptedPassword = existing.imap_password_encrypted;
      } else {
        return new Response(JSON.stringify({ error: "Password is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const settingsData = {
        organization_id: organizationId,
        imap_host,
        imap_port: imap_port || 993,
        imap_user,
        imap_password_encrypted: encryptedPassword,
        mailbox: mailbox || "INBOX",
        is_active: is_active ?? true,
      };

      let result;
      if (existing) {
        // Update
        result = await serviceClient
          .from("organization_email_settings")
          .update(settingsData)
          .eq("id", existing.id)
          .select()
          .single();
      } else {
        // Insert
        result = await serviceClient
          .from("organization_email_settings")
          .insert(settingsData)
          .select()
          .single();
      }

      if (result.error) {
        console.error("Error saving settings:", result.error);
        return new Response(JSON.stringify({ error: result.error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.info("Settings saved successfully");

      return new Response(JSON.stringify({
        success: true,
        message: existing ? "Einstellungen aktualisiert" : "Einstellungen gespeichert",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // TEST - Test IMAP connection
    if (action === "test") {
      const { imap_host, imap_port, imap_user, imap_password } = body;

      // Get password from request or database
      let password = imap_password;
      
      if (!password) {
        // Try to get from database
        const { data: settings } = await serviceClient
          .from("organization_email_settings")
          .select("imap_password_encrypted")
          .eq("organization_id", organizationId)
          .maybeSingle();

        if (settings?.imap_password_encrypted) {
          password = await decryptPassword(settings.imap_password_encrypted, encryptionKey);
        }
      }

      if (!imap_host || !imap_user || !password) {
        return new Response(JSON.stringify({ 
          error: "Alle Felder (Host, Benutzer, Passwort) werden benötigt" 
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const port = imap_port || 993;

      console.info(`Testing IMAP connection to ${imap_host}:${port}...`);

      try {
        // Try to connect via TLS
        const conn = await Deno.connectTls({
          hostname: imap_host,
          port: port,
        });

        const encoder = new TextEncoder();
        const decoder = new TextDecoder();

        // Read greeting
        const greeting = new Uint8Array(1024);
        await conn.read(greeting);
        const greetingStr = decoder.decode(greeting);
        console.info("Greeting:", greetingStr.substring(0, 100));

        if (!greetingStr.includes("OK") && !greetingStr.includes("*")) {
          conn.close();
          return new Response(JSON.stringify({ 
            success: false,
            error: "Server-Begrüßung ungültig" 
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Try login
        const loginCmd = `A1 LOGIN "${imap_user}" "${password}"\r\n`;
        await conn.write(encoder.encode(loginCmd));

        const loginResp = new Uint8Array(2048);
        await conn.read(loginResp);
        const loginStr = decoder.decode(loginResp);
        console.info("Login response:", loginStr.substring(0, 200));

        // Logout
        await conn.write(encoder.encode("A2 LOGOUT\r\n"));
        conn.close();

        if (loginStr.includes("A1 OK")) {
          console.info("IMAP test successful");
          return new Response(JSON.stringify({ 
            success: true,
            message: "Verbindung erfolgreich!" 
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          console.error("Login failed:", loginStr);
          return new Response(JSON.stringify({ 
            success: false,
            error: "Anmeldung fehlgeschlagen - Benutzername oder Passwort falsch" 
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

      } catch (connError: unknown) {
        const err = connError instanceof Error ? connError : new Error(String(connError));
        console.error("Connection test failed:", err.message);
        return new Response(JSON.stringify({ 
          success: false,
          error: `Verbindungsfehler: ${err.message}` 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // DELETE - Remove settings
    if (action === "delete") {
      const { error } = await serviceClient
        .from("organization_email_settings")
        .delete()
        .eq("organization_id", organizationId);

      if (error) {
        console.error("Error deleting settings:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.info("Settings deleted successfully");

      return new Response(JSON.stringify({
        success: true,
        message: "Einstellungen gelöscht",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("manage-email-settings error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
