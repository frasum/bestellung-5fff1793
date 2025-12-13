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
    const { 
      token, 
      article, 
      imageBase64,
      newSupplier 
    } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Creating article from mobile with token:', token.substring(0, 8) + '...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify token
    const { data: tokenData, error: tokenError } = await supabase
      .from('photo_capture_tokens')
      .select('*')
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
    if (new Date(tokenData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Token has expired' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const organizationId = tokenData.organization_id;
    let supplierId = article.supplier_id;

    // Create new supplier if needed
    if (newSupplier && newSupplier.name && newSupplier.email) {
      console.log('Creating new supplier:', newSupplier.name);
      const { data: createdSupplier, error: supplierError } = await supabase
        .from('suppliers')
        .insert({
          name: newSupplier.name,
          email: newSupplier.email,
          phone: newSupplier.phone || null,
          customer_number: newSupplier.customer_number || null,
          organization_id: organizationId,
        })
        .select()
        .single();

      if (supplierError) {
        console.error('Error creating supplier:', supplierError);
        return new Response(
          JSON.stringify({ error: 'Failed to create supplier: ' + supplierError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      supplierId = createdSupplier.id;
      console.log('Created supplier:', supplierId);
    }

    if (!supplierId) {
      return new Response(
        JSON.stringify({ error: 'Supplier ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create article
    console.log('Creating article:', article.name);
    const { data: createdArticle, error: articleError } = await supabase
      .from('articles')
      .insert({
        name: article.name,
        description: article.description || null,
        category: article.category || null,
        unit: article.unit || 'Stk',
        price: parseFloat(article.price) || 0,
        sku: article.sku || null,
        supplier_id: supplierId,
        organization_id: organizationId,
      })
      .select()
      .single();

    if (articleError) {
      console.error('Error creating article:', articleError);
      return new Response(
        JSON.stringify({ error: 'Failed to create article: ' + articleError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Created article:', createdArticle.id);

    // Upload image if provided
    let imageUrl = null;
    if (imageBase64 && imageBase64.startsWith('data:')) {
      try {
        console.log('Uploading image for article:', createdArticle.id);
        
        // Convert base64 to blob
        const base64Data = imageBase64.split(',')[1];
        const binaryData = atob(base64Data);
        const bytes = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
          bytes[i] = binaryData.charCodeAt(i);
        }
        
        const fileName = `${organizationId}/${createdArticle.id}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from('article-images')
          .upload(fileName, bytes, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('article-images')
            .getPublicUrl(fileName);
          
          imageUrl = publicUrl;

          // Update article with image URL
          await supabase
            .from('articles')
            .update({ image_url: imageUrl })
            .eq('id', createdArticle.id);
          
          console.log('Image uploaded:', imageUrl);
        }
      } catch (imgError) {
        console.error('Image upload failed:', imgError);
        // Continue without image
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        article: {
          ...createdArticle,
          image_url: imageUrl,
        },
        supplier_id: supplierId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-article-from-mobile:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
