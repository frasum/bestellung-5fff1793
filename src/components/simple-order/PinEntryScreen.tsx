import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { cn } from '@/lib/utils';

interface PinEntryScreenProps {
  employeeName: string;
  onVerify: (pin: string) => Promise<boolean>;
  onSuccess: () => void;
  maxAttempts?: number;
  lockoutMinutes?: number;
}

export function PinEntryScreen({
  employeeName,
  onVerify,
  onSuccess,
  maxAttempts = 3,
  lockoutMinutes = 5,
}: PinEntryScreenProps) {
  const { t } = useTranslation();
  const { heavyTap, error: errorVibrate } = useHapticFeedback();
  
  const [pin, setPin] = useState(['', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Check lockout from localStorage
  useEffect(() => {
    const lockoutKey = `pin_lockout_${employeeName}`;
    const stored = localStorage.getItem(lockoutKey);
    if (stored) {
      const lockoutDate = new Date(stored);
      if (lockoutDate > new Date()) {
        setLockedUntil(lockoutDate);
      } else {
        localStorage.removeItem(lockoutKey);
      }
    }
  }, [employeeName]);

  // Countdown timer for lockout
  useEffect(() => {
    if (!lockedUntil) return;
    
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockedUntil.getTime() - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedUntil(null);
        setAttempts(0);
        setTimeRemaining(0);
        localStorage.removeItem(`pin_lockout_${employeeName}`);
      } else {
        setTimeRemaining(remaining);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [lockedUntil, employeeName]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs[0].current?.focus();
  }, []);

  const handleInputChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;
    
    heavyTap();
    
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError(null);
    
    // Auto-focus next input
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pastedData.length === 4) {
      setPin(pastedData.split(''));
    }
  };

  const handleSubmit = async () => {
    if (lockedUntil) return;
    
    const pinCode = pin.join('');
    if (pinCode.length !== 4) {
      setError(t('simpleOrder.pinIncomplete', 'Bitte alle 4 Ziffern eingeben'));
      errorVibrate();
      return;
    }
    
    setIsVerifying(true);
    setError(null);
    
    try {
      const isValid = await onVerify(pinCode);
      
      if (isValid) {
        heavyTap();
        onSuccess();
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        errorVibrate();
        
        if (newAttempts >= maxAttempts) {
          const lockoutDate = new Date(Date.now() + lockoutMinutes * 60 * 1000);
          setLockedUntil(lockoutDate);
          localStorage.setItem(`pin_lockout_${employeeName}`, lockoutDate.toISOString());
          setError(t('simpleOrder.tooManyAttempts', 'Zu viele Fehlversuche. Bitte warten.'));
        } else {
          setError(t('simpleOrder.wrongPin', 'Falscher PIN') + ` (${newAttempts}/${maxAttempts})`);
        }
        
        // Clear inputs
        setPin(['', '', '', '']);
        inputRefs[0].current?.focus();
      }
    } catch (err) {
      console.error('PIN verification error:', err);
      setError(t('simpleOrder.pinVerifyError', 'Fehler bei der Überprüfung'));
      errorVibrate();
    } finally {
      setIsVerifying(false);
    }
  };

  const isLocked = !!lockedUntil;
  const isPinComplete = pin.every(d => d !== '');

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">
            👋 {t('simpleOrder.hello', 'Hallo')}, {employeeName}!
          </h1>
          <p className="text-muted-foreground">
            {t('simpleOrder.enterPinDescription', 'Bitte gib deinen 4-stelligen PIN ein')}
          </p>
        </div>

        {/* PIN Input */}
        <div className="flex justify-center gap-3">
          {pin.map((digit, index) => (
            <Input
              key={index}
              ref={inputRefs[index]}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              disabled={isLocked || isVerifying}
              className={cn(
                "w-14 h-14 text-center text-2xl font-bold",
                error && "border-destructive/50",
                digit && "bg-primary/5"
              )}
              autoComplete="off"
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center justify-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Lockout Timer */}
        {isLocked && (
          <div className="text-center text-muted-foreground">
            <p>
              {t('simpleOrder.lockedFor', 'Gesperrt für')}{' '}
              <span className="font-mono font-bold">
                {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
              </span>
            </p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!isPinComplete || isLocked || isVerifying}
          className="w-full h-14 text-lg touch-manipulation"
        >
          {isVerifying ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {t('common.loading', 'Wird geprüft...')}
            </>
          ) : (
            t('simpleOrder.confirmPin', 'PIN bestätigen')
          )}
        </Button>
      </div>
    </div>
  );
}
