import { Pencil, Trash2, Phone, Mail, MapPin, Copy, MessageCircle, ExternalLink, QrCode, Zap, KeyRound, Shield, ShieldAlert, Mic, PlusCircle, Camera, Wine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Employee } from '@/hooks/useEmployees';

interface LocationSuppliersInfo {
  locationName: string;
  supplierNames: string[];
}

interface SimpleOrderToken {
  id: string;
  token: string;
  employee_id: string | null;
}

interface EmployeeCardProps {
  employee: Employee;
  token: SimpleOrderToken | undefined;
  locationSuppliersInfo: LocationSuppliersInfo[];
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

export function EmployeeCard({
  employee,
  token,
  locationSuppliersInfo,
  advancedSettingsEnabled,
  onEdit,
  onDelete,
  onToggleActive,
  onOpenPinDialog,
  onCopyLink,
  onOpenWhatsApp,
  getOrderUrl,
  generateQrCodeUrl,
}: EmployeeCardProps) {
  return (
    <div
      className={`border rounded-lg p-3 sm:p-4 ${
        !employee.is_active ? 'opacity-60 bg-muted/30' : ''
      }`}
    >
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{employee.name}</span>
                {employee.auto_approve_orders && (
                  <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-600">
                    <Zap className="h-3 w-3 mr-1" />
                    Auto-Freigabe
                  </Badge>
                )}
                {employee.auto_approve_orders && (
                  employee.pin_code ? (
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
                {employee.voice_input_enabled && (
                  <Badge variant="outline" className="text-xs border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-900/20">
                    <Mic className="h-3 w-3 mr-1" />
                    Spracheingabe
                  </Badge>
                )}
                {employee.can_add_free_items && (
                  <Badge variant="outline" className="text-xs border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20">
                    <PlusCircle className="h-3 w-3 mr-1" />
                    Freie Artikel
                  </Badge>
                )}
                {employee.can_capture_photos && (
                  <Badge variant="outline" className="text-xs border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-900/20">
                    <Camera className="h-3 w-3 mr-1" />
                    Fotoerfassung
                  </Badge>
                )}
                {employee.wine_catalog_access && employee.wine_catalog_access !== 'none' && (
                  <Badge variant="outline" className="text-xs border-rose-500 text-rose-600 bg-rose-50 dark:bg-rose-900/20">
                    <Wine className="h-3 w-3 mr-1" />
                    {employee.wine_catalog_access === 'edit' ? 'Wein-Editor' : 'Weinkarte'}
                  </Badge>
                )}
                {!employee.is_active && (
                  <Badge variant="secondary">Inaktiv</Badge>
                )}
              </div>
              
              {locationSuppliersInfo.length > 0 && (
                <div className="mt-2 space-y-1">
                  {locationSuppliersInfo.map((info, idx) => (
                    <div key={idx} className="flex items-center gap-1 flex-wrap text-sm">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium text-muted-foreground">{info.locationName}:</span>
                      {info.supplierNames.length > 0 ? (
                        info.supplierNames.length > 3 ? (
                          <Badge variant="secondary" className="text-xs">
                            {info.supplierNames.length} Lieferanten
                          </Badge>
                        ) : (
                          info.supplierNames.map((name, sIdx) => (
                            <Badge key={sIdx} variant="secondary" className="text-xs">
                              {name}
                            </Badge>
                          ))
                        )
                      ) : (
                        <span className="text-xs text-amber-600">Keine Lieferanten</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                {employee.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    <span>{employee.phone}</span>
                  </div>
                )}
                {employee.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    <span>{employee.email}</span>
                  </div>
                )}
              </div>
              
              {employee.notes && (
                <p className="text-sm text-muted-foreground mt-2">
                  {employee.notes}
                </p>
              )}
            </div>
            
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
          </div>
        </div>
      </div>
    </div>
  );
}
