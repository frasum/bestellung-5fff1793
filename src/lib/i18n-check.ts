import de from '@/i18n/locales/de.json';
import en from '@/i18n/locales/en.json';
import fr from '@/i18n/locales/fr.json';
import it from '@/i18n/locales/it.json';
import th from '@/i18n/locales/th.json';
import vi from '@/i18n/locales/vi.json';

type TranslationObject = Record<string, unknown>;

const languages = {
  de: de as TranslationObject,
  en: en as TranslationObject,
  fr: fr as TranslationObject,
  it: it as TranslationObject,
  th: th as TranslationObject,
  vi: vi as TranslationObject,
};

export type LanguageCode = keyof typeof languages;

export interface MissingKey {
  key: string;
  missingIn: LanguageCode[];
  presentIn: LanguageCode[];
}

export interface I18nCheckResult {
  totalKeys: number;
  missingKeys: MissingKey[];
  completeness: Record<LanguageCode, { total: number; missing: number; percentage: number }>;
}

// Recursively extract all keys from a nested object
function extractKeys(obj: TranslationObject, prefix = ''): string[] {
  const keys: string[] = [];
  
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...extractKeys(value as TranslationObject, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys;
}

// Check if a key exists in a translation object
function hasKey(obj: TranslationObject, keyPath: string): boolean {
  const parts = keyPath.split('.');
  let current: unknown = obj;
  
  for (let i = 0; i < parts.length; i++) {
    if (current === null || typeof current !== 'object') {
      return false;
    }
    
    const currentObj = current as Record<string, unknown>;
    const part = parts[i];
    
    // Check if this part exists as a direct key
    if (currentObj[part] !== undefined) {
      current = currentObj[part];
      continue;
    }
    
    // Check if remaining parts form a flat key with dots (e.g., "articles.view")
    const remainingKey = parts.slice(i).join('.');
    if (currentObj[remainingKey] !== undefined) {
      return true;
    }
    
    return false;
  }
  
  return true;
}

export function checkI18nCompleteness(): I18nCheckResult {
  // Collect all unique keys from all languages
  const allKeysSet = new Set<string>();
  const keysByLanguage: Record<LanguageCode, Set<string>> = {
    de: new Set(),
    en: new Set(),
    fr: new Set(),
    it: new Set(),
    th: new Set(),
    vi: new Set(),
  };
  
  // Extract keys from each language
  for (const [lang, translations] of Object.entries(languages)) {
    const keys = extractKeys(translations);
    keys.forEach(key => {
      allKeysSet.add(key);
      keysByLanguage[lang as LanguageCode].add(key);
    });
  }
  
  const allKeys = Array.from(allKeysSet).sort();
  const langCodes = Object.keys(languages) as LanguageCode[];
  
  // Find missing keys
  const missingKeys: MissingKey[] = [];
  
  for (const key of allKeys) {
    const presentIn: LanguageCode[] = [];
    const missingIn: LanguageCode[] = [];
    
    for (const lang of langCodes) {
      if (hasKey(languages[lang], key)) {
        presentIn.push(lang);
      } else {
        missingIn.push(lang);
      }
    }
    
    if (missingIn.length > 0) {
      missingKeys.push({ key, missingIn, presentIn });
    }
  }
  
  // Calculate completeness per language
  const completeness = {} as Record<LanguageCode, { total: number; missing: number; percentage: number }>;
  
  for (const lang of langCodes) {
    const missing = missingKeys.filter(mk => mk.missingIn.includes(lang)).length;
    const percentage = allKeys.length > 0 
      ? Math.round(((allKeys.length - missing) / allKeys.length) * 100) 
      : 100;
    
    completeness[lang] = {
      total: allKeys.length,
      missing,
      percentage,
    };
  }
  
  return {
    totalKeys: allKeys.length,
    missingKeys,
    completeness,
  };
}

export const languageNames: Record<LanguageCode, string> = {
  de: 'Deutsch',
  en: 'English',
  fr: 'Français',
  it: 'Italiano',
  th: 'ไทย',
  vi: 'Tiếng Việt',
};
