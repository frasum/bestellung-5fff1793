import { Article } from '@/hooks/useArticles';
import i18n from '@/i18n';

// Helper function to get localized wine field
export const getLocalizedField = (wine: Article, field: string): string => {
  const lang = i18n.language;
  // Only check for localized versions for EN, TH, FR
  if (lang === 'en' || lang === 'th' || lang === 'fr') {
    const localizedKey = `${field}_${lang}` as keyof Article;
    const localizedValue = wine[localizedKey];
    if (localizedValue && typeof localizedValue === 'string') {
      return localizedValue;
    }
  }
  // Fallback to German original
  return (wine[field as keyof Article] as string) || '';
};

// Check if wine data is incomplete
export const isWineIncomplete = (wine: Article): boolean => {
  return (
    !wine.description?.trim() ||
    !wine.grape_variety?.trim() ||
    !wine.origin_country?.trim() ||
    !wine.image_url
  );
};

// Check specific missing fields
export const getMissingFields = (wine: Article) => ({
  description: !wine.description?.trim(),
  grapeVariety: !wine.grape_variety?.trim(),
  originCountry: !wine.origin_country?.trim(),
  image: !wine.image_url,
});
