import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Users, Filter, ClipboardCheck, CheckCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TourStep {
  id: string;
  target: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface AdminOnboardingTourProps {
  onComplete?: () => void;
}

const ADMIN_TOUR_STORAGE_KEY = 'admin-onboarding-completed';

export function useAdminOnboarding() {
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(ADMIN_TOUR_STORAGE_KEY);
    if (!completed) {
      const timer = setTimeout(() => setShowTour(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const completeTour = useCallback(() => {
    localStorage.setItem(ADMIN_TOUR_STORAGE_KEY, 'true');
    setShowTour(false);
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(ADMIN_TOUR_STORAGE_KEY);
    setShowTour(true);
  }, []);

  return { showTour, completeTour, resetTour, setShowTour };
}

export default function AdminOnboardingTour({ onComplete }: AdminOnboardingTourProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);

  const steps: TourStep[] = [
    {
      id: 'welcome',
      target: '',
      title: t('onboarding.admin.welcome'),
      description: t('onboarding.admin.welcomeDescription'),
      icon: <Users className="h-8 w-8" />,
    },
    {
      id: 'all-orders-tab',
      target: '[data-tour-step="all-orders-tab"]',
      title: t('onboarding.admin.allOrdersStep'),
      description: t('onboarding.admin.allOrdersStepDescription'),
      icon: <ClipboardCheck className="h-8 w-8" />,
    },
    {
      id: 'status-filter',
      target: '[data-tour-step="status-filter"]',
      title: t('onboarding.admin.filterStep'),
      description: t('onboarding.admin.filterStepDescription'),
      icon: <Filter className="h-8 w-8" />,
    },
    {
      id: 'approval',
      target: '',
      title: t('onboarding.admin.approvalStep'),
      description: t('onboarding.admin.approvalStepDescription'),
      icon: <CheckCircle className="h-8 w-8" />,
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem(ADMIN_TOUR_STORAGE_KEY, 'true');
    onComplete?.();
  };

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  // Highlight effect for target element
  useEffect(() => {
    if (currentStepData.target) {
      const element = document.querySelector(currentStepData.target);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('ring-2', 'ring-primary', 'ring-offset-2', 'relative', 'z-[60]');
        return () => {
          element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2', 'relative', 'z-[60]');
        };
      }
    }
  }, [currentStepData.target]);

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={handleSkip}
      />
      
      {/* Tour Card */}
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className={cn(
            "bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full pointer-events-auto",
            "animate-scale-in"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    index === currentStep 
                      ? "w-6 bg-primary" 
                      : index < currentStep 
                        ? "w-2 bg-primary/60"
                        : "w-2 bg-muted"
                  )}
                />
              ))}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleSkip}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 text-center">
            <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary">
              {currentStepData.icon}
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {currentStepData.title}
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {currentStepData.description}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-muted-foreground"
            >
              {t('onboarding.admin.skip')}
            </Button>
            <Button
              size="sm"
              onClick={handleNext}
              className="gap-1"
            >
              {isLastStep ? t('onboarding.admin.finish') : t('onboarding.admin.next')}
              {!isLastStep && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
