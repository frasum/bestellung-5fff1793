import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { pricingPlans } from '@/data/mockData';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export const Pricing = () => {
  return (
    <section id="pricing" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start free and scale as you grow. No hidden fees, no surprises.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pricingPlans.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                'relative bg-card rounded-2xl border p-6 flex flex-col',
                plan.isPopular
                  ? 'border-primary shadow-lg scale-105'
                  : 'border-border'
              )}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-foreground mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">
                    {plan.price === 0 ? 'Free' : `€${plan.price}`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-muted-foreground">/{plan.interval}</span>
                  )}
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-grow">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.isPopular ? 'default' : 'outline'}
                className="w-full"
                asChild
              >
                <Link to="/signup">
                  {plan.price === 0 ? 'Get Started' : 'Start Free Trial'}
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
