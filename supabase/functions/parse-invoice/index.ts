import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvoiceData {
  supplierName: string;
  supplierAddress?: string;
  supplierEmail?: string; // Extract supplier email from invoice
  supplierPhone?: string; // Extract supplier phone from invoice
  customerNumber?: string;
  invoiceNumber: string;
  invoiceDate: string;
  deliveryDate?: string;
  dueDate?: string;
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  currency: string;
  items: Array<{
    position?: number;
    articleName: string;
    articleSku?: string;
    quantity: number;
    unit?: string;
    unitPrice: number;
    totalPrice: number;
    suggestedCategory?: string; // NEW: AI-suggested category
  }>;
}

// Unit normalization mapping
const UNIT_NORMALIZATIONS: Record<string, string> = {
  // Stück variants
  'stück': 'Stk', 'stueck': 'Stk', 'stk': 'Stk', 'st': 'Stk', 'stk.': 'Stk',
  'pcs': 'Stk', 'pc': 'Stk', 'pieces': 'Stk', 'piece': 'Stk', 'each': 'Stk',
  'einheit': 'Stk', 'eh': 'Stk',
  // Kilogram variants
  'kilogramm': 'kg', 'kilo': 'kg', 'kg': 'kg',
  // Gram variants
  'gramm': 'g', 'gr': 'g', 'g': 'g',
  // Liter variants
  'liter': 'l', 'lt': 'l', 'ltr': 'l', 'l': 'l',
  // Milliliter variants
  'milliliter': 'ml', 'ml': 'ml',
  // Flasche variants
  'flasche': 'Fl', 'fl': 'Fl', 'fla': 'Fl', 'flaschen': 'Fl', 'bottle': 'Fl', 'btl': 'Fl',
  // Package variants
  'packung': 'Pck', 'paket': 'Pck', 'pack': 'Pck', 'pck': 'Pck', 'pkg': 'Pck', 'pk': 'Pck',
  // Karton variants
  'karton': 'Krt', 'krt': 'Krt', 'ktn': 'Krt', 'carton': 'Krt', 'ctn': 'Krt', 'box': 'Krt',
  // Dose variants
  'dose': 'Ds', 'ds': 'Ds', 'can': 'Ds',
  // Bund variants
  'bund': 'Bd', 'bd': 'Bd', 'bunch': 'Bd',
  // Portion variants
  'portion': 'Por', 'por': 'Por',
  // Meter variants
  'meter': 'm', 'm': 'm',
};

function normalizeUnit(unit: string | undefined | null): string {
  if (!unit) return 'Stk';
  const normalized = UNIT_NORMALIZATIONS[unit.toLowerCase().trim()];
  return normalized || unit; // Keep original if not found
}

// Sanitize JSON string by removing non-ASCII characters outside of string literals
// This fixes corruption issues like Greek characters appearing in JSON keys
function sanitizeJsonString(json: string): string {
  let result = '';
  let inString = false;
  let escape = false;
  
  for (let i = 0; i < json.length; i++) {
    const char = json[i];
    const code = json.charCodeAt(i);
    
    if (escape) {
      result += char;
      escape = false;
      continue;
    }
    
    if (char === '\\' && inString) {
      result += char;
      escape = true;
      continue;
    }
    
    if (char === '"') {
      inString = !inString;
      result += char;
      continue;
    }
    
    if (inString) {
      // Inside strings: keep most characters, but replace control chars
      if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
        result += ' '; // Replace control chars with space
      } else {
        result += char;
      }
    } else {
      // Outside strings: only allow valid JSON structural characters
      // Valid: whitespace, digits, {, }, [, ], :, ,, ., -, +, e, E, true/false/null chars, "
      if (/[\s\d{}[\]:,.\-+eEtrufalsn"]/.test(char)) {
        result += char;
      }
      // Skip any other characters (like Εί. or other non-ASCII)
    }
  }
  return result;
}

