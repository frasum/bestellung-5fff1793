import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2 } from 'lucide-react';
import { Article } from '@/hooks/useArticles';

interface FormActionsProps {
  editingArticle: Article | null;
  isPending: boolean;
  onClose: () => void;
  onDelete?: (article: Article) => void;
}

export const FormActions = memo(function FormActions({
  editingArticle,
  isPending,
  onClose,
  onDelete,
}: FormActionsProps) {
  return (
    <div className="flex justify-center items-center gap-6 pt-4">
      {editingArticle && onDelete && (
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="h-12 w-12 rounded-full"
          onClick={() => onDelete(editingArticle)}
          title="Löschen"
        >
          <X className="h-5 w-5" />
        </Button>
      )}
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-12 w-12 rounded-full border-2 text-muted-foreground hover:text-foreground"
        onClick={onClose}
        title="Abbrechen"
      >
        <X className="h-5 w-5" />
      </Button>
      <Button
        type="submit"
        size="icon"
        className="h-12 w-12 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white"
        disabled={isPending}
        title={editingArticle ? 'Speichern' : 'Erstellen'}
      >
        {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
      </Button>
    </div>
  );
});
