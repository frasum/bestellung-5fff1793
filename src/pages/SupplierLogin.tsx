import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail } from 'lucide-react';
import { useForceLightTheme } from '@/hooks/useForceLightTheme';
import logo from '@/assets/logo.png';

// Force light mode CSS variables (kept as fallback)
const lightModeStyles: React.CSSProperties = {
  '--background': '0 0% 98%',
  '--foreground': '224 71% 4%',
  '--card': '0 0% 100%',
  '--card-foreground': '224 71% 4%',
  '--popover': '0 0% 100%',
  '--popover-foreground': '224 71% 4%',
  '--primary': '174 100% 29%',
  '--primary-foreground': '0 0% 100%',
  '--secondary': '220 14% 96%',
  '--secondary-foreground': '220 9% 46%',
  '--muted': '220 14% 96%',
  '--muted-foreground': '220 9% 46%',
  '--accent': '220 14% 96%',
  '--accent-foreground': '224 71% 4%',
  '--destructive': '0 84% 60%',
  '--destructive-foreground': '0 0% 100%',
  '--border': '220 13% 91%',
  '--input': '220 13% 91%',
  '--ring': '174 100% 29%',
  colorScheme: 'light',
} as React.CSSProperties;

const SupplierLogin = () => {
  const navigate = useNavigate();
  
  // Force light theme for supplier portal pages
  useForceLightTheme();

  useEffect(() => {
    // Check if already logged in
    const storedSession = localStorage.getItem('supplierSession');
    if (storedSession) {
      const parsed = JSON.parse(storedSession);
      if (new Date(parsed.expiresAt) > new Date()) {
        navigate('/supplier-portal');
      } else {
        localStorage.removeItem('supplierSession');
      }
    }
  }, [navigate]);

  return (
    <div style={lightModeStyles} className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white shadow-lg border-gray-100">
        <CardHeader className="text-center">
          <img src={logo} alt="Bestellung.pro" className="h-16 w-16 mx-auto mb-4" />
          <CardTitle className="text-2xl text-gray-900">Lieferantenportal</CardTitle>
          <CardDescription className="text-gray-500">
            Verwalten Sie Ihre Artikel für Ihre Kunden
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
            <Mail className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="font-medium mb-2 text-gray-900">Login per E-Mail-Link</h3>
            <p className="text-sm text-gray-500">
              Um sich anzumelden, benötigen Sie einen Einladungslink von Ihrem Kunden.
              Dieser Link wird an Ihre hinterlegte E-Mail-Adresse gesendet.
            </p>
          </div>
          
          <div className="text-sm text-gray-500">
            <p>Sie haben noch keinen Zugangslink?</p>
            <p>Kontaktieren Sie Ihren Kunden, um eine Einladung zu erhalten.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupplierLogin;
