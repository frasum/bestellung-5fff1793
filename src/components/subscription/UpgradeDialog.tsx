import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Crown, TrendingUp, Users, Package } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

type LimitType = 'orders' | 'suppliers' | 'users';

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  limitType: LimitType;
  currentTier: string;
  currentUsage: number;
  limit: number | 'unlimited';
}

const limitInfo: Record<LimitType, { icon: typeof Package; label: string; description: string }> = {
  orders: {
    icon: Package,
    label: 'Bestellungen',
    description: 'Sie haben das Limit für Bestellungen in diesem Monat erreicht.',
  },
  suppliers: {
    icon: TrendingUp,
    label: 'Lieferanten',
    description: 'Sie haben das Limit für aktive Lieferanten erreicht.',
  },
  users: {
    icon: Users,
    label: 'Team-Mitglieder',
    description: 'Sie haben das Limit für Team-Mitglieder erreicht.',
  },
};

const tierNames: Record<string, string> = {
  free: 'Free',
  basic: 'Basic',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

const recommendedUpgrade: Record<string, string> = {
  free: 'Basic',
  basic: 'Pro',
  pro: 'Enterprise',
  enterprise: 'Enterprise',
};

export function UpgradeDialog({
  open,
  onOpenChange,
  limitType,
  currentTier,
  currentUsage,
  limit,
}: UpgradeDialogProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const info = limitInfo[limitType];
  const Icon = info.icon;

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate('/pricing');
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-warning/10">
              <Icon className="h-6 w-6 text-warning" />
            </div>
            <Badge variant="secondary">{tierNames[currentTier]} Plan</Badge>
          </div>
          <AlertDialogTitle className="text-xl">
            Limit erreicht
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>{info.description}</p>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <span className="text-sm text-foreground">{info.label}</span>
              <span className="font-medium text-foreground">
                {currentUsage} / {limit === 'unlimited' ? '∞' : limit}
              </span>
            </div>
            <p className="text-sm">
              Upgraden Sie auf <strong>{recommendedUpgrade[currentTier]}</strong> für mehr Kapazität 
              und zusätzliche Funktionen.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Später</AlertDialogCancel>
          <AlertDialogAction onClick={handleUpgrade} className="gap-2">
            <Crown className="h-4 w-4" />
            Jetzt upgraden
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
