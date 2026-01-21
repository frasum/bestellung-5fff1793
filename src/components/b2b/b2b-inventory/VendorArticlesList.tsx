import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, ClipboardList, Plus } from 'lucide-react';
import { VendorGroup } from './types';
import { ArticleRow } from './ArticleRow';

interface VendorArticlesListProps {
  hasActiveSession: boolean;
  isSessionCompleted: boolean;
  groupedArticles: VendorGroup[];
  openVendors: Set<string>;
  onToggleVendor: (vendorId: string) => void;
  getItemValues: (articleId: string) => { storage_1: number; storage_2: number; total: number };
  onItemChange: (articleId: string, field: 'storage_1' | 'storage_2', value: string) => void;
  onNewSession: () => void;
}

export const VendorArticlesList = React.memo(function VendorArticlesList({
  hasActiveSession,
  isSessionCompleted,
  groupedArticles,
  openVendors,
  onToggleVendor,
  getItemValues,
  onItemChange,
  onNewSession,
}: VendorArticlesListProps) {
  if (!hasActiveSession) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Wählen Sie eine Inventur aus oder starten Sie eine neue.
          </p>
          <Button className="mt-4" onClick={onNewSession}>
            <Plus className="h-4 w-4 mr-2" />
            Neue Inventur starten
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (groupedArticles.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Keine Artikel gefunden.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {groupedArticles.map((group) => (
        <Collapsible
          key={group.vendor.id}
          open={openVendors.has(group.vendor.id)}
          onOpenChange={() => onToggleVendor(group.vendor.id)}
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between h-auto py-3 px-4 hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                {openVendors.has(group.vendor.id) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <span className="font-medium">{group.vendor.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {group.capturedCount} / {group.articles.length}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {group.totalValue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </div>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="border rounded-lg overflow-hidden mt-1 mb-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Artikel</TableHead>
                    <TableHead className="text-center">Lager 1</TableHead>
                    <TableHead className="text-center">Lager 2</TableHead>
                    <TableHead className="text-center">Gesamt</TableHead>
                    <TableHead className="text-right">Wert</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.articles.map((article) => (
                    <ArticleRow
                      key={article.id}
                      article={article}
                      values={getItemValues(article.id)}
                      isDisabled={isSessionCompleted}
                      onItemChange={onItemChange}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
});

VendorArticlesList.displayName = 'VendorArticlesList';
