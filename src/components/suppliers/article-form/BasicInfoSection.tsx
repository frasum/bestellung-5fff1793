import { Controller, UseFormReturn } from 'react-hook-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Supplier } from '@/hooks/useSuppliers';
import { ArticleFormData } from '../schemas';

interface BasicInfoSectionProps {
  form: UseFormReturn<ArticleFormData>;
  editingArticle: any;
  preselectedSupplierId?: string | null;
  suppliers: Supplier[];
}

export function BasicInfoSection({
  form,
  editingArticle,
  preselectedSupplierId,
  suppliers,
}: BasicInfoSectionProps) {
  return (
    <>
      {/* Lieferant-Auswahl nur bei neuen Artikeln ohne preselectedSupplierId */}
      {!editingArticle && !preselectedSupplierId && (
        <div className="space-y-2">
          <Label>Lieferant *</Label>
          <Controller
            name="supplier_id"
            control={form.control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="bg-card">
                  <SelectValue placeholder="Lieferant auswählen" />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border z-50">
                  {suppliers?.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {form.formState.errors.supplier_id && (
            <p className="text-sm text-destructive">{form.formState.errors.supplier_id.message}</p>
          )}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="article-name">Name *</Label>
        <Input id="article-name" {...form.register('name')} placeholder="San Marzano Tomatoes" />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>
    </>
  );
}
