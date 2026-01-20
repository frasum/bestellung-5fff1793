import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, Lock, ShoppingCart } from 'lucide-react';
import type { EmployeeSession } from '@/pages/EmployeeOrder';

interface EmployeeLoginScreenProps {
  onLogin: (session: EmployeeSession) => void;
}

export function EmployeeLoginScreen({ onLogin }: EmployeeLoginScreenProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !pin) {
      toast({
        title: 'Fehler',
        description: 'Bitte E-Mail und PIN eingeben',
        variant: 'destructive',
      });
      return;
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      toast({
        title: 'Fehler',
        description: 'PIN muss 4 Ziffern haben',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('verify-employee-login', {
        body: { email, pin },
      });

      if (error) throw error;

      if (data?.success) {
        onLogin({
          sessionToken: data.sessionToken,
          employee: data.employee,
          locations: data.locations,
          locationSuppliers: data.locationSuppliers,
        });
      } else {
        toast({
          title: 'Anmeldung fehlgeschlagen',
          description: data?.error || 'Ungültige Anmeldedaten',
          variant: 'destructive',
        });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Verbindungsfehler';
      console.error('Login error:', message);
      toast({
        title: 'Fehler',
        description: 'Verbindungsfehler. Bitte versuchen Sie es erneut.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-card/95 backdrop-blur">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
            <ShoppingCart className="w-8 h-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Mitarbeiter-Bestellung</CardTitle>
            <CardDescription className="text-base mt-2">
              Melden Sie sich mit Ihrer E-Mail und PIN an
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base font-medium">
                E-Mail Adresse
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="ihre.email@beispiel.de"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 text-lg"
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin" className="text-base font-medium">
                4-stellige PIN
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setPin(value);
                  }}
                  className="pl-10 h-12 text-lg text-center tracking-[0.5em] font-mono"
                  disabled={isLoading}
                  autoComplete="off"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-14 text-lg font-semibold"
              disabled={isLoading || !email || pin.length !== 4}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Anmelden...
                </>
              ) : (
                'Anmelden'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
