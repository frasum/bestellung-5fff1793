import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Wine data from the Weinkarte PDF - Option B format (without vintage)
const wineData = [
  // Dessertwein
  { name: "Noble Late Harvest | Diemersdal", winery: "diemersdal", aroma: "Tropische Früchte, Mandel, Trockenfrüchte", taste: "Frische Säure, saftig, würzig, leichte Süße", grape: "Sauvignon Blanc" },
  { name: "Wachenheimer Riesling Auslese | Dr. Bürklin Wolf", winery: "bürklin", aroma: "Mango, reife Zitrusfrüchte", taste: "Schlank, dicht, saftig, elegante Süße", grape: "Riesling" },
  
  // Champagner
  { name: "Champagne Louis Roederer Collection Brut", winery: "roederer", aroma: "Gelbe Pflaume, weißer Pfirsich, florale Noten", taste: "Frisch, feinfruchtig, lebendige Perlage", grape: "Chardonnay, Pinot Noir, Pinot Meunier" },
  { name: "Champagne Bollinger Special Cuvée", winery: "bollinger", aroma: "Holunderblüte, grüner Apfel, Aprikose", taste: "Anregend, fruchtig, intensives Finale", grape: "Chardonnay, Pinot Noir, Pinot Meunier" },
  { name: "Champagne Louis Roederer Rosé Vintage", winery: "roederer", aroma: "Blumig-würzige Noten, Citrus, Kakao", taste: "Fruchtig, mineralisch, Wildbeeren, Trockenobst", grape: "Chardonnay, Pinot Noir" },
  
  // Spanien
  { name: "Garnacha El Chaparral | Bodegas Nekeas", winery: "nekeas", keywords: ["garnacha", "chaparral"], aroma: "Dunkle Fruchtnoten, Pfeffer, Himbeere", taste: "Fruchtig, vollmundig, langes Finale, elegant", grape: "Garnacha" },
  { name: "Il Lusió Garnatxa Negra | Cellar Xavier Clua", winery: "clua", keywords: ["lusio", "garnatxa"], aroma: "Kirsche, Walderdbeere, Gewürze, Kräuter", taste: "Balanciert, leichtes Holz, frische Säure, intensiv", grape: "Garnatxa Negra, Garnatxa Peluda" },
  { name: "575 Uvas Do | Viñas del Cambrico", winery: "cambrico", keywords: ["575", "uvas"], aroma: "Brombeere, Cassis, Lorbeer, Kokos, Leder", taste: "Würzig, mineralisch, vollmundig, langer Abgang", grape: "Tempranillo, Rufete, Calabrés" },
  { name: "Ribera del Duero Reserva | Bodegas Comenge", winery: "comenge", keywords: ["ribera", "comenge"], aroma: "Lakritze, reife Beeren, Karamell, Vanille", taste: "Sanft, vollmundig, würzig, samtiger Abgang", grape: "Tempranillo" },
  
  // Schaumwein
  { name: "Serprino Bianco Frizzante | Villa Sceriman", winery: "sceriman", keywords: ["serprino"], aroma: "Stachelbeere, Birne, Traubensaft", taste: "Saftig, frisch, harmonisch, feine leichte Perlage", grape: "Serprina" },
  { name: "Cava Cossetània Brut Rosé | Castell d'Or", winery: "cossetania", keywords: ["cossetania", "cava"], aroma: "Himbeere, Erdbeere, Stachelbeere", taste: "Sehr beerig, floral, fruchtig, feinperlig", grape: "Trepat" },
  
  // Südafrika
  { name: "Syrah Toffee Chunk | Simonsvlei", winery: "simonsvlei", keywords: ["toffee", "chunk"], aroma: "Toffee, rauchig, Waldluft", taste: "Fruchtig, cremig, waldbeerig, vollmundig", grape: "Syrah" },
  { name: "Cabernet Sauvignon | Edgebaston", winery: "edgebaston", keywords: ["edgebaston", "cabernet"], aroma: "Dunkle Beeren, Minze, Kräuter, Vanille", taste: "Vollmundig, schwarze Johannisbeere, Mokka", grape: "Cabernet Sauvignon" },
  { name: "Pinotage Reserve | Diemersdal", winery: "diemersdal", keywords: ["pinotage", "reserve"], aroma: "Reife Beeren, Gewürze, Schokolade", taste: "Pflaume, Holznote, körperreich, schmeichelnd", grape: "Pinotage" },
  
  // Österreich Rotwein
  { name: "Zweigelt Platter Rieden | Fidesser", winery: "fidesser", keywords: ["zweigelt", "platter"], aroma: "Kirsche, Waldbeeren, Wiesenheu, Gewürze", taste: "Saftig, dicht, würzig, fruchtig animierend", grape: "Blauer Zweigelt" },
  { name: "Cabernet & Zweigelt Kirchleiten | Fidesser", winery: "fidesser", keywords: ["kirchleiten", "cabernet"], aroma: "Weichsel, schwarze Johannisbeere, Lakritze", taste: "Herbfruchtig, saftig, duftig, aromatisch, würzig", grape: "Zweigelt, Cabernet Sauvignon" },
  { name: "Pinot Noir Kapellenberg | Fidesser", winery: "fidesser", keywords: ["kapellenberg", "pinot"], aroma: "Cassis, Sauerkirsche, Flieder, Tabakblatt", taste: "Facettenreich, fruchtig, rauchig, feines Tannin", grape: "Pinot Noir" },
  
  // Deutschland Weisswein
  { name: "Sauvignon Blanc Deidesheimer Nonnenstück | Reinhardt", winery: "reinhardt", keywords: ["deidesheimer", "nonnenstück"], aroma: "Weinbergpfirsich, rote Stachelbeere, Maracuja", taste: "Fruchtig, harmonische Säure, erfrischender Abgang", grape: "Sauvignon Blanc" },
  { name: "Dr. Bürklin Wolf Blanc", winery: "bürklin", keywords: ["bürklin", "blanc"], aroma: "Apfel, Holunderblüte, Zitrusfrüchte", taste: "Reife Südfrüchte, fruchtig, charmant, frisch", grape: "Riesling, Scheurebe, Sauvignon Blanc" },
  { name: "Auxerrois | Seehof", winery: "seehof", keywords: ["auxerrois", "seehof"], aroma: "Stachelbeere, Grapefruit, weiße Johannisbeere", taste: "Klar, frisch, zarter Schmelz, verspielter Nachhall", grape: "Auxerrois" },
  { name: "Dr. Bürklin Wolf Riesling", winery: "bürklin", keywords: ["bürklin", "riesling"], aroma: "Apfel, Limette, floral", taste: "Fruchtig, frisch, saftig, elegant, mineralisch", grape: "Riesling" },
  
  // Italien Weisswein
  { name: "Grechetto Colli Martani | Terre de la Custodia", winery: "custodia", keywords: ["grechetto", "martani"], aroma: "Zitrusfrüchte, Pfirsich, Kamille", taste: "Mineralisch, frisch, lebendige Säurestruktur", grape: "Grechetto" },
  { name: "Gavi di Gavi Rovereto | Picollo Ernesto", winery: "picollo", keywords: ["gavi", "rovereto"], aroma: "Weiße Blüten, Pfirsich, tropische Früchte", taste: "Kraftvoll, Kräuternoten, leicht mineralisch, aromatisch", grape: "Cortese" },
  { name: "Verdicchio Castelli di Jesi Costa Verde | Tavignano", winery: "tavignano", keywords: ["verdicchio", "costa verde"], aroma: "Exotische Früchte, florale Noten", taste: "Frisch, balancierte Säure, fruchtig", grape: "Verdicchio" },
  { name: "Vermentino di Gallura Branu | Vigne Surrau", winery: "surrau", keywords: ["vermentino", "branu", "gallura"], aroma: "Quitte, weiße Blüte, Zitrus, Heublume", taste: "Kraftvoll, dicht, cremig, saftig, fruchtig", grape: "Vermentino di Gallura" },
  { name: "Campania Greco Due Chicchi | Benito Ferrara", winery: "ferrara", keywords: ["greco", "chicchi"], aroma: "Zitrusfrüchte, Fruchtnoten, weiße Blüten", taste: "Lebendige Frische, körperreich, erfrischend, fruchtig", grape: "Greco, Coda di Volpe" },
  { name: "Ribolla Gialla | La Tunella", winery: "tunella", keywords: ["ribolla", "rjgialla"], aroma: "Blumig, fruchtig, gelber Pfirsich, Pflaume", taste: "Intensiv, vollmundig, fruchtig, geschmeidig", grape: "Ribolla Gialla" },
  { name: "Friulano | La Tunella", winery: "tunella", keywords: ["friulano", "tunella"], aroma: "Bittermandel, Birne, Feldblume, Akazie", taste: "Samtig, sehr wenig Säure, strukturiert, vollmundig", grape: "Friulano" },
  { name: "Réserve della Contessa | Manincor", winery: "manincor", keywords: ["contessa", "manincor"], aroma: "Apfel, Steinobst, Wiesenkräuter, Salbei", taste: "Dicht, elegant, animierende Säure, lang anhaltend", grape: "Pinot Bianco, Chardonnay, Sauvignon Blanc" },
  { name: "Timorgasso Monferrato Bianco | Morgassi Superiore", winery: "morgassi", keywords: ["timorgasso", "morgassi"], aroma: "Fruchtig, würzig, leichte Rauchnote, weiße Blüten", taste: "Intensiv, strukturiert, balanciert, mineralisch", grape: "Timorasso" },
  { name: "Roero Arneis | Vietti", winery: "vietti", keywords: ["roero", "arneis", "vietti"], aroma: "Blumig, Pfirsich, Birne, frisch", taste: "Sehr komplex, lang anhaltend, rund, fruchtig", grape: "Roero Arneis" },
  { name: "Pinot Grigio Porer | Alois Lageder", winery: "lageder", keywords: ["porer", "lageder", "pinot grigio"], aroma: "Kernobst, Mandel, Cashew, Heu", taste: "Harmonisch, strukturiert, ausgewogen, intensiv", grape: "Pinot Grigio" },
  { name: "Zie XVI | Alois Lageder", winery: "lageder", keywords: ["zie", "lageder"], aroma: "Kernobst, heller Tabak, nussig, würzig, leicht holzig", taste: "Tief, voller Körper, erdige Mineralik, komplex", grape: "Gemischter Satz" },
  
  // Italien Rotwein
  { name: "Arcione | La Tunella", winery: "tunella", keywords: ["arcione", "tunella"], aroma: "Schwarzkirsche, Pfeffer, Tabak, Leder, erdig", taste: "Dicht, muskulös, lebendig, fruchtig, elegantes Tannin", grape: "Schiopettino, Pignolo" },
  { name: "Campi Magri Valpolicella Ripasso | Corte Sant'Alda", winery: "sant'alda", keywords: ["campi magri", "ripasso"], aroma: "Dunkle Kirsche, Himbeere, Kakao, süßer Tabak, Vanille", taste: "Intensiv, vielschichtig, präzise, gehaltvoll", grape: "Corvina, Rondinella, Molinara" },
  { name: "Schiopettino | Bressan", winery: "bressan", keywords: ["schiopettino", "bressan"], aroma: "Himbeere, Blaubeere, Moos, Holz, Moschus", taste: "Elegant, außergewöhnlich, voll, frisch, fruchtig", grape: "Schiopettino" },
  { name: "Amarone Riserva Campo del Titari | Luigi Brunelli", winery: "brunelli", keywords: ["amarone", "titari"], aroma: "Kirsche, Himbeere, Kakao, süßer Tabak, Vanille", taste: "Dichter Extrakt, elegant, vollmundig, feines Tannin", grape: "Corvina, Corvinone, Rondinella, Oseleta" },
  { name: "Molino a Vento Nerello Mascalese | Tenute Orestiadi", winery: "orestiadi", keywords: ["molino", "nerello"], aroma: "Wilde Beeren, Gewürze, Granatapfel", taste: "Elegant, strukturiert, sehr harmonisch", grape: "Nerello Mascalese" },
  { name: "Primitivo Salento | Cantine de Falco", winery: "falco", keywords: ["primitivo", "salento"], aroma: "Waldbeeren, Amarenakirsche, würzig, pfeffrig", taste: "Fruchtig, geschmeidig, vollmundig, kraftvoll", grape: "Primitivo" },
  { name: "Nero d'Avola Terre Siciliane | Vinicola Funaro", winery: "funaro", keywords: ["nero", "avola", "funaro"], aroma: "Frisch, rote Beeren, Kirsche, Kräuter", taste: "Dicht, kräftig, weiches Tannin, langes Finale", grape: "Nero d'Avola" },
  { name: "Rosso Piceno | Conti Saladini Pilastri", winery: "saladini", keywords: ["rosso", "piceno"], aroma: "Weiches Bouquet, Mandel, Minze, Erde, Feige", taste: "Weiches Tannin, sanft, schmelzend", grape: "Sangiovese, Montepulciano" },
  { name: "Borgo del Mandorlo Puglia Rosso | Botter", winery: "botter", keywords: ["mandorlo", "puglia"], aroma: "Pflaume, Rosine, Gewürze", taste: "Reife rote Früchte, Vanille, weiche Tannine, gehaltvoll", grape: "Negroamaro, Merlot, Cabernet" },
  { name: "Barbera d'Asti La Villa | Tenuta Olim Bauda", winery: "olim bauda", keywords: ["barbera", "villa"], aroma: "Waldbeeren, Kirsche, würzig", taste: "Fruchtig, würzig, geschmeidig, vollmundig", grape: "Barbera" },
  { name: "Merlot Sassonero Colli Euganei | Cà Lustra", winery: "lustra", keywords: ["sassonero", "euganei"], aroma: "Kirsche, schwarze Beeren, Zeder, Holz", taste: "Bitterschokolade, beerig, kräftig, langer Abgang", grape: "Merlot" },
  { name: "Spatus 8 Nero di Troja | Masseria Tagaro", winery: "tagaro", keywords: ["spatus", "troja"], aroma: "Intensiv nach roten Früchten, würzig, Mokka", taste: "Vollmundig, frisch würzig, fruchtig, weiche Tannine", grape: "Nero di Troja" },
  { name: "Chianti Classico Riserva | I Sodi", winery: "sodi", keywords: ["chianti", "riserva"], aroma: "Kirsche, Pflaume, Schokolade, Gewürze", taste: "Saftig, dicht, komplex, frischer Abgang, intensiv", grape: "Sangiovese, Canaiolo" },
  { name: "Majoli Ruchè di Castagnole Monferrato | Dacapo", winery: "dacapo", keywords: ["ruchè", "majoli"], aroma: "Intensiv, reife Früchte, Gewürze", taste: "Weich, warm, harmonisch, balanciert", grape: "Ruchè" },
  { name: "Orbis Natural Wine Orange | Fidesser", winery: "fidesser", keywords: ["orbis", "orange"], aroma: "Orangenzeste, Weingartenpfirsich, Obstwiese", taste: "Steinobst, saftig, cremig, weißfleischig", grape: "Frühroter Veltliner, Chardonnay" },
  
  // Frankreich Rotwein
  { name: "Costières de Nîmes | Rémy Ferbras", winery: "ferbras", keywords: ["costieres", "nimes"], aroma: "Fruchtkompott, reife Beeren, intensiv würzig", taste: "Aromatisch, geschmeidig, vollmundig, lang anhaltend", grape: "Grenache, Mourvèdre, Syrah" },
  { name: "Cairanne | Rémy Ferbras", winery: "ferbras", keywords: ["cairanne"], aroma: "Reife Erdbeere, Heidelbeere, Gewürze, Schokolade", taste: "Seidige Tannine, Röstaromen, geschmeidig, dicht", grape: "Grenache, Syrah, Mourvèdre" },
  { name: "Côtes du Rhône | Domaine Paul Autard", winery: "autard", keywords: ["cotes", "rhone", "autard"], aroma: "Himbeere, Granatapfel, Pfeffer", taste: "Intensiv, samtig, harmonisch, fruchtig", grape: "Grenache, Syrah, Mourvèdre" },
  { name: "Corbières Magneric | Domaine Sainte Croix", winery: "sainte croix", keywords: ["corbieres", "magneric"], aroma: "Schwarze Früchte, Vanille, feuchte Erde, Cassis", taste: "Vollmundig, Kirsche, leichtes Tannin, kräftig", grape: "Grenache, Syrah, Carignan, Mourvèdre" },
  { name: "Cahors Malbec XL | Château Lacapelle Cabanac", winery: "lacapelle", keywords: ["cahors", "malbec"], aroma: "Blaubeer-Marmelade, intensive Frucht, Caffé", taste: "Würzig, kraftvoll, Leder, vanilliges Finale", grape: "Malbec" },
  
  // Frankreich Weisswein
  { name: "Chardonnay Grande Réserve | Secret Boisé", winery: "secret boise", keywords: ["grande reserve", "secret"], aroma: "Buttrige Holzaromen, weiße Blüten, Karamell", taste: "Tropische Früchte, nussig, langer Abgang", grape: "Chardonnay" },
  { name: "Viognier VdP d'Oc | Domaine Astruc", winery: "astruc", keywords: ["viognier", "astruc"], aroma: "Aprikose, Pfirsich, florale Noten", taste: "Fruchtig, strukturiert, frisch, vollmundig", grape: "Viognier" },
  { name: "Pacherenc du Vic Bilh Cuvée Ericka | Château Laffitte Teston", winery: "laffitte", keywords: ["pacherenc", "ericka"], aroma: "Vanille, Toast, weiße Blumen, Ananas, Minze", taste: "Kräftig, vollmundig, fruchtig, feine Säure", grape: "Petit & Gros Manseng, Petit Courbu" },
  { name: "N°7 Blanc | Domaine La Croix Belle", winery: "croix belle", keywords: ["n°7", "croix belle"], aroma: "Intensiv, Quitte, Trockenfrüchte", taste: "Elegant, Honig, Vanille, exotische Früchte, mineralisch", grape: "Cuvée aus 7 weißen Rebsorten" },
  { name: "Grand Enclos Graves | Château de Cérons", winery: "cerons", keywords: ["grand enclos", "graves"], aroma: "Grapefruit, Maracuja, Akazie, Bienenwachs", taste: "Aromatisch, feinfruchtig, pikant, elegant, nachhaltig", grape: "Sauvignon Blanc & Gris, Sémillon" },
  { name: "Chablis | Domaine des Malandes", winery: "malandes", keywords: ["chablis", "malandes"], aroma: "Apfel, Grapefruit, floral, mineralisch", taste: "Elegant, geradlinig, subtil, anhaltend", grape: "Chardonnay" },
  { name: "Trigone N°21 Côtes Catalanes Blanc | Le Soula", winery: "soula", keywords: ["trigone", "soula"], aroma: "Zitrusfrüchte, Pfirsich, Bergkräuter", taste: "Vielschichtig, strukturiert, leicht salzig, elegant", grape: "Macabeo, Vermentino, Sauvignon" },
  
  // Südafrika Weisswein
  { name: "Chardonnay Unwooded | Diemersdal", winery: "diemersdal", keywords: ["chardonnay", "unwooded"], aroma: "Grüner Apfel, Melone, Limette, Gewürze", taste: "Frisch, fruchtig, geschmacksintensiv, cremig", grape: "Chardonnay" },
  { name: "Chardonnay Vineyard Selection | Kleine Zalze", winery: "kleine zalze", keywords: ["chardonnay", "vineyard"], aroma: "Birne, Zitrusfrucht, geräucherte Nüsse", taste: "Fruchtig, mineralisch, seidiger Abgang, Holznote", grape: "Chardonnay" },
  { name: "Chenin Blanc Vineyard Selection | Kleine Zalze", winery: "kleine zalze", keywords: ["chenin", "vineyard"], aroma: "Guave, Quitte, grüne Melone, Eiche", taste: "Reif fruchtig, mineralisch, leichte Holznote", grape: "Chenin Blanc" },
  { name: "Winter Ferment Sauvignon Blanc | Diemersdal", winery: "diemersdal", keywords: ["winter ferment", "sauvignon"], aroma: "Physalis, Grapefruit, tropische Früchte", taste: "Fruchtig, intensiv, vollmundig, mineralisch", grape: "Sauvignon Blanc" },
  { name: "Glen Carlou Collection White Blend", winery: "glen carlou", keywords: ["glen carlou", "white blend"], aroma: "Tropische Früchte, Gewürze, Holznoten", taste: "Cremig, strukturiert, würzig, Vanille", grape: "Sauvignon Blanc, Chardonnay, Sémillon" },
  
  // Österreich Weisswein
  { name: "Grüner Veltliner Platter | Fidesser", winery: "fidesser", keywords: ["grüner veltliner", "platter"], aroma: "Kernobst, Birne, Kräuter, würzig", taste: "Saftige Fruchtnoten, pfeffrig, zarte Mineralik", grape: "Grüner Veltliner" },
  { name: "Mischsatz vom Alten Weingarten | Norbert Bauer", winery: "bauer", keywords: ["mischsatz", "weingarten", "bauer"], aroma: "Aromatisch, fruchtig, blumig, exotisch", taste: "Cremig, frisch, vielschichtig, saftig", grape: "Gemischter Satz" },
  { name: "Orbis Natural Wine White | Fidesser", winery: "fidesser", keywords: ["orbis", "white"], aroma: "Gelber Apfel, Grapefruit, weiße Blüten", taste: "Feinwürzig, strukturiert, leichte Hefenoten", grape: "Cuvée" },
  
  // Rosé
  { name: "Sauvignon Rosé | Diemersdal", winery: "diemersdal", keywords: ["sauvignon", "rosé"], aroma: "Passionsfrucht, Kirsche, Walderdbeere", taste: "Frisch, fruchtig, beerig, knackig", grape: "Sauvignon Blanc, Cabernet Sauvignon" },
  { name: "Dr. Bürklin Wolf Rosé", winery: "bürklin", keywords: ["bürklin", "rosé"], aroma: "Rhabarber, Erdbeere, Himbeere", taste: "Frisch, saftig, würzig, leicht mineralisch", grape: "Pinot Noir" },
  { name: "Cuvée Julie Fronton Rosé | Château Clamens", winery: "clamens", keywords: ["cuvée julie", "fronton"], aroma: "Grapefruit, reife Beeren, Kiwi", taste: "Vollmundig, frisch, aromatisch, spritziger Abgang", grape: "Négrette, Syrah" },
  { name: "Cerasuolo d'Abruzzo | Fattoria Buccicatino", winery: "buccicatino", keywords: ["cerasuolo", "abruzzo"], aroma: "Reife rote Früchte, Johannisbeere", taste: "Frisch, Kirsche, Beerenkonfitüre, trocken, balanciert", grape: "Montepulciano d'Abruzzo" },
];

