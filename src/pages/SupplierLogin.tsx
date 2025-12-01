import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail } from 'lucide-react';
import logo from '@/assets/logo.png';

const SupplierLogin = () => {
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src={logo} alt="OrderFox.pro" className="h-16 w-16 mx-auto mb-4" />
          <CardTitle className="text-2xl">Lieferantenportal</CardTitle>
          <CardDescription>
            Verwalten Sie Ihre Artikel für Ihre Kunden
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="bg-muted/50 rounded-lg p-6">
            <Mail className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="font-medium mb-2">Login per E-Mail-Link</h3>
            <p className="text-sm text-muted-foreground">
              Um sich anzumelden, benötigen Sie einen Einladungslink von Ihrem Kunden.
              Dieser Link wird an Ihre hinterlegte E-Mail-Adresse gesendet.
            </p>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>Sie haben noch keinen Zugangslink?</p>
            <p>Kontaktieren Sie Ihren Kunden, um eine Einladung zu erhalten.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupplierLogin;
