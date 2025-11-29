import { Users, ShoppingBag, BarChart3, Mail, Shield, Zap } from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Supplier Management',
    description: 'Organize all your suppliers in one place. Store contacts, track performance, and manage relationships effortlessly.',
  },
  {
    icon: ShoppingBag,
    title: 'Easy Ordering',
    description: 'Browse products, add to cart, and place orders with just a few clicks. Orders are automatically sent to suppliers.',
  },
  {
    icon: Mail,
    title: 'Automated Notifications',
    description: 'Orders are instantly emailed to suppliers with all details. WhatsApp notifications coming soon.',
  },
  {
    icon: BarChart3,
    title: 'Expense Tracking',
    description: 'Monitor spending with detailed reports. See monthly trends, top suppliers, and export data anytime.',
  },
  {
    icon: Shield,
    title: 'Role-Based Access',
    description: 'Control who can order, approve, or view reports. Perfect for teams of any size.',
  },
  {
    icon: Zap,
    title: 'Quick Reorder',
    description: 'Repeat your last order with one click. Save time on recurring purchases.',
  },
];

export const Features = () => {
  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Everything You Need to Manage Procurement
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From supplier management to expense tracking, ProcureResto gives you the tools to run your restaurant's procurement efficiently.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-card rounded-xl p-6 border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
