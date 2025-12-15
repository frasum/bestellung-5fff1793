import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderItem {
  article_id: string | null;
  article_name: string;
  quantity: number;
  unit_price?: number;
  unit?: string;
  is_free_text_item?: boolean;
  free_text_description?: string;
}

interface FreeTextItem {
  name: string;
  quantity: number;
  unit: string;
  supplier_id: string;
}

// Email translations for employee confirmation
const employeeEmailTranslations: Record<string, {
  subject: (supplierName: string) => string;
  heading: string;
  orderNumber: string;
  supplier: string;
  deliveryDate: string;
  timeWindow: string;
  location: string;
  items: string;
  footer: string;
}> = {
  de: {
    subject: (s) => `Bestellung erfolgreich: ${s}`,
    heading: 'Deine Bestellung wurde gesendet!',
    orderNumber: 'Bestellnummer',
    supplier: 'Lieferant',
    deliveryDate: 'Lieferdatum',
    timeWindow: 'Zeitfenster',
    location: 'Standort',
    items: 'Bestellte Artikel',
    footer: 'Diese E-Mail wurde automatisch von Bestellung.pro gesendet.',
  },
  en: {
    subject: (s) => `Order successful: ${s}`,
    heading: 'Your order has been sent!',
    orderNumber: 'Order Number',
    supplier: 'Supplier',
    deliveryDate: 'Delivery Date',
    timeWindow: 'Time Window',
    location: 'Location',
    items: 'Ordered Items',
    footer: 'This email was automatically sent by Bestellung.pro.',
  },
  fr: {
    subject: (s) => `Commande réussie: ${s}`,
    heading: 'Votre commande a été envoyée!',
    orderNumber: 'Numéro de commande',
    supplier: 'Fournisseur',
    deliveryDate: 'Date de livraison',
    timeWindow: 'Créneau horaire',
    location: 'Emplacement',
    items: 'Articles commandés',
    footer: 'Cet email a été envoyé automatiquement par Bestellung.pro.',
  },
  it: {
    subject: (s) => `Ordine riuscito: ${s}`,
    heading: 'Il tuo ordine è stato inviato!',
    orderNumber: 'Numero ordine',
    supplier: 'Fornitore',
    deliveryDate: 'Data di consegna',
    timeWindow: 'Fascia oraria',
    location: 'Posizione',
    items: 'Articoli ordinati',
    footer: 'Questa email è stata inviata automaticamente da Bestellung.pro.',
  },
  th: {
    subject: (s) => `สั่งซื้อสำเร็จ: ${s}`,
    heading: 'คำสั่งซื้อของคุณถูกส่งแล้ว!',
    orderNumber: 'หมายเลขคำสั่งซื้อ',
    supplier: 'ผู้จัดจำหน่าย',
    deliveryDate: 'วันที่จัดส่ง',
    timeWindow: 'ช่วงเวลา',
    location: 'สถานที่',
    items: 'รายการที่สั่งซื้อ',
    footer: 'อีเมลนี้ถูกส่งโดยอัตโนมัติจาก Bestellung.pro',
  },
  vi: {
    subject: (s) => `Đặt hàng thành công: ${s}`,
    heading: 'Đơn hàng của bạn đã được gửi!',
    orderNumber: 'Số đơn hàng',
    supplier: 'Nhà cung cấp',
    deliveryDate: 'Ngày giao hàng',
    timeWindow: 'Khung giờ',
    location: 'Địa điểm',
    items: 'Sản phẩm đã đặt',
    footer: 'Email này được gửi tự động bởi Bestellung.pro.',
  },
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, items, free_items, employee_name, location_id, supplier_id: requestSupplierId, delivery_date, time_window } = await req.json();

    const freeItems = (free_items || []) as FreeTextItem[];
    
    console.log('📥 Received free_items:', JSON.stringify(free_items));
    console.log('📥 Parsed freeItems:', JSON.stringify(freeItems));

    if (!token || (!items?.length && !freeItems.length)) {
      return new Response(
        JSON.stringify({ error: 'Token and items are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!employee_name || !location_id) {
      return new Response(
        JSON.stringify({ error: 'Employee name and location are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing simple order submission:', { token: token.substring(0, 8) + '...', itemCount: items.length, employee_name, location_id, delivery_date, time_window });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify token
    const { data: tokenData, error: tokenError } = await supabase
      .from('simple_order_tokens')
      .select(`
        *,
        supplier:suppliers(id, name, organization_id)
      `)
      .eq('token', token)
      .eq('is_active', true)
      .single();

    if (tokenError || !tokenData) {
      console.log('Invalid token:', tokenError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check expiration
    if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Token has expired' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get an admin user from the organization to use as user_id for the draft/order
    const { data: adminProfile, error: adminError } = await supabase
      .from('profiles')
      .select('id')
      .eq('organization_id', tokenData.organization_id)
      .limit(1)
      .single();

    if (adminError || !adminProfile) {
      console.error('No admin found for organization');
      return new Response(
        JSON.stringify({ error: 'Organization configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supplierId = requestSupplierId || tokenData.supplier_id;

    // Fetch supplier details
    let supplierData: { id: string; name: string; email: string } | null = null;
    if (supplierId) {
      const { data: supplier } = await supabase
        .from('suppliers')
        .select('id, name, email')
        .eq('id', supplierId)
        .single();
      supplierData = supplier;
    }
    const supplierName = supplierData?.name || tokenData.supplier?.name || 'Unbekannt';

    // Fetch location-specific customer number from supplier_locations
    let customerNumber: string | null = null;
    if (supplierId && location_id) {
      const { data: supplierLocation } = await supabase
        .from('supplier_locations')
        .select('customer_number')
        .eq('supplier_id', supplierId)
        .eq('location_id', location_id)
        .maybeSingle();
      customerNumber = supplierLocation?.customer_number || null;
    }

    // Check if employee has auto_approve_orders enabled and get email
    let autoApprove = false;
    let employeeEmail: string | null = null;
    if (tokenData.employee_id) {
      const { data: employee } = await supabase
        .from('employees')
        .select('auto_approve_orders, email')
        .eq('id', tokenData.employee_id)
        .single();
      autoApprove = employee?.auto_approve_orders || false;
      employeeEmail = employee?.email || null;
    }

    console.log(`Auto-approve check: employee_id=${tokenData.employee_id}, auto_approve=${autoApprove}`);

    // Get location name for notification
    let locationName = 'Unbekannt';
    if (location_id) {
      const { data: locationData } = await supabase
        .from('locations')
        .select('name, short_code')
        .eq('id', location_id)
        .single();
      if (locationData) {
        locationName = locationData.short_code || locationData.name;
      }
    }

    if (autoApprove && supplierData) {
      // === AUTO-APPROVE PATH: Create actual order and send email ===
      console.log('Processing as auto-approved order...');

      // Generate order number using database function
      const { data: orderNumberData, error: orderNumberError } = await supabase.rpc('generate_order_number');
      if (orderNumberError) {
        console.error('Error generating order number:', orderNumberError);
        return new Response(
          JSON.stringify({ error: 'Failed to generate order number' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create branded order number with supplier name
      const baseOrderNumber = orderNumberData as string;
      const orderNumber = baseOrderNumber.replace('ORD', supplierData.name.split(' ')[0]);

      // Fetch full article details for pricing
      const articleIds = items.map((item: OrderItem) => item.article_id);
      const { data: articlesData } = await supabase
        .from('articles')
        .select('id, name, price, unit, order_unit_id')
        .in('id', articleIds);

      const articleMap = new Map(articlesData?.map(a => [a.id, a]) || []);

      // Load order units for formatting
      const orderUnitIds = articlesData?.map(a => a.order_unit_id).filter(Boolean) || [];
      let orderUnitsMap = new Map();
      if (orderUnitIds.length > 0) {
        const { data: orderUnits } = await supabase
          .from('order_units')
          .select('id, name, quantity')
          .in('id', orderUnitIds);
        orderUnitsMap = new Map(orderUnits?.map(u => [u.id, u]) || []);
      }

      const formatOrderUnit = (orderUnitId: string | null | undefined) => {
        if (!orderUnitId) return undefined;
        const unit = orderUnitsMap.get(orderUnitId);
        return unit ? unit.name : undefined;
      };

      // Calculate total and prepare order items
      interface PreparedOrderItem {
        article_id: string | null;
        article_name: string;
        quantity: number;
        unit_price: number;
        unit: string;
        total_price: number;
        order_unit?: string;
        is_free_text_item?: boolean;
        free_text_description?: string;
      }
      
      let totalAmount = 0;
      const orderItems: PreparedOrderItem[] = [];
      
      // Process regular items
      for (const item of (items || [])) {
        const article = articleMap.get(item.article_id);
        const unitPrice = article?.price || item.unit_price || 0;
        const totalPrice = unitPrice * item.quantity;
        totalAmount += totalPrice;
        
        orderItems.push({
          article_id: item.article_id,
          article_name: article?.name || item.article_name,
          quantity: item.quantity,
          unit_price: unitPrice,
          unit: article?.unit || item.unit || 'Stk',
          total_price: totalPrice,
          order_unit: formatOrderUnit(article?.order_unit_id),
          is_free_text_item: false,
        });
      }
      
      // Process free text items
      for (const freeItem of freeItems.filter(f => f.supplier_id === supplierId)) {
        orderItems.push({
          article_id: null,
          article_name: freeItem.name,
          quantity: freeItem.quantity,
          unit_price: 0,
          unit: freeItem.unit,
          total_price: 0,
          is_free_text_item: true,
          free_text_description: freeItem.name,
        });
        
        // Create suggestion entry for tracking
        await supabase.from('suggested_articles').insert({
          organization_id: tokenData.organization_id,
          supplier_id: supplierId,
          name: freeItem.name,
          unit: freeItem.unit,
          price: 0,
          status: 'pending',
          source: 'employee',
          employee_id: tokenData.employee_id || null,
          location_id: location_id,
        });
      }

      // Get delivery address - try default first, then any address for the location
      let deliveryAddress = null;
      const { data: defaultAddress } = await supabase
        .from('delivery_addresses')
        .select('*')
        .eq('location_id', location_id)
        .eq('is_default', true)
        .maybeSingle();
      
      deliveryAddress = defaultAddress;
      
      // If no default address, try to get any address for the location
      if (!deliveryAddress) {
        const { data: anyAddress } = await supabase
          .from('delivery_addresses')
          .select('*')
          .eq('location_id', location_id)
          .limit(1)
          .maybeSingle();
        deliveryAddress = anyAddress;
      }

      // Format full delivery address including label/name and address_line2
      let deliveryAddressText = locationName;
      if (deliveryAddress) {
        const parts = [deliveryAddress.label];
        if (deliveryAddress.address_line1) parts.push(deliveryAddress.address_line1);
        if (deliveryAddress.address_line2) parts.push(deliveryAddress.address_line2);
        parts.push(`${deliveryAddress.postal_code} ${deliveryAddress.city}`);
        if (deliveryAddress.country && deliveryAddress.country !== 'Germany') {
          parts.push(deliveryAddress.country);
        }
        deliveryAddressText = parts.join('\n');
      }

      // Fetch organization data (including test_mode_enabled) before creating order
      const { data: orgData } = await supabase
        .from('organizations')
        .select('name, test_mode_enabled')
        .eq('id', tokenData.organization_id)
        .single();

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          organization_id: tokenData.organization_id,
          user_id: adminProfile.id,
          supplier_id: supplierId,
          location_id: location_id,
          order_number: orderNumber,
          delivery_address: deliveryAddressText,
          total_amount: totalAmount,
          status: 'pending',
          notes: `EasyOrder: ${employee_name}${delivery_date ? ` | Lieferdatum: ${delivery_date}` : ''}${time_window ? ` | Zeitfenster: ${time_window}` : ''}`,
          employee_id: tokenData.employee_id || null,
          is_test_order: orgData?.test_mode_enabled || false,
        })
        .select()
        .single();

      if (orderError) {
        console.error('Error creating order:', orderError);
        return new Response(
          JSON.stringify({ error: 'Failed to create order' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create order items with order_id including order_unit for display
      const orderItemsWithOrderId = orderItems.map((item: PreparedOrderItem) => ({
        order_id: order.id,
        article_id: item.article_id,
        article_name: item.article_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        unit: item.unit,
        order_unit: item.order_unit || null,
        total_price: item.total_price,
        is_free_text_item: item.is_free_text_item || false,
        free_text_description: item.free_text_description || null,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsWithOrderId);

      if (itemsError) {
        console.error('Error creating order items:', itemsError);
        // Rollback order
        await supabase.from('orders').delete().eq('id', order.id);
        return new Response(
          JSON.stringify({ error: 'Failed to create order items' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create confirmation token for supplier email button
      const { data: tokenConfirmData } = await supabase
        .from('order_confirmation_tokens')
        .insert({ order_id: order.id })
        .select('token')
        .single();

      // orgData already fetched above with name and test_mode_enabled

      // Send email to supplier
      try {
        const notesText = `EasyOrder: ${employee_name}${delivery_date ? ` | Lieferdatum: ${delivery_date}` : ''}${time_window ? ` | Zeitfenster: ${time_window}` : ''}`;
        
        await supabase.functions.invoke('send-order-email', {
          body: {
            orderId: order.id,
            orderNumber: orderNumber,
            supplierEmail: supplierData.email,
            supplierName: supplierData.name,
            restaurantName: orgData?.name || 'Restaurant',
            deliveryAddress: deliveryAddressText,
            items: orderItems.map((item: PreparedOrderItem) => ({
              article_name: item.article_name,
              quantity: item.quantity,
              unit: item.unit,
              unit_price: item.unit_price,
              total_price: item.total_price,
              order_unit: item.order_unit,
            })),
            totalAmount: totalAmount,
            notes: notesText,
            customerNumber: customerNumber,
            confirmationToken: tokenConfirmData?.token || null,
          },
        });
        
        // Update order to mark email as sent
        await supabase
          .from('orders')
          .update({ email_sent: true, email_sent_at: new Date().toISOString() })
          .eq('id', order.id);
          
        console.log(`Order email sent to ${supplierData.email}`);
      } catch (emailError) {
        console.error('Failed to send order email:', emailError);
        // Don't fail the whole operation, order is created
      }

      // Send confirmation email to employee if they have an email
      if (employeeEmail) {
        try {
          const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
          const lang = tokenData.language || 'de';
          const t = employeeEmailTranslations[lang] || employeeEmailTranslations.de;

          const itemsHtml = orderItems.map((item: PreparedOrderItem) => 
            `<li style="padding: 8px 0; border-bottom: 1px solid #eee;">${item.quantity}× ${item.article_name}</li>`
          ).join('');

          const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"></head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">✓ ${t.heading}</h1>
              </div>
              <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px 0; color: #6b7280;">${t.orderNumber}:</td><td style="padding: 8px 0; font-weight: 600;">${orderNumber}</td></tr>
                  <tr><td style="padding: 8px 0; color: #6b7280;">${t.supplier}:</td><td style="padding: 8px 0;">${supplierData.name}</td></tr>
                  ${delivery_date ? `<tr><td style="padding: 8px 0; color: #6b7280;">${t.deliveryDate}:</td><td style="padding: 8px 0;">${delivery_date}</td></tr>` : ''}
                  ${time_window ? `<tr><td style="padding: 8px 0; color: #6b7280;">${t.timeWindow}:</td><td style="padding: 8px 0;">${time_window}</td></tr>` : ''}
                  <tr><td style="padding: 8px 0; color: #6b7280;">${t.location}:</td><td style="padding: 8px 0;">${locationName}</td></tr>
                </table>
                <h3 style="margin-top: 24px; color: #374151;">${t.items}</h3>
                <ul style="list-style: none; padding: 0; margin: 0;">${itemsHtml}</ul>
              </div>
              <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">${t.footer}</p>
            </body>
            </html>
          `;

          await resend.emails.send({
            from: 'Bestellung.pro <bestellungen@bestellung.pro>',
            to: [employeeEmail],
            subject: t.subject(supplierData.name),
            html: emailHtml,
          });

          console.log(`Employee confirmation email sent to ${employeeEmail}`);
        } catch (employeeEmailError) {
          console.error('Failed to send employee confirmation email:', employeeEmailError);
          // Don't fail - employee confirmation is optional
        }
      }

      console.log(`Auto-approved order created. Order ID: ${order.id}, Order Number: ${orderNumber}`);

      return new Response(
        JSON.stringify({
          success: true,
          auto_approved: true,
          order_id: order.id,
          order_number: orderNumber,
          message: 'Order sent to supplier',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      // === STANDARD PATH: Create cart draft for admin approval ===
      console.log('Processing as pre-order (cart draft)...');

      const draftName = `EasyOrder: ${employee_name}`;
      const notes = `Lieferant: ${supplierName}`;

      const { data: draft, error: draftError } = await supabase
        .from('cart_drafts')
        .insert({
          organization_id: tokenData.organization_id,
          user_id: adminProfile.id,
          location_id: location_id,
          name: draftName,
          notes: notes,
          desired_delivery_date: delivery_date || null,
          desired_time_window: time_window || null,
          employee_id: tokenData.employee_id || null,
        })
        .select()
        .single();

      if (draftError) {
        console.error('Error creating cart draft:', draftError);
        return new Response(
          JSON.stringify({ error: 'Failed to create order draft' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create cart draft items - regular items
      const draftItems = (items || []).map((item: OrderItem) => ({
        draft_id: draft.id,
        article_id: item.article_id,
        quantity: item.quantity,
        is_free_text_item: false,
      }));

      // Add free text items - with fallback to requestSupplierId if supplier_id is missing
      const freeItemsForSupplier = freeItems.filter(f => 
        f.supplier_id === supplierId || (!f.supplier_id && requestSupplierId === supplierId)
      );
      console.log(`📦 Free items for supplier ${supplierId}:`, freeItemsForSupplier.length, JSON.stringify(freeItemsForSupplier));
      
      for (const freeItem of freeItemsForSupplier) {
        draftItems.push({
          draft_id: draft.id,
          article_id: null,
          quantity: freeItem.quantity,
          is_free_text_item: true,
          free_text_name: freeItem.name,
          free_text_unit: freeItem.unit,
          supplier_id: freeItem.supplier_id,
        });
        
        // Create suggestion entry for tracking
        await supabase.from('suggested_articles').insert({
          organization_id: tokenData.organization_id,
          supplier_id: supplierId,
          name: freeItem.name,
          unit: freeItem.unit,
          price: 0,
          status: 'pending',
          source: 'employee',
          employee_id: tokenData.employee_id || null,
          location_id: location_id,
        });
      }

      const { error: itemsError } = await supabase
        .from('cart_draft_items')
        .insert(draftItems);

      if (itemsError) {
        console.error('Error creating draft items:', itemsError);
        // Rollback draft
        await supabase.from('cart_drafts').delete().eq('id', draft.id);
        return new Response(
          JSON.stringify({ error: 'Failed to create order items' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const totalItems = (items?.length || 0) + freeItemsForSupplier.length;
      console.log(`EasyOrder submitted as cart draft. Draft ID: ${draft.id}, Items: ${totalItems}`);

      // Send notification to admins/managers (internal call with service role header)
      const allNotificationItems = [
        ...(items || []).map((item: OrderItem) => ({
          article_name: item.article_name,
          quantity: item.quantity,
        })),
        ...freeItemsForSupplier.map(item => ({
          article_name: `${item.name} (Freier Artikel)`,
          quantity: item.quantity,
        })),
      ];
      
      fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/notify-preorder-received`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          'x-internal-secret': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        },
        body: JSON.stringify({
          organization_id: tokenData.organization_id,
          employee_name,
          supplier_name: supplierName,
          location_name: locationName,
          items: allNotificationItems,
        }),
      }).catch(err => console.error('Failed to send preorder notification:', err));

      return new Response(
        JSON.stringify({
          success: true,
          auto_approved: false,
          draft_id: draft.id,
          message: 'Order saved as pre-order',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in submit-simple-order:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
