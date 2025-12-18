import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo.png';
import { generateSystemOverviewPdf } from '@/lib/systemOverviewPdf';

const navItems = [
  { label: 'Module', href: '#modules' },
  { label: 'Prozess', href: '#process' },
  { label: 'Features', href: '#features' },
  { label: 'Preise', href: '#pricing' },
];

export const PresentationNav = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (href: string) => {
    const element = document.querySelector(href);
    element?.scrollIntoView({ behavior: 'smooth' });
    setIsMobileMenuOpen(false);
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      await generateSystemOverviewPdf();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-background/95 backdrop-blur-md shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button onClick={() => scrollTo('#')} className="flex items-center gap-2">
              <img src={logo} alt="Bestellung.pro" className="h-8" />
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => scrollTo(item.href)}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button size="sm" onClick={() => navigate('/onboarding/questions')}>
                Demo starten
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background pt-16 md:hidden animate-fade-in">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col gap-4">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => scrollTo(item.href)}
                  className="text-lg font-medium text-foreground py-3 border-b border-border"
                >
                  {item.label}
                </button>
              ))}
              <div className="flex flex-col gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF herunterladen
                </Button>
                <Button onClick={() => navigate('/onboarding/questions')}>
                  Demo starten
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
