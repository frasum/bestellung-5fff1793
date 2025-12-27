import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decryptPassword } from "../_shared/encryption.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Interface for email settings from database
interface EmailSettings {
  id: string;
  organization_id: string;
  imap_host: string;
  imap_port: number;
  imap_user: string;
  imap_password_encrypted: string;
  mailbox: string;
  is_active: boolean;
}

// Simple IMAP client implementation for Deno
class SimpleImapClient {
  private conn: Deno.TlsConn | null = null;
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();
  private tagCounter = 0;
  private buffer = "";

  constructor(
    private host: string,
    private port: number,
    private user: string,
    private pass: string
  ) {}

  private getTag(): string {
    return `A${++this.tagCounter}`;
  }

  private async readLine(): Promise<string> {
    if (!this.conn) throw new Error("Not connected");

    while (!this.buffer.includes("\r\n")) {
      const chunk = new Uint8Array(4096);
      const bytesRead = await this.conn.read(chunk);
      if (bytesRead === null) break;
      this.buffer += this.decoder.decode(chunk.subarray(0, bytesRead));
    }

    const lineEnd = this.buffer.indexOf("\r\n");
    if (lineEnd === -1) return this.buffer;

    const line = this.buffer.substring(0, lineEnd);
    this.buffer = this.buffer.substring(lineEnd + 2);
    return line;
  }

  private async readUntilTag(tag: string): Promise<string[]> {
    const lines: string[] = [];
    while (true) {
      const line = await this.readLine();
      lines.push(line);
      if (line.startsWith(tag + " ")) break;
    }
    return lines;
  }

  private async sendCommand(command: string): Promise<string[]> {
    if (!this.conn) throw new Error("Not connected");

    const tag = this.getTag();
    const fullCommand = `${tag} ${command}\r\n`;

    // Mask password in logs
    const logCommand = command.startsWith("LOGIN") 
      ? "LOGIN ***" 
      : command;
    console.info(`> ${tag} ${logCommand}`);

    await this.conn.write(this.encoder.encode(fullCommand));
    return await this.readUntilTag(tag);
  }

  async connect(): Promise<void> {
    console.info(`Connecting to ${this.host}:${this.port}...`);
    this.conn = await Deno.connectTls({
      hostname: this.host,
      port: this.port,
    });

    // Read greeting
    const greeting = await this.readLine();
    console.info("Server greeting received:", greeting.substring(0, 100));

    // Login
    const loginResp = await this.sendCommand(`LOGIN "${this.user}" "${this.pass}"`);
    const loginResult = loginResp[loginResp.length - 1];
    if (!loginResult.includes("OK")) {
      throw new Error("Login failed: " + loginResult);
    }
    console.info("Logged in successfully");
  }

  async selectMailbox(mailbox: string): Promise<number> {
    const resp = await this.sendCommand(`SELECT "${mailbox}"`);
    let messageCount = 0;
    for (const line of resp) {
      const match = line.match(/\*\s+(\d+)\s+EXISTS/i);
      if (match) {
        messageCount = parseInt(match[1], 10);
      }
    }
    console.info(`Mailbox opened: ${messageCount} messages`);
    return messageCount;
  }

  async searchSince(sinceDate: Date | null): Promise<number[]> {
    // Format date as DD-Mon-YYYY for IMAP (e.g., 01-Jan-2025)
    let searchCmd = "SEARCH ALL";
    
    if (sinceDate) {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const day = sinceDate.getDate().toString().padStart(2, '0');
      const month = months[sinceDate.getMonth()];
      const year = sinceDate.getFullYear();
      const dateStr = `${day}-${month}-${year}`;
      searchCmd = `SEARCH SINCE ${dateStr}`;
    }
    
    console.info(`Executing: ${searchCmd}`);
    const resp = await this.sendCommand(searchCmd);
    console.info("SEARCH response:", JSON.stringify(resp));
    
    const seqNumbers: number[] = [];
    
    for (const line of resp) {
      // Look for lines like "* SEARCH 1 2 3" or "* SEARCH"
      if (line.startsWith("* SEARCH")) {
        const numbersStr = line.substring("* SEARCH".length).trim();
        if (numbersStr) {
          // Split by whitespace and parse each number
          const parts = numbersStr.split(/\s+/);
          for (const part of parts) {
            const num = parseInt(part, 10);
            if (!isNaN(num) && num > 0) {
              seqNumbers.push(num);
            }
          }
        }
      }
    }
    
    console.info(`Found ${seqNumbers.length} messages since ${sinceDate?.toISOString() || 'beginning'}: [${seqNumbers.join(", ")}]`);
    return seqNumbers;
  }

