import { AlertCircle, Grape, MapPin, Euro } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useTranslation } from 'react-i18next';
import { Article } from '@/hooks/useArticles';
import { FilterMode } from './types';

interface WinesTabFiltersProps {
  filterMode: FilterMode;
  setFilterMode: (mode: FilterMode) => void;
  wineArticles: Article[];
  incompleteCount: number;
}

export const WinesTabFilters = ({
  filterMode,
  setFilterMode,
  wineArticles,
  incompleteCount,
}: WinesTabFiltersProps) => {
  const { t } = useTranslation();
  
  return (
    <ToggleGroup 
      type="single" 
      value={filterMode} 
      onValueChange={(value) => value && setFilterMode(value as FilterMode)}
      className="justify-start"
    >
      <ToggleGroupItem value="all" className="gap-1.5">
        {t('wines.filterAll', 'Alle')}
        <Badge variant="secondary" className="text-xs">
          {wineArticles.length}
        </Badge>
      </ToggleGroupItem>
      <ToggleGroupItem value="incomplete" className="gap-1.5">
        <AlertCircle className="h-3.5 w-3.5" />
        {t('wines.filterIncomplete', 'Unvollständig')}
        {incompleteCount > 0 && (
          <Badge variant="destructive" className="text-xs">
            {incompleteCount}
          </Badge>
        )}
      </ToggleGroupItem>
      <ToggleGroupItem value="missing-description" className="gap-1.5 hidden sm:flex">
        {t('wines.filterMissingDescription', 'Ohne Beschreibung')}
        <Badge variant="secondary" className="text-xs">
          {wineArticles.filter(w => !w.description?.trim()).length}
        </Badge>
      </ToggleGroupItem>
      <ToggleGroupItem value="missing-grape" className="gap-1.5 hidden sm:flex">
        <Grape className="h-3.5 w-3.5" />
        {t('wines.filterMissingGrape', 'Ohne Rebsorte')}
        <Badge variant="secondary" className="text-xs">
          {wineArticles.filter(w => !w.grape_variety?.trim()).length}
        </Badge>
      </ToggleGroupItem>
      <ToggleGroupItem value="missing-origin" className="gap-1.5 hidden sm:flex">
        <MapPin className="h-3.5 w-3.5" />
        {t('wines.filterMissingOrigin', 'Ohne Herkunftsland')}
        <Badge variant="secondary" className="text-xs">
          {wineArticles.filter(w => !w.origin_country?.trim()).length}
        </Badge>
      </ToggleGroupItem>
      <ToggleGroupItem value="missing-price" className="gap-1.5 hidden sm:flex">
        <Euro className="h-3.5 w-3.5" />
        {t('wines.filterMissingPrice', 'Ohne Verkaufspreis')}
        <Badge variant="secondary" className="text-xs">
          {wineArticles.filter(w => !w.selling_price || w.selling_price === 0).length}
        </Badge>
      </ToggleGroupItem>
    </ToggleGroup>
  );
};
