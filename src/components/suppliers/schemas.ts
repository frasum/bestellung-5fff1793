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
});

export type SupplierFormData = z.infer<typeof supplierSchema>;
export type ArticleFormData = z.infer<typeof articleSchema>;
