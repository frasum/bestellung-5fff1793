import { memo } from 'react';
import { Zap, Shield, ShieldAlert, Mic, PlusCircle, Camera, Wine } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface EmployeeBadgesProps {
  autoApproveOrders: boolean;
  pinCode: string | null;
  voiceInputEnabled: boolean;
  canAddFreeItems: boolean | null;
  canCapturePhotos: boolean | null;
  wineCatalogAccess: string | null;
  isActive: boolean;
}

export const EmployeeBadges = memo(function EmployeeBadges({
  autoApproveOrders,
  pinCode,
  voiceInputEnabled,
  canAddFreeItems,
  canCapturePhotos,
  wineCatalogAccess,
  isActive,
}: EmployeeBadgesProps) {
  return (
    <>
      {autoApproveOrders && (
        <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-600">
          <Zap className="h-3 w-3 mr-1" />
          Auto-Freigabe
        </Badge>
      )}
      {autoApproveOrders && (
        pinCode ? (
          <Badge variant="outline" className="text-xs border-green-500 text-green-600">
            <Shield className="h-3 w-3 mr-1" />
            PIN aktiv
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">
            <ShieldAlert className="h-3 w-3 mr-1" />
            Kein PIN
          </Badge>
        )
      )}
      {voiceInputEnabled && (
        <Badge variant="outline" className="text-xs border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-900/20">
          <Mic className="h-3 w-3 mr-1" />
          Spracheingabe
        </Badge>
      )}
      {canAddFreeItems && (
        <Badge variant="outline" className="text-xs border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20">
          <PlusCircle className="h-3 w-3 mr-1" />
          Freie Artikel
        </Badge>
      )}
      {canCapturePhotos && (
        <Badge variant="outline" className="text-xs border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-900/20">
          <Camera className="h-3 w-3 mr-1" />
          Fotoerfassung
        </Badge>
      )}
      {wineCatalogAccess && wineCatalogAccess !== 'none' && (
        <Badge variant="outline" className="text-xs border-rose-500 text-rose-600 bg-rose-50 dark:bg-rose-900/20">
          <Wine className="h-3 w-3 mr-1" />
          {wineCatalogAccess === 'edit' ? 'Wein-Editor' : 'Weinkarte'}
        </Badge>
      )}
      {!isActive && (
        <Badge variant="secondary">Inaktiv</Badge>
      )}
    </>
  );
});

EmployeeBadges.displayName = 'EmployeeBadges';
