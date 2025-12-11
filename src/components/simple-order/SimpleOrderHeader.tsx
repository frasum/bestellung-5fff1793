import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Supplier {
  id: string;
  name: string;
}

interface SimpleOrderHeaderProps {
  supplierName: string;
  showBackButton: boolean;
  onBack: () => void;
  selectedLocationName: string;
  selectedLocationId: string | null;
  // New props for quick supplier switch
  isMultiSupplier?: boolean;
  selectedSupplierId?: string | null;
  suppliers?: Supplier[];
  onSupplierChange?: (supplierId: string) => void;
  getArticleCount?: (supplierId: string) => number;
}

const languages = [
  { code: 'th', flag: '🇹🇭', label: 'ไทย' },
  { code: 'de', flag: '🇩🇪', label: 'Deutsch' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'vi', flag: '🇻🇳', label: 'Tiếng Việt' },
  { code: 'fr', flag: '🇫🇷', label: 'Français' },
  { code: 'it', flag: '🇮🇹', label: 'Italiano' },
];

export const SimpleOrderHeader = ({
  supplierName,
  showBackButton,
  onBack,
  selectedLocationName,
  selectedLocationId,
  isMultiSupplier = false,
  selectedSupplierId,
  suppliers = [],
  onSupplierChange,
  getArticleCount,
}: SimpleOrderHeaderProps) => {
  const { i18n, t } = useTranslation();
  const currentLanguage = languages.find(l => l.code === i18n.language) || languages[1];

  const showSupplierDropdown = isMultiSupplier && selectedSupplierId && suppliers.length > 1 && onSupplierChange;

  return (
    <div className="sticky top-0 z-10 bg-primary text-primary-foreground shadow-lg">
      <div className="max-w-2xl mx-auto px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          {/* Left: Back button with text (if multi-supplier) */}
          <div className="flex-shrink-0">
            {showBackButton ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-3 text-primary-foreground hover:bg-primary-foreground/20 gap-1"
                onClick={onBack}
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {t('simpleOrder.changeSupplier', 'Wechseln')}
                </span>
              </Button>
            ) : (
              <div className="w-10" />
            )}
          </div>

          {/* Center: Supplier name - clickable dropdown for multi-supplier */}
          <div className="flex-1 text-center min-w-0">
            {showSupplierDropdown ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-lg font-bold text-primary-foreground hover:bg-primary-foreground/20 gap-1 px-2"
                  >
                    <span className="truncate max-w-[150px]">{supplierName}</span>
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="bg-popover min-w-[200px]">
                  {suppliers.map((supplier) => (
                    <DropdownMenuItem
                      key={supplier.id}
                      onClick={() => onSupplierChange(supplier.id)}
                      className={supplier.id === selectedSupplierId ? 'bg-accent' : ''}
                    >
                      <span className="flex-1">{supplier.name}</span>
                      {getArticleCount && (
                        <span className="ml-2 text-muted-foreground text-sm">
                          ({getArticleCount(supplier.id)})
                        </span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <h1 className="text-lg font-bold truncate">
                {supplierName || t('simpleOrder.title', 'Bestellung')}
              </h1>
            )}
          </div>

          {/* Right: Location badge + Language dropdown */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {selectedLocationId && (
              <span className="text-xs bg-primary-foreground/20 px-2 py-1 rounded-full flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {selectedLocationName}
              </span>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                >
                  <span className="text-base">{currentLanguage.flag}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => i18n.changeLanguage(lang.code)}
                    className={i18n.language === lang.code ? 'bg-accent' : ''}
                  >
                    <span className="mr-2">{lang.flag}</span>
                    {lang.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
};
