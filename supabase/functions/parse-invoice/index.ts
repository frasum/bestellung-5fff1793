import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvoiceData {
  supplierName: string;
  supplierAddress?: string;
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
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseAuth = createClient(supabaseUrl, authHeader.replace('Bearer ', ''));

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user's organization
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

    const { invoiceId, pdfUrl, pdfBase64 } = await req.json();

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

    // Prepare content for AI - support both URL and base64
    let pdfContent: { type: string; image_url?: { url: string }; text?: string }[];
    
    if (pdfBase64) {
      pdfContent = [
        {
          type: "image_url",
          image_url: { url: `data:application/pdf;base64,${pdfBase64}` }
        }
      ];
    } else if (pdfUrl) {
      pdfContent = [
        {
          type: "image_url",
          image_url: { url: pdfUrl }
        }
      ];
    } else {
      return new Response(JSON.stringify({ error: 'pdfUrl or pdfBase64 is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call Lovable AI to extract invoice data
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
            
Extract the following information and return as JSON:
{
  "supplierName": "Supplier/vendor company name",
  "supplierAddress": "Full supplier address if visible",
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
      "totalPrice": numeric line total
    }
  ]
}

Important:
- Parse ALL line items from the invoice
- Use numeric values without currency symbols
- If a value is unclear or missing, use null
- Parse German date formats (DD.MM.YYYY) to YYYY-MM-DD
- Common units: Stk (piece), kg, g, l, ml, Fl (bottle), Pck (package), Krt (carton)`
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
        max_tokens: 4000,
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
    
    console.log('AI response:', aiContent);

    // Parse the JSON from AI response
    let invoiceData: InvoiceData;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = aiContent.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, aiContent];
      invoiceData = JSON.parse(jsonMatch[1].trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      await supabaseClient
        .from('invoices')
        .update({ status: 'pending', notes: 'Failed to parse AI response', parsed_data: { raw: aiContent } })
        .eq('id', invoiceId);
      
      return new Response(JSON.stringify({ error: 'Failed to parse invoice data' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find matching supplier by name
    const { data: suppliers } = await supabaseClient
      .from('suppliers')
      .select('id, name')
      .eq('organization_id', profile.organization_id)
      .eq('is_active', true);

    let matchedSupplierId: string | null = null;
    if (suppliers && invoiceData.supplierName) {
      const supplierNameLower = invoiceData.supplierName.toLowerCase();
      const matchedSupplier = suppliers.find(s => 
        s.name.toLowerCase().includes(supplierNameLower) || 
        supplierNameLower.includes(s.name.toLowerCase())
      );
      if (matchedSupplier) {
        matchedSupplierId = matchedSupplier.id;
        console.log('Matched supplier:', matchedSupplier.name);
      }
    }

    // Update invoice with parsed data
    const { error: updateError } = await supabaseClient
      .from('invoices')
      .update({
        supplier_id: matchedSupplierId,
        invoice_number: invoiceData.invoiceNumber,
        invoice_date: invoiceData.invoiceDate || null,
        delivery_date: invoiceData.deliveryDate || null,
        due_date: invoiceData.dueDate || null,
        net_amount: invoiceData.netAmount,
        vat_amount: invoiceData.vatAmount,
        gross_amount: invoiceData.grossAmount,
        currency: invoiceData.currency || 'EUR',
        parsed_data: invoiceData,
        status: 'pending', // Will be updated after matching
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
        profile.organization_id,
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
        invoice_items (*),
        invoice_discrepancies (*)
      `)
      .eq('id', invoiceId)
      .single();

    return new Response(JSON.stringify({ 
      success: true, 
      invoice: finalInvoice,
      parsed: invoiceData 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in parse-invoice:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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
