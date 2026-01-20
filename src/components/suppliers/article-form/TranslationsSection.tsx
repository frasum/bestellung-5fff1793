import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Globe, ChevronDown, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArticleFormData } from '../schemas';

interface TranslationsSectionProps {
  form: UseFormReturn<ArticleFormData>;
  editingArticleId: string | undefined;
  translationsOpen: boolean;
  setTranslationsOpen: (open: boolean) => void;
}

export function TranslationsSection({
  form,
  editingArticleId,
  translationsOpen,
  setTranslationsOpen,
}: TranslationsSectionProps) {
  const [isTranslatingEn, setIsTranslatingEn] = useState(false);
  const [isTranslatingTh, setIsTranslatingTh] = useState(false);
  const [isTranslatingFr, setIsTranslatingFr] = useState(false);

  const hasEnglishTranslations = !!(form.watch('description_en') || form.watch('grape_variety_en') || 
    form.watch('flavor_profile_en') || form.watch('food_pairings_en'));
  const hasThaiTranslations = !!(form.watch('description_th') || form.watch('grape_variety_th') || 
    form.watch('flavor_profile_th') || form.watch('food_pairings_th'));
  const hasFrenchTranslations = !!(form.watch('description_fr') || form.watch('grape_variety_fr') || 
    form.watch('flavor_profile_fr') || form.watch('food_pairings_fr'));
  const hasAnyTranslations = hasEnglishTranslations || hasThaiTranslations || hasFrenchTranslations;

  const handleAutoTranslate = async (targetLanguage: 'en' | 'th' | 'fr') => {
    if (!editingArticleId) {
      toast.error('Bitte speichern Sie den Artikel zuerst, bevor Sie übersetzen');
      return;
    }

    const setIsTranslating = targetLanguage === 'en' ? setIsTranslatingEn : targetLanguage === 'th' ? setIsTranslatingTh : setIsTranslatingFr;
    setIsTranslating(true);

    try {
      const { data, error } = await supabase.functions.invoke('translate-wine-content', {
        body: { articleId: editingArticleId, targetLanguage },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      if (data.translations) {
        const translations = data.translations;
        const suffix = `_${targetLanguage}` as const;
        
        if (translations.description) form.setValue(`description${suffix}` as any, translations.description);
        if (translations.grape_variety) form.setValue(`grape_variety${suffix}` as any, translations.grape_variety);
        if (translations.flavor_profile) form.setValue(`flavor_profile${suffix}` as any, translations.flavor_profile);
        if (translations.food_pairings) form.setValue(`food_pairings${suffix}` as any, translations.food_pairings);
        if (translations.origin_country) form.setValue(`origin_country${suffix}` as any, translations.origin_country);
        
        const langNames = { en: 'Englische', th: 'Thailändische', fr: 'Französische' };
        toast.success(`${langNames[targetLanguage]} Übersetzung erstellt`);
      }
    } catch (error) {
      console.error('Translation error:', error);
      toast.error('Fehler bei der Übersetzung');
    } finally {
      setIsTranslating(false);
    }
  };

  const renderLanguageSection = (
    lang: 'en' | 'th' | 'fr',
    label: string,
    flag: string,
    borderColor: string,
    placeholders: {
      description: string;
      grapeVariety: string;
      flavorProfile: string;
      foodPairings: string;
      originCountry: string;
    },
    isTranslating: boolean
  ) => (
    <div className={`border-l-2 ${borderColor} pl-3 space-y-3`}>
      <div className="flex items-center gap-2 justify-between">
        <span className="text-sm font-medium">{flag} {label}</span>
        <Button 
          type="button" 
          variant="ghost" 
          size="sm"
          onClick={() => handleAutoTranslate(lang)}
          disabled={isTranslating || !editingArticleId}
          className="h-7 text-xs"
        >
          {isTranslating ? (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <Sparkles className="h-3 w-3 mr-1" />
          )}
          Auto-übersetzen
        </Button>
      </div>
      <Textarea 
        {...form.register(`description_${lang}` as any)} 
        placeholder={placeholders.description}
        className="min-h-[50px] resize-none text-sm"
      />
      <Textarea 
        {...form.register(`grape_variety_${lang}` as any)} 
        placeholder={placeholders.grapeVariety}
        className="min-h-[40px] resize-none text-sm"
      />
      <Textarea 
        {...form.register(`flavor_profile_${lang}` as any)} 
        placeholder={placeholders.flavorProfile}
        className="min-h-[40px] resize-none text-sm"
      />
      <Textarea 
        {...form.register(`food_pairings_${lang}` as any)} 
        placeholder={placeholders.foodPairings}
        className="min-h-[40px] resize-none text-sm"
      />
      <Input 
        {...form.register(`origin_country_${lang}` as any)} 
        placeholder={placeholders.originCountry}
        className="text-sm"
      />
    </div>
  );

  return (
    <Collapsible open={translationsOpen} onOpenChange={setTranslationsOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 hover:bg-muted/50 rounded-md px-2 -mx-2 transition-colors">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium text-sm">Übersetzungen (EN/TH/FR)</span>
        <Badge variant={hasAnyTranslations ? "default" : "secondary"} className="ml-auto text-xs">
          {hasAnyTranslations ? (
            <>{hasEnglishTranslations && '🇬🇧'}{hasThaiTranslations && '🇹🇭'}{hasFrenchTranslations && '🇫🇷'}</>
          ) : 'leer'}
        </Badge>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", translationsOpen && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 pt-3">
        {renderLanguageSection('en', 'English', '🇬🇧', 'border-blue-400', {
          description: 'Description...',
          grapeVariety: 'Grape variety...',
          flavorProfile: 'Flavor profile...',
          foodPairings: 'Food pairings...',
          originCountry: 'Origin country...',
        }, isTranslatingEn)}
        
        {renderLanguageSection('th', 'ไทย', '🇹🇭', 'border-green-400', {
          description: 'คำอธิบาย...',
          grapeVariety: 'พันธุ์องุ่น...',
          flavorProfile: 'รสชาติ...',
          foodPairings: 'อาหารที่เข้ากัน...',
          originCountry: 'ประเทศต้นกำเนิด...',
        }, isTranslatingTh)}
        
        {renderLanguageSection('fr', 'Français', '🇫🇷', 'border-purple-400', {
          description: 'Description...',
          grapeVariety: 'Cépage...',
          flavorProfile: 'Profil aromatique...',
          foodPairings: 'Accords mets-vins...',
          originCountry: "Pays d'origine...",
        }, isTranslatingFr)}
      </CollapsibleContent>
    </Collapsible>
  );
}
