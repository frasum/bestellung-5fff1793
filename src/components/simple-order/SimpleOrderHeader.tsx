import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ChevronDown, ClipboardList, Mic } from 'lucide-react';
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
  isMultiSupplier?: boolean;
  selectedSupplierId?: string | null;
  suppliers?: Supplier[];
  onSupplierChange?: (supplierId: string) => void;
  getArticleCount?: (supplierId: string) => number;
  hasEmployee?: boolean;
  onViewOrders?: () => void;
  voiceInputEnabled?: boolean;
  onVoiceMode?: () => void;
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
  isMultiSupplier = false,
  selectedSupplierId,
  suppliers = [],
  onSupplierChange,
  getArticleCount,
  hasEmployee = false,
  onViewOrders,
  voiceInputEnabled = false,
  onVoiceMode,
}: SimpleOrderHeaderProps) => {
  const { i18n, t } = useTranslation();
  const currentLanguage = languages.find(l => l.code === i18n.language) || languages[1];

  const showSupplierDropdown = isMultiSupplier && selectedSupplierId && suppliers.length > 1 && onSupplierChange;
  const showOrderHistory = hasEmployee && onViewOrders;
  const showVoiceButton = voiceInputEnabled && onVoiceMode;

  return (
    <div className="sticky top-0 z-10 bg-primary text-primary-foreground border-b border-primary-foreground/10">
      <div className="max-w-2xl mx-auto px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          {/* Center: Supplier name */}
          <div className="flex-1 text-center min-w-0">
            {showSupplierDropdown ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-lg font-bold text-primary-foreground hover:bg-primary-foreground/20 gap-1 px-3 min-h-11 touch-manipulation"
                  >
                    <span className="truncate max-w-[150px]">{supplierName}</span>
                    <ChevronDown className="h-5 w-5 flex-shrink-0" />
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

          {/* Right: Voice + Order history + Language */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {showVoiceButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onVoiceMode}
                className="h-11 w-11 text-primary-foreground hover:bg-primary-foreground/20 touch-manipulation"
                title={t('voice.title', 'Spracheingabe')}
              >
                <Mic className="h-5 w-5" />
              </Button>
            )}
            {showOrderHistory && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onViewOrders}
                className="h-11 w-11 text-primary-foreground hover:bg-primary-foreground/20 touch-manipulation"
                title={t('simpleOrder.myOrders', 'Meine Bestellungen')}
              >
                <ClipboardList className="h-5 w-5" />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 text-primary-foreground hover:bg-primary-foreground/20 touch-manipulation"
                >
                  <span className="text-xl">{currentLanguage.flag}</span>
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
