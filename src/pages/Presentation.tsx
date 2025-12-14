import { PresentationNav } from '@/components/presentation/PresentationNav';
import { HeroSection } from '@/components/presentation/HeroSection';
import { BenefitsSection } from '@/components/presentation/BenefitsSection';
import { ModulesSection } from '@/components/presentation/ModulesSection';
import { RolesSection } from '@/components/presentation/RolesSection';
import { ProcessSection } from '@/components/presentation/ProcessSection';
import { FeaturesSection } from '@/components/presentation/FeaturesSection';
import { PricingSection } from '@/components/presentation/PricingSection';
import { TestimonialsSection } from '@/components/presentation/TestimonialsSection';
import { CtaSection } from '@/components/presentation/CtaSection';
import { ContactSection } from '@/components/presentation/ContactSection';
// SEO meta tags are set in index.html for this public page

const Presentation = () => {
  return (
    <div className="min-h-screen bg-background">
      <PresentationNav />
        <HeroSection />
        <BenefitsSection />
        <ModulesSection />
        <RolesSection />
        <ProcessSection />
        <FeaturesSection />
        <PricingSection />
        <TestimonialsSection />
        <CtaSection />
      <ContactSection />
    </div>
  );
};

export default Presentation;
