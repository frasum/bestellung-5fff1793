import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Users, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import logoImage from '@/assets/logo.png';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Refactored components
import {
  loginSchema,
  signupSchema,
  signupWithOrgSchema,
  demoSchema,
  LoginFormData,
  SignupFormData,
  SignupWithOrgFormData,
  DemoFormData,
  AuthTab,
  useInvitation,
  useDemoAccount,
  LoginForm,
  SignupForm,
  SignupWithOrgForm,
  DemoTab,
  DemoDialogs,
  AuthTabs,
} from '@/components/auth';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');
  const nextParam = searchParams.get('next');

  // Only allow same-origin relative paths, so /auth?next=... cannot be turned
  // into an open redirect. Everything else falls back to /suppliers.
  const safeNext = (() => {
    if (!nextParam) return null;
    if (!nextParam.startsWith('/') || nextParam.startsWith('//')) return null;
    return nextParam;
  })();
  const postAuthTarget = safeNext ?? '/suppliers';

  const [activeTab, setActiveTab] = useState<AuthTab>(inviteToken ? 'signup' : 'login');
  const [isLoading, setIsLoading] = useState(false);
  const [showDemoDialog, setShowDemoDialog] = useState(false);
  const [showEmptyDemoDialog, setShowEmptyDemoDialog] = useState(false);
  const [showVoiceOnboardingDialog, setShowVoiceOnboardingDialog] = useState(false);
  const [showQuestionOnboardingDialog, setShowQuestionOnboardingDialog] = useState(false);

  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  
  const { isAcceptingInvitation, acceptInvitation } = useInvitation(inviteToken);
  const {
    isDemoLoading,
    isEmptyDemoLoading,
    isVoiceOnboardingLoading,
    isQuestionOnboardingLoading,
    handleStartDemo,
  } = useDemoAccount();

  // Forms
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

  // Handle user navigation
  useEffect(() => {
    if (user && !inviteToken) {
      // If an OAuth consent flow (or other) sent us here with ?next=..., use
      // an absolute-URL navigate so the browser reloads the target route; this
      // avoids replaying state from the /auth SPA screen on the consent page.
      if (safeNext) {
        window.location.replace(safeNext);
        return;
      }
      navigate(postAuthTarget);
    }
    if (user && inviteToken) {
      acceptInvitation().then((success) => {
        if (success) {
          navigate(postAuthTarget);
        }
      });
    }
  }, [user, navigate, inviteToken, safeNext, postAuthTarget]);

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

    if (inviteToken) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const success = await acceptInvitation();
      setIsLoading(false);
      if (success) {
        toast.success('Erfolgreich angemeldet!');
        navigate('/suppliers');
      }
    } else {
      setIsLoading(false);
      toast.success('Welcome back!');
      navigate('/suppliers');
    }
  };

  const handleSignup = async (data: SignupFormData) => {
    setIsLoading(true);
    const { error } = await signUp(data.email, data.password, data.fullName, 'Pending Organization');
    
    if (error) {
      setIsLoading(false);
      if (error.message.includes('User already registered')) {
        toast.error('Ein Konto mit dieser E-Mail existiert bereits. Bitte melden Sie sich an.');
        setActiveTab('login');
      } else {
        toast.error(error.message);
      }
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 500));
    const success = await acceptInvitation();
    setIsLoading(false);
    
    if (success) {
      toast.success('Konto erstellt! Weiterleitung...');
      navigate('/suppliers');
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
      navigate('/suppliers');
    }
  };

  // Show loading state while accepting invitation
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
              {activeTab === 'login' 
                ? ' Melden Sie sich an oder erstellen Sie ein Konto, um die Einladung anzunehmen.'
                : ' Erstellen Sie ein Konto, um die Einladung anzunehmen.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl shadow-lg p-8">
          <AuthTabs 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            hideDemo={!!inviteToken} 
          />

          {activeTab === 'login' ? (
            <LoginForm
              form={loginForm}
              onSubmit={handleLogin}
              isLoading={isLoading}
              hasInviteToken={!!inviteToken}
            />
          ) : activeTab === 'signup' && inviteToken ? (
            <SignupForm
              form={signupForm}
              onSubmit={handleSignup}
              isLoading={isLoading}
            />
          ) : activeTab === 'signup' ? (
            <SignupWithOrgForm
              form={signupWithOrgForm}
              onSubmit={handleSignupWithOrg}
              isLoading={isLoading}
            />
          ) : (
            <DemoTab
              onOpenDemoDialog={() => setShowDemoDialog(true)}
              onOpenVoiceDialog={() => setShowVoiceOnboardingDialog(true)}
              onOpenQuestionDialog={() => setShowQuestionOnboardingDialog(true)}
            />
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            By continuing, you agree to our{' '}
            <span className="text-primary">Terms</span>
            {' '}and{' '}
            <span className="text-primary">Privacy Policy</span>
          </p>
        </div>
      </div>

      <DemoDialogs
        demoForm={demoForm}
        showDemoDialog={showDemoDialog}
        setShowDemoDialog={setShowDemoDialog}
        showEmptyDemoDialog={showEmptyDemoDialog}
        setShowEmptyDemoDialog={setShowEmptyDemoDialog}
        showVoiceOnboardingDialog={showVoiceOnboardingDialog}
        setShowVoiceOnboardingDialog={setShowVoiceOnboardingDialog}
        showQuestionOnboardingDialog={showQuestionOnboardingDialog}
        setShowQuestionOnboardingDialog={setShowQuestionOnboardingDialog}
        isDemoLoading={isDemoLoading}
        isEmptyDemoLoading={isEmptyDemoLoading}
        isVoiceOnboardingLoading={isVoiceOnboardingLoading}
        isQuestionOnboardingLoading={isQuestionOnboardingLoading}
        onStartDemo={(data) => handleStartDemo(data, 'standard', () => setShowDemoDialog(false))}
        onStartEmptyDemo={(data) => handleStartDemo(data, 'empty', () => setShowEmptyDemoDialog(false))}
        onStartVoiceOnboarding={(data) => handleStartDemo(data, 'voice', () => setShowVoiceOnboardingDialog(false))}
        onStartQuestionOnboarding={(data) => handleStartDemo(data, 'question', () => setShowQuestionOnboardingDialog(false))}
      />
    </div>
  );
};

export default Auth;
