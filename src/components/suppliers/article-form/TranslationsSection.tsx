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
import { ArticleFormData, TranslationLanguage, getTranslationFieldKey } from '../schemas';

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

  const handleAutoTranslate = async (targetLanguage: TranslationLanguage) => {
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
        
        if (translations.description) form.setValue(getTranslationFieldKey('description', targetLanguage), translations.description);
        if (translations.grape_variety) form.setValue(getTranslationFieldKey('grape_variety', targetLanguage), translations.grape_variety);
        if (translations.flavor_profile) form.setValue(getTranslationFieldKey('flavor_profile', targetLanguage), translations.flavor_profile);
        if (translations.food_pairings) form.setValue(getTranslationFieldKey('food_pairings', targetLanguage), translations.food_pairings);
        if (translations.origin_country) form.setValue(getTranslationFieldKey('origin_country', targetLanguage), translations.origin_country);
        
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
    lang: TranslationLanguage,
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
        {...form.register(getTranslationFieldKey('description', lang))} 
        placeholder={placeholders.description}
        className="min-h-[50px] resize-none text-sm"
      />
      <Textarea 
        {...form.register(getTranslationFieldKey('grape_variety', lang))} 
        placeholder={placeholders.grapeVariety}
        className="min-h-[40px] resize-none text-sm"
      />
      <Textarea 
        {...form.register(getTranslationFieldKey('flavor_profile', lang))} 
        placeholder={placeholders.flavorProfile}
        className="min-h-[40px] resize-none text-sm"
      />
      <Textarea 
        {...form.register(getTranslationFieldKey('food_pairings', lang))} 
        placeholder={placeholders.foodPairings}
        className="min-h-[40px] resize-none text-sm"
      />
      <Input 
        {...form.register(getTranslationFieldKey('origin_country', lang))} 
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
