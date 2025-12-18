import { industryTemplates, IndustryTemplate } from '@/data/industryTemplates';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  UtensilsCrossed,
  Heart,
  ShoppingCart,
  Wrench,
  Briefcase,
  Factory,
  Settings,
  ArrowRight,
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  UtensilsCrossed,
  Heart,
  ShoppingCart,
  Wrench,
  Briefcase,
  Factory,
  Settings,
};

interface IndustrySelectStepProps {
  selectedIndustry: IndustryTemplate | null;
  onSelectIndustry: (industryId: string) => void;
  onContinue: () => void;
}

export function IndustrySelectStep({
  selectedIndustry,
  onSelectIndustry,
  onContinue,
}: IndustrySelectStepProps) {
  const handleSelect = (industry: IndustryTemplate) => {
    onSelectIndustry(industry.id);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">In welcher Branche sind Sie tätig?</h2>
        <p className="text-muted-foreground">
          Wir passen Kategorien, Einheiten und Beispiele an Ihre Branche an
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {industryTemplates.map((industry) => {
          const Icon = iconMap[industry.icon] || Settings;
          const isSelected = selectedIndustry?.id === industry.id;

          return (
            <Card
              key={industry.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md hover:border-primary/50',
                isSelected && 'border-primary bg-primary/5 ring-2 ring-primary'
              )}
              onClick={() => handleSelect(industry)}
            >
              <CardContent className="p-6 text-center space-y-3">
                <div
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center mx-auto',
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold">{industry.name}</h3>
                  <p className="text-sm text-muted-foreground">{industry.description}</p>
                </div>
                {industry.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-center">
                    {industry.categories.slice(0, 3).map((cat) => (
                      <span
                        key={cat}
                        className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"
                      >
                        {cat}
                      </span>
                    ))}
                    {industry.categories.length > 3 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                        +{industry.categories.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="sticky bottom-4 pt-6 flex justify-center sm:justify-end">
        <Button 
          onClick={onContinue} 
          disabled={!selectedIndustry}
          className="w-full sm:w-auto gap-2"
          size="lg"
        >
          {selectedIndustry 
            ? `Mit "${selectedIndustry.name}" fortfahren` 
            : 'Bitte wählen Sie eine Branche'}
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
