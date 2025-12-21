import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Save, RotateCcw, Loader2, Check } from 'lucide-react';
import { useTranslationOverrides, useBulkSaveTranslationOverrides, useDeleteTranslationOverride } from '@/hooks/useTranslationOverrides';

// Import translation files
import de from '@/i18n/locales/de.json';
import en from '@/i18n/locales/en.json';
import fr from '@/i18n/locales/fr.json';
import it from '@/i18n/locales/it.json';
import th from '@/i18n/locales/th.json';
import vi from '@/i18n/locales/vi.json';

type TranslationObject = { [key: string]: string | TranslationObject };

const languages: Record<string, { label: string; flag: string; data: TranslationObject }> = {
  en: { label: 'English', flag: '🇬🇧', data: en },
  fr: { label: 'Français', flag: '🇫🇷', data: fr },
  it: { label: 'Italiano', flag: '🇮🇹', data: it },
  th: { label: 'ไทย', flag: '🇹🇭', data: th },
  vi: { label: 'Tiếng Việt', flag: '🇻🇳', data: vi },
};

// Extract all keys from a translation object
const extractKeys = (obj: TranslationObject, prefix = ''): string[] => {
  const keys: string[] = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys.push(...extractKeys(obj[key] as TranslationObject, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
};

// Get value from nested object using dot notation
const getNestedValue = (obj: TranslationObject, path: string): string | undefined => {
  const keys = path.split('.');
  let current: TranslationObject | string = obj;
  for (const key of keys) {
    if (typeof current !== 'object' || current === null) return undefined;
    current = current[key] as TranslationObject | string;
  }
  return typeof current === 'string' ? current : undefined;
};

// Get unique categories from keys
const getCategories = (keys: string[]): string[] => {
  const categories = new Set<string>();
  keys.forEach(key => {
    const category = key.split('.')[0];
    categories.add(category);
  });
  return Array.from(categories).sort();
};

export const TranslationsTab = () => {
  const { t } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const { data: overrides, isLoading: overridesLoading } = useTranslationOverrides();
  const bulkSave = useBulkSaveTranslationOverrides();
  const deleteOverride = useDeleteTranslationOverride();

  // Get all translation keys from German (source)
  const allKeys = useMemo(() => extractKeys(de as TranslationObject), []);
  const categories = useMemo(() => getCategories(allKeys), [allKeys]);

  // Filter keys based on search and category
  const filteredKeys = useMemo(() => {
    return allKeys.filter(key => {
      const matchesSearch = searchTerm === '' || 
        key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (getNestedValue(de as TranslationObject, key) || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || key.startsWith(selectedCategory + '.');
      
      return matchesSearch && matchesCategory;
    });
  }, [allKeys, searchTerm, selectedCategory]);

  // Build override map for quick lookup
  const overrideMap = useMemo(() => {
    const map: Record<string, { id: string; value: string }> = {};
    overrides?.forEach(o => {
      if (o.language_code === selectedLanguage) {
        map[o.translation_key] = { id: o.id, value: o.override_value };
      }
    });
    return map;
  }, [overrides, selectedLanguage]);

  // Initialize edited values when language changes
  useEffect(() => {
    setEditedValues({});
    setHasChanges(false);
  }, [selectedLanguage]);

  const getCurrentValue = (key: string): string => {
    // Check if there's an edited value
    if (editedValues[key] !== undefined) {
      return editedValues[key];
    }
    // Check if there's an override
    if (overrideMap[key]) {
      return overrideMap[key].value;
    }
    // Return original value
    return getNestedValue(languages[selectedLanguage].data, key) || '';
  };

  const getOriginalValue = (key: string): string => {
    return getNestedValue(languages[selectedLanguage].data, key) || '';
  };

  const isModified = (key: string): boolean => {
    return !!overrideMap[key];
  };

  const handleValueChange = (key: string, value: string) => {
    setEditedValues(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    const overridesToSave = Object.entries(editedValues)
      .filter(([key, value]) => {
        const original = getOriginalValue(key);
        return value !== original;
      })
      .map(([key, value]) => ({
        language_code: selectedLanguage,
        translation_key: key,
        original_value: getOriginalValue(key),
        override_value: value,
      }));

    if (overridesToSave.length > 0) {
      bulkSave.mutate(overridesToSave, {
        onSuccess: () => {
          setEditedValues({});
          setHasChanges(false);
        }
      });
    }
  };

  const handleReset = (key: string) => {
    const override = overrideMap[key];
    if (override) {
      deleteOverride.mutate(override.id);
    }
    // Also remove from edited values
    setEditedValues(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  if (overridesLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {t('settings.translationsTab.title')}
          {hasChanges && (
            <Badge variant="secondary" className="ml-2">
              {t('settings.translationsTab.unsavedChanges')}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {t('settings.translationsTab.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('settings.translationsTab.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={t('settings.translationsTab.allCategories')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('settings.translationsTab.allCategories')}</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(languages).map(([code, { label, flag }]) => (
                <SelectItem key={code} value={code}>
                  <span className="flex items-center gap-2">
                    <span>{flag}</span>
                    <span>{label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || bulkSave.isPending}
            size="sm"
          >
            {bulkSave.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {t('settings.translationsTab.save')}
          </Button>
        </div>

        {/* Translation table */}
        <ScrollArea className="h-[500px] rounded-md border">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-[250px]">{t('settings.translationsTab.key')}</TableHead>
                <TableHead className="w-[300px]">{t('settings.translationsTab.germanText')}</TableHead>
                <TableHead>{t('settings.translationsTab.translatedText')}</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredKeys.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    {t('settings.translationsTab.noResults')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredKeys.map(key => {
                  const germanValue = getNestedValue(de as TranslationObject, key) || '';
                  const currentValue = getCurrentValue(key);
                  const modified = isModified(key);
                  const hasEdit = editedValues[key] !== undefined;

                  return (
                    <TableRow key={key} className={modified ? 'bg-primary/5' : ''}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          {key}
                          {modified && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {t('settings.translationsTab.customized')}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{germanValue}</TableCell>
                      <TableCell>
                        <Input
                          value={currentValue}
                          onChange={(e) => handleValueChange(key, e.target.value)}
                          className={hasEdit ? 'border-primary' : ''}
                        />
                      </TableCell>
                      <TableCell>
                        {modified && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleReset(key)}
                                  disabled={deleteOverride.isPending}
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {t('settings.translationsTab.resetTooltip')}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </ScrollArea>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
          <span>
            {t('settings.translationsTab.showing', { 
              count: filteredKeys.length, 
              total: allKeys.length 
            })}
          </span>
          <span>
            {t('settings.translationsTab.customizedCount', { 
              count: overrides?.filter(o => o.language_code === selectedLanguage).length || 0 
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
