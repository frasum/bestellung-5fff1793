import { useState } from 'react';
import { Loader2, Gift, Mail, Building2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useInviteSponsoredAccount, DEFAULT_SPONSORED_FEATURES, SponsoredFeatures } from '@/hooks/useInviteSponsoredAccount';

interface InviteSponsoredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FeatureConfig {
  key: keyof SponsoredFeatures;
  label: string;
  description: string;
  isCore?: boolean;
}

const FEATURE_CONFIG: FeatureConfig[] = [
  { key: 'suppliers', label: 'Lieferanten', description: 'Lieferanten verwalten', isCore: true },
  { key: 'articles', label: 'Artikel', description: 'Artikelkatalog pflegen', isCore: true },
  { key: 'orders', label: 'Bestellungen', description: 'Bestellungen aufgeben und verwalten', isCore: true },
  { key: 'inventory', label: 'Inventur', description: 'Lagerbestände erfassen' },
  { key: 'simple_order', label: 'Simple Order', description: 'Mitarbeiter-App für einfache Bestellungen' },
  { key: 'b2b_portal', label: 'B2B-Portal', description: 'Kunden-Portal für Großkunden' },
  { key: 'voice_order', label: 'Sprachbestellung', description: 'Bestellungen per Spracheingabe' },
  { key: 'wine_catalog', label: 'Weinkatalog', description: 'Spezieller Weinkatalog mit Details' },
  { key: 'multi_location', label: 'Mehrere Standorte', description: 'Mehrere Standorte verwalten' },
  { key: 'supplier_portal', label: 'Lieferanten-Portal', description: 'Portal für Lieferanten' },
  { key: 'advanced_reports', label: 'Erweiterte Berichte', description: 'Detaillierte Analysen und Berichte' },
];

export function InviteSponsoredDialog({ open, onOpenChange }: InviteSponsoredDialogProps) {
  const [email, setEmail] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [sponsoredNote, setSponsoredNote] = useState('');
  const [features, setFeatures] = useState<SponsoredFeatures>(DEFAULT_SPONSORED_FEATURES);
  
  const inviteMutation = useInviteSponsoredAccount();

  const handleFeatureToggle = (key: keyof SponsoredFeatures) => {
    setFeatures(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSubmit = () => {
    if (!email.trim() || !organizationName.trim()) return;
    
    inviteMutation.mutate({
      email: email.trim(),
      organizationName: organizationName.trim(),
      sponsoredNote: sponsoredNote.trim() || undefined,
      sponsoredFeatures: features,
    }, {
      onSuccess: () => {
        // Reset form
        setEmail('');
        setOrganizationName('');
        setSponsoredNote('');
        setFeatures(DEFAULT_SPONSORED_FEATURES);
        onOpenChange(false);
      }
    });
  };

  const coreFeatures = FEATURE_CONFIG.filter(f => f.isCore);
  const optionalFeatures = FEATURE_CONFIG.filter(f => !f.isCore);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-pink-500" />
            Friends & Family einladen
          </DialogTitle>
          <DialogDescription>
            Lade einen Freund oder Familienmitglied ein und wähle welche Funktionen freigeschaltet werden sollen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="invite-email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              E-Mail-Adresse
            </Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="freund@example.com"
            />
          </div>

          {/* Organization Name */}
          <div className="space-y-2">
            <Label htmlFor="invite-org" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Restaurant / Organisation
            </Label>
            <Input
              id="invite-org"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="z.B. Ristorante Bella Italia"
            />
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="invite-note">Notiz (optional)</Label>
            <Textarea
              id="invite-note"
              value={sponsoredNote}
              onChange={(e) => setSponsoredNote(e.target.value)}
              placeholder="z.B. Restaurant von Marco - Freund aus der Schule"
              className="min-h-[60px]"
            />
          </div>

          {/* Features */}
          <div className="space-y-4">
            <Label>Freigeschaltete Funktionen</Label>
            
            {/* Core Features (always on) */}
            <div className="rounded-lg border bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground mb-2">Basis-Funktionen (immer aktiv)</p>
              <div className="space-y-2">
                {coreFeatures.map((feature) => (
                  <div key={feature.key} className="flex items-center space-x-3">
                    <Checkbox 
                      id={`feature-${feature.key}`}
                      checked={true}
                      disabled
                    />
                    <div className="flex-1">
                      <label 
                        htmlFor={`feature-${feature.key}`}
                        className="text-sm font-medium text-muted-foreground"
                      >
                        {feature.label}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Optional Features */}
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground mb-2">Zusätzliche Funktionen</p>
              <div className="space-y-3">
                {optionalFeatures.map((feature) => (
                  <div key={feature.key} className="flex items-start space-x-3">
                    <Checkbox 
                      id={`feature-${feature.key}`}
                      checked={features[feature.key]}
                      onCheckedChange={() => handleFeatureToggle(feature.key)}
                    />
                    <div className="flex-1">
                      <label 
                        htmlFor={`feature-${feature.key}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {feature.label}
                      </label>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={inviteMutation.isPending || !email.trim() || !organizationName.trim()}
            className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
          >
            {inviteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Einladung senden
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
