import { UseFormReturn } from 'react-hook-form';
import { Play, Mic, ClipboardList, FlaskConical, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { DemoFormData } from './schemas';

interface DemoDialogsProps {
  demoForm: UseFormReturn<DemoFormData>;
  // Dialog states
  showDemoDialog: boolean;
  setShowDemoDialog: (open: boolean) => void;
  showEmptyDemoDialog: boolean;
  setShowEmptyDemoDialog: (open: boolean) => void;
  showVoiceOnboardingDialog: boolean;
  setShowVoiceOnboardingDialog: (open: boolean) => void;
  showQuestionOnboardingDialog: boolean;
  setShowQuestionOnboardingDialog: (open: boolean) => void;
  // Loading states
  isDemoLoading: boolean;
  isEmptyDemoLoading: boolean;
  isVoiceOnboardingLoading: boolean;
  isQuestionOnboardingLoading: boolean;
  // Handlers
  onStartDemo: (data: DemoFormData) => Promise<void>;
  onStartEmptyDemo: (data: DemoFormData) => Promise<void>;
  onStartVoiceOnboarding: (data: DemoFormData) => Promise<void>;
  onStartQuestionOnboarding: (data: DemoFormData) => Promise<void>;
}

export function DemoDialogs({
  demoForm,
  showDemoDialog,
  setShowDemoDialog,
  showEmptyDemoDialog,
  setShowEmptyDemoDialog,
  showVoiceOnboardingDialog,
  setShowVoiceOnboardingDialog,
  showQuestionOnboardingDialog,
  setShowQuestionOnboardingDialog,
  isDemoLoading,
  isEmptyDemoLoading,
  isVoiceOnboardingLoading,
  isQuestionOnboardingLoading,
  onStartDemo,
  onStartEmptyDemo,
  onStartVoiceOnboarding,
  onStartQuestionOnboarding,
}: DemoDialogsProps) {
  return (
    <>
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
          
          <form onSubmit={demoForm.handleSubmit(onStartDemo)} className="space-y-4">
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
          
          <form onSubmit={demoForm.handleSubmit(onStartVoiceOnboarding)} className="space-y-4">
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
          
          <form onSubmit={demoForm.handleSubmit(onStartEmptyDemo)} className="space-y-4">
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

      {/* Question Onboarding Dialog */}
      <Dialog open={showQuestionOnboardingDialog} onOpenChange={setShowQuestionOnboardingDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              Fragebogen-Onboarding starten
            </DialogTitle>
            <DialogDescription>
              Richten Sie Ihren Katalog Schritt für Schritt ein. 
              Wählen Sie Ihre Branche und wir laden passende Vorlagen.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={demoForm.handleSubmit(onStartQuestionOnboarding)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question-demo-email">E-Mail-Adresse</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="question-demo-email"
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
                <ClipboardList className="w-4 h-4 text-primary" />
                So funktioniert's
              </p>
              <ul className="text-muted-foreground space-y-1 text-xs">
                <li>• Wählen Sie Ihre Branche (Gastronomie, Handwerk, etc.)</li>
                <li>• Passende Kategorien und Einheiten werden geladen</li>
                <li>• Fügen Sie Lieferanten und Artikel hinzu</li>
                <li>• Fertig – Ihr Katalog ist einsatzbereit</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowQuestionOnboardingDialog(false)}
              >
                Abbrechen
              </Button>
              <Button type="submit" className="flex-1" disabled={isQuestionOnboardingLoading}>
                {isQuestionOnboardingLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ClipboardList className="w-4 h-4 mr-2" />
                    Jetzt starten
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