  async fetchMessage(seqNum: number): Promise<{ envelope: string; bodystructure: string }> {
    const resp = await this.sendCommand(`FETCH ${seqNum} (ENVELOPE BODYSTRUCTURE)`);
    console.info(`FETCH ${seqNum} response lines: ${resp.length}`);
    
    const fullResp = resp.join("\n");
    return { envelope: fullResp, bodystructure: fullResp };
  }

  async fetchBodyPart(seqNum: number, part: string): Promise<string> {
    const resp = await this.sendCommand(`FETCH ${seqNum} BODY[${part}]`);
    console.info(`FETCH BODY[${part}] response lines: ${resp.length}`);
    return resp.join("\n");
  }

  async fetchFullMessage(seqNum: number): Promise<string> {
    const resp = await this.sendCommand(`FETCH ${seqNum} BODY[]`);
    return resp.join("\n");
  }

  async markAsSeen(seqNum: number): Promise<void> {
    await this.sendCommand(`STORE ${seqNum} +FLAGS (\\Seen)`);
  }

  async logout(): Promise<void> {
    try {
      await this.sendCommand("LOGOUT");
    } catch (e: unknown) {
      // Ignore logout errors
    }
    if (this.conn) {
      try {
        this.conn.close();
      } catch (e: unknown) {
        // Ignore close errors
      }
    }
    console.info("Disconnected from IMAP server");
  }
}

// Decode IMAP encoded strings (=?UTF-8?Q?...?= or =?UTF-8?B?...?=)
function decodeImapString(str: string): string {
  if (!str) return "";
  
  // Handle multiple encoded parts
  const encodedPartRegex = /=\?([^?]+)\?([BQ])\?([^?]*)\?=/gi;
  
  let result = str;
  let match;
  
  while ((match = encodedPartRegex.exec(str)) !== null) {
    const [fullMatch, _charset, encoding, content] = match;
    let decoded = "";
    
    try {
      if (encoding.toUpperCase() === "B") {
        // Base64 encoding
        decoded = atob(content);
        // Try to decode as UTF-8
        try {
          decoded = decodeURIComponent(escape(decoded));
        } catch {
          // Keep as-is if decoding fails
        }
      } else if (encoding.toUpperCase() === "Q") {
        // Quoted-printable encoding
        decoded = content
          .replace(/_/g, " ")
          .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => 
            String.fromCharCode(parseInt(hex, 16))
          );
        // Try to decode as UTF-8
        try {
          decoded = decodeURIComponent(escape(decoded));
        } catch {
          // Keep as-is if decoding fails
        }
      }
      
      result = result.replace(fullMatch, decoded);
    } catch (e) {
      console.error("Decoding error for:", fullMatch, e);
    }
  }
  
  return result.trim();
}

