import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, ExternalLink, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

interface KroeswangProduct {
  name: string;
  price: string;
  unit: string;
  articleNumber: string;
  category: string;
  description?: string;
  url?: string;
}

const CATEGORIES = [
  { value: 'fleisch', label: 'Fleisch' },
  { value: 'gefluegel', label: 'Geflügel' },
  { value: 'fisch', label: 'Fisch & Meeresfrüchte' },
  { value: 'wild', label: 'Wild' },
  { value: 'wurst', label: 'Wurst & Schinken' },
  { value: 'convenience', label: 'Convenience' },
  { value: 'tiefkuehl', label: 'Tiefkühl' },
  { value: 'molkerei', label: 'Molkerei' },
];

export const KroeswangCatalogSearch = () => {
  const { t } = useTranslation();
  const [category, setCategory] = useState('fleisch');
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<KroeswangProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    setIsLoading(true);
    setHasSearched(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('search-kroeswang-catalog', {
        body: { category, searchTerm, limit: 30 },
      });

      if (error) {
        console.error('Error searching catalog:', error);
        toast.error('Fehler bei der Katalogsuche');
        return;
      }

      if (data.success && data.products) {
        setProducts(data.products);
        if (data.products.length === 0) {
          toast.info('Keine Produkte gefunden');
        } else {
          toast.success(`${data.products.length} Produkte gefunden`);
        }
      } else {
        toast.error(data.error || 'Fehler bei der Suche');
      }
    } catch (err) {
      console.error('Search error:', err);
      toast.error('Fehler bei der Katalogsuche');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Kröswang Katalog-Suche
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Kategorie wählen" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Suchbegriff (optional)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="ml-2 hidden sm:inline">Suchen</span>
            </Button>
          </div>
        </div>

        {/* Results */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Durchsuche kroeswang.at...</span>
          </div>
        )}

        {!isLoading && hasSearched && products.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Keine Produkte gefunden. Versuche einen anderen Suchbegriff.
          </div>
        )}

        {!isLoading && products.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produkt</TableHead>
                  <TableHead>Preis</TableHead>
                  <TableHead className="hidden md:table-cell">Art.Nr.</TableHead>
                  <TableHead className="hidden lg:table-cell">Kategorie</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        {product.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {product.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono">
                        {product.price}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {product.articleNumber || '-'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant="outline">{product.category}</Badge>
                    </TableCell>
                    <TableCell>
                      {product.url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(product.url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Info */}
        <p className="text-xs text-muted-foreground text-center">
          Die Preise werden direkt von kroeswang.at abgerufen und können sich ändern.
        </p>
      </CardContent>
    </Card>
  );
};
