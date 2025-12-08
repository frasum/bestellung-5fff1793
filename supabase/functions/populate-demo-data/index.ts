import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Seed data for demo account
const DEMO_SUPPLIERS = [
  {
    name: 'Frische Früchte GmbH',
    email: 'bestellung@frische-fruechte.de',
    phone: '+49 89 123456',
    contact_person: 'Maria Obstler',
    customer_number: 'FF-2024-001',
    top_category: 'Küche',
    main_category: 'Obst & Gemüse',
    minimum_order_value: 50,
    articles: [
      { name: 'Bio Äpfel Elstar', sku: 'FF-001', unit: 'kg', price: 3.49, category: 'Obst' },
      { name: 'Tomaten Rispentomaten', sku: 'FF-002', unit: 'kg', price: 4.99, category: 'Gemüse' },
      { name: 'Zwiebeln gelb', sku: 'FF-003', unit: 'kg', price: 1.89, category: 'Gemüse' },
      { name: 'Karotten frisch', sku: 'FF-004', unit: 'kg', price: 2.29, category: 'Gemüse' },
      { name: 'Zitronen Bio', sku: 'FF-005', unit: 'Stk', price: 0.49, category: 'Obst' },
      { name: 'Salat Eisberg', sku: 'FF-006', unit: 'Stk', price: 1.29, category: 'Gemüse' },
    ]
  },
  {
    name: 'Metzgerei Schmidt',
    email: 'order@metzgerei-schmidt.de',
    phone: '+49 89 654321',
    contact_person: 'Hans Schmidt',
    customer_number: 'MS-8847',
    top_category: 'Küche',
    main_category: 'Fleisch & Wurst',
    minimum_order_value: 100,
    articles: [
      { name: 'Rinderfilet', sku: 'MS-001', unit: 'kg', price: 42.90, category: 'Rind' },
      { name: 'Hähnchenbrust', sku: 'MS-002', unit: 'kg', price: 12.90, category: 'Geflügel' },
      { name: 'Schweineschnitzel', sku: 'MS-003', unit: 'kg', price: 14.50, category: 'Schwein' },
      { name: 'Hackfleisch gemischt', sku: 'MS-004', unit: 'kg', price: 9.90, category: 'Gemischt' },
      { name: 'Wiener Würstchen', sku: 'MS-005', unit: 'Pkg', price: 4.99, category: 'Wurst' },
      { name: 'Bacon Streifen', sku: 'MS-006', unit: 'kg', price: 15.90, category: 'Schwein' },
    ]
  },
  {
    name: 'Getränke Müller',
    email: 'bestellung@getraenke-mueller.de',
    phone: '+49 89 111222',
    contact_person: 'Peter Müller',
    customer_number: 'GM-5521',
    top_category: 'Getränke',
    main_category: 'Softdrinks & Säfte',
    minimum_order_value: 75,
    articles: [
      { name: 'Coca Cola 1L', sku: 'GM-001', unit: 'Kiste', price: 18.99, category: 'Softdrinks' },
      { name: 'Mineralwasser Classic', sku: 'GM-002', unit: 'Kiste', price: 8.99, category: 'Wasser' },
      { name: 'Orangensaft 100%', sku: 'GM-003', unit: 'Liter', price: 2.49, category: 'Säfte' },
      { name: 'Apfelschorle', sku: 'GM-004', unit: 'Kiste', price: 12.99, category: 'Schorlen' },
      { name: 'Espresso Bohnen', sku: 'GM-005', unit: 'kg', price: 18.90, category: 'Kaffee' },
      { name: 'Tee Earl Grey', sku: 'GM-006', unit: 'Pkg', price: 4.99, category: 'Tee' },
    ]
  },
  {
    name: 'Hygiene Plus',
    email: 'service@hygiene-plus.de',
    phone: '+49 89 333444',
    contact_person: 'Lisa Sauber',
    customer_number: 'HP-1122',
    top_category: 'Bedarfsartikel',
    main_category: 'Reinigung & Hygiene',
    minimum_order_value: 40,
    articles: [
      { name: 'Spülmittel Konzentrat', sku: 'HP-001', unit: 'Liter', price: 3.99, category: 'Reinigung' },
      { name: 'Papierhandtücher', sku: 'HP-002', unit: 'Karton', price: 24.90, category: 'Hygiene' },
      { name: 'Desinfektionsmittel', sku: 'HP-003', unit: 'Liter', price: 8.90, category: 'Hygiene' },
      { name: 'Müllbeutel 120L', sku: 'HP-004', unit: 'Rolle', price: 12.90, category: 'Entsorgung' },
      { name: 'Küchenrolle 3-lagig', sku: 'HP-005', unit: 'Pkg', price: 6.99, category: 'Hygiene' },
      { name: 'Edelstahlreiniger', sku: 'HP-006', unit: 'Flasche', price: 7.49, category: 'Reinigung' },
    ]
  }
];

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { organization_id, user_id } = await req.json();

    if (!organization_id) {
      return new Response(
        JSON.stringify({ error: 'organization_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Populating demo data for organization: ${organization_id}`);

    // Update organization with demo settings
    const demoExpiresAt = new Date();
    demoExpiresAt.setDate(demoExpiresAt.getDate() + 7);

    const { error: orgError } = await supabase
      .from('organizations')
      .update({
        is_demo: true,
        demo_expires_at: demoExpiresAt.toISOString(),
        test_mode_enabled: true
      })
      .eq('id', organization_id);

    if (orgError) {
      console.error('Org update error:', orgError);
    }

    // Check if location exists, create if not
    const { data: existingLocation } = await supabase
      .from('locations')
      .select('id')
      .eq('organization_id', organization_id)
      .limit(1)
      .single();

    let locationId = existingLocation?.id;

    if (!locationId) {
      const { data: location, error: locationError } = await supabase
        .from('locations')
        .insert({
          organization_id: organization_id,
          name: 'Hauptstandort',
          short_code: 'HAUPT',
          is_default: true
        })
        .select()
        .single();

      if (locationError) {
        console.error('Location error:', locationError);
      } else {
        locationId = location.id;
      }
    }

    // Create delivery address if location exists
    if (locationId) {
      const { data: existingAddress } = await supabase
        .from('delivery_addresses')
        .select('id')
        .eq('organization_id', organization_id)
        .limit(1);

      if (!existingAddress || existingAddress.length === 0) {
        await supabase
          .from('delivery_addresses')
          .insert({
            organization_id: organization_id,
            location_id: locationId,
            label: 'Haupteingang',
            address_line1: 'Musterstraße 123',
            postal_code: '80331',
            city: 'München',
            country: 'Germany',
            is_default: true
          });
      }
    }

    // Create suppliers and articles
    for (const supplierData of DEMO_SUPPLIERS) {
      const { articles, ...supplierInfo } = supplierData;
      
      const { data: supplier, error: supplierError } = await supabase
        .from('suppliers')
        .insert({
          ...supplierInfo,
          organization_id: organization_id,
          is_active: true
        })
        .select()
        .single();

      if (supplierError) {
        console.error(`Supplier error for ${supplierInfo.name}:`, supplierError);
        continue;
      }

      // Insert articles for this supplier
      const articlesToInsert = articles.map(article => ({
        ...article,
        organization_id: organization_id,
        supplier_id: supplier.id,
        is_active: true
      }));

      const { error: articlesError } = await supabase
        .from('articles')
        .insert(articlesToInsert);

      if (articlesError) {
        console.error(`Articles error for ${supplierInfo.name}:`, articlesError);
      }
    }

    // Create sample orders if user_id is provided
    if (user_id && locationId) {
      const { data: suppliers } = await supabase
        .from('suppliers')
        .select('id, name')
        .eq('organization_id', organization_id);

      if (suppliers && suppliers.length > 0) {
        const orderStatuses = ['pending', 'confirmed', 'delivered'];
        
        for (let i = 0; i < 3; i++) {
          const supplier = suppliers[i % suppliers.length];
          const orderDate = new Date();
          orderDate.setDate(orderDate.getDate() - (i * 2));
          
          const orderNumber = `${supplier.name.split(' ')[0]}-${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}-${String(i + 1).padStart(4, '0')}`;
          
          const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
              organization_id: organization_id,
              supplier_id: supplier.id,
              user_id: user_id,
              location_id: locationId,
              order_number: orderNumber,
              status: orderStatuses[i],
              total_amount: 150 + (i * 50),
              delivery_address: 'Musterstraße 123, 80331 München',
              is_test_order: true,
              created_at: orderDate.toISOString()
            })
            .select()
            .single();

          if (orderError) {
            console.error('Order error:', orderError);
            continue;
          }

          // Get articles for this supplier
          const { data: articles } = await supabase
            .from('articles')
            .select('*')
            .eq('supplier_id', supplier.id)
            .limit(3);

          if (articles && order) {
            const orderItems = articles.map((article, idx) => ({
              order_id: order.id,
              article_id: article.id,
              article_name: article.name,
              quantity: idx + 1,
              unit: article.unit,
              unit_price: article.price,
              total_price: article.price * (idx + 1)
            }));

            await supabase.from('order_items').insert(orderItems);
          }
        }
      }
    }

    // Create categories
    const categories = ['Obst', 'Gemüse', 'Fleisch', 'Getränke', 'Reinigung', 'Hygiene'];
    for (const categoryName of categories) {
      await supabase
        .from('categories')
        .insert({
          organization_id: organization_id,
          name: categoryName
        });
    }

    // Create units
    const units = ['kg', 'Stk', 'Liter', 'Kiste', 'Karton', 'Pkg', 'Flasche', 'Rolle'];
    for (const unitName of units) {
      await supabase
        .from('units')
        .insert({
          organization_id: organization_id,
          name: unitName
        });
    }

    console.log('Demo data population complete');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Demo data populated successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
