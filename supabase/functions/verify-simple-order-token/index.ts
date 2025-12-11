import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Verifying simple order token:', token.substring(0, 8) + '...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get token with supplier, organization, location and employee info
    const { data: tokenData, error: tokenError } = await supabase
      .from('simple_order_tokens')
      .select(`
        *,
        supplier:suppliers(id, name, email, organization_id),
        location:locations(id, name),
        employee:employees(id, name)
      `)
      .eq('token', token)
      .eq('is_active', true)
      .single();

    if (tokenError || !tokenData) {
      console.log('Token not found or inactive:', tokenError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid or inactive token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check expiration
    if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
      console.log('Token expired');
      return new Response(
        JSON.stringify({ error: 'Token has expired' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if this is a multi-supplier token
    const isMultiSupplier = tokenData.is_multi_supplier === true;
    console.log('Is multi-supplier token:', isMultiSupplier);

    let suppliers: any[] = [];
    let articles: any[] = [];

    if (isMultiSupplier) {
      // Get all suppliers linked to this token with sort_order
      const { data: tokenSuppliers, error: tokenSuppliersError } = await supabase
        .from('simple_order_token_suppliers')
        .select(`
          supplier_id,
          sort_order,
          supplier:suppliers(id, name, email, organization_id)
        `)
        .eq('token_id', tokenData.id)
        .order('sort_order', { ascending: true });

      if (tokenSuppliersError) {
        console.error('Error fetching token suppliers:', tokenSuppliersError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch suppliers' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Extract supplier IDs
      const supplierIds = tokenSuppliers?.map(ts => ts.supplier_id) || [];
      console.log('Multi-supplier token has suppliers:', supplierIds.length);

      if (supplierIds.length > 0) {
        // Get all articles for these suppliers with sort_order
        const { data: allArticles, error: articlesError } = await supabase
          .from('articles')
          .select('id, name, description, price, unit, category, sku, packaging_unit, supplier_id, sort_order')
          .in('supplier_id', supplierIds)
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .order('name', { ascending: true });

        if (articlesError) {
          console.error('Error fetching articles:', articlesError);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch articles' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        articles = allArticles || [];

        // Build suppliers array with article counts and sort_order
        suppliers = tokenSuppliers?.map(ts => {
          const sup = ts.supplier as any;
          return {
            id: sup?.id,
            name: sup?.name,
            email: sup?.email,
            organization_id: sup?.organization_id,
            sort_order: ts.sort_order || 0,
            article_count: articles.filter(a => a.supplier_id === ts.supplier_id).length,
          };
        }) || [];
      }
    } else {
      // Single supplier token - use existing logic
      if (tokenData.supplier_id) {
        const { data: singleArticles, error: articlesError } = await supabase
          .from('articles')
          .select('id, name, description, price, unit, category, sku, packaging_unit, supplier_id, sort_order')
          .eq('supplier_id', tokenData.supplier_id)
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .order('name', { ascending: true });

        if (articlesError) {
          console.error('Error fetching articles:', articlesError);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch articles' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        articles = singleArticles || [];
        suppliers = tokenData.supplier ? [{
          id: tokenData.supplier.id,
          name: tokenData.supplier.name,
          email: tokenData.supplier.email,
          organization_id: tokenData.supplier.organization_id,
          article_count: articles.length,
        }] : [];
      }
    }

    // Get all locations for the organization
    const { data: locations, error: locationsError } = await supabase
      .from('locations')
      .select('id, name, short_code')
      .eq('organization_id', tokenData.organization_id)
      .order('name', { ascending: true });

    if (locationsError) {
      console.error('Error fetching locations:', locationsError);
    }

    console.log(`Token verified. Multi-supplier: ${isMultiSupplier}, Suppliers: ${suppliers.length}, Articles: ${articles.length}, Locations: ${locations?.length || 0}, Employee: ${tokenData.employee_name || 'not set'}`);

    return new Response(
      JSON.stringify({
        success: true,
        tokenData: {
          id: tokenData.id,
          label: tokenData.label,
          language: tokenData.language,
          supplier: isMultiSupplier ? null : tokenData.supplier,
          location: tokenData.location,
          organization_id: tokenData.organization_id,
          is_multi_supplier: isMultiSupplier,
          employee_name: (tokenData.employee as any)?.name || tokenData.employee_name || null,
        },
        suppliers: suppliers,
        articles: articles,
        locations: locations || [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in verify-simple-order-token:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});