// Parse envelope to extract subject, from, message-id
function parseEnvelope(envelopeResp: string): { subject: string; from: string; messageId: string } {
  let subject = "";
  let from = "";
  let messageId = "";
  
  console.info("Parsing envelope, length:", envelopeResp.length);
  console.info("Envelope preview:", envelopeResp.substring(0, 500));
  
  // Extract ENVELOPE content - look for ENVELOPE followed by parentheses
  const envelopeMatch = envelopeResp.match(/ENVELOPE\s*\((.+)\)/is);
  if (envelopeMatch) {
    const envelopeContent = envelopeMatch[1];
    console.info("Envelope content found, length:", envelopeContent.length);
    
    // ENVELOPE format: (date subject from sender reply-to to cc bcc in-reply-to message-id)
    // Try to extract the subject - it's typically the first or second quoted string
    
    // Find all quoted strings
    const quotedStrings: string[] = [];
    let inQuote = false;
    let currentQuote = "";
    let escapeNext = false;
    
    for (let i = 0; i < envelopeContent.length; i++) {
      const char = envelopeContent[i];
      
      if (escapeNext) {
        currentQuote += char;
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        currentQuote += char;
        continue;
      }
      
      if (char === '"') {
        if (inQuote) {
          quotedStrings.push(currentQuote);
          currentQuote = "";
          inQuote = false;
        } else {
          inQuote = true;
        }
        continue;
      }
      
      if (inQuote) {
        currentQuote += char;
      }
    }
    
    console.info("Found quoted strings:", quotedStrings.length, quotedStrings.slice(0, 5));
    
    // The subject is typically the second quoted string (after date)
    if (quotedStrings.length >= 2) {
      subject = decodeImapString(quotedStrings[1]);
    } else if (quotedStrings.length >= 1) {
      // Sometimes it's the first
      subject = decodeImapString(quotedStrings[0]);
    }
    
    // Extract email address from the FROM field
    // Look for pattern like: "mailbox" "host" in the address structure
    const emailPattern = /"([a-zA-Z0-9._%+-]+)"\s+"([a-zA-Z0-9.-]+)"/g;
    let emailMatch;
    while ((emailMatch = emailPattern.exec(envelopeContent)) !== null) {
      // Skip if it looks like encoded content
      if (!emailMatch[1].includes("=") && emailMatch[2].includes(".")) {
        from = `${emailMatch[1]}@${emailMatch[2]}`;
        console.info("Found email:", from);
        break;
      }
    }
  }
  
  // Try to find message-id with angle brackets
  const msgIdMatch = envelopeResp.match(/<([^>]+@[^>]+)>/);
  if (msgIdMatch) {
    messageId = msgIdMatch[1];
  }
  
  // Fallback subject extraction - look for common patterns
  if (!subject) {
    // Try to find subject after "NIL" or date pattern
    const subjectPatterns = [
      /"([^"]{3,})"\s+NIL\s+NIL/,  // Subject before NIL NIL (from)
      /\d{4}\s+"([^"]+)"/,  // After year in date
      /"Re:\s*([^"]+)"/i,
      /"Fwd:\s*([^"]+)"/i,
      /"([^"]*[Rr]echnung[^"]*)"/,  // German invoice
      /"([^"]*[Ii]nvoice[^"]*)"/,   // English invoice
    ];
    
    for (const pattern of subjectPatterns) {
      const match = envelopeResp.match(pattern);
      if (match && match[1]) {
        subject = decodeImapString(match[1]);
        console.info("Found subject via pattern:", subject);
        break;
      }
    }
  }
  
  // Generate message ID if not found
  if (!messageId) {
    messageId = `generated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  console.info("Parsed - Subject:", subject || "(empty)", "From:", from || "(empty)", "MessageId:", messageId);
  
  return { 
    subject: subject || "No Subject", 
    from: from || "unknown", 
    messageId
  };
}

// Check if message has PDF attachments
function hasPdfAttachment(bodystructure: string): boolean {
  const lowerStructure = bodystructure.toLowerCase();
  return lowerStructure.includes('"application" "pdf"') ||
         lowerStructure.includes('"application"  "pdf"') ||
         (lowerStructure.includes('"application"') && lowerStructure.includes('.pdf'));
}

// Extract ALL PDFs from MIME message (returns array of PDFs)
function extractPdfFromMime(mimeMessage: string): Uint8Array[] {
  console.info("Extracting PDFs from MIME, message length:", mimeMessage.length);
  
  const allPdfs: Uint8Array[] = [];
  
  // Find all boundaries in the message (there might be nested ones)
  const boundaryMatches = mimeMessage.matchAll(/boundary="?([^"\s\r\n;]+)"?/gi);
  const boundaries: string[] = [];
  for (const match of boundaryMatches) {
    boundaries.push(match[1]);
  }
  console.info("Found boundaries:", boundaries.length, boundaries);
  
  // Extract PDFs using each boundary
  for (const boundary of boundaries) {
    const results = extractPdfWithBoundary(mimeMessage, boundary);
    for (const pdf of results) {
      // Avoid duplicates by checking size
      const isDuplicate = allPdfs.some(existing => existing.length === pdf.length);
      if (!isDuplicate) {
        allPdfs.push(pdf);
      }
    }
  }
  
  // Fallback: try to find base64-encoded PDF content directly if no PDFs found
  if (allPdfs.length === 0) {
    console.info("No PDF found with boundaries, trying direct extraction...");
    const directPdf = extractBase64PdfDirect(mimeMessage);
    if (directPdf) {
      allPdfs.push(directPdf);
    }
  }
  
  console.info(`Total PDFs extracted: ${allPdfs.length}`);
  return allPdfs;
}

function extractPdfWithBoundary(mimeMessage: string, boundary: string): Uint8Array[] {
  console.info("Trying boundary:", boundary);
  
  const foundPdfs: Uint8Array[] = [];
  
  // Escape special regex characters in boundary
  const escapedBoundary = boundary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Split by boundary
  const parts = mimeMessage.split(new RegExp(`--${escapedBoundary}`, 'g'));
  console.info(`Split into ${parts.length} parts`);
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    
    // Check if this part contains a PDF
    const lowerPart = part.toLowerCase();
    const isPdf = (lowerPart.includes('content-type:') || lowerPart.includes('content-type :')) &&
                  (lowerPart.includes('application/pdf') || 
                   (lowerPart.includes('application/octet-stream') && lowerPart.includes('.pdf')) ||
                   lowerPart.includes('name="') && lowerPart.includes('.pdf'));
    
    if (isPdf) {
      console.info(`Part ${i} appears to be PDF`);
      
      // Check for nested boundary (forwarded messages)
      const nestedBoundaryMatch = part.match(/boundary="?([^"\s\r\n;]+)"?/i);
      if (nestedBoundaryMatch && nestedBoundaryMatch[1] !== boundary) {
        console.info("Found nested boundary, recursing...");
        const nestedResults = extractPdfWithBoundary(part, nestedBoundaryMatch[1]);
        foundPdfs.push(...nestedResults);
      }
      
      // Try to extract base64 content from this part
      const pdfContent = extractBase64FromPart(part);
      if (pdfContent) {
        foundPdfs.push(pdfContent);
      }
    }
    
    // Check for nested multipart
    if (lowerPart.includes('content-type:') && 
        (lowerPart.includes('multipart/mixed') || 
         lowerPart.includes('multipart/related') ||
         lowerPart.includes('multipart/alternative'))) {
      const nestedBoundaryMatch = part.match(/boundary="?([^"\s\r\n;]+)"?/i);
      if (nestedBoundaryMatch && nestedBoundaryMatch[1] !== boundary) {
        console.info(`Part ${i} is nested multipart, recursing...`);
        const nestedResults = extractPdfWithBoundary(part, nestedBoundaryMatch[1]);
        foundPdfs.push(...nestedResults);
      }
    }
  }
  
  return foundPdfs;
}

function extractBase64FromPart(part: string): Uint8Array | null {
  // Check transfer encoding
  const isBase64 = /content-transfer-encoding:\s*base64/i.test(part);
  
  if (!isBase64) {
    console.info("Part is not base64 encoded");
    return null;
  }
  
  // Split headers from body (double CRLF or double LF)
  const headerBodySplit = part.split(/\r?\n\r?\n/);
  if (headerBodySplit.length < 2) {
    console.info("Could not split headers from body");
    return null;
  }
  
  // Body is everything after headers
  let body = headerBodySplit.slice(1).join("\n\n");
  
  // Clean up the body - remove any trailing boundary markers or IMAP artifacts
  body = body
    .replace(/--[\w\-]+=?-?-?\s*$/gm, '') // Remove trailing boundaries
    .replace(/\)\s*$/g, '') // Remove trailing IMAP artifacts
    .replace(/^\s+|\s+$/g, ''); // Trim
  
  // Remove all whitespace for base64
  const cleanBase64 = body.replace(/[\s\r\n]/g, '');
  console.info("Base64 content length after cleaning:", cleanBase64.length);
  
  if (cleanBase64.length < 100) {
    console.info("Base64 content too short, likely not valid");
    return null;
  }
  
  return decodeBase64(cleanBase64);
}

function extractBase64PdfDirect(mimeMessage: string): Uint8Array | null {
  // Look for PDF header in base64: JVBERi0 = %PDF-
  const pdfBase64Start = "JVBERi0";
  
  const startIndex = mimeMessage.indexOf(pdfBase64Start);
  if (startIndex === -1) {
    console.info("No PDF base64 header found");
    return null;
  }
  
  console.info("Found PDF base64 header at position:", startIndex);
  
  // Find a reasonable end point - look for boundary or significant whitespace pattern
  let endIndex = mimeMessage.length;
  
  // Look for common end markers
  const endMarkers = ["\n--", "\r\n--", "\n\n", "\r\n\r\n", ")\r\n", ")\n"];
  for (const marker of endMarkers) {
    const idx = mimeMessage.indexOf(marker, startIndex + 100);
    if (idx !== -1 && idx < endIndex) {
      endIndex = idx;
    }
  }
  
  let base64Content = mimeMessage.substring(startIndex, endIndex);
  base64Content = base64Content.replace(/[\s\r\n]/g, '');
  
  // Validate it contains mostly base64 characters
  const validChars = base64Content.replace(/[^A-Za-z0-9+/=]/g, '');
  if (validChars.length < base64Content.length * 0.9) {
    console.info("Content contains too many invalid base64 characters");
    return null;
  }
  
  console.info("Extracted direct base64 content, length:", validChars.length);
  return decodeBase64(validChars);
}

// Safely decode base64
function decodeBase64(base64String: string): Uint8Array | null {
  try {
    // Ensure proper padding
    let padded = base64String;
    const remainder = padded.length % 4;
    if (remainder === 2) {
      padded += '==';
    } else if (remainder === 3) {
      padded += '=';
    }
    
    const binaryString = atob(padded);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Verify it looks like a PDF (starts with %PDF)
    if (bytes.length > 4) {
      const header = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
      if (header === "%PDF") {
        console.info("Valid PDF header detected, size:", bytes.length);
        return bytes;
      } else {
        console.info("Decoded content doesn't have PDF header, got:", header);
        // Still return it - might be a valid PDF with BOM or other prefix
        if (bytes.length > 1000) {
          return bytes;
        }
      }
    }
    
    return null;
  } catch (e: unknown) {
    const error = e instanceof Error ? e : new Error(String(e));
    console.error("Base64 decode error:", error.message);
    return null;
  }
}

// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

// Interface for emails to process
interface EmailToProcess {
  seqNum: number;
  subject: string;
  from: string;
  messageId: string;
  fullMessage: string;
  pdfContents: Uint8Array[];
  supplierId: string | null;
}

// Background processing function
async function processPdfsInBackground(
  serviceClient: SupabaseClient,
  organizationId: string,
  emailsToProcess: EmailToProcess[],
  statusId: string,
  imap: SimpleImapClient
) {
  console.info(`[BACKGROUND] Starting processing of ${emailsToProcess.length} emails with PDFs`);
  
  let processedPdfs = 0;
  let newInvoicesCount = 0;
  let skippedCount = 0;
  const errors: string[] = [];
  
  // Calculate total PDFs
  const totalPdfs = emailsToProcess.reduce((sum, email) => sum + email.pdfContents.length, 0);
  
  for (const email of emailsToProcess) {
    // Check if cancellation was requested
    const { data: statusCheck } = await serviceClient
      .from("invoice_processing_status")
      .select("status")
      .eq("id", statusId)
      .single();
    
    if (statusCheck?.status === "cancelled") {
      console.info("[BACKGROUND] Processing cancelled by user");
      await imap.logout();
      await serviceClient
        .from("invoice_processing_status")
        .update({ 
          completed_at: new Date().toISOString()
        })
        .eq("id", statusId);
      return;
    }
    
    const { seqNum, subject, from, messageId, pdfContents, supplierId } = email;
    
    console.info(`[BACKGROUND] Processing email ${seqNum}: ${pdfContents.length} PDFs`);
    
    for (let pdfIndex = 0; pdfIndex < pdfContents.length; pdfIndex++) {
      const pdfContent = pdfContents[pdfIndex];
      
      if (pdfContent.length < 1000) {
        console.warn(`[BACKGROUND] PDF ${pdfIndex + 1} is too small (${pdfContent.length} bytes), skipping`);
        skippedCount++;
        processedPdfs++;
        continue;
      }

      console.info(`[BACKGROUND] Processing PDF ${pdfIndex + 1}/${pdfContents.length}, size: ${pdfContent.length}`);

      // Upload to storage with unique filename
      const filename = `invoice-${Date.now()}-${pdfIndex}.pdf`;
      const filePath = `${organizationId}/${filename}`;

      const { error: uploadError } = await serviceClient.storage
        .from("invoices")
        .upload(filePath, pdfContent, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (uploadError) {
        console.error(`[BACKGROUND] Upload failed for PDF ${pdfIndex + 1}:`, uploadError.message);
        errors.push(`Upload failed for PDF ${pdfIndex + 1} from: ${subject}`);
        processedPdfs++;
        continue;
      }

      const { data: publicUrl } = serviceClient.storage
        .from("invoices")
        .getPublicUrl(filePath);

      // Create invoice record
      const { data: invoice, error: invoiceError } = await serviceClient
        .from("invoices")
        .insert({
          organization_id: organizationId,
          pdf_url: publicUrl.publicUrl,
          status: "pending",
          email_from: from,
          email_subject: subject,
          email_message_id: messageId,
          email_received_at: new Date().toISOString(),
          supplier_id: supplierId,
        })
        .select()
        .single();

      if (invoiceError) {
        console.error(`[BACKGROUND] Invoice creation failed for PDF ${pdfIndex + 1}:`, invoiceError.message);
        errors.push(`Invoice creation failed for PDF ${pdfIndex + 1} from: ${subject}`);
        processedPdfs++;
        continue;
      }

      // Log email as "created" - will update to "processed" after successful parsing
      const { data: emailLog } = await serviceClient.from("invoice_email_log").insert({
        organization_id: organizationId,
        message_id: `${messageId}-${pdfIndex}`,
        email_from: from,
        email_subject: subject,
        status: "created",
        invoice_id: invoice.id,
      }).select().single();

      // Trigger parse-invoice function
      try {
        console.info(`[BACKGROUND] Triggering parse-invoice for invoice ${invoice.id}...`);
        const parseResult = await serviceClient.functions.invoke("parse-invoice", {
          body: { invoiceId: invoice.id },
        });
        
        if (parseResult.error) {
          console.error("[BACKGROUND] parse-invoice returned error:", parseResult.error);
          if (emailLog) {
            await serviceClient.from("invoice_email_log")
              .update({ status: "parse_failed", error_message: parseResult.error.message || 'Unknown error' })
              .eq("id", emailLog.id);
          }
        } else {
          console.info("[BACKGROUND] parse-invoice completed successfully");
          if (emailLog) {
            await serviceClient.from("invoice_email_log")
              .update({ status: "processed" })
              .eq("id", emailLog.id);
          }
        }
      } catch (parseError: unknown) {
        const errMsg = parseError instanceof Error ? parseError.message : String(parseError);
        console.error("[BACKGROUND] Failed to trigger parse-invoice:", errMsg);
        if (emailLog) {
          await serviceClient.from("invoice_email_log")
            .update({ status: "parse_failed", error_message: errMsg })
            .eq("id", emailLog.id);
        }
      }

      console.info(`[BACKGROUND] Successfully created invoice ${invoice.id} from ${from} (PDF ${pdfIndex + 1}/${pdfContents.length})`);
      newInvoicesCount++;
      processedPdfs++;
      
      // Update progress in database
      await serviceClient
        .from("invoice_processing_status")
        .update({ 
          processed_pdfs: processedPdfs,
          new_invoices: newInvoicesCount 
        })
        .eq("id", statusId);
    }
    
    await imap.markAsSeen(seqNum);
  }
  
  // Disconnect IMAP after processing
  await imap.logout();
  
  // Update last check timestamp
  await serviceClient
    .from("organizations")
    .update({ last_invoice_email_check: new Date().toISOString() })
    .eq("id", organizationId);
  
  // Mark processing as completed
  await serviceClient
    .from("invoice_processing_status")
    .update({ 
      status: errors.length > 0 && newInvoicesCount === 0 ? "failed" : "completed",
      processed_pdfs: processedPdfs,
      new_invoices: newInvoicesCount,
      skipped_duplicates: skippedCount,
      error_message: errors.length > 0 ? errors.join("; ") : null,
      completed_at: new Date().toISOString()
    })
    .eq("id", statusId);
  
  console.info(`[BACKGROUND] Completed: ${processedPdfs} PDFs processed, ${newInvoicesCount} new invoices`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if this is a cron job request
    const body = await req.json().catch(() => ({}));
    const isCronJob = body.source === "cron";

    let organizationId: string;
    let serviceClient: SupabaseClient;
    let emailSettings: EmailSettings | null = null;

    // Create service client for database operations
    serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const encryptionKey = Deno.env.get("EMAIL_ENCRYPTION_KEY");
    if (!encryptionKey) {
      console.error("EMAIL_ENCRYPTION_KEY not configured");
      return new Response(JSON.stringify({ error: "Encryption not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (isCronJob) {
      // === CRON MODE: Process all active organizations ===
      console.info("[CRON] Running in cron mode - processing all active organizations");
      
      const { data: allSettings, error: settingsError } = await serviceClient
        .from("organization_email_settings")
        .select("*")
        .eq("is_active", true);

      if (settingsError) {
        console.error("[CRON] Failed to fetch email settings:", settingsError);
        return new Response(JSON.stringify({ error: "Failed to fetch email settings" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!allSettings || allSettings.length === 0) {
        console.info("[CRON] No active email settings found");
        return new Response(JSON.stringify({ 
          success: true, 
          message: "Keine aktiven E-Mail-Einstellungen konfiguriert",
          organizationsProcessed: 0 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.info(`[CRON] Found ${allSettings.length} organizations with active email settings`);

      // Process each organization
      const results: { org: string; success: boolean; message: string }[] = [];
      
      for (const settings of allSettings) {
        try {
          console.info(`[CRON] Processing organization ${settings.organization_id}...`);
          const result = await processOrganizationEmails(
            serviceClient, 
            settings as EmailSettings, 
            encryptionKey,
            true
          );
          results.push({
            org: settings.organization_id,
            success: true,
            message: result.message,
          });
        } catch (orgError: unknown) {
          const err = orgError instanceof Error ? orgError : new Error(String(orgError));
          console.error(`[CRON] Error processing org ${settings.organization_id}:`, err.message);
          results.push({
            org: settings.organization_id,
            success: false,
            message: err.message,
          });
        }
      }

      return new Response(JSON.stringify({
        success: true,
        mode: "cron",
        organizationsProcessed: allSettings.length,
        results,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else {
      // === MANUAL MODE: Use user authentication ===
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

      // Get user's organization
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

      organizationId = profile.organization_id;

      // Get email settings for this organization
      const { data: settings, error: settingsError } = await serviceClient
        .from("organization_email_settings")
        .select("*")
        .eq("organization_id", organizationId)
        .maybeSingle();

      if (settingsError) {
        console.error("Failed to fetch email settings:", settingsError);
        return new Response(JSON.stringify({ error: "Failed to fetch email settings" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!settings) {
        return new Response(JSON.stringify({ 
          error: "Keine E-Mail-Einstellungen konfiguriert. Bitte konfigurieren Sie diese unter Einstellungen → Kommunikation → Rechnungs-E-Mail." 
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      emailSettings = settings as EmailSettings;

      // Process this organization's emails
      const result = await processOrganizationEmails(
        serviceClient, 
        emailSettings, 
        encryptionKey,
        false
      );

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("check-invoice-emails error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Process emails for a single organization
async function processOrganizationEmails(
  serviceClient: SupabaseClient,
  emailSettings: EmailSettings,
  encryptionKey: string,
  isCronJob: boolean
): Promise<{ success: boolean; message: string; foundPdfs?: number; skipped?: number; processing?: boolean; statusId?: string }> {
  const organizationId = emailSettings.organization_id;
  
  // Decrypt password
  const imapPass = await decryptPassword(emailSettings.imap_password_encrypted, encryptionKey);
  const imapHost = emailSettings.imap_host;
  const imapPort = emailSettings.imap_port || 993;
  const imapUser = emailSettings.imap_user;
  const mailbox = emailSettings.mailbox || "INBOX";

  console.info(`[${isCronJob ? 'CRON' : 'MANUAL'}] Connecting to IMAP server ${imapHost}:${imapPort} for org ${organizationId}...`);

  const imap = new SimpleImapClient(imapHost, imapPort, imapUser, imapPass);
  await imap.connect();
  await imap.selectMailbox(mailbox);

  // Search for emails from the last 30 days
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - 30);
  
  const emailSeqNums = await imap.searchSince(sinceDate);
  
  // Collect emails to process (with PDFs)
  const emailsToProcess: EmailToProcess[] = [];
  let skippedCount = 0;
  let noAttachmentCount = 0;
  const errors: string[] = [];

  // Phase 1: Quick scan of emails to find those with PDFs
  console.info(`[PHASE 1] Scanning ${emailSeqNums.length} emails for PDFs...`);
  
  for (const seqNum of emailSeqNums) {
    try {
      const { envelope, bodystructure } = await imap.fetchMessage(seqNum);
      const { subject, from, messageId } = parseEnvelope(envelope);

      console.info(`Scanning email #${seqNum}: "${subject}" from ${from}`);

      // Check if already processed
      const { data: existingLogs } = await serviceClient
        .from("invoice_email_log")
        .select("id")
        .eq("organization_id", organizationId)
        .or(`message_id.eq.${messageId},message_id.like.${messageId}-%`)
        .limit(1);

      if (existingLogs && existingLogs.length > 0) {
        console.info(`Email ${messageId} already processed, skipping`);
        skippedCount++;
        await imap.markAsSeen(seqNum);
        continue;
      }

      // Check for PDF attachments
      if (!hasPdfAttachment(bodystructure)) {
        console.info("No PDF attachments found in email");
        
        // Log as processed without invoice
        await serviceClient.from("invoice_email_log").insert({
          organization_id: organizationId,
          message_id: messageId,
          email_from: from,
          email_subject: subject,
          status: "no_attachment",
        });

        await imap.markAsSeen(seqNum);
        noAttachmentCount++;
        continue;
      }

      // Fetch full message to extract PDF
      console.info("Fetching full message for PDF extraction...");
      const fullMessage = await imap.fetchFullMessage(seqNum);
      console.info("Full message length:", fullMessage.length);
      
      const pdfContents = extractPdfFromMime(fullMessage);

      if (pdfContents.length === 0) {
        console.error("Could not extract any PDF content from email");
        
        await serviceClient.from("invoice_email_log").insert({
          organization_id: organizationId,
          message_id: messageId,
          email_from: from,
          email_subject: subject,
          status: "extraction_failed",
          error_message: "Could not extract PDF content from email",
        });
        errors.push(`Failed to extract PDF from: ${subject}`);
        
        await imap.markAsSeen(seqNum);
        continue;
      }

      console.info(`Found ${pdfContents.length} PDF(s) in email`);

      // Find matching supplier by email
      const { data: supplier } = await serviceClient
        .from("suppliers")
        .select("id")
        .eq("organization_id", organizationId)
        .or(`email.eq.${from},invoice_email.eq.${from}`)
        .maybeSingle();

      // Add to processing queue
      emailsToProcess.push({
        seqNum,
        subject,
        from,
        messageId,
        fullMessage,
        pdfContents,
        supplierId: supplier?.id || null,
      });

    } catch (emailError: unknown) {
      const error = emailError instanceof Error ? emailError : new Error(String(emailError));
      console.error(`Error scanning email ${seqNum}:`, error.message);
      errors.push(`Error scanning email: ${error.message}`);
      await imap.markAsSeen(seqNum);
    }
  }

  // Calculate total PDFs to process
  const totalPdfs = emailsToProcess.reduce((sum, email) => sum + email.pdfContents.length, 0);
  
  console.info(`[PHASE 1 COMPLETE] Found ${totalPdfs} PDFs in ${emailsToProcess.length} emails`);

  // Update last check timestamp
  await serviceClient
    .from("organization_email_settings")
    .update({ last_checked_at: new Date().toISOString() })
    .eq("organization_id", organizationId);

  // If no PDFs to process, return immediately
  if (totalPdfs === 0) {
    await imap.logout();

    const mode = isCronJob ? "[CRON]" : "[MANUAL]";
    console.info(`${mode} No PDFs to process: ${skippedCount} skipped, ${noAttachmentCount} without attachments`);

    return {
      success: true,
      message: "E-Mails geprüft, keine neuen PDFs gefunden",
      foundPdfs: 0,
      skipped: skippedCount,
      processing: false,
    };
  }

  // Create processing status record for real-time progress tracking
  const { data: statusRecord, error: statusError } = await serviceClient
    .from("invoice_processing_status")
    .insert({
      organization_id: organizationId,
      total_pdfs: totalPdfs,
      processed_pdfs: 0,
      new_invoices: 0,
      skipped_duplicates: skippedCount,
      status: "processing",
    })
    .select()
    .single();

  if (statusError) {
    console.error("Failed to create status record:", statusError);
  }

  const statusId = statusRecord?.id;

  // Start background processing
  if (statusId) {
    // @ts-ignore EdgeRuntime is available in Supabase Edge Functions
    EdgeRuntime.waitUntil(
      processPdfsInBackground(serviceClient, organizationId, emailsToProcess, statusId, imap)
    );
  } else {
    // Fallback: process synchronously if status record failed
    console.warn("Status record creation failed, processing synchronously...");
    await processPdfsInBackground(serviceClient, organizationId, emailsToProcess, "fallback", imap);
  }

  // Return immediate response
  const mode = isCronJob ? "[CRON]" : "[MANUAL]";
  console.info(`${mode} Returning immediate response, processing ${totalPdfs} PDFs in background`);

  return {
    success: true,
    message: `${totalPdfs} PDF(s) gefunden, werden im Hintergrund verarbeitet...`,
    foundPdfs: totalPdfs,
    skipped: skippedCount,
    processing: true,
    statusId: statusId,
  };
}
