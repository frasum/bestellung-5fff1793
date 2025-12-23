import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple IMAP client implementation for Deno
class SimpleImapClient {
  private conn: Deno.TlsConn | null = null;
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();
  private commandCounter = 0;

  constructor(
    private host: string,
    private port: number,
    private user: string,
    private password: string
  ) {}

  private async sendCommand(command: string): Promise<string> {
    if (!this.conn) throw new Error("Not connected");
    
    const tag = `A${++this.commandCounter}`;
    const fullCommand = `${tag} ${command}\r\n`;
    
    console.log(`> ${tag} ${command.includes("LOGIN") ? "LOGIN ***" : command}`);
    
    await this.conn.write(this.encoder.encode(fullCommand));
    
    let response = "";
    const buffer = new Uint8Array(8192);
    
    // Read until we get the tagged response
    while (true) {
      const bytesRead = await this.conn.read(buffer);
      if (bytesRead === null) break;
      
      response += this.decoder.decode(buffer.subarray(0, bytesRead));
      
      if (response.includes(`${tag} OK`) || response.includes(`${tag} NO`) || response.includes(`${tag} BAD`)) {
        break;
      }
    }
    
    return response;
  }

  private async readInitialResponse(): Promise<string> {
    if (!this.conn) throw new Error("Not connected");
    
    const buffer = new Uint8Array(4096);
    const bytesRead = await this.conn.read(buffer);
    if (bytesRead === null) return "";
    
    return this.decoder.decode(buffer.subarray(0, bytesRead));
  }

  async connect(): Promise<void> {
    console.log(`Connecting to ${this.host}:${this.port}...`);
    
    this.conn = await Deno.connectTls({
      hostname: this.host,
      port: this.port,
    });
    
    // Read greeting
    const greeting = await this.readInitialResponse();
    console.log(`Server greeting received`);
    
    // Login
    const loginResponse = await this.sendCommand(`LOGIN "${this.user}" "${this.password}"`);
    if (!loginResponse.includes("OK")) {
      throw new Error("Login failed");
    }
    console.log("Logged in successfully");
  }

  async selectMailbox(mailbox: string): Promise<{ exists: number }> {
    const response = await this.sendCommand(`SELECT "${mailbox}"`);
    
    const existsMatch = response.match(/\* (\d+) EXISTS/);
    const exists = existsMatch ? parseInt(existsMatch[1]) : 0;
    
    return { exists };
  }

  async searchUnseen(): Promise<number[]> {
    const response = await this.sendCommand("SEARCH UNSEEN");
    
    const searchLine = response.split("\r\n").find(line => line.startsWith("* SEARCH"));
    if (!searchLine) return [];
    
    const uids = searchLine
      .replace("* SEARCH ", "")
      .trim()
      .split(" ")
      .filter(s => s)
      .map(s => parseInt(s));
    
    return uids;
  }

  async fetchMessage(seqNum: number): Promise<{
    from: string;
    subject: string;
    date: string;
    messageId: string;
    hasAttachments: boolean;
    bodyStructure: string;
  }> {
    const response = await this.sendCommand(`FETCH ${seqNum} (ENVELOPE BODYSTRUCTURE)`);
    
    // Parse envelope
    const envelopeMatch = response.match(/ENVELOPE \(([^)]+(?:\([^)]*\))*[^)]*)\)/);
    let from = "unknown";
    let subject = "No Subject";
    let date = new Date().toISOString();
    let messageId = `msg-${seqNum}-${Date.now()}`;
    
    if (envelopeMatch) {
      const envelopeParts = envelopeMatch[1];
      
      // Extract subject (second quoted string after date)
      const subjectMatch = envelopeParts.match(/"([^"]*)" "([^"]*)"/);
      if (subjectMatch) {
        subject = subjectMatch[2] || "No Subject";
      }
      
      // Extract from address
      const fromMatch = envelopeParts.match(/NIL NIL \(\((?:NIL|"[^"]*") (?:NIL|"[^"]*") "([^"]*)" "([^"]*)"\)\)/);
      if (fromMatch) {
        from = `${fromMatch[1]}@${fromMatch[2]}`;
      }
      
      // Extract message-id
      const msgIdMatch = envelopeParts.match(/<([^>]+)>/);
      if (msgIdMatch) {
        messageId = msgIdMatch[1];
      }
    }
    
    // Check for PDF attachments in body structure
    const hasAttachments = response.toLowerCase().includes('"application" "pdf"') ||
                          response.toLowerCase().includes('"application" "octet-stream"');
    
    return {
      from,
      subject: decodeImapString(subject),
      date,
      messageId,
      hasAttachments,
      bodyStructure: response,
    };
  }

  async fetchAttachment(seqNum: number, partNum: string): Promise<Uint8Array | null> {
    const response = await this.sendCommand(`FETCH ${seqNum} BODY[${partNum}]`);
    
    // Extract base64 content
    const bodyMatch = response.match(/\{(\d+)\}\r\n([\s\S]+?)\r\n[A-Z]/);
    if (!bodyMatch) return null;
    
    const base64Content = bodyMatch[2].replace(/\r\n/g, "");
    
    try {
      const binaryStr = atob(base64Content);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      return bytes;
    } catch {
      return null;
    }
  }

  async fetchFullMessage(seqNum: number): Promise<string> {
    const response = await this.sendCommand(`FETCH ${seqNum} BODY[]`);
    return response;
  }

  async markAsSeen(seqNum: number): Promise<void> {
    await this.sendCommand(`STORE ${seqNum} +FLAGS (\\Seen)`);
  }

  async logout(): Promise<void> {
    if (this.conn) {
      try {
        await this.sendCommand("LOGOUT");
      } catch {
        // Ignore logout errors
      }
      this.conn.close();
      this.conn = null;
    }
  }
}

