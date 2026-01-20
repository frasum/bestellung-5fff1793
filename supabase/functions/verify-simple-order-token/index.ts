import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface EmployeeData {
  id: string;
  name: string;
  auto_approve_orders: boolean;
  email: string | null;
  pin_code: string | null;
  voice_input_enabled: boolean;
  can_add_free_items: boolean;
  can_capture_photos: boolean;
  wine_catalog_access: string;
  language: string | null;
}

interface SupplierData {
  id: string;
  name: string;
  email: string | null;
  organization_id: string;
}

interface LocationData {
  id: string;
  name: string;
  short_code?: string;
}

interface TokenData {
  id: string;
  token: string;
  label: string | null;
  language: string | null;
  organization_id: string;
  supplier_id: string | null;
  employee_id: string | null;
  employee_name: string | null;
  is_multi_supplier: boolean;
  expires_at: string | null;
  supplier: SupplierData[];
  location: LocationData[];
  employee: EmployeeData[];
}

interface TokenSupplierData {
  supplier_id: string;
  sort_order: number | null;
  supplier: SupplierData[];
}

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
    const { token, action } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Verifying simple order token:', token.substring(0, 8) + '...', 'Action:', action || 'none');

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
        employee:employees(id, name, auto_approve_orders, email, pin_code, voice_input_enabled, can_add_free_items, can_capture_photos, wine_catalog_access, language)
      `)
      .eq('token', token)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

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

    // Cast tokenData to typed version and extract employee (array from Supabase join)
    const typedToken = tokenData as unknown as TokenData;
    const employee = typedToken.employee?.[0];

    // Get employee wine catalog access early for get-wines action
    const wineCatalogAccessEarly = employee?.wine_catalog_access || 'none';

    // Handle get-wines action for wine catalog - early exit
    if (action === 'get-wines') {
      if (wineCatalogAccessEarly === 'none') {
        return new Response(
          JSON.stringify({ error: 'No wine catalog access' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Fetching wines for organization:', tokenData.organization_id);

      // Get organization name
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', tokenData.organization_id)
        .single();

      if (orgError) {
        console.error('Error fetching organization:', orgError);
      }

      // Get all wines for the organization
      const { data: winesData, error: winesError } = await supabase
        .from('articles')
        .select(`
          id, name, description, selling_price, origin_country,
          grape_variety, flavor_profile, food_pairings, image_url, category, supplier_id,
          supplier:suppliers(id, name)
        `)
        .eq('organization_id', tokenData.organization_id)
        .eq('is_active', true)
        .ilike('category', '%wein%')
        .order('name');

      if (winesError) {
        console.error('Error fetching wines:', winesError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch wines' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Found ${winesData?.length || 0} wines for organization`);

      return new Response(
        JSON.stringify({
          success: true,
          wines: winesData || [],
          organization_name: orgData?.name || '',
          wine_catalog_access: wineCatalogAccessEarly,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if this is a multi-supplier token
    const isMultiSupplier = tokenData.is_multi_supplier === true;
    console.log('Is multi-supplier token:', isMultiSupplier);

    let suppliers: Array<{ id: string; name: string; email: string | null; organization_id: string; sort_order?: number; article_count: number }> = [];
    let articles: Array<{ id: string; name: string; supplier_id: string; [key: string]: unknown }> = [];
    let favoriteArticleIds: string[] = [];

    // Get employee_id and voice_input_enabled for favorites lookup
    const employeeId = tokenData.employee_id || employee?.id;
    const voiceInputEnabled = employee?.voice_input_enabled ?? false;
    
    // Load favorites if employee is assigned
    if (employeeId) {
      const { data: favorites, error: favError } = await supabase
        .from('employee_article_favorites')
        .select('article_id')
        .eq('employee_id', employeeId);
      
      if (favError) {
        console.error('Error fetching favorites:', favError);
      } else {
        favoriteArticleIds = favorites?.map(f => f.article_id) || [];
        console.log(`Loaded ${favoriteArticleIds.length} favorites for employee ${employeeId}`);
      }
    }

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
        // Get all articles for these suppliers with sort_order and order_unit
        const { data: allArticles, error: articlesError } = await supabase
          .from('articles')
          .select('id, name, description, price, unit, category, sku, packaging_unit, supplier_id, sort_order, order_unit_id, order_unit:order_units(id, name, quantity)')
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
        suppliers = (tokenSuppliers as TokenSupplierData[])?.map(ts => {
          const sup = ts.supplier?.[0];
          return {
            id: sup?.id || '',
            name: sup?.name || '',
            email: sup?.email || null,
            organization_id: sup?.organization_id || '',
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
          .select('id, name, description, price, unit, category, sku, packaging_unit, supplier_id, sort_order, order_unit_id, order_unit:order_units(id, name, quantity)')
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
        const singleSupplier = typedToken.supplier?.[0];
        suppliers = singleSupplier ? [{
          id: singleSupplier.id,
          name: singleSupplier.name,
          email: singleSupplier.email,
          organization_id: singleSupplier.organization_id,
          article_count: articles.length,
        }] : [];
      }
    }

    // Get locations - filtered by employee_locations if employee is assigned
    let locations: LocationData[] = [];
    
    if (employeeId) {
      // Employee is assigned - only get their permitted locations
      const { data: employeeLocations, error: empLocError } = await supabase
        .from('employee_locations')
        .select('location:locations(id, name, short_code)')
        .eq('employee_id', employeeId);
      
      if (empLocError) {
        console.error('Error fetching employee locations:', empLocError);
      } else if (employeeLocations && employeeLocations.length > 0) {
        // Use only employee's permitted locations
        locations = employeeLocations
          .map(el => el.location as unknown as LocationData)
          .filter((loc): loc is LocationData => Boolean(loc))
          .sort((a, b) => a.name.localeCompare(b.name));
        console.log(`Employee ${employeeId} has ${locations.length} permitted locations`);
      } else {
        // Fallback: No employee_locations configured, show all
        console.log(`No employee_locations configured for ${employeeId}, showing all`);
        const { data: allLocations } = await supabase
          .from('locations')
          .select('id, name, short_code')
          .eq('organization_id', tokenData.organization_id)
          .order('name', { ascending: true });
        locations = allLocations || [];
      }
    } else {
      // No employee - show all organization locations
      const { data: allLocations, error: locationsError } = await supabase
        .from('locations')
        .select('id, name, short_code')
        .eq('organization_id', tokenData.organization_id)
        .order('name', { ascending: true });
      
      if (locationsError) {
        console.error('Error fetching locations:', locationsError);
      }
      locations = allLocations || [];
    }

    console.log(`Token verified. Multi-supplier: ${isMultiSupplier}, Suppliers: ${suppliers.length}, Articles: ${articles.length}, Locations: ${locations?.length || 0}, Employee: ${tokenData.employee_name || 'not set'}`);

    // Get auto_approve status and PIN from employee
    const autoApproveOrders = employee?.auto_approve_orders || false;
    const hasPinCode = !!employee?.pin_code;
    const canAddFreeItems = employee?.can_add_free_items || false;
    const canCapturePhotos = employee?.can_capture_photos || false;
    const wineCatalogAccess = employee?.wine_catalog_access || 'none';
    
    // Only require PIN if auto_approve is enabled AND a PIN is set
    const requiresPin = autoApproveOrders && hasPinCode;

    // Get articles without photos for photo capture feature
    let articlesWithoutPhotos: Array<{ id: string; name: string; supplier_id: string }> = [];
    let categories: Array<{ id: string; name: string }> = [];
    
    if (canCapturePhotos) {
      // Get supplier IDs the employee can access
      const accessibleSupplierIds = isMultiSupplier 
        ? suppliers.map(s => s.id) 
        : (tokenData.supplier_id ? [tokenData.supplier_id] : []);
      
      if (accessibleSupplierIds.length > 0) {
        const { data: noPhotoArticles } = await supabase
          .from('articles')
          .select('id, name, description, unit, category, supplier_id')
          .in('supplier_id', accessibleSupplierIds)
          .eq('is_active', true)
          .is('image_url', null)
          .order('name', { ascending: true });
        
        articlesWithoutPhotos = noPhotoArticles || [];
      }
      
      // Get organization categories
      const { data: orgCategories } = await supabase
        .from('categories')
        .select('id, name')
        .eq('organization_id', tokenData.organization_id)
        .order('name', { ascending: true });
      
      categories = orgCategories || [];
    }

    // Use employee language if assigned, otherwise fall back to token language
    const effectiveLanguage = employee?.language || tokenData.language;

    return new Response(
      JSON.stringify({
        success: true,
        tokenData: {
          id: tokenData.id,
          label: tokenData.label,
          language: effectiveLanguage,
          supplier: isMultiSupplier ? null : (typedToken.supplier?.[0] || null),
          location: tokenData.location,
          organization_id: tokenData.organization_id,
          is_multi_supplier: isMultiSupplier,
          employee_id: employeeId || null,
          employee_name: employee?.name || tokenData.employee_name || null,
          has_employee: !!employeeId,
          auto_approve_orders: autoApproveOrders,
          requires_pin: requiresPin,
          voice_input_enabled: voiceInputEnabled,
          can_add_free_items: canAddFreeItems,
          can_capture_photos: canCapturePhotos,
          wine_catalog_access: wineCatalogAccess,
        },
        suppliers: suppliers,
        articles: articles,
        locations: locations || [],
        favorite_article_ids: favoriteArticleIds,
        articles_without_photos: articlesWithoutPhotos,
        categories: categories,
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