import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, ShoppingCart, Truck, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Hero = () => {
  const benefits = [
    'Streamline supplier management',
    'Automate order processing',
    'Track expenses in real-time',
  ];

  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Restaurant Procurement Made Simple
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              Simplify Your{' '}
              <span className="text-primary">Restaurant</span>{' '}
              Procurement
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-xl">
              Manage suppliers, streamline orders, and control costs—all from one intuitive platform. 
              Built for restaurants that want to spend less time on procurement and more time on great food.
            </p>

            <ul className="space-y-3 mb-8">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-3 text-muted-foreground">
                  <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" variant="hero" asChild>
                <Link to="/signup">
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#features">See How It Works</a>
              </Button>
            </div>
          </div>

          {/* Visual */}
          <div className="relative animate-slide-up lg:animate-fade-in">
            <div className="relative bg-card rounded-2xl shadow-elegant border border-border overflow-hidden">
              {/* Mock Dashboard Header */}
              <div className="bg-muted/50 px-6 py-4 border-b border-border flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-warning/60" />
                <div className="w-3 h-3 rounded-full bg-success/60" />
                <span className="ml-4 text-sm text-muted-foreground">Dashboard</span>
              </div>
              
              {/* Mock Content */}
              <div className="p-6 space-y-4">
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-muted/30 rounded-lg p-4 text-center">
                    <ShoppingCart className="w-6 h-6 mx-auto text-primary mb-2" />
                    <div className="text-2xl font-bold text-foreground">47</div>
                    <div className="text-xs text-muted-foreground">Orders</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4 text-center">
                    <Truck className="w-6 h-6 mx-auto text-accent mb-2" />
                    <div className="text-2xl font-bold text-foreground">12</div>
                    <div className="text-xs text-muted-foreground">Suppliers</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4 text-center">
                    <BarChart3 className="w-6 h-6 mx-auto text-success mb-2" />
                    <div className="text-2xl font-bold text-foreground">€12k</div>
                    <div className="text-xs text-muted-foreground">Spent</div>
                  </div>
                </div>

                {/* Mock Chart */}
                <div className="bg-muted/30 rounded-lg p-4 h-32 flex items-end justify-between gap-2">
                  {[40, 65, 55, 80, 70, 90].map((height, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-primary/60 rounded-t"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>

                {/* Mock Order List */}
                <div className="space-y-2">
                  {['Fresh Farms Italia', 'Mediterranean Seafood'].map((name, i) => (
                    <div key={i} className="flex items-center justify-between bg-muted/30 rounded-lg px-4 py-3">
                      <span className="text-sm font-medium text-foreground">{name}</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-success/20 text-success">
                        Delivered
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
