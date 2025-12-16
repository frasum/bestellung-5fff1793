import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Sparkles, 
  Check, 
  ArrowRight, 
  Loader2, 
  Building2, 
  Package, 
  FileText,
} from 'lucide-react';

interface B2BUpgradePricingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'customer' | 'supplier';
  entityId: string; // customerId or accountId
  email: string;
  companyName: string;
  vendorCount: number;
  articleCount: number;
  onUpgradeSuccess: () => void;
}

interface PricingPlan {
  id: 'basic' | 'pro';
  name: string;
  normalPrice: number;
  upgradePrice: number;
  discount: string;
  features: string[];
  highlighted?: boolean;
}

const pricingPlans: PricingPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    normalPrice: 9,
    upgradePrice: 7,
    discount: '-22%',
    features: [
      'Bis zu 3 Lieferanten',
      'Unbegrenzte Artikel',
      'E-Mail Bestellungen',
      'Basis-Berichte',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    normalPrice: 19,
    upgradePrice: 15,
    discount: '-21%',
    features: [
      'Unbegrenzte Lieferanten',
      'Unbegrenzte Artikel',
      'E-Mail Bestellungen',
      'Erweiterte Berichte',
      'Team-Mitglieder',
      'EasyOrder für Mitarbeiter',
    ],
    highlighted: true,
  },
];

type Step = 'pricing' | 'account' | 'migration';

export default function B2BUpgradePricingDialog({
  open,
  onOpenChange,
  type,
  entityId,
  email,
  companyName,
  vendorCount,
  articleCount,
  onUpgradeSuccess,
}: B2BUpgradePricingDialogProps) {
  const [step, setStep] = useState<Step>('pricing');
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'pro'>('pro');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [organizationName, setOrganizationName] = useState(companyName);
  const [upgrading, setUpgrading] = useState(false);

  const handleSelectPlan = (planId: 'basic' | 'pro') => {
    setSelectedPlan(planId);
    setStep('account');
  };

  const handleCreateAccount = () => {
    if (password.length < 6) {
      toast.error('Passwort muss mindestens 6 Zeichen haben');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwörter stimmen nicht überein');
      return;
    }
    if (!organizationName.trim()) {
      toast.error('Bitte geben Sie einen Firmennamen ein');
      return;
    }
    setStep('migration');
  };

  const handleUpgrade = async () => {
    setUpgrading(true);

    try {
      const body = type === 'customer' 
        ? {
            type: 'customer',
            customer_id: entityId,
            email,
            password,
            organization_name: organizationName,
            subscription_tier: selectedPlan,
          }
        : {
            type: 'supplier',
            account_id: entityId,
            email,
            password,
            organization_name: organizationName,
            subscription_tier: selectedPlan,
          };

      const { data, error } = await supabase.functions.invoke('upgrade-b2b-customer', {
        body,
      });

      if (error) throw error;

      toast.success('Upgrade erfolgreich! Sie können sich jetzt bei Bestellung.pro anmelden.');
      onUpgradeSuccess();
      onOpenChange(false);
      
      // Reset state
      setStep('pricing');
      setPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Upgrade error:', error);
      toast.error('Fehler beim Upgrade: ' + (error.message || 'Unbekannter Fehler'));
    } finally {
      setUpgrading(false);
    }
  };

  const selectedPlanData = pricingPlans.find(p => p.id === selectedPlan)!;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Zu Bestellung.pro upgraden
          </DialogTitle>
          <DialogDescription>
            Nutzen Sie die volle Bestellplattform für Ihr Unternehmen
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Pricing */}
        {step === 'pricing' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 text-center">
              <Badge variant="secondary" className="mb-2">B2B Upgrade Rabatt</Badge>
              <p className="text-sm text-muted-foreground">
                Als bestehender B2B-{type === 'customer' ? 'Kunde' : 'Lieferant'} erhalten Sie dauerhaft vergünstigte Preise
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {pricingPlans.map((plan) => (
                <Card 
                  key={plan.id} 
                  className={`cursor-pointer transition-all hover:border-primary ${
                    plan.highlighted ? 'border-primary ring-1 ring-primary' : ''
                  }`}
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        {plan.discount}
                      </Badge>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">€{plan.upgradePrice}</span>
                      <span className="text-muted-foreground">/Monat</span>
                      <span className="text-sm text-muted-foreground line-through">
                        €{plan.normalPrice}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-600 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full mt-4" 
                      variant={plan.highlighted ? 'default' : 'outline'}
                    >
                      {plan.name} wählen
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Account Creation */}
        {step === 'account' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Button variant="ghost" size="sm" onClick={() => setStep('pricing')}>
                ← Zurück
              </Button>
              <span>Plan: {selectedPlanData.name} (€{selectedPlanData.upgradePrice}/Monat)</span>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>E-Mail</Label>
                <Input value={email} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">
                  Ihre E-Mail-Adresse wird als Login verwendet
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Neues Passwort</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mindestens 6 Zeichen"
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Passwort wiederholen"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="orgName">Firmenname</Label>
                <Input
                  id="orgName"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="Mein Restaurant"
                />
              </div>
            </div>

            <Button onClick={handleCreateAccount} className="w-full">
              Weiter zur Datenübernahme
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 3: Migration Preview */}
        {step === 'migration' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Button variant="ghost" size="sm" onClick={() => setStep('account')}>
                ← Zurück
              </Button>
            </div>

            <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-5 w-5 text-green-600" />
                  Diese Daten werden übernommen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>Lieferanten aus "Mein Einkauf"</span>
                  </div>
                  <Badge variant="secondary">{vendorCount}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>Artikel</span>
                  </div>
                  <Badge variant="secondary">{articleCount}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Check className="h-5 w-5 text-primary" />
                  Was Sie behalten
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Zugang zum aktuellen B2B-Portal bleibt bestehen
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    {type === 'customer' ? 'Bestellhistorie' : 'Kunden und Bestellungen'} bleiben erhalten
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Neuer Bestellung.pro Account mit allen Features
                  </li>
                </ul>
              </CardContent>
            </Card>

            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Zusammenfassung</h4>
              <div className="text-sm space-y-1 text-muted-foreground">
                <p>Plan: <span className="text-foreground font-medium">{selectedPlanData.name}</span></p>
                <p>Preis: <span className="text-foreground font-medium">€{selectedPlanData.upgradePrice}/Monat</span></p>
                <p>E-Mail: <span className="text-foreground font-medium">{email}</span></p>
                <p>Firma: <span className="text-foreground font-medium">{organizationName}</span></p>
              </div>
            </div>

            <Button onClick={handleUpgrade} disabled={upgrading} className="w-full h-12">
              {upgrading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Upgrade wird durchgeführt...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Jetzt zu Bestellung.pro upgraden
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}