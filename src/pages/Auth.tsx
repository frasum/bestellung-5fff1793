import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, User, Building2, ArrowRight, Loader2, Play, Users, FlaskConical, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import logoImage from '@/assets/logo.png';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription } from '@/components/ui/alert';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const signupWithOrgSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  organizationName: z.string().min(2, 'Restaurant name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const demoSchema = z.object({
  email: z.string().email('Bitte geben Sie eine gültige E-Mail-Adresse ein'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;
type SignupWithOrgFormData = z.infer<typeof signupWithOrgSchema>;
type DemoFormData = z.infer<typeof demoSchema>;

const Auth = () => {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');
  
  const [isLogin, setIsLogin] = useState(!inviteToken); // Default to signup if invite token present
  const [isLoading, setIsLoading] = useState(false);
  const [showDemoDialog, setShowDemoDialog] = useState(false);
  const [showEmptyDemoDialog, setShowEmptyDemoDialog] = useState(false);
  const [showVoiceOnboardingDialog, setShowVoiceOnboardingDialog] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [isEmptyDemoLoading, setIsEmptyDemoLoading] = useState(false);
  const [isVoiceOnboardingLoading, setIsVoiceOnboardingLoading] = useState(false);
  const [isAcceptingInvitation, setIsAcceptingInvitation] = useState(false);
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Handle invitation acceptance after login/signup
  const acceptInvitation = async () => {
    if (!inviteToken) return true;
    
    setIsAcceptingInvitation(true);
    try {
      const { data, error } = await supabase.functions.invoke('accept-invitation', {
        body: { token: inviteToken }
      });

      if (error) {
        console.error('Accept invitation error:', error);
        toast.error('Fehler beim Annehmen der Einladung');
        return false;
      }

      if (data?.error) {
        toast.error(data.error);
        return false;
      }

      toast.success(`Willkommen im Team von ${data.organizationName}!`);
      return true;
    } catch (err) {
      console.error('Accept invitation error:', err);
      toast.error('Fehler beim Annehmen der Einladung');
      return false;
    } finally {
      setIsAcceptingInvitation(false);
    }
  };

  useEffect(() => {
    if (user && !inviteToken) {
      navigate('/reports');
    }
    // If user is logged in and has invite token, accept the invitation
    if (user && inviteToken) {
      acceptInvitation().then((success) => {
        if (success) {
          navigate('/reports');
        }
      });
    }
  }, [user, navigate, inviteToken]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  });

  const signupWithOrgForm = useForm<SignupWithOrgFormData>({
    resolver: zodResolver(signupWithOrgSchema),
    defaultValues: { fullName: '', organizationName: '', email: '', password: '', confirmPassword: '' },
  });

  const demoForm = useForm<DemoFormData>({
    resolver: zodResolver(demoSchema),
    defaultValues: { email: '' },
  });

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    const { error } = await signIn(data.email, data.password);
    
    if (error) {
      setIsLoading(false);
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Invalid email or password');
      } else if (error.message.includes('Email not confirmed')) {
        toast.error('Please confirm your email address');
      } else {
        toast.error(error.message);
      }
      return;
    }

    // If there's an invite token, wait for the user state to update
    // The useEffect will handle accepting the invitation
    if (inviteToken) {
      // Wait a moment for auth state to propagate
      await new Promise(resolve => setTimeout(resolve, 500));
      const success = await acceptInvitation();
      setIsLoading(false);
      if (success) {
        toast.success('Erfolgreich angemeldet!');
        navigate('/reports');
      }
    } else {
      setIsLoading(false);
      toast.success('Welcome back!');
      navigate('/reports');
    }
  };

  const handleSignup = async (data: SignupFormData) => {
    setIsLoading(true);
    
    // For invited users, we create account without organization name
    // The organization will be set by accept-invitation
    const { error } = await signUp(data.email, data.password, data.fullName, 'Pending Organization');
    
    if (error) {
      setIsLoading(false);
      if (error.message.includes('User already registered')) {
        toast.error('Ein Konto mit dieser E-Mail existiert bereits. Bitte melden Sie sich an.');
        setIsLogin(true);
      } else {
        toast.error(error.message);
      }
      return;
    }

    // Wait for auth state to propagate
    await new Promise(resolve => setTimeout(resolve, 500));
    const success = await acceptInvitation();
    setIsLoading(false);
    
    if (success) {
      toast.success('Konto erstellt! Weiterleitung...');
      navigate('/reports');
    }
  };

  const handleSignupWithOrg = async (data: SignupWithOrgFormData) => {
    setIsLoading(true);
    const { error } = await signUp(data.email, data.password, data.fullName, data.organizationName);
    setIsLoading(false);

    if (error) {
      if (error.message.includes('User already registered')) {
        toast.error('An account with this email already exists');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Account created! Redirecting...');
      navigate('/reports');
    }
  };

  const handleStartDemo = async (data: DemoFormData, emptyAccount = false) => {
    const setLoading = emptyAccount ? setIsEmptyDemoLoading : setIsDemoLoading;
    setLoading(true);
    
    try {
      const { data: result, error } = await supabase.functions.invoke('create-demo-account', {
        body: { email: data.email, emptyAccount }
      });

      if (error) {
        toast.error(error.message || 'Fehler beim Erstellen des Demo-Accounts');
        setLoading(false);
        return;
      }

      if (result?.error) {
        toast.error(result.error);
        setLoading(false);
        return;
      }

      if (result?.session) {
        // Set the session
        await supabase.auth.setSession({
          access_token: result.session.access_token,
          refresh_token: result.session.refresh_token,
        });
        
        toast.success(emptyAccount 
          ? 'Leerer Demo-Account erstellt! Testen Sie das Onboarding.' 
          : 'Demo-Account erstellt! Willkommen bei Bestellung.pro'
        );
        setShowDemoDialog(false);
        setShowEmptyDemoDialog(false);
        navigate('/reports');
      } else if (result?.needsManualLogin) {
        toast.success('Demo-Account erstellt! Bitte melden Sie sich mit der E-Mail an.');
        setShowDemoDialog(false);
        setShowEmptyDemoDialog(false);
      }
    } catch (err) {
      console.error('Demo error:', err);
      toast.error('Ein unerwarteter Fehler ist aufgetreten');
    }
    
    setLoading(false);
  };

  const handleStartEmptyDemo = async (data: DemoFormData) => {
    await handleStartDemo(data, true);
  };

  const handleStartVoiceOnboarding = async (data: DemoFormData) => {
    setIsVoiceOnboardingLoading(true);
    
    try {
      const { data: result, error } = await supabase.functions.invoke('create-demo-account', {
        body: { email: data.email, emptyAccount: true }
      });

      if (error) {
        toast.error(error.message || 'Fehler beim Erstellen des Demo-Accounts');
        setIsVoiceOnboardingLoading(false);
        return;
      }

      if (result?.error) {
        toast.error(result.error);
        setIsVoiceOnboardingLoading(false);
        return;
      }

      if (result?.session) {
        await supabase.auth.setSession({
          access_token: result.session.access_token,
          refresh_token: result.session.refresh_token,
        });
        
        toast.success('Demo-Account erstellt! Starte Sprach-Onboarding...');
        setShowVoiceOnboardingDialog(false);
        navigate('/onboarding');
      } else if (result?.needsManualLogin) {
        toast.success('Demo-Account erstellt! Bitte melden Sie sich an.');
        setShowVoiceOnboardingDialog(false);
      }
    } catch (err) {
      console.error('Voice onboarding error:', err);
      toast.error('Ein unerwarteter Fehler ist aufgetreten');
    }
    
    setIsVoiceOnboardingLoading(false);
  };

  // Show loading state while accepting invitation for logged-in user
  if (user && inviteToken && isAcceptingInvitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Einladung wird angenommen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <img src={logoImage} alt="Bestellung.pro" className="w-10 h-10 rounded-lg object-cover" />
          <span className="font-bold text-2xl text-foreground">Bestellung.pro</span>
        </div>

        {/* Invitation Banner */}
        {inviteToken && (
          <Alert className="mb-4 border-primary/50 bg-primary/5">
            <Users className="h-4 w-4" />
            <AlertDescription>
              Sie wurden eingeladen, einem Team beizutreten. 
              {isLogin 
                ? ' Melden Sie sich an oder erstellen Sie ein Konto, um die Einladung anzunehmen.'
                : ' Erstellen Sie ein Konto, um die Einladung anzunehmen.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl shadow-lg p-8">
          {/* Tabs */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-center font-medium rounded-lg transition-colors ${
                isLogin
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('auth.signIn')}
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-center font-medium rounded-lg transition-colors ${
                !isLogin
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('auth.signUp')}
            </button>
          </div>

          {isLogin ? (
            /* Login Form */
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@restaurant.com"
                    className="pl-10"
                    {...loginForm.register('email')}
                  />
                </div>
                {loginForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">{t('auth.password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    {...loginForm.register('password')}
                  />
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {inviteToken ? 'Anmelden & Team beitreten' : t('auth.signIn')}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          ) : inviteToken ? (
            /* Signup Form for Invited Users (no organization name) */
            <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">{t('auth.fullName')}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Max Mustermann"
                    className="pl-10"
                    {...signupForm.register('fullName')}
                  />
                </div>
                {signupForm.formState.errors.fullName && (
                  <p className="text-sm text-destructive">{signupForm.formState.errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@restaurant.com"
                    className="pl-10"
                    {...signupForm.register('email')}
                  />
                </div>
                {signupForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{signupForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">{t('auth.password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    {...signupForm.register('password')}
                  />
                </div>
                {signupForm.formState.errors.password && (
                  <p className="text-sm text-destructive">{signupForm.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-confirm">{t('settings.confirmPassword')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="signup-confirm"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    {...signupForm.register('confirmPassword')}
                  />
                </div>
                {signupForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">{signupForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Konto erstellen & Team beitreten
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          ) : (
            /* Signup Form with Organization Name */
            <form onSubmit={signupWithOrgForm.handleSubmit(handleSignupWithOrg)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">{t('auth.fullName')}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    className="pl-10"
                    {...signupWithOrgForm.register('fullName')}
                  />
                </div>
                {signupWithOrgForm.formState.errors.fullName && (
                  <p className="text-sm text-destructive">{signupWithOrgForm.formState.errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-org">Restaurant Name</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="signup-org"
                    type="text"
                    placeholder="Bella Vista Restaurant"
                    className="pl-10"
                    {...signupWithOrgForm.register('organizationName')}
                  />
                </div>
                {signupWithOrgForm.formState.errors.organizationName && (
                  <p className="text-sm text-destructive">{signupWithOrgForm.formState.errors.organizationName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@restaurant.com"
                    className="pl-10"
                    {...signupWithOrgForm.register('email')}
                  />
                </div>
                {signupWithOrgForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{signupWithOrgForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">{t('auth.password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    {...signupWithOrgForm.register('password')}
                  />
                </div>
                {signupWithOrgForm.formState.errors.password && (
                  <p className="text-sm text-destructive">{signupWithOrgForm.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-confirm">{t('settings.confirmPassword')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="signup-confirm"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    {...signupWithOrgForm.register('confirmPassword')}
                  />
                </div>
                {signupWithOrgForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">{signupWithOrgForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {t('auth.createAccount')}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Demo Buttons - only show when no invite token */}
          {!inviteToken && (
            <div className="mt-6 pt-6 border-t border-border space-y-3">
              <Button 
                variant="outline" 
                className="w-full gap-2"
                onClick={() => setShowDemoDialog(true)}
              >
                <Play className="w-4 h-4" />
                Demo starten
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                7 Tage kostenlos testen mit Beispieldaten
              </p>
              
              <Button 
                variant="secondary" 
                className="w-full gap-2"
                onClick={() => setShowEmptyDemoDialog(true)}
              >
                <FlaskConical className="w-4 h-4" />
                Leere Demo (Onboarding testen)
              </Button>

              <Button 
                variant="outline" 
                className="w-full gap-2 border-primary/50 text-primary hover:bg-primary/10"
                onClick={() => setShowVoiceOnboardingDialog(true)}
              >
                <Mic className="w-4 h-4" />
                Mit Sprach-Assistent starten
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Richten Sie Ihren Katalog per Sprache ein
              </p>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            By continuing, you agree to our{' '}
            <span className="text-primary">Terms</span>
            {' '}and{' '}
            <span className="text-primary">Privacy Policy</span>
          </p>
        </div>
      </div>

      {/* Demo Dialog */}
      <Dialog open={showDemoDialog} onOpenChange={setShowDemoDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="w-5 h-5 text-primary" />
              Demo starten
            </DialogTitle>
            <DialogDescription>
              Testen Sie Bestellung.pro 7 Tage kostenlos mit Beispieldaten. 
              Geben Sie Ihre E-Mail-Adresse ein, um alle E-Mail-Funktionen live zu erleben.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={demoForm.handleSubmit((data) => handleStartDemo(data, false))} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="demo-email">E-Mail-Adresse</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="demo-email"
                  type="email"
                  placeholder="ihre@email.de"
                  className="pl-10"
                  {...demoForm.register('email')}
                />
              </div>
              {demoForm.formState.errors.email && (
                <p className="text-sm text-destructive">{demoForm.formState.errors.email.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Bestellungs-E-Mails werden an diese Adresse gesendet, damit Sie sehen, wie die Kommunikation mit Lieferanten aussieht.
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <p className="font-medium mb-1">Was ist enthalten?</p>
              <ul className="text-muted-foreground space-y-1 text-xs">
                <li>• 4 Beispiel-Lieferanten mit 24 Artikeln</li>
                <li>• Beispiel-Bestellungen zum Erkunden</li>
                <li>• Alle Funktionen freigeschaltet</li>
                <li>• Testmodus aktiv – E-Mails gehen an Sie</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowDemoDialog(false)}
              >
                Abbrechen
              </Button>
              <Button type="submit" className="flex-1" disabled={isDemoLoading}>
                {isDemoLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Demo starten
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Voice Onboarding Dialog */}
      <Dialog open={showVoiceOnboardingDialog} onOpenChange={setShowVoiceOnboardingDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-primary" />
              Sprach-Onboarding starten
            </DialogTitle>
            <DialogDescription>
              Unser KI-Assistent hilft Ihnen per Sprache, Ihre ersten Lieferanten 
              und Artikel anzulegen. Einfach sprechen und fertig!
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={demoForm.handleSubmit(handleStartVoiceOnboarding)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="voice-demo-email">E-Mail-Adresse</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="voice-demo-email"
                  type="email"
                  placeholder="ihre@email.de"
                  className="pl-10"
                  {...demoForm.register('email')}
                />
              </div>
              {demoForm.formState.errors.email && (
                <p className="text-sm text-destructive">{demoForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm">
              <p className="font-medium mb-1 flex items-center gap-2">
                <Mic className="w-4 h-4 text-primary" />
                So funktioniert's
              </p>
              <ul className="text-muted-foreground space-y-1 text-xs">
                <li>• Sprechen Sie mit unserem KI-Assistenten</li>
                <li>• Nennen Sie Lieferanten und Artikel</li>
                <li>• Der Assistent legt alles automatisch an</li>
                <li>• Jederzeit pausieren oder stoppen</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowVoiceOnboardingDialog(false)}
              >
                Abbrechen
              </Button>
              <Button type="submit" className="flex-1" disabled={isVoiceOnboardingLoading}>
                {isVoiceOnboardingLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    Jetzt starten
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Empty Demo Dialog */}
      <Dialog open={showEmptyDemoDialog} onOpenChange={setShowEmptyDemoDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-primary" />
              Leere Demo starten
            </DialogTitle>
            <DialogDescription>
              Erstellen Sie einen Demo-Account ohne Beispieldaten, um das Onboarding 
              mit Photo-Capture und Voice-Capture zu testen.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={demoForm.handleSubmit(handleStartEmptyDemo)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="empty-demo-email">E-Mail-Adresse</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="empty-demo-email"
                  type="email"
                  placeholder="test@example.com"
                  className="pl-10"
                  {...demoForm.register('email')}
                />
              </div>
              {demoForm.formState.errors.email && (
                <p className="text-sm text-destructive">{demoForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <p className="font-medium mb-1">Was ist enthalten?</p>
              <ul className="text-muted-foreground space-y-1 text-xs">
                <li>• Leerer Katalog (keine Lieferanten/Artikel)</li>
                <li>• 1 Standort + 1 Lieferadresse</li>
                <li>• Testmodus aktiv – E-Mails gehen an Sie</li>
                <li>• Onboarding-CTAs sichtbar</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowEmptyDemoDialog(false)}
              >
                Abbrechen
              </Button>
              <Button type="submit" className="flex-1" disabled={isEmptyDemoLoading}>
                {isEmptyDemoLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <FlaskConical className="w-4 h-4 mr-2" />
                    Leere Demo starten
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
