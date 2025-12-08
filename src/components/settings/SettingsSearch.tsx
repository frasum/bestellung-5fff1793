import { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, User, Lock, Building2, Users, Store, MapPin, 
  Bell, FileText, ExternalLink, Ruler, Tag, FlaskConical, Mail
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface SettingsSearchItem {
  id: string;
  label: string;
  description?: string;
  keywords: string[];
  tab: string;
  subTab?: string;
  icon: LucideIcon;
  path: string; // Display path
}

const SETTINGS_SEARCH_ITEMS: SettingsSearchItem[] = [
  // Profil
  { id: 'profile-name', label: 'Vollständiger Name', description: 'Profilname ändern', keywords: ['name', 'profil', 'benutzer', 'user'], tab: 'profile', icon: User, path: 'Profil' },
  { id: 'profile-password', label: 'Passwort ändern', description: 'Sicherheit', keywords: ['kennwort', 'sicherheit', 'password', 'security'], tab: 'profile', icon: Lock, path: 'Profil' },
  
  // Organisation > Allgemein
  { id: 'org-name', label: 'Organisationsname', description: 'Firmenname', keywords: ['firma', 'unternehmen', 'company', 'name'], tab: 'organization', subTab: 'general', icon: Building2, path: 'Organisation › Allgemein' },
  { id: 'org-testmode', label: 'Testmodus', description: 'E-Mail-Weiterleitung', keywords: ['test', 'email', 'weiterleitung', 'debug'], tab: 'organization', subTab: 'general', icon: FlaskConical, path: 'Organisation › Allgemein' },
  
  // Organisation > Team
  { id: 'org-team', label: 'Team-Mitglieder', description: 'Einladen und verwalten', keywords: ['mitarbeiter', 'einladen', 'rollen', 'users', 'invite', 'member'], tab: 'organization', subTab: 'team', icon: Users, path: 'Organisation › Team' },
  
  // Organisation > Standorte
  { id: 'org-locations', label: 'Standorte', description: 'Restaurants verwalten', keywords: ['restaurant', 'filiale', 'location', 'branch'], tab: 'organization', subTab: 'locations', icon: Store, path: 'Organisation › Standorte' },
  
  // Organisation > Adressen
  { id: 'org-addresses', label: 'Lieferadressen', description: 'Adressen verwalten', keywords: ['adresse', 'lieferung', 'delivery', 'address'], tab: 'organization', subTab: 'addresses', icon: MapPin, path: 'Organisation › Adressen' },
  
  // Stammdaten > Einheiten
  { id: 'units', label: 'Einheiten', description: 'Mengeneinheiten verwalten', keywords: ['kg', 'stück', 'liter', 'mengeneinheit', 'unit', 'piece'], tab: 'master-data', subTab: 'units', icon: Ruler, path: 'Stammdaten › Einheiten' },
  
  // Stammdaten > Kategorien
  { id: 'categories', label: 'Kategorien', description: 'Artikelkategorien', keywords: ['kategorie', 'artikel', 'gruppierung', 'category'], tab: 'master-data', subTab: 'categories', icon: Tag, path: 'Stammdaten › Kategorien' },
  
  // Kommunikation > Benachrichtigungen
  { id: 'notifications', label: 'Benachrichtigungen', description: 'E-Mail-Einstellungen', keywords: ['email', 'alert', 'meldung', 'notification'], tab: 'communication', subTab: 'notifications', icon: Bell, path: 'Kommunikation › Benachrichtigungen' },
  
  // Kommunikation > E-Mail-Vorlagen
  { id: 'email-templates', label: 'E-Mail-Vorlagen', description: 'Bestellungsvorlagen', keywords: ['bestellung', 'vorlage', 'template', 'order'], tab: 'communication', subTab: 'email-templates', icon: Mail, path: 'Kommunikation › E-Mail-Vorlagen' },
  { id: 'email-design', label: 'E-Mail-Design', description: 'Modern, Klassisch, Minimalistisch', keywords: ['design', 'layout', 'style', 'modern', 'classic'], tab: 'communication', subTab: 'email-templates', icon: FileText, path: 'Kommunikation › E-Mail-Vorlagen' },
  { id: 'email-footer', label: 'E-Mail-Footer', description: 'Footer anpassen', keywords: ['footer', 'fußzeile', 'logo', 'powered by'], tab: 'communication', subTab: 'email-templates', icon: FileText, path: 'Kommunikation › E-Mail-Vorlagen' },
  
  // Kommunikation > Lieferantenportal
  { id: 'supplier-portal', label: 'Lieferantenportal', description: 'Portal-Einstellungen', keywords: ['portal', 'lieferant', 'einladung', 'supplier'], tab: 'communication', subTab: 'supplier-portal', icon: ExternalLink, path: 'Kommunikation › Lieferantenportal' },
  { id: 'portal-logo', label: 'Portal-Logo', description: 'Logo hochladen', keywords: ['logo', 'bild', 'image', 'brand'], tab: 'communication', subTab: 'supplier-portal', icon: ExternalLink, path: 'Kommunikation › Lieferantenportal' },
];

interface SettingsSearchProps {
  onNavigate: (tab: string, subTab?: string) => void;
}

export const SettingsSearch = ({ onNavigate }: SettingsSearchProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!search.trim()) return [];
    const searchLower = search.toLowerCase().trim();
    return SETTINGS_SEARCH_ITEMS.filter(item =>
      item.label.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower) ||
      item.keywords.some(k => k.toLowerCase().includes(searchLower))
    ).slice(0, 8); // Limit results
  }, [search]);

  const handleSelect = (item: SettingsSearchItem) => {
    onNavigate(item.tab, item.subTab);
    setSearch('');
    setOpen(false);
    inputRef.current?.blur();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSearch('');
      setOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'Enter' && filteredItems.length > 0) {
      handleSelect(filteredItems[0]);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Einstellungen durchsuchen..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(e.target.value.length > 0);
          }}
          onFocus={() => search.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          className="pl-10"
        />
      </div>

      {open && filteredItems.length > 0 && (
        <Card className="absolute z-50 w-full mt-1 p-1 shadow-lg border bg-popover animate-in fade-in-50 slide-in-from-top-2 duration-200">
          <div className="max-h-80 overflow-y-auto">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted text-left transition-colors"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{item.label}</div>
                    {item.description && (
                      <div className="text-xs text-muted-foreground truncate">{item.description}</div>
                    )}
                  </div>
                  <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0.5 flex-shrink-0">
                    {item.path}
                  </Badge>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {open && search.trim() && filteredItems.length === 0 && (
        <Card className="absolute z-50 w-full mt-1 p-4 shadow-lg border bg-popover text-center animate-in fade-in-50 slide-in-from-top-2 duration-200">
          <p className="text-sm text-muted-foreground">Keine Einstellungen gefunden</p>
        </Card>
      )}
    </div>
  );
};
