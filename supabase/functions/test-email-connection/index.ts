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
        "EMAIL_ENCRYPTION_KEY: Hex-Format erkannt, aber nicht 32 Bytes"
      );
    }
    return new Uint8Array(pairs.map((b) => parseInt(b, 16)));
  }

  // base64 (standard or urlsafe) representing 32 bytes
  try {
    const normalized = trimmed.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + (4 - (normalized.length % 4)) % 4, "=");
    const raw = atob(padded);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);

    if (bytes.byteLength !== 32) {
      throw new Error(
        `EMAIL_ENCRYPTION_KEY: Base64 ergibt ${bytes.byteLength} statt 32 Bytes`
      );
    }

    return bytes;
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    throw new Error(
      `EMAIL_ENCRYPTION_KEY ungültig (Länge: ${trimmed.length}). Erwartet: 64 Hex-Zeichen oder 44 Base64-Zeichen. Fehler: ${errorMsg}`
    );
  }
}

// Decrypt password using AES-256-GCM
async function decryptPassword(encryptedBase64: string, keyBytes: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes.buffer as ArrayBuffer,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );
  
  const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encrypted
  );
  
  return new TextDecoder().decode(decrypted);
}

// Simple IMAP client for connection testing
class SimpleImapClient {
  private conn: Deno.TlsConn | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private decoder = new TextDecoder();
  private encoder = new TextEncoder();
  private tagCounter = 0;
  private buffer = "";

  async connect(host: string, port: number): Promise<void> {
    this.conn = await Deno.connectTls({ hostname: host, port });
    this.reader = this.conn.readable.getReader();
    
    // Read greeting
    const greeting = await this.readResponse();
    if (!greeting.includes("OK")) {
      throw new Error("Server did not respond with OK greeting");
    }
  }

  private async readResponse(): Promise<string> {
    while (true) {
      const { value, done } = await this.reader!.read();
      if (done) break;
      this.buffer += this.decoder.decode(value);
      
      // Check if we have a complete response
      if (this.buffer.includes("\r\n")) {
        const response = this.buffer;
        this.buffer = "";
        return response;
      }
    }
    return this.buffer;
  }

  private async sendCommand(command: string): Promise<string> {
    const tag = `A${++this.tagCounter}`;
    const fullCommand = `${tag} ${command}\r\n`;
    await this.conn!.write(this.encoder.encode(fullCommand));
    
    // Read until we get a tagged response
    let response = "";
    const taggedResponsePattern = new RegExp(`^${tag} (OK|NO|BAD)`, "m");
    
    while (true) {
      const { value, done } = await this.reader!.read();
      if (done) break;
      response += this.decoder.decode(value);
      
      if (taggedResponsePattern.test(response)) {
        break;
      }
    }
    
    return response;
  }

  async login(user: string, password: string): Promise<void> {
    const response = await this.sendCommand(`LOGIN "${user}" "${password}"`);
    if (!response.includes("OK")) {
      throw new Error("Login failed - check username and password");
    }
  }

  async selectMailbox(mailbox: string): Promise<number> {
    const response = await this.sendCommand(`SELECT "${mailbox}"`);
    if (!response.includes("OK")) {
      throw new Error(`Failed to select mailbox "${mailbox}"`);
    }
    
    // Extract message count
    const existsMatch = response.match(/\* (\d+) EXISTS/);
    return existsMatch ? parseInt(existsMatch[1], 10) : 0;
  }

  async logout(): Promise<void> {
    try {
      await this.sendCommand("LOGOUT");
    } finally {
      this.conn?.close();
    }
  }
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
      throw new Error("EMAIL_ENCRYPTION_KEY not configured");
    }

    // Validate encryption key early
    const keyBytes = decodeEncryptionKey(encryptionKey);

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
    const { imap_host, imap_port, imap_user, imap_password, mailbox } = body;

    if (!imap_host || !imap_user) {
      throw new Error("IMAP host and user are required");
    }

    // Get password - either from request or from stored settings
    let password = imap_password;
    
    if (!password) {
      // Load from database
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      const { data: settings, error: settingsError } = await supabaseAdmin
        .from("organization_email_settings")
        .select("imap_password_encrypted")
        .eq("organization_id", organizationId)
        .single();

      if (settingsError || !settings?.imap_password_encrypted) {
        throw new Error("No password provided and no stored password found");
      }

      password = await decryptPassword(settings.imap_password_encrypted, keyBytes);
    }

    // Test connection
    console.log(`Testing IMAP connection to ${imap_host}:${imap_port || 993}`);
    
    const client = new SimpleImapClient();
    
    try {
      await client.connect(imap_host, imap_port || 993);
      console.log("Connected to IMAP server");
      
      await client.login(imap_user, password);
      console.log("Login successful");
      
      const messageCount = await client.selectMailbox(mailbox || "INBOX");
      console.log(`Selected mailbox, ${messageCount} messages`);
      
      await client.logout();
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          messageCount,
          message: `Verbindung erfolgreich! ${messageCount} E-Mails im Postfach.`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
      
    } catch (imapError) {
      console.error("IMAP error:", imapError);
      const errMsg = imapError instanceof Error ? imapError.message : String(imapError);
      throw new Error(`IMAP-Verbindung fehlgeschlagen: ${errMsg}`);
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
