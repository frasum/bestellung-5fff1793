import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WineMenuEntry {
  name: string;
  winery?: string;
  grape_variety?: string;
  price_075l?: number;
  aromas?: string;
  taste?: string;
  special_attributes?: string[];
  country?: string;
}

interface SyncResult {
  articleId: string;
  articleName: string;
  matched: boolean;
  updates: {
    selling_price?: boolean;
    flavor_profile?: boolean;
    special_attributes?: boolean;
  };
}

// Normalize text for matching: lowercase, remove accents, special chars
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .replace(/\s+/g, ' ')
    .trim();
}

// Calculate simple similarity score between two strings
function similarity(a: string, b: string): number {
  const normA = normalize(a);
  const normB = normalize(b);
  
  if (normA === normB) return 1;
  
  // Check if one contains the other
  if (normA.includes(normB) || normB.includes(normA)) return 0.8;
  
  // Word-level matching
  const wordsA = normA.split(' ').filter(w => w.length > 2);
  const wordsB = normB.split(' ').filter(w => w.length > 2);
  
  let matches = 0;
  for (const wordA of wordsA) {
    if (wordsB.some(wordB => wordA.includes(wordB) || wordB.includes(wordA))) {
      matches++;
    }
  }
  
  return matches / Math.max(wordsA.length, wordsB.length, 1);
}

// Find best matching article for a wine menu entry
function findBestMatch(
  entry: WineMenuEntry,
  articles: { 
    id: string; 
    name: string; 
    grape_variety?: string | null; 
    origin_country?: string | null;
    selling_price?: number | null;
    flavor_profile?: string | null;
    special_attributes?: string | null;
  }[]
): { article: typeof articles[0]; score: number } | null {
  let bestMatch: { article: typeof articles[0]; score: number } | null = null;
  
  for (const article of articles) {
    // Primary match: name similarity
    let score = similarity(entry.name, article.name);
    
    // Boost if winery name is in article name
    if (entry.winery && normalize(article.name).includes(normalize(entry.winery))) {
      score += 0.2;
    }
    
    // Boost if grape variety matches
    if (entry.grape_variety && article.grape_variety) {
      if (normalize(entry.grape_variety).includes(normalize(article.grape_variety)) ||
          normalize(article.grape_variety).includes(normalize(entry.grape_variety))) {
        score += 0.15;
      }
    }
    
    // Boost if country matches
    if (entry.country && article.origin_country) {
      if (normalize(entry.country) === normalize(article.origin_country)) {
        score += 0.1;
      }
    }
    
    if (score > 0.5 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { article, score };
    }
  }
  
  return bestMatch;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { wineMenuEntries, organizationId, dryRun = false } = await req.json() as {
      wineMenuEntries: WineMenuEntry[];
      organizationId: string;
      dryRun?: boolean;
    };

    if (!wineMenuEntries || !Array.isArray(wineMenuEntries)) {
      return new Response(JSON.stringify({ error: 'wineMenuEntries array required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!organizationId) {
      return new Response(JSON.stringify({ error: 'organizationId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch all wine articles for this organization
    const { data: articles, error: fetchError } = await supabase
      .from('articles')
      .select('id, name, grape_variety, origin_country, selling_price, flavor_profile, special_attributes')
      .eq('organization_id', organizationId)
      .ilike('category', '%wein%');

    if (fetchError) {
      console.error('Error fetching articles:', fetchError);
      return new Response(JSON.stringify({ error: 'Failed to fetch articles' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${articles?.length || 0} wine articles, processing ${wineMenuEntries.length} menu entries`);

    const results: SyncResult[] = [];
    let updatedCount = 0;
    let matchedCount = 0;

    for (const entry of wineMenuEntries) {
      const match = findBestMatch(entry, articles || []);
      
      if (!match) {
        results.push({
          articleId: '',
          articleName: entry.name,
          matched: false,
          updates: {},
        });
        continue;
      }

      matchedCount++;
      const article = match.article;
      const updates: Record<string, any> = {};
      const updatesApplied: SyncResult['updates'] = {};

      // Rule 1: selling_price - only set if currently empty/null/0
      if (entry.price_075l && (!article.selling_price || article.selling_price === 0)) {
        updates.selling_price = entry.price_075l;
        updatesApplied.selling_price = true;
      }

      // Rule 2: flavor_profile - only replace if already filled (not empty)
      // Combine aromas and taste from PDF
      const newFlavorProfile = [entry.aromas, entry.taste].filter(Boolean).join('. ');
      if (newFlavorProfile && article.flavor_profile?.trim()) {
        updates.flavor_profile = newFlavorProfile;
        updatesApplied.flavor_profile = true;
      }

      // Rule 3: special_attributes - always set (new field)
      if (entry.special_attributes && entry.special_attributes.length > 0) {
        updates.special_attributes = entry.special_attributes.join(', ');
        updatesApplied.special_attributes = true;
      }

      results.push({
        articleId: article.id,
        articleName: article.name,
        matched: true,
        updates: updatesApplied,
      });

      // Apply updates if not dry run and there are changes
      if (!dryRun && Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('articles')
          .update(updates)
          .eq('id', article.id);

        if (updateError) {
          console.error(`Error updating article ${article.id}:`, updateError);
        } else {
          updatedCount++;
          console.log(`Updated article ${article.name}:`, updates);
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      dryRun,
      summary: {
        totalEntries: wineMenuEntries.length,
        matched: matchedCount,
        updated: dryRun ? 0 : updatedCount,
        notMatched: wineMenuEntries.length - matchedCount,
      },
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Error in sync-wine-menu:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