// Helper function to normalize text for matching
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    .replace(/['´`']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Match function with flexible matching
function findBestMatch(catalogName: string, wines: typeof wineData): typeof wineData[0] | null {
  const normalizedCatalog = normalize(catalogName);
  
  // First try: direct keyword matches
  for (const wine of wines) {
    if (wine.keywords) {
      const matchCount = wine.keywords.filter(kw => normalizedCatalog.includes(normalize(kw))).length;
      if (matchCount >= 1 && wine.keywords.length <= 2) {
        return wine;
      }
      if (matchCount >= 2) {
        return wine;
      }
    }
  }
  
  // Second try: winery name match
  for (const wine of wines) {
    if (normalizedCatalog.includes(normalize(wine.winery))) {
      // Check if wine type also matches
      const wineryMatch = normalize(wine.winery);
      if (normalizedCatalog.includes(wineryMatch)) {
        return wine;
      }
    }
  }
  
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get organization ID for The Spice Bazaar
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .ilike('name', '%spice%')
      .single();

    if (orgError || !org) {
      console.error('Organization not found:', orgError);
      return new Response(
        JSON.stringify({ error: 'Organization not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all wine articles
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('id, name, description')
      .eq('organization_id', org.id)
      .ilike('category', '%wein%');

    if (articlesError) {
      console.error('Error fetching articles:', articlesError);
      return new Response(
        JSON.stringify({ error: 'Error fetching articles' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${articles?.length} wine articles`);

    const results = {
      matched: 0,
      updated: 0,
      notMatched: [] as string[],
      errors: [] as string[],
    };

    // Process each article
    for (const article of articles || []) {
      const match = findBestMatch(article.name, wineData);
      
      if (match) {
        results.matched++;
        
        // Build description from aroma + taste
        const description = `${match.aroma}. ${match.taste}.`;
        
        // Update article with new name and description
        const { error: updateError } = await supabase
          .from('articles')
          .update({
            name: match.name,
            description: description,
            grape_variety: match.grape,
          })
          .eq('id', article.id);

        if (updateError) {
          console.error(`Error updating ${article.name}:`, updateError);
          results.errors.push(`${article.name}: ${updateError.message}`);
        } else {
          console.log(`Updated: ${article.name} -> ${match.name}`);
          results.updated++;
        }
      } else {
        results.notMatched.push(article.name);
      }
    }

    console.log(`Results: ${results.matched} matched, ${results.updated} updated, ${results.notMatched.length} not matched`);

    return new Response(
      JSON.stringify({
        success: true,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Import error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
