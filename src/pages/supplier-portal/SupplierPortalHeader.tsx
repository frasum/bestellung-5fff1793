import { format, differenceInHours } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, Clock, AlertTriangle } from 'lucide-react';
import logo from '@/assets/logo.png';
import type { SupplierSession, PortalSettings } from './types';

interface SupplierPortalHeaderProps {
  session: SupplierSession;
  portalSettings: PortalSettings;
  onLogout: () => void;
}

export function SupplierPortalHeader({
  session,
  portalSettings,
  onLogout,
}: SupplierPortalHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img 
            src={portalSettings.logo_url || logo} 
            alt="Portal Logo" 
            className={cn(
              "object-contain",
              portalSettings.logo_url ? "h-10 max-w-[120px]" : "h-10 w-10"
            )} 
          />
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{portalSettings.portal_title}</h1>
            <p className="text-sm text-gray-500">{session.supplierName}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {session.expiresAt && (
            <div className="hidden sm:flex items-center gap-3">
              {differenceInHours(new Date(session.expiresAt), new Date()) <= 24 ? (
                <Badge className="bg-amber-50 text-amber-700 border border-amber-200 gap-1.5 font-normal">
                  <AlertTriangle className="h-3 w-3" />
                  Läuft bald ab
                </Badge>
              ) : null}
              <div className="text-xs text-gray-500 flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-full">
                <Clock className="h-3 w-3" />
                Zugang bis: {format(new Date(session.expiresAt), 'dd.MM.yyyy', { locale: de })}
              </div>
            </div>
          )}
          <Button 
            variant="outline" 
            onClick={onLogout}
            className="border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Abmelden
          </Button>
        </div>
      </div>
    </header>
  );
}
