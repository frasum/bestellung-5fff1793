import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ArticleUpdateRequest {
  action: 'list' | 'update' | 'get-settings' | 'get-units' | 'create-unit' | 'get-categories' | 'create-category' | 'suggest-article' | 'save-draft' | 'get-draft' | 'delete-draft';
  supplierId: string;
  organizationId: string;
  sessionToken: string;
  articleId?: string;
  changes?: Record<string, any>;
  unitName?: string;
  categoryName?: string;
  suggestedArticle?: {
    name: string;
    description?: string | null;
    sku?: string | null;
    unit: string;
    price: number;
    category?: string | null;
    comment?: string | null;
  };
  draftData?: {
    editedArticles: Record<string, any>;
    priceInputs: Record<string, string>;
    annualOrderValueInputs: Record<string, string>;
  };
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
    const tokenParts = sessionToken.split(':');
    if (tokenParts.length < 3) {
      console.error('Invalid session token format');
      return new Response(
        JSON.stringify({ error: 'Invalid session token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const [tokenSupplierId, tokenOrgId, tokenTimestamp] = tokenParts;
    
    if (tokenSupplierId !== supplierId || tokenOrgId !== organizationId) {
      console.error('Session token does not match supplier/organization');
      return new Response(
        JSON.stringify({ error: 'Session token mismatch' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tokenAge = Date.now() - parseInt(tokenTimestamp, 10);
    const maxTokenAge = 24 * 60 * 60 * 1000;
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

    // Handle get-units action
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

    // Handle create-unit action
    if (action === 'create-unit') {
      const { unitName } = body;
      
      if (!unitName || !unitName.trim()) {
        return new Response(
          JSON.stringify({ error: 'Missing unitName' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

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

    // Handle get-categories action
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

    // Handle create-category action
    if (action === 'create-category') {
      const { categoryName } = body;
      
      if (!categoryName || !categoryName.trim()) {
        return new Response(
          JSON.stringify({ error: 'Missing categoryName' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

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

    // Handle save-draft action
    if (action === 'save-draft') {
      const { draftData } = body;
      
      if (!draftData) {
        return new Response(
          JSON.stringify({ error: 'Missing draftData' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Upsert the draft (insert or update if exists)
      const { data: draft, error: upsertError } = await supabase
        .from('supplier_portal_drafts')
        .upsert({
          supplier_id: supplierId,
          organization_id: organizationId,
          draft_data: draftData,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'supplier_id,organization_id',
        })
        .select()
        .single();

      if (upsertError) {
        console.error('Error saving draft:', upsertError);
        throw upsertError;
      }

      console.log(`Saved draft for supplier ${supplierId}`);

      return new Response(JSON.stringify({ success: true, draft }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle get-draft action
    if (action === 'get-draft') {
      const { data: draft, error: fetchError } = await supabase
        .from('supplier_portal_drafts')
        .select('*')
        .eq('supplier_id', supplierId)
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching draft:', fetchError);
        throw fetchError;
      }

      console.log(`Fetched draft for supplier ${supplierId}: ${draft ? 'found' : 'none'}`);

      return new Response(JSON.stringify({ draft: draft?.draft_data || null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle delete-draft action
    if (action === 'delete-draft') {
      const { error: deleteError } = await supabase
        .from('supplier_portal_drafts')
        .delete()
        .eq('supplier_id', supplierId)
        .eq('organization_id', organizationId);

      if (deleteError) {
        console.error('Error deleting draft:', deleteError);
        throw deleteError;
      }

      console.log(`Deleted draft for supplier ${supplierId}`);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'list') {
      // Fetch articles for this supplier including annual_order_value
      const { data: articles, error: articlesError } = await supabase
        .from('articles')
        .select('id, name, description, sku, unit, price, category, is_active, annual_order_value')
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
        
        // For numeric fields, compare as numbers
        let hasChanged = false;
        if (field === 'price' || field === 'annual_order_value') {
          const oldNum = oldValue !== null && oldValue !== undefined ? Number(oldValue) : null;
          const newNum = newValue !== null && newValue !== undefined ? Number(newValue) : null;
          hasChanged = oldNum !== newNum;
        } else {
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

      // Send notification email to admins
      const sendAdminNotification = async () => {
        try {
          const { data: adminProfiles, error: adminError } = await supabase
            .from('profiles')
            .select('id, email, full_name')
            .eq('organization_id', organizationId);

          if (adminError || !adminProfiles?.length) {
            console.log('No profiles found for organization');
            return;
          }

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

          const changeSummary = changeRecords.map(c => {
            const fieldLabels: Record<string, string> = {
              name: 'Artikelname',
              sku: 'SKU',
              description: 'Beschreibung',
              unit: 'Einheit',
              price: 'Preis',
              category: 'Kategorie',
              annual_order_value: 'Bestellwert (365 Tage)',
            };
            const label = fieldLabels[c.field_name] || c.field_name;
            const formatValue = (val: string | null) => {
              if (val === null) return '—';
              if (c.field_name === 'price' || c.field_name === 'annual_order_value') {
                return `${parseFloat(val).toFixed(2).replace('.', ',')} €`;
              }
              return val;
            };
            return `<tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${label}</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${formatValue(c.old_value)}</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${formatValue(c.new_value)}</td>
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
                    Bitte prüfen Sie die Änderungen im Bestellung.pro-Dashboard und genehmigen oder lehnen Sie diese ab.
                  </p>
                </div>
                <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                    Diese E-Mail wurde automatisch von Bestellung.pro gesendet.
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
              from: 'Bestellung.pro <onboarding@resend.dev>',
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

      sendAdminNotification();

      return new Response(JSON.stringify({ 
        message: 'Änderungen zur Genehmigung eingereicht',
        pendingChanges: insertedChanges 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle suggest-article action
    if (action === 'suggest-article') {
      const { suggestedArticle } = body;
      
      if (!suggestedArticle || !suggestedArticle.name?.trim()) {
        return new Response(
          JSON.stringify({ error: 'Missing article name' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: newSuggestion, error: insertError } = await supabase
        .from('suggested_articles')
        .insert({
          supplier_id: supplierId,
          organization_id: organizationId,
          name: suggestedArticle.name.trim(),
          description: suggestedArticle.description || null,
          sku: suggestedArticle.sku || null,
          unit: suggestedArticle.unit || 'Stk',
          price: suggestedArticle.price || 0,
          category: suggestedArticle.category || null,
          supplier_comment: suggestedArticle.comment || null,
          status: 'pending',
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting suggested article:', insertError);
        throw insertError;
      }

      console.log(`Created suggested article: ${newSuggestion.name} (${newSuggestion.id})`);

      // Send notification email to admins
      const sendSuggestionNotification = async () => {
        try {
          const { data: adminProfiles, error: adminError } = await supabase
            .from('profiles')
            .select('id, email, full_name')
            .eq('organization_id', organizationId);

          if (adminError || !adminProfiles?.length) {
            console.log('No profiles found for organization');
            return;
          }

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

          const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f5;">
              <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div style="background-color: #22c55e; color: white; padding: 24px; text-align: center;">
                  <h1 style="margin: 0; font-size: 24px;">📦 Neuer Artikelvorschlag</h1>
                </div>
                <div style="padding: 24px;">
                  <p style="color: #374151; margin: 0 0 16px;">
                    Der Lieferant <strong>${supplier.name || 'Unbekannt'}</strong> hat einen neuen Artikel vorgeschlagen.
                  </p>
                  
                  <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 16px; margin-bottom: 16px;">
                    <h3 style="margin: 0 0 12px; color: #166534;">${suggestedArticle.name}</h3>
                    <table style="width: 100%; font-size: 14px; color: #374151;">
                      ${suggestedArticle.sku ? `<tr><td style="padding: 4px 0;"><strong>SKU:</strong></td><td>${suggestedArticle.sku}</td></tr>` : ''}
                      <tr><td style="padding: 4px 0;"><strong>Einheit:</strong></td><td>${suggestedArticle.unit || 'Stk'}</td></tr>
                      <tr><td style="padding: 4px 0;"><strong>Preis:</strong></td><td>${(suggestedArticle.price || 0).toFixed(2).replace('.', ',')} €</td></tr>
                      ${suggestedArticle.category ? `<tr><td style="padding: 4px 0;"><strong>Kategorie:</strong></td><td>${suggestedArticle.category}</td></tr>` : ''}
                      ${suggestedArticle.description ? `<tr><td style="padding: 4px 0;"><strong>Beschreibung:</strong></td><td>${suggestedArticle.description}</td></tr>` : ''}
                    </table>
                    ${suggestedArticle.comment ? `
                      <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #bbf7d0;">
                        <p style="margin: 0; font-style: italic; color: #166534;">"${suggestedArticle.comment}"</p>
                      </div>
                    ` : ''}
                  </div>
                  
                  <p style="color: #6b7280; font-size: 14px; margin: 0;">
                    Bitte prüfen Sie den Vorschlag im Bestellung.pro-Dashboard und übernehmen oder lehnen Sie ihn ab.
                  </p>
                </div>
                <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                    Diese E-Mail wurde automatisch von Bestellung.pro gesendet.
                  </p>
                </div>
              </div>
            </body>
            </html>
          `;

          console.log(`Sending suggestion notification to ${adminEmails.length} admin(s)`);

          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: 'Bestellung.pro <onboarding@resend.dev>',
              to: adminEmails,
              subject: `[Lieferantenportal] Neuer Artikelvorschlag von ${supplier.name || 'Lieferant'}`,
              html: emailHtml,
            }),
          });

          const emailResult = await emailResponse.json();
          console.log('Suggestion notification email sent:', emailResult);
        } catch (emailError) {
          console.error('Error sending suggestion notification:', emailError);
        }
      };

      sendSuggestionNotification();

      return new Response(JSON.stringify({ 
        message: 'Artikelvorschlag eingereicht',
        suggestedArticle: newSuggestion 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in supplier-portal-articles function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});