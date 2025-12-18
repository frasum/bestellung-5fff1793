import { Button } from '@/components/ui/button';
import { ArrowDown, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo.png';

export const HeroSection = () => {
  const navigate = useNavigate();

  const scrollToContent = () => {
    document.getElementById('benefits')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary/10 via-background to-primary/5">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 text-center">
        {/* Logo */}
        <div className="mb-8 animate-fade-in">
          <img src={logo} alt="Bestellung.pro" className="h-20 mx-auto" />
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          Bestellung<span className="text-primary">.pro</span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Digitale Beschaffung für Gastronomie
        </p>

        {/* Description */}
        <p className="text-lg text-muted-foreground mb-12 max-w-xl mx-auto animate-fade-in" style={{ animationDelay: '0.3s' }}>
          Bestellen Sie schneller, sparen Sie Zeit und behalten Sie die Kontrolle über Ihre Restaurant-Beschaffung.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <Button
            size="lg"
            className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all"
            onClick={() => navigate('/onboarding/questions')}
          >
            <Play className="mr-2 h-5 w-5" />
            Demo starten
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="text-lg px-8 py-6"
            onClick={scrollToContent}
          >
            Mehr erfahren
            <ArrowDown className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Scroll indicator */}
      <button
        onClick={scrollToContent}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowDown className="h-8 w-8" />
      </button>
    </section>
  );
};