// Fuzzy matching for article names to detect duplicates
function normalizeArticleName(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getArticleTokens(name: string): string[] {
  return normalizeArticleName(name)
    .split(' ')
    .filter(t => t.length >= 3);
}

function calculateArticleSimilarity(name1: string, name2: string): number {
  const tokens1 = getArticleTokens(name1);
  const tokens2 = getArticleTokens(name2);
  
  if (tokens1.length === 0 || tokens2.length === 0) return 0;
  
  let matches = 0;
  for (const t1 of tokens1) {
    for (const t2 of tokens2) {
      if (t1 === t2 || (t1.length >= 5 && t2.length >= 5 && (t1.includes(t2) || t2.includes(t1)))) {
        matches++;
        break;
      }
    }
  }
  
  // Calculate Jaccard-like similarity
  const totalUniqueTokens = new Set([...tokens1, ...tokens2]).size;
  return (matches / totalUniqueTokens) * 100;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Check both Authorization header and apikey header
    const authHeader = req.headers.get('Authorization');
    const apiKeyHeader = req.headers.get('apikey');
    
    // Service-role call: apikey header contains service-role-key (from functions.invoke())
    // OR: Authorization header contains service-role-key
    const isServiceRoleViaApiKey = apiKeyHeader === supabaseServiceKey;
    const isServiceRoleViaAuth = authHeader && authHeader.replace('Bearer ', '') === supabaseServiceKey;
    const isServiceRoleCall = isServiceRoleViaApiKey || isServiceRoleViaAuth;
    
    // If no auth header and not a service-role call, reject
    if (!authHeader && !isServiceRoleCall) {
      console.log('No authorization - authHeader:', !!authHeader, 'apiKeyHeader:', !!apiKeyHeader);
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse request body first to get invoiceId
    const { invoiceId, pdfUrl, pdfBase64 } = await req.json();

    if (!invoiceId) {
      return new Response(JSON.stringify({ error: 'invoiceId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determine organization_id - either from user auth or from invoice
    let organizationId: string;
    
    if (isServiceRoleCall) {
      // Service-role call (from check-invoice-emails) - get organization from invoice
      console.log('Service-role call detected, getting organization from invoice');
      const { data: invoice, error: invoiceError } = await supabaseClient
        .from('invoices')
        .select('organization_id')
        .eq('id', invoiceId)
        .single();
      
      if (invoiceError || !invoice?.organization_id) {
        console.error('Failed to get invoice organization:', invoiceError);
        return new Response(JSON.stringify({ error: 'Invoice not found or has no organization' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      organizationId = invoice.organization_id;
      console.log('Got organization from invoice:', organizationId);
    } else {
      // User auth call - get organization from user profile
      const token = authHeader!.replace('Bearer ', '');
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

      // Verify user JWT (pass token explicitly; edge runtime has no session)
      const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
      const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

      if (authError || !user) {
        console.error('User auth failed:', authError?.message);
        return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) {
        return new Response(JSON.stringify({ error: 'No organization found' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      organizationId = profile.organization_id;
    }

    if (!invoiceId) {
      return new Response(JSON.stringify({ error: 'invoiceId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update invoice status to processing
    await supabaseClient
      .from('invoices')
      .update({ status: 'processing' })
      .eq('id', invoiceId);

    console.log('Processing invoice:', invoiceId);

    // Get PDF URL or base64 - if not provided, fetch from database
    let finalPdfUrl = pdfUrl;
    let finalPdfBase64 = pdfBase64;
    
    if (!finalPdfUrl && !finalPdfBase64) {
      console.log('No pdfUrl or pdfBase64 provided, fetching from invoice record');
      const { data: invoiceRecord, error: fetchError } = await supabaseClient
        .from('invoices')
        .select('pdf_url')
        .eq('id', invoiceId)
        .single();
      
      if (fetchError || !invoiceRecord?.pdf_url) {
        console.error('Failed to fetch invoice PDF URL:', fetchError);
        await supabaseClient
          .from('invoices')
          .update({ status: 'pending', notes: 'PDF URL nicht gefunden' })
          .eq('id', invoiceId);
        return new Response(JSON.stringify({ error: 'Invoice has no PDF URL and none was provided' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      finalPdfUrl = invoiceRecord.pdf_url;
      console.log('Using PDF URL from database:', finalPdfUrl);
    }

    // If we have a URL but no base64, download the PDF and convert to base64
    // (Gemini doesn't support PDF URLs directly, only base64)
    if (finalPdfUrl && !finalPdfBase64) {
      console.log('Downloading PDF from URL to convert to base64...');
      try {
        const pdfResponse = await fetch(finalPdfUrl);
        if (!pdfResponse.ok) {
          throw new Error(`Failed to download PDF: ${pdfResponse.status}`);
        }
        const pdfBuffer = await pdfResponse.arrayBuffer();
        const uint8Array = new Uint8Array(pdfBuffer);
        
        // Convert to base64
        let binary = '';
        for (let i = 0; i < uint8Array.length; i++) {
          binary += String.fromCharCode(uint8Array[i]);
        }
        finalPdfBase64 = btoa(binary);
        console.log('PDF converted to base64, length:', finalPdfBase64.length);
      } catch (downloadError) {
        console.error('Failed to download PDF:', downloadError);
        await supabaseClient
          .from('invoices')
          .update({ status: 'pending', notes: 'PDF konnte nicht heruntergeladen werden' })
          .eq('id', invoiceId);
        return new Response(JSON.stringify({ error: 'Failed to download PDF for processing' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Clean up existing data before re-parsing (to avoid duplicates)
    console.log('Cleaning up existing invoice data before parsing...');
    
    // Delete existing discrepancies
    await supabaseClient
      .from('invoice_discrepancies')
      .delete()
      .eq('invoice_id', invoiceId);
    
    // Delete existing items
    await supabaseClient
      .from('invoice_items')
      .delete()
      .eq('invoice_id', invoiceId);
    
    // Reset matched order
    await supabaseClient
      .from('invoices')
      .update({ matched_order_id: null })
      .eq('id', invoiceId);

    // Prepare content for AI - always use base64 for PDFs (Gemini doesn't support PDF URLs)
    let pdfContent: { type: string; image_url?: { url: string }; text?: string }[];
    
    if (finalPdfBase64) {
      pdfContent = [
        {
          type: "image_url",
          image_url: { url: `data:application/pdf;base64,${finalPdfBase64}` }
        }
      ];
    } else {
      return new Response(JSON.stringify({ error: 'pdfUrl or pdfBase64 is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call Lovable AI to extract invoice data - NOW INCLUDING customerNumber
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          {
            role: 'system',
            content: `You are an expert invoice parser. Extract structured data from invoice PDFs/images.

Return ONLY valid JSON (no markdown fences, no commentary, no backticks).

Extract the following information and return as JSON:
{
  "supplierName": "Supplier/vendor company name",
  "supplierAddress": "Full supplier address if visible",
  "supplierEmail": "Supplier email address if visible (look in header, footer, contact info)",
  "supplierPhone": "Supplier phone number if visible (look for 'Tel.', 'Telefon', 'Tel:', 'Phone', 'Fon', 'T:', 'T.' in header, footer, contact section)",
  "customerNumber": "Customer number if visible (look for 'Kunden-Nr.', 'Kundennummer', 'Kd.-Nr.', 'Kd.Nr.', 'Customer No.', 'Kundenkonto', 'Debitor-Nr.')",
  "invoiceNumber": "Invoice/bill number",
  "invoiceDate": "Invoice date in YYYY-MM-DD format",
  "deliveryDate": "Delivery date in YYYY-MM-DD format if shown",
  "dueDate": "Payment due date in YYYY-MM-DD format if shown",
  "netAmount": numeric value (net total without VAT),
  "vatAmount": numeric value (VAT/tax amount),
  "grossAmount": numeric value (total including VAT),
  "currency": "EUR" or other currency code,
  "items": [
    {
      "position": position number if shown,
      "articleName": "Product/article name",
      "articleSku": "SKU/article number if shown",
      "quantity": numeric quantity,
      "unit": "unit like Stk, kg, Fl, etc",
      "unitPrice": numeric unit price,
      "totalPrice": numeric line total,
      "suggestedCategory": "Suggest a food/beverage category in German based on the article name. Categories: Fleisch, Fisch, Gemüse, Obst, Milchprodukte, Backwaren, Getränke, Wein, Bier, Spirituosen, Gewürze, Öle, Konserven, Tiefkühl, Trockenprodukte, Reinigung, Verbrauchsmaterial, Sonstiges"
    }
  ]
}

Important:
- Parse ALL line items from the invoice
- Use numeric values without currency symbols
- If a value is unclear or missing, use null
- Parse German date formats (DD.MM.YYYY) to YYYY-MM-DD
- Normalize units to standard forms: Stk (piece), kg, g, l, ml, Fl (bottle), Pck (package), Krt (carton)
- Look carefully for customer number - it identifies which location this invoice belongs to
- Extract supplier email from the invoice header, footer, or contact section
- Extract supplier phone number from the invoice header, footer, or contact section
- Suggest a category for each item based on its name (use German category names)`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Please extract all data from this invoice:' },
              ...pdfContent
            ]
          }
        ],
        temperature: 0.1,
        // Increase token budget to avoid truncated JSON for invoices with many line items
        max_tokens: 16000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      await supabaseClient
        .from('invoices')
        .update({ status: 'pending', notes: 'AI parsing failed: ' + errorText })
        .eq('id', invoiceId);
      
      return new Response(JSON.stringify({ error: 'AI parsing failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content;

    console.log('AI response received (first 500 chars):', (aiContent ?? '').substring(0, 500));

    // Parse the JSON from AI response
    let invoiceData: InvoiceData;
    try {
      // Extract JSON from potential markdown code blocks
      let jsonContent = aiContent ?? '';

      // Remove markdown code block wrapper if present
      if (jsonContent.includes('```')) {
        const codeBlockMatch = jsonContent.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
        if (codeBlockMatch && codeBlockMatch[1]) {
          jsonContent = codeBlockMatch[1];
        } else {
          // Fallback: just strip the backticks and json marker
          jsonContent = jsonContent.replace(/```json\s*/g, '').replace(/```/g, '');
        }
      }

      // If the model added any leading/trailing text, keep only the outermost JSON object
      const firstBrace = jsonContent.indexOf('{');
      const lastBrace = jsonContent.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonContent = jsonContent.slice(firstBrace, lastBrace + 1);
      }

      console.log('Cleaned JSON content (first 500 chars):', jsonContent.substring(0, 500));
      
      // Sanitize JSON to remove any non-ASCII characters outside strings (fixes corruption)
      jsonContent = sanitizeJsonString(jsonContent);
      console.log('Sanitized JSON content (first 500 chars):', jsonContent.substring(0, 500));
      
      // Try to parse the JSON, with repair fallback for truncated responses
      try {
        invoiceData = JSON.parse(jsonContent.trim());
      } catch (initialParseError) {
        console.log('Initial parse failed, attempting JSON repair...');
        
        // Try to repair truncated JSON (common when items array is cut off)
        let repairedJson = jsonContent.trim();
        
        // Remove trailing commas before ] or }
        repairedJson = repairedJson.replace(/,\s*([\]}])/g, '$1');
        
        // Count open/close braces and brackets
        const openBraces = (repairedJson.match(/{/g) || []).length;
        const closeBraces = (repairedJson.match(/}/g) || []).length;
        const openBrackets = (repairedJson.match(/\[/g) || []).length;
        const closeBrackets = (repairedJson.match(/]/g) || []).length;
        
        // If we're inside an incomplete object in an array, remove it
        if (openBraces > closeBraces || openBrackets > closeBrackets) {
          // Find the last complete object in items array
          const itemsMatch = repairedJson.match(/"items"\s*:\s*\[/);
          if (itemsMatch) {
            const itemsStart = repairedJson.indexOf(itemsMatch[0]);
            const afterItems = repairedJson.substring(itemsStart + itemsMatch[0].length);
            
            // Find all complete objects {...}
            let depth = 0;
            let lastCompleteEnd = -1;
            let inString = false;
            let escape = false;
            
            for (let i = 0; i < afterItems.length; i++) {
              const char = afterItems[i];
              
              if (escape) {
                escape = false;
                continue;
              }
              
              if (char === '\\') {
                escape = true;
                continue;
              }
              
              if (char === '"' && !escape) {
                inString = !inString;
                continue;
              }
              
              if (inString) continue;
              
              if (char === '{') {
                depth++;
              } else if (char === '}') {
                depth--;
                if (depth === 0) {
                  lastCompleteEnd = i;
                }
              }
            }
            
            if (lastCompleteEnd >= 0) {
              // Rebuild JSON with only complete items
              const completeItems = afterItems.substring(0, lastCompleteEnd + 1);
              repairedJson = repairedJson.substring(0, itemsStart + itemsMatch[0].length) + completeItems + ']}';
              console.log('Repaired JSON by closing items array after last complete item');
            }
          }
        }
        
        // Add missing closing brackets/braces
        const newOpenBrackets = (repairedJson.match(/\[/g) || []).length;
        const newCloseBrackets = (repairedJson.match(/]/g) || []).length;
        const newOpenBraces = (repairedJson.match(/{/g) || []).length;
        const newCloseBraces = (repairedJson.match(/}/g) || []).length;
        
        for (let i = 0; i < newOpenBrackets - newCloseBrackets; i++) {
          repairedJson += ']';
        }
        for (let i = 0; i < newOpenBraces - newCloseBraces; i++) {
          repairedJson += '}';
        }
        
        // Remove any trailing commas again after repair
        repairedJson = repairedJson.replace(/,\s*([\]}])/g, '$1');
        
        console.log('Attempting to parse repaired JSON (last 200 chars):', repairedJson.slice(-200));
        invoiceData = JSON.parse(repairedJson);
        console.log('JSON repair successful!');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response even after repair:', parseError);
      
      // Fallback: Try to extract at least header data
      let headerData: Partial<InvoiceData> = {};
      const rawContent = aiContent ?? '';
      
      // Try to extract key fields with regex
      const supplierMatch = rawContent.match(/"supplierName"\s*:\s*"([^"]+)"/);
      const invoiceNumMatch = rawContent.match(/"invoiceNumber"\s*:\s*"([^"]+)"/);
      const customerNumMatch = rawContent.match(/"customerNumber"\s*:\s*"([^"]+)"/);
      const grossMatch = rawContent.match(/"grossAmount"\s*:\s*([\d.]+)/);
      const netMatch = rawContent.match(/"netAmount"\s*:\s*([\d.]+)/);
      const vatMatch = rawContent.match(/"vatAmount"\s*:\s*([\d.]+)/);
      const dateMatch = rawContent.match(/"invoiceDate"\s*:\s*"([^"]+)"/);
      
      if (supplierMatch) headerData.supplierName = supplierMatch[1];
      if (invoiceNumMatch) headerData.invoiceNumber = invoiceNumMatch[1];
      if (customerNumMatch) headerData.customerNumber = customerNumMatch[1];
      if (grossMatch) headerData.grossAmount = parseFloat(grossMatch[1]);
      if (netMatch) headerData.netAmount = parseFloat(netMatch[1]);
      if (vatMatch) headerData.vatAmount = parseFloat(vatMatch[1]);
      if (dateMatch) headerData.invoiceDate = dateMatch[1];
      headerData.items = []; // Empty items since we couldn't parse them
      headerData.currency = 'EUR';
      
      const hasMinimumData = headerData.supplierName && (headerData.invoiceNumber || headerData.grossAmount);
      
      if (hasMinimumData) {
        console.log('Fallback: Extracted header data:', headerData);
        invoiceData = headerData as InvoiceData;
        
        // Add note about partial parsing
        await supabaseClient
          .from('invoices')
          .update({ 
            notes: 'Teilweise geparst - Artikelpositionen konnten nicht vollständig gelesen werden',
            parsed_data: { raw: rawContent, extracted: headerData }
          })
          .eq('id', invoiceId);
      } else {
        console.error('Could not extract minimum header data');
        await supabaseClient
          .from('invoices')
          .update({ 
            status: 'pending', 
            notes: 'Parsing fehlgeschlagen - bitte manuell prüfen', 
            parsed_data: { raw: rawContent } 
          })
          .eq('id', invoiceId);
        
        return new Response(JSON.stringify({ error: 'Failed to parse invoice data' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    console.log('Extracted customer number:', invoiceData.customerNumber);

    // Find matching supplier by name with improved fuzzy matching
    const { data: suppliers } = await supabaseClient
      .from('suppliers')
      .select('id, name, phone, address')
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    // Stop words - legal entity designators that should be ignored during matching
    const stopWords = new Set([
      'gmbh', 'ag', 'kg', 'ohg', 'gbr', 'ltd', 'inc', 'co', 'se', 'ug', 'mbh',
      'e.v', 'ev', 'und', 'and', 'the', 'der', 'die', 'das', 'handels', 'handel',
      'vertriebs', 'vertrieb', 'import', 'export', 'international', 'deutschland',
      'germany', 'europe', 'europa'
    ]);

    // Helper function to normalize German umlauts and special characters
    const normalizeGerman = (str: string): string => {
      return str
        .toLowerCase()
        .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/é/g, 'e').replace(/è/g, 'e').replace(/ê/g, 'e')
        .replace(/á/g, 'a').replace(/à/g, 'a').replace(/â/g, 'a')
        .replace(/[^a-z0-9]/g, ' ') // Replace special chars with spaces
        .replace(/\s+/g, ' ')       // Collapse multiple spaces
        .trim();
    };

    // Alternative normalization (umlaut to single char)
    const normalizeSimple = (str: string): string => {
      return str
        .toLowerCase()
        .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u')
        .replace(/ß/g, 'ss')
        .replace(/é/g, 'e').replace(/è/g, 'e').replace(/ê/g, 'e')
        .replace(/á/g, 'a').replace(/à/g, 'a').replace(/â/g, 'a')
        .replace(/[^a-z0-9]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    };

    // Extract tokens (words) from a string, filtering out stop words
    const getTokens = (str: string): string[] => {
      return str.split(' ')
        .filter(t => t.length >= 3)
        .filter(t => !stopWords.has(t));
    };

    // Get characteristic tokens (longer, more unique words)
    const getCharacteristicTokens = (tokens: string[]): string[] => {
      return tokens.filter(t => t.length >= 5);
    };

    let matchedSupplierId: string | null = null;
    let supplierAutoCreated = false;
    
    if (suppliers && invoiceData.supplierName) {
      const invoiceSupplierName = invoiceData.supplierName;
      const invoiceNormalized1 = normalizeGerman(invoiceSupplierName);
      const invoiceNormalized2 = normalizeSimple(invoiceSupplierName);
      const invoiceTokens1 = getTokens(invoiceNormalized1);
      const invoiceTokens2 = getTokens(invoiceNormalized2);
      const allInvoiceTokens = [...new Set([...invoiceTokens1, ...invoiceTokens2])];
      const characteristicInvoiceTokens = getCharacteristicTokens(allInvoiceTokens);

      console.log('Matching supplier:', invoiceSupplierName);
      console.log('Normalized tokens (filtered):', allInvoiceTokens);
      console.log('Characteristic tokens (>=5 chars):', characteristicInvoiceTokens);

      // Try to find best match
      let bestMatch: { supplier: typeof suppliers[0]; score: number; matchDetails: string } | null = null;

      for (const supplier of suppliers) {
        const supplierNormalized1 = normalizeGerman(supplier.name);
        const supplierNormalized2 = normalizeSimple(supplier.name);
        const supplierTokens1 = getTokens(supplierNormalized1);
        const supplierTokens2 = getTokens(supplierNormalized2);
        const allSupplierTokens = [...new Set([...supplierTokens1, ...supplierTokens2])];

        let score = 0;
        let matchDetails = '';

        // Check 1: Direct substring match (normalized) - only for substantial strings
        if (invoiceNormalized1.length >= 10 && supplierNormalized1.length >= 10) {
          if (supplierNormalized1.includes(invoiceNormalized1) || invoiceNormalized1.includes(supplierNormalized1)) {
            score = 100;
            matchDetails = 'direct substring match';
          } else if (supplierNormalized2.includes(invoiceNormalized2) || invoiceNormalized2.includes(supplierNormalized2)) {
            score = 100;
            matchDetails = 'direct substring match (simple)';
          }
        }

        // Check 2: Token-based matching with improved logic
        if (score === 0) {
          // Count matching tokens
          const matchedTokens: string[] = [];
          
          for (const invToken of allInvoiceTokens) {
            for (const supToken of allSupplierTokens) {
              // Exact token match
              if (invToken === supToken) {
                if (!matchedTokens.includes(invToken)) {
                  matchedTokens.push(invToken);
                }
              }
              // Token contains the other (only for longer tokens - stricter: min 7 chars)
              else if (invToken.length >= 7 && supToken.length >= 7) {
                if (invToken.includes(supToken) || supToken.includes(invToken)) {
                  if (!matchedTokens.includes(invToken)) {
                    matchedTokens.push(invToken);
                  }
                }
              }
            }
          }

          // Calculate score based on number of matched tokens
          if (matchedTokens.length >= 2) {
            // At least 2 tokens match - high confidence
            score = 90;
            matchDetails = `${matchedTokens.length} tokens match: [${matchedTokens.join(', ')}]`;
          } else if (matchedTokens.length === 1) {
            // Single token match - stricter scoring to avoid false positives
            const matchedToken = matchedTokens[0];
            if (matchedToken.length >= 8) {
              // Very long, characteristic token - high score
              score = 70;
              matchDetails = `single very characteristic token match: "${matchedToken}"`;
            } else if (matchedToken.length >= 6) {
              // Medium token - below threshold to force new supplier creation
              score = 55;
              matchDetails = `single medium token match: "${matchedToken}" (below threshold)`;
            } else {
              // Short token - low score, likely false positive
              score = 40;
              matchDetails = `single short token match: "${matchedToken}" (below threshold)`;
            }
          }
        }

        if (score >= 40) {
          console.log(`Supplier "${supplier.name}" score: ${score} (${matchDetails})`);
        }

        if (score > 0 && (!bestMatch || score > bestMatch.score)) {
          bestMatch = { supplier, score, matchDetails };
        }
      }

      if (bestMatch && bestMatch.score >= 60) {
        matchedSupplierId = bestMatch.supplier.id;
        console.log('✅ Matched supplier:', bestMatch.supplier.name, 'with score:', bestMatch.score, '-', bestMatch.matchDetails);
        
        // Update supplier with missing contact info from invoice
        const supplierUpdates: Record<string, string> = {};
        
        if (invoiceData.supplierPhone && !bestMatch.supplier.phone) {
          supplierUpdates.phone = invoiceData.supplierPhone;
        }
        if (invoiceData.supplierAddress && !bestMatch.supplier.address) {
          supplierUpdates.address = invoiceData.supplierAddress;
        }
        
        if (Object.keys(supplierUpdates).length > 0) {
          console.log('Updating supplier with missing info:', supplierUpdates);
          await supabaseClient
            .from('suppliers')
            .update(supplierUpdates)
            .eq('id', matchedSupplierId);
        }
      } else if (bestMatch) {
        console.log('❌ Best match below threshold:', bestMatch.supplier.name, 'with score:', bestMatch.score, '-', bestMatch.matchDetails);
        console.log('Will create new supplier instead');
      } else {
        console.log('No supplier match found');
      }
    }

    // AUTO-CREATE SUPPLIER if no match found
    if (!matchedSupplierId && invoiceData.supplierName) {
      console.log('Auto-creating supplier:', invoiceData.supplierName);
      
      // Use extracted email or generate a placeholder
      const supplierEmail = invoiceData.supplierEmail && invoiceData.supplierEmail.includes('@') 
        ? invoiceData.supplierEmail 
        : `rechnung@${invoiceData.supplierName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20)}.auto`;
      
      console.log('Using supplier email:', supplierEmail);
      
      const { data: newSupplier, error: supplierError } = await supabaseClient
        .from('suppliers')
        .insert({
          organization_id: organizationId,
          name: invoiceData.supplierName,
          email: supplierEmail,
          phone: invoiceData.supplierPhone || null,
          address: invoiceData.supplierAddress || null,
          is_active: true,
        })
        .select('id')
        .single();
      
      if (supplierError) {
        console.error('Failed to auto-create supplier:', supplierError);
      } else if (newSupplier) {
        matchedSupplierId = newSupplier.id;
        supplierAutoCreated = true;
        console.log('Auto-created supplier with ID:', matchedSupplierId);
      }
    }

    // LOCATION ASSIGNMENT via customer number
    let matchedLocationId: string | null = null;
    
    if (matchedSupplierId && invoiceData.customerNumber) {
      console.log('Looking for location with customer number:', invoiceData.customerNumber);
      
      // Search in supplier_locations for matching customer_number
      const { data: supplierLocation } = await supabaseClient
        .from('supplier_locations')
        .select('location_id')
        .eq('supplier_id', matchedSupplierId)
        .eq('customer_number', invoiceData.customerNumber)
        .single();
      
      if (supplierLocation?.location_id) {
        matchedLocationId = supplierLocation.location_id;
        console.log('Found location via customer number:', matchedLocationId);
      }
    }
    
    // Fallback: If only one location exists, use it
    if (!matchedLocationId) {
      const { data: locations } = await supabaseClient
        .from('locations')
        .select('id')
        .eq('organization_id', organizationId);
      
      if (locations && locations.length === 1) {
        matchedLocationId = locations[0].id;
        console.log('Using single location as fallback:', matchedLocationId);
      }
    }

    // Save customer number to supplier_locations if we have one and found a location
    if (matchedSupplierId && matchedLocationId && invoiceData.customerNumber) {
      const { data: existingSupplierLocation } = await supabaseClient
        .from('supplier_locations')
        .select('id, customer_number')
        .eq('supplier_id', matchedSupplierId)
        .eq('location_id', matchedLocationId)
        .maybeSingle();
      
      if (existingSupplierLocation) {
        // Record exists - update customer_number if missing
        if (!existingSupplierLocation.customer_number) {
          console.log('Updating supplier_location with customer number:', invoiceData.customerNumber);
          await supabaseClient
            .from('supplier_locations')
            .update({ customer_number: invoiceData.customerNumber })
            .eq('id', existingSupplierLocation.id);
        }
      } else {
        // No record exists - create new supplier_location with customer number
        console.log('Creating supplier_location with customer number:', invoiceData.customerNumber);
        await supabaseClient
          .from('supplier_locations')
          .insert({
            supplier_id: matchedSupplierId,
            location_id: matchedLocationId,
            customer_number: invoiceData.customerNumber,
            is_active: true
          });
      }
    }

    // AUTO-CREATE ARTICLES if they don't exist (with fuzzy duplicate detection)
    let articlesCreated = 0;
    let articlesUpdated = 0;
    let articlesMerged = 0;
    
    if (matchedSupplierId && invoiceData.items && invoiceData.items.length > 0) {
      console.log('Checking/creating articles for', invoiceData.items.length, 'items');
      
      // Get existing articles for this supplier
      const { data: existingArticles } = await supabaseClient
        .from('articles')
        .select('id, name, sku, price, category')
        .eq('organization_id', organizationId)
        .eq('supplier_id', matchedSupplierId);
      
      type ArticleRef = { id: string; name: string; sku: string | null; price: number; category: string | null };
      const existingByName = new Map<string, ArticleRef>();
      const existingBySku = new Map<string, ArticleRef>();
      const existingList: ArticleRef[] = existingArticles || [];
      
      if (existingArticles) {
        for (const art of existingArticles) {
          existingByName.set(normalizeArticleName(art.name), art);
          if (art.sku) {
            existingBySku.set(art.sku.toLowerCase(), art);
          }
        }
      }
      
      for (const item of invoiceData.items) {
        if (!item.articleName) continue;
        
        // Normalize the unit from the invoice
        const normalizedUnit = normalizeUnit(item.unit);
        
        // Try to find existing article by SKU first
        let existingArticle: ArticleRef | undefined;
        
        if (item.articleSku) {
          existingArticle = existingBySku.get(item.articleSku.toLowerCase());
        }
        
        // Try exact name match
        if (!existingArticle) {
          existingArticle = existingByName.get(normalizeArticleName(item.articleName));
        }
        
        // Try fuzzy matching to detect similar articles (avoid duplicates)
        if (!existingArticle) {
          let bestMatch: { article: ArticleRef; similarity: number } | null = null;
          
          for (const art of existingList) {
            const similarity = calculateArticleSimilarity(item.articleName, art.name);
            if (similarity >= 70 && (!bestMatch || similarity > bestMatch.similarity)) {
              bestMatch = { article: art, similarity };
            }
          }
          
          if (bestMatch) {
            console.log(`Fuzzy match: "${item.articleName}" -> "${bestMatch.article.name}" (${bestMatch.similarity.toFixed(0)}%)`);
            existingArticle = bestMatch.article;
            articlesMerged++;
          }
        }
        
        if (existingArticle) {
          // Article exists - optionally update price if different
          if (item.unitPrice && Math.abs(Number(existingArticle.price) - item.unitPrice) > 0.01) {
            console.log(`Updating price for "${item.articleName}": ${existingArticle.price} -> ${item.unitPrice}`);
            await supabaseClient
              .from('articles')
              .update({ price: item.unitPrice })
              .eq('id', existingArticle.id);
            articlesUpdated++;
          }
          
          // Update category if not set and AI suggested one
          if (!existingArticle.category && item.suggestedCategory) {
            console.log(`Setting category for "${item.articleName}": ${item.suggestedCategory}`);
            await supabaseClient
              .from('articles')
              .update({ category: item.suggestedCategory })
              .eq('id', existingArticle.id);
          }
        } else {
          // Create new article with normalized unit and AI-suggested category
          console.log(`Creating new article: "${item.articleName}" (unit: ${normalizedUnit}, category: ${item.suggestedCategory || 'none'})`);
          const { data: newArticle, error: articleError } = await supabaseClient
            .from('articles')
            .insert({
              organization_id: organizationId,
              supplier_id: matchedSupplierId,
              name: item.articleName,
              sku: item.articleSku || null,
              unit: normalizedUnit,
              price: item.unitPrice || 0,
              category: item.suggestedCategory || null,
              is_active: true,
            })
            .select('id')
            .single();
          
          if (articleError) {
            console.error('Failed to create article:', articleError);
          } else {
            articlesCreated++;
            // Add to maps for subsequent checks
            const newArtRef = { 
              id: newArticle.id, 
              name: item.articleName, 
              sku: item.articleSku || null, 
              price: item.unitPrice || 0,
              category: item.suggestedCategory || null
            };
            existingByName.set(normalizeArticleName(item.articleName), newArtRef);
            existingList.push(newArtRef);
            
            // Auto-assign new article to all organization locations
            const { data: orgLocations } = await supabaseClient
              .from('locations')
              .select('id')
              .eq('organization_id', organizationId);
            
            if (orgLocations && orgLocations.length > 0) {
              const { error: locError } = await supabaseClient
                .from('article_locations')
                .insert(orgLocations.map(loc => ({
                  article_id: newArticle.id,
                  location_id: loc.id,
                  is_active: true
                })));
              
              if (locError) {
                console.error('Failed to assign article to locations:', locError);
              } else {
                console.log(`Assigned article "${item.articleName}" to ${orgLocations.length} locations`);
              }
            }
          }
        }
      }
      
      console.log(`Articles: ${articlesCreated} created, ${articlesUpdated} updated, ${articlesMerged} merged via fuzzy matching`);
    }

    // Determine initial status based on parsing success
    const hasSupplier = matchedSupplierId !== null;
    const hasItems = invoiceData.items && invoiceData.items.length > 0;
    const initialStatus = hasSupplier && hasItems ? 'matched' : 'pending';
    
    console.log(`Setting initial status to '${initialStatus}' - Supplier: ${hasSupplier}, Items: ${hasItems}`);

    // Build notes for auto-created entities
    const notes: string[] = [];
    if (supplierAutoCreated) {
      notes.push('Lieferant wurde automatisch erstellt - bitte E-Mail-Adresse ergänzen');
    }
    if (articlesCreated > 0) {
      notes.push(`${articlesCreated} Artikel wurden automatisch erstellt`);
    }

    // Update invoice with parsed data
    const { error: updateError } = await supabaseClient
      .from('invoices')
      .update({
        supplier_id: matchedSupplierId,
        location_id: matchedLocationId,
        customer_number: invoiceData.customerNumber || null,
        invoice_number: invoiceData.invoiceNumber,
        invoice_date: invoiceData.invoiceDate || null,
        delivery_date: invoiceData.deliveryDate || null,
        due_date: invoiceData.dueDate || null,
        net_amount: invoiceData.netAmount,
        vat_amount: invoiceData.vatAmount,
        gross_amount: invoiceData.grossAmount,
        currency: invoiceData.currency || 'EUR',
        parsed_data: invoiceData,
        status: initialStatus,
        notes: notes.length > 0 ? notes.join('; ') : null,
      })
      .eq('id', invoiceId);

    if (updateError) {
      console.error('Failed to update invoice:', updateError);
      throw updateError;
    }

    // Insert invoice items
    if (invoiceData.items && invoiceData.items.length > 0) {
      const invoiceItems = invoiceData.items.map((item, index) => ({
        invoice_id: invoiceId,
        position_number: item.position || index + 1,
        article_name: item.articleName,
        article_sku: item.articleSku || null,
        quantity: item.quantity,
        unit: item.unit || 'Stk',
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
      }));

      const { error: itemsError } = await supabaseClient
        .from('invoice_items')
        .insert(invoiceItems);

      if (itemsError) {
        console.error('Failed to insert invoice items:', itemsError);
      }
    }

    // Now try to match with orders and find discrepancies
    if (matchedSupplierId) {
      await matchAndFindDiscrepancies(
        supabaseClient,
        invoiceId,
        matchedSupplierId,
        organizationId,
        invoiceData
      );
    } else {
      // No supplier matched - set status to pending for manual review
      await supabaseClient
        .from('invoices')
        .update({ status: 'pending' })
        .eq('id', invoiceId);
    }

    // Get the final invoice state
    const { data: finalInvoice } = await supabaseClient
      .from('invoices')
      .select(`
        *,
        suppliers (name),
        locations (name),
        invoice_items (*),
        invoice_discrepancies (*)
      `)
      .eq('id', invoiceId)
      .single();

    return new Response(JSON.stringify({ 
      success: true, 
      invoice: finalInvoice,
      parsed: invoiceData,
      autoCreated: {
        supplier: supplierAutoCreated,
        articlesCreated,
        articlesUpdated,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in parse-invoice:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // CRITICAL: Never leave invoice stuck in 'processing' - always update to pending with error
    try {
      const { invoiceId } = await req.clone().json().catch(() => ({}));
      if (invoiceId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
        
        await supabaseClient
          .from('invoices')
          .update({ 
            status: 'pending', 
            notes: `Verarbeitung fehlgeschlagen: ${errorMessage}` 
          })
          .eq('id', invoiceId);
        console.log('Updated invoice status to pending after error');
      }
    } catch (updateError) {
      console.error('Failed to update invoice status after error:', updateError);
    }
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function matchAndFindDiscrepancies(
  supabase: any,
  invoiceId: string,
  supplierId: string,
  organizationId: string,
  invoiceData: InvoiceData
) {
  console.log('Matching invoice with orders for supplier:', supplierId);

  // Get the invoice with items
  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, invoice_items(*)')
    .eq('id', invoiceId)
    .single();

  if (!invoice) return;

  // Find recent orders from this supplier (last 30 days before invoice date)
  const invoiceDate = new Date(invoice.invoice_date || invoice.created_at);
  const startDate = new Date(invoiceDate);
  startDate.setDate(startDate.getDate() - 30);

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .eq('organization_id', organizationId)
    .eq('supplier_id', supplierId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', invoiceDate.toISOString())
    .order('created_at', { ascending: false });

  if (!orders || orders.length === 0) {
    console.log('No matching orders found');
    await supabase
      .from('invoices')
      .update({ status: 'pending', notes: 'Keine passende Bestellung gefunden' })
      .eq('id', invoiceId);
    return;
  }

  // Try to find the best matching order
  const invoiceItems = invoice.invoice_items || [];
  let bestMatchOrder = null;
  let bestMatchScore = 0;

  for (const order of orders) {
    let matchScore = 0;
    for (const invItem of invoiceItems) {
      const orderItem = order.order_items?.find((oi: any) => 
        oi.article_name.toLowerCase().includes(invItem.article_name.toLowerCase()) ||
        invItem.article_name.toLowerCase().includes(oi.article_name.toLowerCase())
      );
      if (orderItem) matchScore++;
    }
    if (matchScore > bestMatchScore) {
      bestMatchScore = matchScore;
      bestMatchOrder = order;
    }
  }

  if (!bestMatchOrder) {
    await supabase
      .from('invoices')
      .update({ status: 'pending', notes: 'Keine passenden Artikel in Bestellungen gefunden' })
      .eq('id', invoiceId);
    return;
  }

  console.log('Best matching order:', bestMatchOrder.order_number, 'score:', bestMatchScore);

  // Update invoice with matched order
  await supabase
    .from('invoices')
    .update({ matched_order_id: bestMatchOrder.id })
    .eq('id', invoiceId);

  // Find discrepancies
  const discrepancies: any[] = [];
  
  for (const invItem of invoiceItems) {
    const orderItem = bestMatchOrder.order_items?.find((oi: any) => 
      oi.article_name.toLowerCase().includes(invItem.article_name.toLowerCase()) ||
      invItem.article_name.toLowerCase().includes(oi.article_name.toLowerCase())
    );

    if (!orderItem) {
      // Extra item on invoice (not in order)
      discrepancies.push({
        invoice_id: invoiceId,
        invoice_item_id: invItem.id,
        discrepancy_type: 'extra_item',
        expected_value: 'nicht bestellt',
        actual_value: `${invItem.quantity} ${invItem.unit} ${invItem.article_name}`,
      });
      continue;
    }

    // Update invoice item with matched order item
    await supabase
      .from('invoice_items')
      .update({ matched_order_item_id: orderItem.id })
      .eq('id', invItem.id);

    // Check quantity
    if (invItem.quantity !== orderItem.quantity) {
      const diff = invItem.quantity - orderItem.quantity;
      discrepancies.push({
        invoice_id: invoiceId,
        invoice_item_id: invItem.id,
        order_item_id: orderItem.id,
        discrepancy_type: 'quantity_mismatch',
        expected_value: `${orderItem.quantity} ${orderItem.unit}`,
        actual_value: `${invItem.quantity} ${invItem.unit}`,
        difference_amount: diff,
        difference_percent: (diff / orderItem.quantity) * 100,
      });
    }

    // Check price
    const orderPrice = Number(orderItem.unit_price);
    const invPrice = Number(invItem.unit_price);
    
    if (orderPrice > 0 && invPrice > 0 && Math.abs(orderPrice - invPrice) > 0.01) {
      const priceDiff = invPrice - orderPrice;
      const pricePercent = (priceDiff / orderPrice) * 100;
      
      discrepancies.push({
        invoice_id: invoiceId,
        invoice_item_id: invItem.id,
        order_item_id: orderItem.id,
        discrepancy_type: priceDiff > 0 ? 'price_increase' : 'price_decrease',
        expected_value: `€${orderPrice.toFixed(2)}`,
        actual_value: `€${invPrice.toFixed(2)}`,
        difference_amount: priceDiff,
        difference_percent: pricePercent,
      });
    }
  }

  // Check for missing items (ordered but not invoiced)
  for (const orderItem of bestMatchOrder.order_items || []) {
    const invoiced = invoiceItems.some((inv: any) => 
      inv.article_name.toLowerCase().includes(orderItem.article_name.toLowerCase()) ||
      orderItem.article_name.toLowerCase().includes(inv.article_name.toLowerCase())
    );
    
    if (!invoiced) {
      discrepancies.push({
        invoice_id: invoiceId,
        order_item_id: orderItem.id,
        discrepancy_type: 'missing_item',
        expected_value: `${orderItem.quantity} ${orderItem.unit} ${orderItem.article_name}`,
        actual_value: 'nicht berechnet',
      });
    }
  }

  // Insert discrepancies
  if (discrepancies.length > 0) {
    const { error } = await supabase
      .from('invoice_discrepancies')
      .insert(discrepancies);
    
    if (error) {
      console.error('Failed to insert discrepancies:', error);
    }

    // Set status to discrepancy
    await supabase
      .from('invoices')
      .update({ status: 'discrepancy' })
      .eq('id', invoiceId);
  } else {
    // No discrepancies - set to matched
    await supabase
      .from('invoices')
      .update({ status: 'matched' })
      .eq('id', invoiceId);
  }

  console.log('Found', discrepancies.length, 'discrepancies');
}
