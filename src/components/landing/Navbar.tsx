import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Menu, X, ChefHat } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    user
  } = useAuth();
  const {
    t
  } = useTranslation();
  return <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground">OrderFox.pro</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              {t('nav.features')}
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              {t('nav.pricing')}
            </a>
            <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
              {t('nav.about')}
            </a>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            {user ? <Button asChild>
                <Link to="/dashboard">{t('nav.dashboard')}</Link>
              </Button> : <>
                <Button variant="ghost" asChild>
                  <Link to="/auth">{t('nav.signIn')}</Link>
                </Button>
                <Button asChild>
                  <Link to="/auth">{t('nav.getStarted')}</Link>
                </Button>
              </>}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 text-muted-foreground hover:text-foreground" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-4">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors px-2 py-2" onClick={() => setIsOpen(false)}>
                {t('nav.features')}
              </a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors px-2 py-2" onClick={() => setIsOpen(false)}>
                {t('nav.pricing')}
              </a>
              <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors px-2 py-2" onClick={() => setIsOpen(false)}>
                {t('nav.about')}
              </a>
              <div className="flex items-center gap-2 px-2 py-2">
                <LanguageSwitcher variant="full" />
              </div>
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                {user ? <Button asChild>
                    <Link to="/dashboard">{t('nav.dashboard')}</Link>
                  </Button> : <>
                    <Button variant="ghost" asChild className="justify-start">
                      <Link to="/auth">{t('nav.signIn')}</Link>
                    </Button>
                    <Button asChild>
                      <Link to="/auth">{t('nav.getStarted')}</Link>
                    </Button>
                  </>}
              </div>
            </div>
          </div>}
      </div>
    </nav>;
};