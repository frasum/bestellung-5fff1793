import { UseFormReturn } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ArticleFormData } from '../schemas';

interface WineDetailsSectionProps {
  form: UseFormReturn<ArticleFormData>;
  descriptionRef: React.RefObject<HTMLTextAreaElement>;
  grapeVarietyRef: React.RefObject<HTMLTextAreaElement>;
  flavorProfileRef: React.RefObject<HTMLTextAreaElement>;
  foodPairingsRef: React.RefObject<HTMLTextAreaElement>;
  editingArticle: boolean;
}

export function WineDetailsSection({
  form,
  descriptionRef,
  grapeVarietyRef,
  flavorProfileRef,
  foodPairingsRef,
  editingArticle,
}: WineDetailsSectionProps) {
  return (
    <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
      <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
        🍷 Wein-Details
      </h3>
      
      {/* Selling Price for Wines */}
      <div className="space-y-2">
        <Label htmlFor="article-selling-price">Verkaufspreis (€)</Label>
        <Input 
          id="article-selling-price" 
          type="number"
          step="0.01"
          {...form.register('selling_price')} 
          placeholder="z.B. 42.00"
          onFocus={(e) => e.target.select()}
          className={cn(
            editingArticle && !form.watch('selling_price') && 
            'border-orange-400 bg-orange-50/50 dark:bg-orange-950/20'
          )}
        />
        <p className="text-xs text-muted-foreground">
          Verkaufspreis im Restaurant (für Mitarbeiter sichtbar)
        </p>
      </div>
      
      {/* Description - full width auto-grow */}
      <div className="space-y-2">
        <Label htmlFor="article-description">Beschreibung</Label>
        {(() => {
          const { ref: registerRef, ...rest } = form.register('description');
          return (
            <Textarea
              {...rest}
              ref={(el) => { registerRef(el); (descriptionRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el; }}
              id="article-description"
              placeholder="Weingut, Jahrgang, Qualitätsstufe, besondere Merkmale..."
              className="min-h-[80px] resize-none"
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.max(80, target.scrollHeight)}px`;
              }}
            />
          );
        })()}
      </div>

      {/* Grape Variety - auto-grow */}
      <div className="space-y-2">
        <Label htmlFor="article-grape-variety">Traubensorte 🍇</Label>
        <Textarea 
          ref={grapeVarietyRef}
          id="article-grape-variety" 
          {...form.register('grape_variety')} 
          placeholder="z.B. Riesling, Spätburgunder, Cuvée aus Merlot und Cabernet..."
          className={cn(
            "min-h-[60px] resize-none",
            editingArticle && !form.watch('grape_variety')?.trim() && 
            'border-orange-400 bg-orange-50/50 dark:bg-orange-950/20'
          )}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = `${Math.max(60, target.scrollHeight)}px`;
          }}
        />
      </div>

      {/* Flavor Profile - auto-grow */}
      <div className="space-y-2">
        <Label htmlFor="article-flavor-profile">Geschmacksprofil 🍷</Label>
        <Textarea 
          ref={flavorProfileRef}
          id="article-flavor-profile" 
          {...form.register('flavor_profile')} 
          placeholder="z.B. fruchtig mit Noten von Kirsche und Vanille, samtige Tannine..."
          className={cn(
            "min-h-[60px] resize-none",
            editingArticle && !form.watch('flavor_profile')?.trim() && 
            'border-orange-400 bg-orange-50/50 dark:bg-orange-950/20'
          )}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = `${Math.max(60, target.scrollHeight)}px`;
          }}
        />
      </div>

      {/* Food Pairings - auto-grow */}
      <div className="space-y-2">
        <Label htmlFor="article-food-pairings">Speiseempfehlungen 🍽️</Label>
        <Textarea 
          ref={foodPairingsRef}
          id="article-food-pairings" 
          {...form.register('food_pairings')} 
          placeholder="z.B. Passt hervorragend zu Lamm, gegrilltem Gemüse, reifem Käse..."
          className={cn(
            "min-h-[60px] resize-none",
            editingArticle && !form.watch('food_pairings')?.trim() && 
            'border-orange-400 bg-orange-50/50 dark:bg-orange-950/20'
          )}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = `${Math.max(60, target.scrollHeight)}px`;
          }}
        />
      </div>

      {/* Special Attributes (Bio, Vegan, etc.) */}
      <div className="space-y-2">
        <Label htmlFor="article-special-attributes">Besonderheiten ✨</Label>
        <Input 
          id="article-special-attributes" 
          {...form.register('special_attributes')} 
          placeholder="z.B. Bio, Vegan, Biodynamisch, Demeter, Alte Reben"
        />
        <p className="text-xs text-muted-foreground">
          Komma-getrennte Liste besonderer Eigenschaften
        </p>
      </div>
    </div>
  );
}
