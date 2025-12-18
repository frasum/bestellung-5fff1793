import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IndustryTemplate } from '@/data/industryTemplates';
import { CreatedSupplier } from '../hooks/useQuestionOnboarding';
import { ArrowRight, ArrowLeft, Plus, Building2, Mail, Hash } from 'lucide-react';

interface SupplierStepProps {
  industry: IndustryTemplate;
  createdSuppliers: CreatedSupplier[];
  onAddSupplier: (supplier: CreatedSupplier) => void;
  onContinue: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function SupplierStep({
  industry,
  createdSuppliers,
  onAddSupplier,
  onContinue,
  onBack,
  onSkip,
}: SupplierStepProps) {
  const { terminology, exampleSuppliers } = industry;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [customerNumber, setCustomerNumber] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError(`Bitte geben Sie einen Namen für den ${terminology.supplier} ein`);
      return;
    }

    // Check for duplicate
    if (createdSuppliers.some((s) => s.name.toLowerCase() === name.trim().toLowerCase())) {
      setError(`Ein ${terminology.supplier} mit diesem Namen existiert bereits`);
      return;
    }

    onAddSupplier({
      name: name.trim(),
      email: email.trim() || undefined,
      customerNumber: customerNumber.trim() || undefined,
    });

    // Reset form
    setName('');
    setEmail('');
    setCustomerNumber('');

    // Continue to articles
    onContinue();
  };

  const handleQuickAdd = (supplierName: string) => {
    if (createdSuppliers.some((s) => s.name.toLowerCase() === supplierName.toLowerCase())) {
      setError(`${supplierName} wurde bereits hinzugefügt`);
      return;
    }
    onAddSupplier({ name: supplierName });
    onContinue();
  };

  const supplierCount = createdSuppliers.length;

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">
          {supplierCount === 0
            ? `Ersten ${terminology.supplier} erstellen`
            : `Weiteren ${terminology.supplier} hinzufügen`}
        </h2>
        <p className="text-muted-foreground">
          {supplierCount === 0
            ? `Von welchem ${terminology.supplier} bestellen Sie regelmäßig?`
            : `Sie haben bereits ${supplierCount} ${terminology.supplierPlural}. Möchten Sie weitere hinzufügen?`}
        </p>
      </div>

      {/* Quick-Add Suggestions */}
      {exampleSuppliers.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">
            Schnellauswahl (Beispiele für {industry.name}):
          </Label>
          <div className="flex flex-wrap gap-2">
            {exampleSuppliers.map((example) => {
              const alreadyAdded = createdSuppliers.some(
                (s) => s.name.toLowerCase() === example.name.toLowerCase()
              );
              return (
                <Button
                  key={example.name}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={alreadyAdded}
                  className="gap-1"
                  onClick={() => handleQuickAdd(example.name)}
                >
                  <Plus className="w-3 h-3" />
                  {example.name}
                  {alreadyAdded && ' ✓'}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">oder manuell eingeben</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="supplier-name">{terminology.supplier}-Name *</Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="supplier-name"
              placeholder={exampleSuppliers[0]?.name || `z.B. Muster-${terminology.supplier}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="supplier-email">E-Mail (optional)</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="supplier-email"
              type="email"
              placeholder="bestellung@lieferant.de"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="supplier-number">Kundennummer (optional)</Label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="supplier-number"
              placeholder="z.B. KD-12345"
              value={customerNumber}
              onChange={(e) => setCustomerNumber(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Zurück
          </Button>
          <Button type="submit" className="flex-1 gap-2">
            Weiter zu {terminology.articlePlural}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {supplierCount > 0 && (
          <Button
            type="button"
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={onSkip}
          >
            Überspringen → Zur Zusammenfassung
          </Button>
        )}
      </form>
    </div>
  );
}