// Helper to decode IMAP encoded strings
function decodeImapString(str: string): string {
  // Handle =?UTF-8?Q?...?= or =?UTF-8?B?...?= encoding
  const matches = str.matchAll(/=\?([^?]+)\?([BQ])\?([^?]+)\?=/gi);
  let decoded = str;
  
  for (const match of matches) {
    const charset = match[1];
    const encoding = match[2].toUpperCase();
    const content = match[3];
    
    try {
      if (encoding === "B") {
        decoded = decoded.replace(match[0], atob(content));
      } else if (encoding === "Q") {
        decoded = decoded.replace(
          match[0],
          content.replace(/_/g, " ").replace(/=([0-9A-F]{2})/gi, (_, hex) =>
            String.fromCharCode(parseInt(hex, 16))
          )
        );
      }
    } catch {
      // Keep original if decoding fails
    }
  }
  
  return decoded;
}

// Extract PDF parts from body structure
function extractPdfParts(bodyStructure: string): { part: string; filename: string }[] {
  const parts: { part: string; filename: string }[] = [];
  
  // Look for PDF type in structure
  const pdfMatches = bodyStructure.matchAll(/"application" "pdf"[^)]*\("name" "([^"]+)"\)/gi);
  let partIndex = 1;
  
  for (const match of pdfMatches) {
    parts.push({
      part: `${partIndex}`,
      filename: match[1] || `attachment-${partIndex}.pdf`,
    });
    partIndex++;
  }
  
  // Also check for octet-stream with .pdf extension
  const octetMatches = bodyStructure.matchAll(/"application" "octet-stream"[^)]*\("name" "([^"]+\.pdf)"\)/gi);
  for (const match of octetMatches) {
    parts.push({
      part: `${partIndex}`,
      filename: match[1],
    });
    partIndex++;
  }
  
  return parts;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's organization
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      console.error("Profile error:", profileError);
      return new Response(JSON.stringify({ error: "Organization not found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const organizationId = profile.organization_id;

    // Get IMAP credentials
    const imapHost = Deno.env.get("INVOICE_IMAP_HOST");
    const imapPort = parseInt(Deno.env.get("INVOICE_IMAP_PORT") || "993");
    const imapUser = Deno.env.get("INVOICE_IMAP_USER");
    const imapPassword = Deno.env.get("INVOICE_IMAP_PASSWORD");

    if (!imapHost || !imapUser || !imapPassword) {
      return new Response(JSON.stringify({ error: "IMAP credentials not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Connecting to IMAP server ${imapHost}:${imapPort}...`);

    const client = new SimpleImapClient(imapHost, imapPort, imapUser, imapPassword);
    
    try {
      await client.connect();
    } catch (connError: unknown) {
      console.error("IMAP connection error:", connError);
      const errorMessage = connError instanceof Error ? connError.message : "Unknown error";
      return new Response(JSON.stringify({ 
        error: "Could not connect to mail server",
        details: errorMessage 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Select INBOX
    const mailbox = await client.selectMailbox("INBOX");
    console.log(`Mailbox opened: ${mailbox.exists} messages`);

    // Search for unread messages
    const unreadSeqNums = await client.searchUnseen();
    console.log(`Found ${unreadSeqNums.length} unread messages`);

    let newInvoicesCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const processedEmails: string[] = [];

    for (const seqNum of unreadSeqNums) {
      try {
        const message = await client.fetchMessage(seqNum);
        console.log(`Processing email: ${message.subject} from ${message.from}`);

        // Check if already processed
        const { data: existingLog } = await supabase
          .from("invoice_email_log")
          .select("id")
          .eq("organization_id", organizationId)
          .eq("message_id", message.messageId)
          .maybeSingle();

        if (existingLog) {
          console.log(`Email ${message.messageId} already processed, skipping`);
          skippedCount++;
          continue;
        }

        if (!message.hasAttachments) {
          // Log email without PDF
          await supabase.from("invoice_email_log").insert({
            organization_id: organizationId,
            message_id: message.messageId,
            email_from: message.from,
            email_subject: message.subject,
            status: "no_pdf",
          });
          
          await client.markAsSeen(seqNum);
          skippedCount++;
          continue;
        }

        // Try to match supplier by email
        const { data: supplier } = await supabase
          .from("suppliers")
          .select("id, name")
          .eq("organization_id", organizationId)
          .or(`email.eq.${message.from},invoice_email.eq.${message.from}`)
          .maybeSingle();

        // Fetch full message to extract PDF
        const fullMessage = await client.fetchFullMessage(seqNum);
        
        // Extract PDF content from MIME message
        const pdfContent = extractPdfFromMime(fullMessage);
        
        if (pdfContent) {
          // Upload PDF to storage
          const fileName = `${organizationId}/${Date.now()}-invoice.pdf`;
          const { error: uploadError } = await supabase.storage
            .from("invoices")
            .upload(fileName, pdfContent, {
              contentType: "application/pdf",
            });

          if (uploadError) {
            console.error("Upload error:", uploadError);
            errorCount++;
            continue;
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from("invoices")
            .getPublicUrl(fileName);

          // Create invoice record
          const { data: invoice, error: invoiceError } = await supabase
            .from("invoices")
            .insert({
              organization_id: organizationId,
              supplier_id: supplier?.id || null,
              pdf_url: urlData.publicUrl,
              status: "pending",
              email_subject: message.subject,
              email_from: message.from,
              email_received_at: new Date().toISOString(),
              email_message_id: message.messageId,
            })
            .select()
            .single();

          if (invoiceError) {
            console.error("Invoice creation error:", invoiceError);
            errorCount++;
            continue;
          }

          console.log(`Created invoice ${invoice.id}`);

          // Trigger parse-invoice function
          try {
            const parseResponse = await fetch(`${supabaseUrl}/functions/v1/parse-invoice`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({
                invoiceId: invoice.id,
                pdfUrl: urlData.publicUrl,
              }),
            });

            if (!parseResponse.ok) {
              console.error("Parse invoice error:", await parseResponse.text());
            }
          } catch (parseError) {
            console.error("Parse invoke error:", parseError);
          }

          newInvoicesCount++;
          processedEmails.push(message.subject);
        }

        // Log successful processing
        await supabase.from("invoice_email_log").insert({
          organization_id: organizationId,
          message_id: message.messageId,
          email_from: message.from,
          email_subject: message.subject,
          status: pdfContent ? "processed" : "no_pdf",
        });

        // Mark email as read
        await client.markAsSeen(seqNum);

      } catch (messageError) {
        console.error(`Error processing message ${seqNum}:`, messageError);
        errorCount++;
      }
    }

    // Update last check timestamp
    await supabase
      .from("organizations")
      .update({ last_invoice_email_check: new Date().toISOString() })
      .eq("id", organizationId);

    // Disconnect from IMAP
    await client.logout();
    console.log("Disconnected from IMAP server");

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedEmails.length,
        newInvoices: newInvoicesCount,
        skipped: skippedCount,
        errors: errorCount,
        emails: processedEmails,
        message: newInvoicesCount > 0 
          ? `${newInvoicesCount} neue Rechnungen importiert`
          : "Keine neuen Rechnungen gefunden",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error in check-invoice-emails:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Extract PDF content from a MIME message
function extractPdfFromMime(mimeMessage: string): Uint8Array | null {
  // Look for PDF boundary
  const boundaryMatch = mimeMessage.match(/boundary="?([^"\r\n]+)"?/i);
  if (!boundaryMatch) {
    // Try to find inline base64 PDF
    const base64Match = mimeMessage.match(/Content-Type:\s*application\/pdf[\s\S]*?Content-Transfer-Encoding:\s*base64[\s\S]*?\r\n\r\n([\s\S]+?)(?:\r\n--|\r\n[A-Z])/i);
    if (base64Match) {
      return decodeBase64(base64Match[1]);
    }
    return null;
  }

  const boundary = boundaryMatch[1];
  const parts = mimeMessage.split(`--${boundary}`);

  for (const part of parts) {
    // Check if this part is a PDF
    if (part.toLowerCase().includes("application/pdf") || 
        (part.toLowerCase().includes("application/octet-stream") && part.toLowerCase().includes(".pdf"))) {
      
      // Check for base64 encoding
      if (part.toLowerCase().includes("base64")) {
        // Extract the base64 content after headers
        const headerEnd = part.indexOf("\r\n\r\n");
        if (headerEnd === -1) continue;
        
        const base64Content = part.substring(headerEnd + 4).trim();
        return decodeBase64(base64Content);
      }
    }
  }

  return null;
}

function decodeBase64(base64String: string): Uint8Array | null {
  try {
    // Clean up the base64 string
    const cleaned = base64String.replace(/[\r\n\s]/g, "");
    const binaryStr = atob(cleaned);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    console.error("Base64 decode error:", e);
    return null;
  }
}
