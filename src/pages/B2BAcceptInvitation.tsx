import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface InvitationData {
  email: string;
  supplierName: string;
  companyName: string;
  isValid: boolean;
  isExpired: boolean;
  isAccepted: boolean;
}

export default function B2BAcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  
  // Registration form
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Login form
  const [loginPassword, setLoginPassword] = useState('');

  useEffect(() => {
    if (token) {
      validateToken();
    } else {
      setLoading(false);
    }
  }, [token]);

  const validateToken = async () => {
    try {
      const { data, error } = await supabase
        .from('b2b_customer_invitations')
        .select(`
          email,
          expires_at,
          accepted_at,
          supplier_account_id,
          supplier_b2b_accounts!inner(company_name)
        `)
        .eq('token', token)
        .single();

      if (error || !data) {
        setInvitationData({ 
          email: '', 
          supplierName: '', 
          companyName: '',
          isValid: false, 
          isExpired: false, 
          isAccepted: false 
        });
        return;
      }

      const isExpired = new Date(data.expires_at) < new Date();
      const isAccepted = !!data.accepted_at;

      // Get customer company name
      const { data: customerData } = await supabase
        .from('supplier_b2b_customers')
        .select('company_name')
        .eq('email', data.email)
        .eq('supplier_account_id', data.supplier_account_id)
        .single();

      setInvitationData({
        email: data.email,
        supplierName: (data.supplier_b2b_accounts as any).company_name,
        companyName: customerData?.company_name || '',
        isValid: true,
        isExpired,
        isAccepted
      });
    } catch (err) {
      console.error('Error validating token:', err);
      setInvitationData({ 
        email: '', 
        supplierName: '', 
        companyName: '',
        isValid: false, 
        isExpired: false, 
        isAccepted: false 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({ title: 'Passwörter stimmen nicht überein', variant: 'destructive' });
      return;
    }

    if (password.length < 6) {
      toast({ title: 'Passwort muss mindestens 6 Zeichen haben', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitationData!.email,
        password,
        options: {
          data: { full_name: name }
        }
      });

      if (authError) throw authError;

      // Accept the invitation
      await acceptInvitation(authData.user!.id);
    } catch (err: any) {
      console.error('Registration error:', err);
      toast({ 
        title: 'Registrierung fehlgeschlagen', 
        description: err.message,
        variant: 'destructive' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: invitationData!.email,
        password: loginPassword
      });

      if (authError) throw authError;

      // Accept the invitation
      await acceptInvitation(authData.user!.id);
    } catch (err: any) {
      console.error('Login error:', err);
      toast({ 
        title: 'Anmeldung fehlgeschlagen', 
        description: err.message,
        variant: 'destructive' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const acceptInvitation = async (userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('accept-b2b-customer-invitation', {
        body: { token, userId }
      });

      if (error) throw error;

      toast({ title: 'Einladung angenommen!', description: 'Sie werden weitergeleitet...' });
      
      const subdomain = (data as any)?.subdomain as string | undefined;
      const target = subdomain ? `/b2b/portal/${subdomain}` : '/b2b/portal';

      setTimeout(() => {
        navigate(target);
      }, 1500);
    } catch (err: any) {
      console.error('Accept invitation error:', err);
      toast({ 
        title: 'Fehler beim Annehmen der Einladung', 
        description: err.message,
        variant: 'destructive' 
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
            <CardTitle>Ungültiger Link</CardTitle>
            <CardDescription>
              Kein Einladungstoken gefunden. Bitte verwenden Sie den Link aus Ihrer E-Mail.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!invitationData?.isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
            <CardTitle>Einladung nicht gefunden</CardTitle>
            <CardDescription>
              Diese Einladung existiert nicht oder wurde bereits verwendet.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (invitationData.isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
            <CardTitle>Einladung abgelaufen</CardTitle>
            <CardDescription>
              Diese Einladung ist abgelaufen. Bitte kontaktieren Sie {invitationData.supplierName} für eine neue Einladung.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (invitationData.isAccepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <CardTitle>Bereits angenommen</CardTitle>
            <CardDescription>
              Diese Einladung wurde bereits angenommen. Sie können sich jetzt anmelden.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => navigate('/b2b/login')}
            >
              Zum Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Einladung von {invitationData.supplierName}</CardTitle>
          <CardDescription>
            Sie wurden eingeladen, als Kunde von <strong>{invitationData.supplierName}</strong> beizutreten.
            {invitationData.companyName && (
              <span className="block mt-1">Firma: {invitationData.companyName}</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="register" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="register">Registrieren</TabsTrigger>
              <TabsTrigger value="login">Anmelden</TabsTrigger>
            </TabsList>
            
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={invitationData.email} 
                    disabled 
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input 
                    id="name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ihr Name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Passwort</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mindestens 6 Zeichen"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Passwort wiederholen"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Registrieren & Einladung annehmen
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="loginEmail">E-Mail</Label>
                  <Input 
                    id="loginEmail" 
                    type="email" 
                    value={invitationData.email} 
                    disabled 
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loginPassword">Passwort</Label>
                  <Input 
                    id="loginPassword" 
                    type="password" 
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Ihr Passwort"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Anmelden & Einladung annehmen
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
