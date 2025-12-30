import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Decode EMAIL_ENCRYPTION_KEY (supports 64-char hex or base64-encoded 32 bytes)
function decodeEncryptionKey(key: string): Uint8Array {
  const trimmed = key.trim();

  // 64 hex chars = 32 bytes
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    const pairs = trimmed.match(/.{1,2}/g);
    if (!pairs || pairs.length !== 32) {
      throw new Error(
        `EMAIL_ENCRYPTION_KEY ist als Hex ungültig (erwartet: 32 Bytes, erhalten: ${pairs?.length ?? 0})`
      );
    }
    return new Uint8Array(pairs.map((b) => parseInt(b, 16)));
  }

  // base64 (standard or urlsafe) representing 32 bytes
  try {
    const normalized = trimmed.replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(normalized);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);

    if (bytes.byteLength !== 32) {
      throw new Error(
        `EMAIL_ENCRYPTION_KEY Base64 muss 32 Bytes ergeben (aktuell: ${bytes.byteLength})`
      );
    }

    return bytes;
  } catch {
    throw new Error(
      "EMAIL_ENCRYPTION_KEY muss entweder 64 Hex-Zeichen (32 Bytes) oder Base64-codierte 32 Bytes sein"
    );
  }
}

// Encrypt password using AES-256-GCM
async function encryptPassword(password: string, encryptionKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyBytes = decodeEncryptionKey(encryptionKey);

  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes as unknown as BufferSource,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(password)
  );

  // Combine IV + encrypted data and encode as base64
  const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode(...combined));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const encryptionKey = Deno.env.get("EMAIL_ENCRYPTION_KEY");

    if (!encryptionKey) {
      throw new Error("EMAIL_ENCRYPTION_KEY nicht konfiguriert");
    }

    // Validate encryption key format by decoding it (supports 64 hex chars or base64 encoded 32 bytes)
    // This will throw a descriptive error if invalid.
    decodeEncryptionKey(encryptionKey);

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

    const organizationId = profile.organization_id;

    // Parse request body
    const body = await req.json();
    const { imap_host, imap_port, imap_user, imap_password, mailbox, is_active } = body;

    if (!imap_host || !imap_user) {
      throw new Error("IMAP host and user are required");
    }

    // Create service role client for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check if settings already exist
    const { data: existing } = await supabaseAdmin
      .from("organization_email_settings")
      .select("id")
      .eq("organization_id", organizationId)
      .single();

    // Prepare update data
    const updateData: Record<string, unknown> = {
      organization_id: organizationId,
      imap_host,
      imap_port: imap_port || 993,
      imap_user,
      mailbox: mailbox || "INBOX",
      is_active: is_active ?? true,
      updated_at: new Date().toISOString(),
    };

    // Encrypt password if provided
    if (imap_password && imap_password.length > 0) {
      updateData.imap_password_encrypted = await encryptPassword(imap_password, encryptionKey);
    }

    let result;
    if (existing) {
      // Update existing settings
      const { data, error } = await supabaseAdmin
        .from("organization_email_settings")
        .update(updateData)
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Insert new settings - password is required for new entries
      if (!imap_password) {
        throw new Error("Password is required for new configuration");
      }

      const { data, error } = await supabaseAdmin
        .from("organization_email_settings")
        .insert(updateData)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    console.log(`Updated email settings for organization ${organizationId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        id: result.id,
        message: "E-Mail-Einstellungen erfolgreich gespeichert" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error updating email settings:", error);
    const errMsg = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errMsg }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
