import React from 'react';
import { Input } from '@/components/ui/input';
import { TableCell, TableRow } from '@/components/ui/table';
import { VendorArticle } from './types';

interface ArticleRowProps {
  article: VendorArticle;
  values: {
    storage_1: number;
    storage_2: number;
    total: number;
  };
  isDisabled: boolean;
  onItemChange: (articleId: string, field: 'storage_1' | 'storage_2', value: string) => void;
}

export const ArticleRow = React.memo(function ArticleRow({
  article,
  values,
  isDisabled,
  onItemChange,
}: ArticleRowProps) {
  const value = values.total * (article.price || 0);

  return (
    <TableRow>
      <TableCell>
        <div>
          <div className="font-medium">{article.name}</div>
          {article.sku && (
            <div className="text-xs text-muted-foreground">{article.sku}</div>
          )}
        </div>
      </TableCell>
      <TableCell className="text-center">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={values.storage_1 || ''}
          onChange={(e) => onItemChange(article.id, 'storage_1', e.target.value)}
          disabled={isDisabled}
          className="w-20 h-8 text-center mx-auto"
        />
      </TableCell>
      <TableCell className="text-center">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={values.storage_2 || ''}
          onChange={(e) => onItemChange(article.id, 'storage_2', e.target.value)}
          disabled={isDisabled}
          className="w-20 h-8 text-center mx-auto"
        />
      </TableCell>
      <TableCell className="text-center font-medium">
        {values.total > 0 ? values.total : '-'}
      </TableCell>
      <TableCell className="text-right">
        {value > 0
          ? value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
          : '-'
        }
      </TableCell>
    </TableRow>
  );
});

ArticleRow.displayName = 'ArticleRow';
