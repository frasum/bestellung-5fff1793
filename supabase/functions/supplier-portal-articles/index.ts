import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ArticleUpdateRequest {
  action: 'list' | 'update' | 'get-settings' | 'get-units' | 'create-unit' | 'get-categories' | 'create-category';
  supplierId: string;
  organizationId: string;
  sessionToken: string; // Required session token for authentication
  articleId?: string;
  changes?: Record<string, any>;
  unitName?: string; // For create-unit action
  categoryName?: string; // For create-category action
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: ArticleUpdateRequest = await req.json();
    const { action, supplierId, organizationId, sessionToken, articleId, changes } = body;

    console.log(`Supplier portal request: action=${action}, supplierId=${supplierId}`);

    // Validate required parameters
    if (!supplierId || !organizationId) {
      return new Response(
        JSON.stringify({ error: 'Missing supplierId or organizationId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Validate session token
    if (!sessionToken) {
      console.error('No session token provided');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify session token matches the supplier
    // Session token format: supplierId:organizationId:timestamp:randomHash
    // We validate that the token contains the correct supplierId and organizationId
    const tokenParts = sessionToken.split(':');
    if (tokenParts.length < 3) {
      console.error('Invalid session token format');
      return new Response(
        JSON.stringify({ error: 'Invalid session token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const [tokenSupplierId, tokenOrgId, tokenTimestamp] = tokenParts;
    
    // Validate token matches the requested supplier and organization
    if (tokenSupplierId !== supplierId || tokenOrgId !== organizationId) {
      console.error('Session token does not match supplier/organization');
      return new Response(
        JSON.stringify({ error: 'Session token mismatch' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate token is not too old (24 hours max session)
    const tokenAge = Date.now() - parseInt(tokenTimestamp, 10);
    const maxTokenAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    if (isNaN(tokenAge) || tokenAge > maxTokenAge) {
      console.error('Session token expired');
      return new Response(
        JSON.stringify({ error: 'Session expired' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify supplier exists and belongs to the organization
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('id, organization_id, name')
      .eq('id', supplierId)
      .eq('organization_id', organizationId)
      .single();

    if (supplierError || !supplier) {
      console.error('Supplier verification failed:', supplierError);
      return new Response(
        JSON.stringify({ error: 'Invalid supplier or organization' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle get-settings action
    if (action === 'get-settings') {
      const { data: settings, error: settingsError } = await supabase
        .from('supplier_portal_settings')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (settingsError) {
        console.error('Error fetching portal settings:', settingsError);
      }

      // Return settings or defaults
      const portalSettings = settings || {
        portal_title: 'Lieferantenportal',
        welcome_message: null,
        card_title: 'Meine Artikel',
        card_description: 'Änderungen werden zur Genehmigung eingereicht.',
        info_text: null,
        footer_text: null,
        logo_url: null,
      };

      console.log('Returning portal settings for organization:', organizationId);

      return new Response(JSON.stringify({ settings: portalSettings }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle get-units action - fetch organization units
    if (action === 'get-units') {
      const { data: units, error: unitsError } = await supabase
        .from('units')
        .select('id, name')
        .eq('organization_id', organizationId)
        .order('name');

      if (unitsError) {
        console.error('Error fetching units:', unitsError);
        throw unitsError;
      }

      console.log(`Found ${units?.length || 0} units for organization ${organizationId}`);

      return new Response(JSON.stringify({ units: units || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle create-unit action - create a new unit
    if (action === 'create-unit') {
      const { unitName } = body;
      
      if (!unitName || !unitName.trim()) {
        return new Response(
          JSON.stringify({ error: 'Missing unitName' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if unit already exists
      const { data: existingUnit } = await supabase
        .from('units')
        .select('id, name')
        .eq('organization_id', organizationId)
        .ilike('name', unitName.trim())
        .maybeSingle();

      if (existingUnit) {
        console.log(`Unit "${unitName}" already exists`);
        return new Response(JSON.stringify({ unit: existingUnit }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create new unit
      const { data: newUnit, error: createError } = await supabase
        .from('units')
        .insert({ 
          name: unitName.trim(), 
          organization_id: organizationId 
        })
        .select('id, name')
        .single();

      if (createError) {
        console.error('Error creating unit:', createError);
        throw createError;
      }

      console.log(`Created new unit: ${newUnit.name}`);

      return new Response(JSON.stringify({ unit: newUnit }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle get-categories action - fetch organization categories
    if (action === 'get-categories') {
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name')
        .eq('organization_id', organizationId)
        .order('name');

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
        throw categoriesError;
      }

      console.log(`Found ${categories?.length || 0} categories for organization ${organizationId}`);

      return new Response(JSON.stringify({ categories: categories || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle create-category action - create a new category
    if (action === 'create-category') {
      const { categoryName } = body;
      
      if (!categoryName || !categoryName.trim()) {
        return new Response(
          JSON.stringify({ error: 'Missing categoryName' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if category already exists
      const { data: existingCategory } = await supabase
        .from('categories')
        .select('id, name')
        .eq('organization_id', organizationId)
        .ilike('name', categoryName.trim())
        .maybeSingle();

      if (existingCategory) {
        console.log(`Category "${categoryName}" already exists`);
        return new Response(JSON.stringify({ category: existingCategory }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create new category
      const { data: newCategory, error: createError } = await supabase
        .from('categories')
        .insert({ 
          name: categoryName.trim(), 
          organization_id: organizationId 
        })
        .select('id, name')
        .single();

      if (createError) {
        console.error('Error creating category:', createError);
        throw createError;
      }

      console.log(`Created new category: ${newCategory.name}`);

      return new Response(JSON.stringify({ category: newCategory }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'list') {
      // Fetch articles for this supplier
      const { data: articles, error: articlesError } = await supabase
        .from('articles')
        .select('id, name, description, sku, unit, price, category, is_active')
        .eq('supplier_id', supplierId)
        .eq('organization_id', organizationId)
        .order('name');

      if (articlesError) {
        console.error('Error fetching articles:', articlesError);
        throw articlesError;
      }

      // Fetch pending changes for this supplier
      const { data: pendingChanges, error: pendingError } = await supabase
        .from('supplier_article_changes')
        .select('*')
        .eq('supplier_id', supplierId)
        .eq('status', 'pending');

      if (pendingError) {
        console.error('Error fetching pending changes:', pendingError);
      }

      console.log(`Found ${articles?.length || 0} articles for supplier ${supplierId}`);

      return new Response(JSON.stringify({ 
        articles, 
        pendingChanges: pendingChanges || [] 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'update') {
      if (!articleId || !changes) {
        return new Response(
          JSON.stringify({ error: 'Missing articleId or changes for update' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Fetch the current article to get old values
      const { data: currentArticle, error: fetchError } = await supabase
        .from('articles')
        .select('*')
        .eq('id', articleId)
        .eq('supplier_id', supplierId)
        .eq('organization_id', organizationId)
        .single();

      if (fetchError || !currentArticle) {
        console.error('Error fetching article:', fetchError);
        return new Response(
          JSON.stringify({ error: 'Article not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create pending change records for each changed field
      const changeRecords: Array<{
        supplier_id: string;
        organization_id: string;
        article_id: string;
        field_name: string;
        old_value: string | null;
        new_value: string | null;
        status: string;
      }> = [];
      for (const [field, newValue] of Object.entries(changes)) {
        const oldValue = currentArticle[field];
        
        // For price field, compare as numbers to avoid floating point string issues
        let hasChanged = false;
        if (field === 'price') {
          const oldNum = oldValue !== null && oldValue !== undefined ? Number(oldValue) : null;
          const newNum = newValue !== null && newValue !== undefined ? Number(newValue) : null;
          hasChanged = oldNum !== newNum;
        } else {
          // For other fields, compare as strings
          const oldStr = oldValue !== null && oldValue !== undefined ? String(oldValue) : null;
          const newStr = newValue !== null && newValue !== undefined ? String(newValue) : null;
          hasChanged = oldStr !== newStr;
        }
        
        if (hasChanged) {
          changeRecords.push({
            supplier_id: supplierId,
            organization_id: organizationId,
            article_id: articleId,
            field_name: field,
            old_value: oldValue !== null && oldValue !== undefined ? String(oldValue) : null,
            new_value: newValue !== null && newValue !== undefined ? String(newValue) : null,
            status: 'pending',
          });
        }
      }

      if (changeRecords.length === 0) {
        return new Response(JSON.stringify({ 
          message: 'No changes detected',
          pendingChanges: [] 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Delete any existing pending changes for this article's fields
      const fieldsToUpdate = changeRecords.map(c => c.field_name);
      await supabase
        .from('supplier_article_changes')
        .delete()
        .eq('article_id', articleId)
        .eq('status', 'pending')
        .in('field_name', fieldsToUpdate);

      // Insert the new pending changes
      const { data: insertedChanges, error: insertError } = await supabase
        .from('supplier_article_changes')
        .insert(changeRecords)
        .select();

      if (insertError) {
        console.error('Error inserting changes:', insertError);
        throw insertError;
      }

      console.log(`Created ${insertedChanges?.length || 0} pending change(s) for article ${articleId}`);

      // Send notification email to admins (background task)
      const sendAdminNotification = async () => {
        try {
          // Fetch admin users for this organization
          const { data: adminProfiles, error: adminError } = await supabase
            .from('profiles')
            .select('id, email, full_name')
            .eq('organization_id', organizationId);

          if (adminError) {
            console.error('Error fetching profiles:', adminError);
            return;
          }

          if (!adminProfiles || adminProfiles.length === 0) {
            console.log('No profiles found for organization');
            return;
          }

          // Filter to only admins by checking user_roles
          const adminEmails: string[] = [];
          for (const profile of adminProfiles) {
            const { data: roleData } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', profile.id)
              .eq('role', 'admin')
              .maybeSingle();
            
            if (roleData) {
              adminEmails.push(profile.email);
            }
          }

          if (adminEmails.length === 0) {
            console.log('No admin users found for organization');
            return;
          }

          // Build change summary for email
          const changeSummary = changeRecords.map(c => {
            const fieldLabels: Record<string, string> = {
              name: 'Artikelname',
              sku: 'SKU',
              description: 'Beschreibung',
              unit: 'Einheit',
              price: 'Preis',
              category: 'Kategorie',
            };
            const label = fieldLabels[c.field_name] || c.field_name;
            return `<tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${label}</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${c.old_value || '—'}</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${c.new_value || '—'}</td>
            </tr>`;
          }).join('');

          const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f5;">
              <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div style="background-color: #f97316; color: white; padding: 24px; text-align: center;">
                  <h1 style="margin: 0; font-size: 24px;">🦊 Lieferantenänderung</h1>
                </div>
                <div style="padding: 24px;">
                  <p style="color: #374151; margin: 0 0 16px;">
                    Der Lieferant <strong>${supplier.name || 'Unbekannt'}</strong> hat Änderungen für einen Artikel eingereicht.
                  </p>
                  
                  <div style="background-color: #f9fafb; border-radius: 6px; padding: 16px; margin-bottom: 16px;">
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">Artikel</p>
                    <p style="margin: 4px 0 0; color: #111827; font-weight: 600;">${currentArticle.name}</p>
                    ${currentArticle.sku ? `<p style="margin: 4px 0 0; color: #6b7280; font-size: 14px;">SKU: ${currentArticle.sku}</p>` : ''}
                  </div>
                  
                  <h3 style="color: #374151; margin: 0 0 12px;">Vorgeschlagene Änderungen</h3>
                  <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <thead>
                      <tr style="background-color: #f9fafb;">
                        <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e5e7eb;">Feld</th>
                        <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e5e7eb;">Alter Wert</th>
                        <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e5e7eb;">Neuer Wert</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${changeSummary}
                    </tbody>
                  </table>
                  
                  <p style="color: #6b7280; font-size: 14px; margin: 24px 0 0;">
                    Bitte prüfen Sie die Änderungen im OrderFox-Dashboard und genehmigen oder lehnen Sie diese ab.
                  </p>
                </div>
                <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                    Diese E-Mail wurde automatisch von OrderFox.pro gesendet.
                  </p>
                </div>
              </div>
            </body>
            </html>
          `;

          console.log(`Sending notification email to ${adminEmails.length} admin(s): ${adminEmails.join(', ')}`);

          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: 'OrderFox <onboarding@resend.dev>',
              to: adminEmails,
              subject: `[Lieferantenportal] Änderungsanfrage von ${supplier.name || 'Lieferant'}`,
              html: emailHtml,
            }),
          });

          const emailResult = await emailResponse.json();
          console.log('Admin notification email sent:', emailResult);
        } catch (emailError) {
          console.error('Error sending admin notification:', emailError);
        }
      };

      // Run email notification in background (don't await)
      sendAdminNotification();

      return new Response(JSON.stringify({ 
        message: 'Änderungen zur Genehmigung eingereicht',
        pendingChanges: insertedChanges 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in supplier-portal-articles:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
