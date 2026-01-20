import { Controller, UseFormReturn } from 'react-hook-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ArticleFormData } from '../schemas';

interface CategorySectionProps {
  form: UseFormReturn<ArticleFormData>;
  categories: string[];
  isWineCategory: boolean;
}

export function CategorySection({
  form,
  categories,
  isWineCategory,
}: CategorySectionProps) {
  return (
    <div className={cn("grid gap-4", isWineCategory ? "grid-cols-2" : "grid-cols-1")}>
      <div className="space-y-2">
        <Label>Kategorie</Label>
        <Controller
          name="category"
          control={form.control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value || ''}>
              <SelectTrigger className="bg-card">
                <SelectValue placeholder="Auswählen" />
              </SelectTrigger>
              <SelectContent className="bg-card border border-border z-50">
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>
      
      {/* Origin Country - only visible for wine categories */}
      {isWineCategory && (
        <div className="space-y-2">
          <Label>Herkunftsland 🌍</Label>
          <Controller
            name="origin_country"
            control={form.control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <SelectTrigger className="bg-card">
                  <SelectValue placeholder="Herkunftsland auswählen" />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border z-50">
                  <SelectItem value="Deutschland">Deutschland</SelectItem>
                  <SelectItem value="Österreich">Österreich</SelectItem>
                  <SelectItem value="Italien">Italien</SelectItem>
                  <SelectItem value="Frankreich">Frankreich</SelectItem>
                  <SelectItem value="Spanien">Spanien</SelectItem>
                  <SelectItem value="Portugal">Portugal</SelectItem>
                  <SelectItem value="RSA">RSA (Südafrika)</SelectItem>
                  <SelectItem value="Neue Welt">Neue Welt</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      )}
    </div>
  );
}
