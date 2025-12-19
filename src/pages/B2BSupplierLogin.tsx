import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Mail, Lock, ArrowRight } from 'lucide-react';

const B2BSupplierLogin = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [subdomain, setSubdomain] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if user is an account owner
      const { data: account } = await supabase
        .from('supplier_b2b_accounts')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (account) {
        // Account owner - full access
        navigate('/b2b/dashboard');
        return;
      }

      // Check if user is a supplier user (e.g., Luigi with own login)
      const { data: supplierUser } = await supabase
        .from('b2b_supplier_users')
        .select('supplier_id, account_id, role')
        .eq('user_id', data.user?.id)
        .maybeSingle();

      if (supplierUser) {
        // Supplier user - restricted access to their supplier only
        navigate('/b2b/dashboard', { 
          state: { 
            supplierId: supplierUser.supplier_id,
            accountId: supplierUser.account_id,
            isSupplierUser: true,
            supplierUserRole: supplierUser.role
          } 
        });
        return;
      }

      toast.error('Kein B2B-Zugang mit dieser E-Mail gefunden');
      await supabase.auth.signOut();
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login fehlgeschlagen');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate subdomain format
      const subdomainRegex = /^[a-z0-9-]+$/;
      if (!subdomainRegex.test(subdomain)) {
        throw new Error('Subdomain darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten');
      }

      // Check if subdomain is available
      const { data: existing } = await supabase
        .from('supplier_b2b_accounts')
        .select('id')
        .eq('subdomain', subdomain)
        .maybeSingle();

      if (existing) {
        throw new Error('Diese Subdomain ist bereits vergeben');
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/b2b/dashboard`,
        },
      });

      if (authError) throw authError;

      // Create B2B account
      const { data: accountData, error: accountError } = await supabase
        .from('supplier_b2b_accounts')
        .insert({
          company_name: companyName,
          subdomain,
          email,
        })
        .select()
        .single();

      if (accountError) throw accountError;

      // Auto-create the single supplier for this account (1 Account = 1 Supplier)
      const { error: supplierError } = await supabase
        .from('b2b_suppliers')
        .insert({
          account_id: accountData.id,
          name: companyName,
          contact_email: email,
          is_active: true,
        });

      if (supplierError) {
        console.error('Error creating supplier:', supplierError);
        // Don't fail registration, supplier can be created later
      }

      toast.success('Registrierung erfolgreich! Bitte bestätigen Sie Ihre E-Mail.');
      setIsRegistering(false);
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registrierung fehlgeschlagen');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            {isRegistering ? 'B2B Portal Registrierung' : 'B2B Lieferanten-Portal'}
          </CardTitle>
          <CardDescription>
            {isRegistering 
              ? 'Erstellen Sie Ihr B2B-Portal für Ihre Kunden'
              : 'Melden Sie sich an, um Ihr B2B-Portal zu verwalten'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
            {isRegistering && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Firmenname / Lieferantenname</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="z.B. Kao Großhandel"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Dies wird als Name Ihres Lieferanten-Portals angezeigt
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subdomain">Subdomain</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="subdomain"
                      value={subdomain}
                      onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="kao"
                      className="flex-1"
                      required
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      .bestellung.pro
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ihre Kunden erreichen Ihr Portal unter dieser Adresse
                  </p>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@beispiel.de"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                'Bitte warten...'
              ) : (
                <>
                  {isRegistering ? 'Registrieren' : 'Anmelden'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-sm text-primary hover:underline"
            >
              {isRegistering 
                ? 'Bereits registriert? Hier anmelden'
                : 'Noch kein Konto? Jetzt registrieren'
              }
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default B2BSupplierLogin;
