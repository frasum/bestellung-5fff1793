import { memo } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArticleFormData } from '../schemas';

interface DescriptionSectionProps {
  form: UseFormReturn<ArticleFormData>;
}

export const DescriptionSection = memo(function DescriptionSection({
  form,
}: DescriptionSectionProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="article-description">Beschreibung</Label>
      <Textarea
        id="article-description"
        {...form.register('description')}
        placeholder="Produktbeschreibung..."
        className="min-h-[80px] resize-y"
      />
    </div>
  );
});
