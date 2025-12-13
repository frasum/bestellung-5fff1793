import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ArticleData {
  imageBase64: string;
  name: string;
  description: string | null;
  category: string | null;
  unit: string;
  price: string;
  sku: string | null;
}

interface NewSupplier {
  name: string;
  email: string;
  phone?: string | null;
  customer_number?: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, articles, supplierId, newSupplier } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: "Token is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Articles array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify token
    const { data: tokenData, error: tokenError } = await supabase
      .from("photo_capture_tokens")
      .select("organization_id, expires_at, is_active")
      .eq("token", token)
      .single();

    if (tokenError || !tokenData) {
      console.error("Token lookup error:", tokenError);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!tokenData.is_active || new Date(tokenData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ success: false, error: "Token expired or inactive" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const organizationId = tokenData.organization_id;
    let finalSupplierId = supplierId;

    // Create new supplier if needed
    if (newSupplier && !supplierId) {
      const { data: supplierData, error: supplierError } = await supabase
        .from("suppliers")
        .insert({
          organization_id: organizationId,
          name: newSupplier.name,
          email: newSupplier.email,
          phone: newSupplier.phone || null,
          customer_number: newSupplier.customer_number || null,
        })
        .select("id")
        .single();

      if (supplierError) {
        console.error("Supplier creation error:", supplierError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to create supplier" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      finalSupplierId = supplierData.id;
      console.log("Created new supplier:", finalSupplierId);
    }

    if (!finalSupplierId) {
      return new Response(
        JSON.stringify({ success: false, error: "Supplier ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: { name: string; success: boolean; error?: string; articleId?: string }[] = [];

    // Process each article
    for (const article of articles as ArticleData[]) {
      try {
        const price = parseFloat(article.price.replace(",", ".")) || 0;

        // Create article
        const { data: articleData, error: articleError } = await supabase
          .from("articles")
          .insert({
            organization_id: organizationId,
            supplier_id: finalSupplierId,
            name: article.name,
            description: article.description || null,
            category: article.category || null,
            unit: article.unit || "Stk",
            price,
            sku: article.sku || null,
          })
          .select("id")
          .single();

        if (articleError) {
          console.error("Article creation error:", articleError);
          results.push({ name: article.name, success: false, error: articleError.message });
          continue;
        }

        const articleId = articleData.id;

        // Upload image if provided
        if (article.imageBase64 && article.imageBase64.startsWith("data:")) {
          try {
            const base64Data = article.imageBase64.split(",")[1];
            const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
            
            const mimeMatch = article.imageBase64.match(/data:([^;]+);/);
            const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
            const extension = mimeType.split("/")[1] || "jpg";
            
            const fileName = `${organizationId}/${articleId}.${extension}`;

            const { error: uploadError } = await supabase.storage
              .from("article-images")
              .upload(fileName, binaryData, {
                contentType: mimeType,
                upsert: true,
              });

            if (uploadError) {
              console.error("Image upload error:", uploadError);
            } else {
              const { data: publicUrlData } = supabase.storage
                .from("article-images")
                .getPublicUrl(fileName);

              if (publicUrlData?.publicUrl) {
                await supabase
                  .from("articles")
                  .update({ image_url: publicUrlData.publicUrl })
                  .eq("id", articleId);
              }
            }
          } catch (imgError) {
            console.error("Image processing error:", imgError);
          }
        }

        results.push({ name: article.name, success: true, articleId });
      } catch (err) {
        console.error("Article processing error:", err);
        results.push({ name: article.name, success: false, error: String(err) });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`Batch complete: ${successCount} success, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        results,
        successCount,
        failCount,
        supplierId: finalSupplierId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Batch creation error:", err);
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
