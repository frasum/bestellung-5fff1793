import { ReactNode } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';

interface MobileFilterSheetProps {
  children: ReactNode;
  activeFilterCount?: number;
  onClearFilters?: () => void;
  title?: string;
}

export const MobileFilterSheet = ({
  children,
  activeFilterCount = 0,
  onClearFilters,
  title = 'Filter'
}: MobileFilterSheetProps) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="lg:hidden relative">
          <Filter className="w-4 h-4 mr-2" />
          Filter
          {activeFilterCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 min-w-5 flex items-center justify-center rounded-full text-xs"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-xl">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle>{title}</SheetTitle>
            {activeFilterCount > 0 && onClearFilters && (
              <Button variant="ghost" size="sm" onClick={onClearFilters}>
                <X className="w-4 h-4 mr-1" />
                Zurücksetzen
              </Button>
            )}
          </div>
        </SheetHeader>
        <div className="space-y-6 overflow-y-auto pb-20">
          {children}
        </div>
        <SheetFooter className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
          <SheetTrigger asChild>
            <Button className="w-full">
              Filter anwenden
            </Button>
          </SheetTrigger>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
