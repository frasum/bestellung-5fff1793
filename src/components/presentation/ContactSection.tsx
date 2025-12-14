import { Mail, Globe, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '@/assets/logo.png';

export const ContactSection = () => {
  return (
    <section id="contact" className="py-16 bg-card border-t">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Logo & Description */}
          <div>
            <img src={logo} alt="Bestellung.pro" className="h-12 mb-4" />
            <p className="text-muted-foreground text-sm">
              Digitale Beschaffung für Gastronomie. Schnell, einfach, zuverlässig.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Kontakt</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                <a href="mailto:info@bestellung.pro" className="hover:text-primary transition-colors">
                  info@bestellung.pro
                </a>
              </li>
              <li className="flex items-center gap-3 text-muted-foreground">
                <Globe className="h-4 w-4 text-primary" />
                <a href="https://www.bestellung.pro" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  www.bestellung.pro
                </a>
              </li>
              <li className="flex items-center gap-3 text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" />
                <span>[Telefonnummer einfügen]</span>
              </li>
            </ul>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Rechtliches</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/impressum" className="text-muted-foreground hover:text-primary transition-colors">
                  Impressum
                </Link>
              </li>
              <li>
                <Link to="/datenschutz" className="text-muted-foreground hover:text-primary transition-colors">
                  Datenschutz
                </Link>
              </li>
              <li>
                <Link to="/agb" className="text-muted-foreground hover:text-primary transition-colors">
                  AGB
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t mt-12 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Bestellung.pro | Alle Rechte vorbehalten
          </p>
        </div>
      </div>
    </section>
  );
};
