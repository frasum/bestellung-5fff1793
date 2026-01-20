import { z } from 'zod';

export const supplierSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen haben'),
  email: z.string().email('Bitte geben Sie eine gültige E-Mail-Adresse ein'),
  phone: z.string().optional(),
  address: z.string().optional(),
  contact_person: z.string().optional(),
  customer_number: z.string().optional(),
  minimum_order_value: z.string().optional(),
});

export const articleSchema = z.object({
  supplier_id: z.string().min(1, 'Bitte wählen Sie einen Lieferanten'),
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen haben'),
  description: z.string().optional(),
  sku: z.string().optional(),
  unit: z.string().min(1, 'Einheit ist erforderlich'),
  price: z.string().min(1, 'Preis ist erforderlich').refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Preis muss eine positive Zahl sein'),
  category: z.string().optional(),
  origin_country: z.string().optional(),
  packaging_unit: z.string().optional().refine(
    (val) => !val || (!isNaN(Number(val)) && Number(val) > 0),
    'BE muss eine positive Zahl sein'
  ),
  order_unit_id: z.string().optional(),
  reference_price: z.string().optional().refine(
    (val) => !val || (!isNaN(Number(val.replace(',', '.'))) && Number(val.replace(',', '.')) > 0),
    'Referenzpreis muss eine positive Zahl sein'
  ),
  reference_unit: z.string().optional(),
  selling_price: z.string().optional().refine(
    (val) => !val || (!isNaN(Number(val)) && Number(val) >= 0),
    'Verkaufspreis muss eine Zahl sein'
  ),
  grape_variety: z.string().optional(),
  flavor_profile: z.string().optional(),
  food_pairings: z.string().optional(),
  // Translation fields - English
  description_en: z.string().optional(),
  grape_variety_en: z.string().optional(),
  flavor_profile_en: z.string().optional(),
  food_pairings_en: z.string().optional(),
  origin_country_en: z.string().optional(),
  // Translation fields - Thai
  description_th: z.string().optional(),
  grape_variety_th: z.string().optional(),
  flavor_profile_th: z.string().optional(),
  food_pairings_th: z.string().optional(),
  origin_country_th: z.string().optional(),
  // Translation fields - French
  description_fr: z.string().optional(),
  grape_variety_fr: z.string().optional(),
  flavor_profile_fr: z.string().optional(),
  food_pairings_fr: z.string().optional(),
  origin_country_fr: z.string().optional(),
  // Special attributes (Bio, Vegan, etc.)
  special_attributes: z.string().optional(),
});

export type SupplierFormData = z.infer<typeof supplierSchema>;
export type ArticleFormData = z.infer<typeof articleSchema>;

// Type-safe translation field name helpers
export type TranslationLanguage = 'en' | 'th' | 'fr';
export type TranslationField = 'description' | 'grape_variety' | 'flavor_profile' | 'food_pairings' | 'origin_country';

export type TranslationFieldKey<L extends TranslationLanguage> = 
  | `description_${L}`
  | `grape_variety_${L}`
  | `flavor_profile_${L}`
  | `food_pairings_${L}`
  | `origin_country_${L}`;

// Helper to get typed field key
export function getTranslationFieldKey<L extends TranslationLanguage>(
  field: TranslationField,
  lang: L
): TranslationFieldKey<L> {
  return `${field}_${lang}` as TranslationFieldKey<L>;
}
