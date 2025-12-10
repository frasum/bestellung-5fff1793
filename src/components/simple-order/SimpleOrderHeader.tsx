import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SimpleOrderHeaderProps {
  supplierName: string;
  showBackButton: boolean;
  onBack: () => void;
  selectedLocationName: string;
  selectedLocationId: string | null;
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
}: SimpleOrderHeaderProps) => {
  const { i18n } = useTranslation();
  const currentLanguage = languages.find(l => l.code === i18n.language) || languages[1];

  return (
    <div className="sticky top-0 z-10 bg-primary text-primary-foreground shadow-lg">
      <div className="max-w-2xl mx-auto px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          {/* Left: Back button (if multi-supplier) */}
          <div className="w-10">
            {showBackButton && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={onBack}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Center: Supplier name or "Bestellung" */}
          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold truncate">
              {supplierName || 'Bestellung'}
            </h1>
          </div>

          {/* Right: Location badge + Language dropdown */}
          <div className="flex items-center gap-2">
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
                  className="h-9 w-9 text-primary-foreground hover:bg-primary-foreground/20"
                >
                  <span className="text-lg">{currentLanguage.flag}</span>
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
