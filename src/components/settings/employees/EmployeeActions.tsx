import { memo } from 'react';
import { Pencil, Trash2, Copy, MessageCircle, ExternalLink, QrCode, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Employee } from '@/hooks/useEmployees';

interface SimpleOrderToken {
  id: string;
  token: string;
  employee_id: string | null;
}

interface EmployeeActionsProps {
  employee: Employee;
  token: SimpleOrderToken | undefined;
  advancedSettingsEnabled: boolean;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  onToggleActive: (employee: Employee) => void;
  onOpenPinDialog: (employee: Employee) => void;
  onCopyLink: (token: string) => void;
  onOpenWhatsApp: (employee: Employee, token: string) => void;
  getOrderUrl: (token: string) => string;
  generateQrCodeUrl: (token: string) => string;
}

export const EmployeeActions = memo(function EmployeeActions({
  employee,
  token,
  advancedSettingsEnabled,
  onEdit,
  onDelete,
  onToggleActive,
  onOpenPinDialog,
  onCopyLink,
  onOpenWhatsApp,
  getOrderUrl,
  generateQrCodeUrl,
}: EmployeeActionsProps) {
  return (
    <div className="flex items-center gap-1 flex-shrink-0 flex-wrap justify-end">
      {token && (
        <>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                title="QR-Code anzeigen"
              >
                <QrCode className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <img 
                src={generateQrCodeUrl(token.token)} 
                alt="QR-Code" 
                className="w-40 h-40 rounded border bg-white"
              />
            </PopoverContent>
          </Popover>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={() => onCopyLink(token.token)}
            title="Link kopieren"
          >
            <Copy className="h-4 w-4" />
          </Button>
          {employee.phone && (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={() => onOpenWhatsApp(employee, token.token)}
              title="Per WhatsApp senden"
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          )}
          {advancedSettingsEnabled && (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={() => window.open(getOrderUrl(token.token), '_blank')}
              title="EasyOrder direkt öffnen (Test)"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </>
      )}
      
      {employee.auto_approve_orders && (
        <Button 
          variant="ghost" 
          size="icon"
          className={`h-10 w-10 ${employee.pin_code ? "text-green-600 hover:text-green-700" : "text-amber-600 hover:text-amber-700"}`}
          onClick={() => onOpenPinDialog(employee)}
          title="PIN bearbeiten"
        >
          <KeyRound className="h-4 w-4" />
        </Button>
      )}
      
      <div className="hidden sm:block w-px h-6 bg-border mx-1" />
      
      <Switch
        checked={employee.is_active}
        onCheckedChange={() => onToggleActive(employee)}
      />
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10"
        onClick={() => onEdit(employee)}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10"
        onClick={() => onDelete(employee)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
});

EmployeeActions.displayName = 'EmployeeActions';
