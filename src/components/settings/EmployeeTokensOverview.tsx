import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { User, ChevronDown, ChevronRight, Copy, QrCode, Pencil, Trash2, ExternalLink, Printer, Package, Link2, Phone, Mail, MessageCircle, KeyRound, Shield, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmployeeTokensOverviewProps {
  tokens: any[];
  onEdit: (token: any) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
  onUpdateEmployeePin?: (employeeId: string, pin: string | null) => Promise<void>;
}

const LANGUAGES = [
  { code: 'th', name: 'ไทย (Thai)' },
  { code: 'de', name: 'Deutsch' },
  { code: 'en', name: 'English' },
  { code: 'vi', name: 'Tiếng Việt' },
];

export function EmployeeTokensOverview({ tokens, onEdit, onToggleActive, onDelete, onUpdateEmployeePin }: EmployeeTokensOverviewProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [expandedSuppliers, setExpandedSuppliers] = useState<Set<string>>(new Set());
  const [selectedQrToken, setSelectedQrToken] = useState<string | null>(null);
  
  // PIN Dialog state
  const [pinDialogToken, setPinDialogToken] = useState<any | null>(null);
  const [pinValue, setPinValue] = useState('');
  const [isSavingPin, setIsSavingPin] = useState(false);

  const openPinDialog = (token: any) => {
    setPinDialogToken(token);
    // Don't pre-populate - PIN is now hashed and not readable
    setPinValue('');
  };

  const closePinDialog = () => {
    setPinDialogToken(null);
    setPinValue('');
  };

  const handleSavePin = async () => {
    if (!pinDialogToken?.employee?.id || !onUpdateEmployeePin) return;
    
    setIsSavingPin(true);
    try {
      await onUpdateEmployeePin(
        pinDialogToken.employee.id, 
        pinValue.length === 4 ? pinValue : null
      );
      toast({
        title: pinValue.length === 4 ? 'PIN gespeichert' : 'PIN entfernt',
        description: pinValue.length === 4 
          ? `PIN für ${pinDialogToken.employee.name} wurde gesetzt.`
          : `PIN für ${pinDialogToken.employee.name} wurde entfernt.`,
      });
      closePinDialog();
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'PIN konnte nicht gespeichert werden.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingPin(false);
    }
  };

  const generateRandomPin = () => {
    const randomPin = String(Math.floor(1000 + Math.random() * 9000));
    setPinValue(randomPin);
  };

  // Group tokens by supplier
  const groupedTokens = useMemo(() => {
    const groups: Record<string, any[]> = {};
    
    tokens.forEach(token => {
      let key: string;
      if (token.is_multi_supplier) {
        key = '__multi__';
      } else if (token.supplier?.name) {
        key = token.supplier.name;
      } else {
        key = '__unassigned__';
      }
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(token);
    });

    // Sort: suppliers alphabetically, multi and unassigned at the end
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === '__multi__') return 1;
      if (b === '__multi__') return -1;
      if (a === '__unassigned__') return 1;
      if (b === '__unassigned__') return -1;
      return a.localeCompare(b, 'de');
    });

    return sortedKeys.map(key => ({
      supplierKey: key,
      supplierName: key === '__multi__' ? 'Multi-Lieferanten' : (key === '__unassigned__' ? 'Ohne Zuordnung' : key),
      isMulti: key === '__multi__',
      isUnassigned: key === '__unassigned__',
      tokens: groups[key],
      activeCount: groups[key].filter(t => t.is_active).length,
      inactiveCount: groups[key].filter(t => !t.is_active).length,
    }));
  }, [tokens]);

  // Statistics
  const stats = useMemo(() => {
    const suppliersWithLinks = groupedTokens.filter(g => !g.isMulti && !g.isUnassigned).length;
    const totalActive = tokens.filter(t => t.is_active).length;
    const totalInactive = tokens.filter(t => !t.is_active).length;
    const multiCount = groupedTokens.find(g => g.isMulti)?.tokens.length || 0;
    
    return { suppliersWithLinks, totalActive, totalInactive, multiCount };
  }, [groupedTokens, tokens]);

  const toggleSupplier = (key: string) => {
    setExpandedSuppliers(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const getOrderUrl = (token: string) => `https://bestellung.pro/simple-order/${token}`;

  const generateQrCodeUrl = (token: string) => {
    const url = encodeURIComponent(getOrderUrl(token));
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${url}`;
  };

  const copyToClipboard = (token: string) => {
    navigator.clipboard.writeText(getOrderUrl(token));
    toast({
      title: 'Link kopiert',
      description: 'Der Link wurde in die Zwischenablage kopiert.',
    });
  };

  const sendViaWhatsApp = (token: string, phone: string, employeeName: string) => {
    // Clean phone number: remove spaces, dashes, and ensure international format
    const cleanPhone = phone.replace(/[\s\-()]/g, '').replace(/^0/, '49');
    const orderUrl = getOrderUrl(token);
    const message = encodeURIComponent(`Hallo ${employeeName}, hier ist dein Bestelllink:\n${orderUrl}`);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const getLinkedSupplierNames = (token: any) => {
    if (token.is_multi_supplier && token.token_suppliers) {
      return token.token_suppliers.map((ts: any) => ts.supplier?.name).filter(Boolean).join(', ');
    }
    return '';
  };

  const printAllQrCodes = (groupTokens: any[], supplierName: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const qrCodesHtml = groupTokens.map(token => {
      const employeeName = token.employee?.name || token.employee_name || 'Ohne Zuordnung';
      
      return `
        <div style="page-break-inside:avoid;text-align:center;margin:20px 0;padding:20px;border:1px solid #eee;border-radius:8px;">
          <h3 style="margin:0 0 10px 0;">${employeeName}</h3>
          <img src="${generateQrCodeUrl(token.token)}" style="width:200px;height:200px;" />
          <p style="margin:10px 0 0 0;color:#666;font-size:14px;">${supplierName}</p>
        </div>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head><title>QR-Codes: ${supplierName}</title></head>
        <body style="font-family:sans-serif;padding:20px;">
          <h1 style="text-align:center;margin-bottom:30px;">
            QR-Codes für ${supplierName}
          </h1>
          <div style="display:grid;grid-template-columns:repeat(2, 1fr);gap:20px;">
            ${qrCodesHtml}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const selectedToken = tokens.find(t => t.token === selectedQrToken);

  return (
    <div className="space-y-4">
      {/* Statistics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 text-center">
          <div className="text-2xl font-bold">{stats.suppliersWithLinks}</div>
          <div className="text-xs text-muted-foreground">Lieferanten</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.totalActive}</div>
          <div className="text-xs text-muted-foreground">Aktive Links</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-2xl font-bold text-muted-foreground">{stats.totalInactive}</div>
          <div className="text-xs text-muted-foreground">Inaktive Links</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-2xl font-bold text-orange-500">{stats.multiCount}</div>
          <div className="text-xs text-muted-foreground">Multi-Lieferanten</div>
        </Card>
      </div>

      {/* Grouped List */}
      <div className="space-y-2">
        {groupedTokens.map(group => {
          const isExpanded = expandedSuppliers.has(group.supplierKey);

          return (
            <Card key={group.supplierKey} className="overflow-hidden">
              <Collapsible open={isExpanded} onOpenChange={() => toggleSupplier(group.supplierKey)}>
                <CollapsibleTrigger asChild>
                  <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      {group.isMulti ? (
                        <div className="flex items-center gap-2">
                          <Link2 className="h-5 w-5 text-orange-500" />
                          <span className="font-semibold">{group.supplierName}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Package className="h-5 w-5 text-primary" />
                          <span className="font-semibold">{group.supplierName}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {group.tokens.length} {group.tokens.length === 1 ? 'Link' : 'Links'}
                      </Badge>
                      {group.activeCount > 0 && (
                        <Badge variant="default" className="bg-green-600">
                          {group.activeCount} aktiv
                        </Badge>
                      )}
                      {group.inactiveCount > 0 && (
                        <Badge variant="secondary">
                          {group.inactiveCount} inaktiv
                        </Badge>
                      )}
                    </div>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="border-t">
                    {/* Quick Actions */}
                    <div className="px-4 py-2 bg-muted/30 flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          printAllQrCodes(group.tokens, group.supplierName);
                        }}
                      >
                        <Printer className="h-4 w-4 mr-1" />
                        Alle QR-Codes drucken
                      </Button>
                    </div>

                    {/* Token List */}
                    <div className="divide-y">
                      {group.tokens.map(token => {
                        const employeeName = token.employee?.name || token.employee_name || 'Ohne Zuordnung';
                        const language = LANGUAGES.find(l => l.code === token.language);
                        
                        return (
                          <div key={token.id} className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-muted/30">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{employeeName}</span>
                                {token.location && (
                                  <Badge variant="secondary" className="text-xs">{token.location.short_code || token.location.name}</Badge>
                                )}
                                <Badge variant={token.is_active ? 'default' : 'destructive'} className="text-xs">
                                  {token.is_active ? 'Aktiv' : 'Inaktiv'}
                                </Badge>
                                {/* PIN Status Badge for Auto-Approve employees */}
                                {token.employee?.auto_approve_orders && (
                                  token.employee?.pin_code ? (
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
                              </div>
                              {(token.employee?.phone || token.employee?.email) && (
                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                  {token.employee?.phone && (
                                    <span className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {token.employee.phone}
                                    </span>
                                  )}
                                  {token.employee?.email && (
                                    <span className="flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      {token.employee.email}
                                    </span>
                                  )}
                                </div>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {language?.name || token.language}
                                {group.isMulti && token.token_suppliers && (
                                  <> • {token.token_suppliers.length} Lieferanten</>
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Switch
                                checked={token.is_active}
                                onCheckedChange={(checked) => onToggleActive(token.id, checked)}
                              />
                              <Button variant="ghost" size="icon" onClick={() => onEdit(token)} title="Bearbeiten">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {/* PIN Edit Button for Auto-Approve employees */}
                              {token.employee?.auto_approve_orders && onUpdateEmployeePin && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => openPinDialog(token)}
                                  title="PIN bearbeiten"
                                  className={token.employee?.pin_code ? "text-green-600 hover:text-green-700" : "text-amber-600 hover:text-amber-700"}
                                >
                                  <KeyRound className="h-4 w-4" />
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" onClick={() => copyToClipboard(token.token)} title="Link kopieren">
                                <Copy className="h-4 w-4" />
                              </Button>
                              {token.employee?.phone && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => sendViaWhatsApp(token.token, token.employee.phone, employeeName)}
                                  title="Per WhatsApp senden"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  <MessageCircle className="h-4 w-4" />
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" onClick={() => setSelectedQrToken(token.token)} title="QR-Code">
                                <QrCode className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Bestelllink löschen?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Der Link für "{employeeName}" wird dauerhaft gelöscht.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => onDelete(token.id)}
                                      className="bg-destructive hover:bg-destructive/90"
                                    >
                                      {t('common.delete')}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {/* QR Code Dialog */}
      {selectedToken && (
        <Dialog open={!!selectedQrToken} onOpenChange={(open) => !open && setSelectedQrToken(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>QR-Code: {selectedToken.employee?.name || selectedToken.employee_name || 'Bestelllink'}</DialogTitle>
              <DialogDescription>
                {selectedToken.is_multi_supplier 
                  ? `Scannen Sie diesen QR-Code zum Bestellen bei ${selectedToken.token_suppliers?.length || 0} Lieferanten`
                  : `Scannen Sie diesen QR-Code zum Bestellen bei ${selectedToken.supplier?.name}`
                }
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center p-4">
              <img
                src={generateQrCodeUrl(selectedToken.token)}
                alt={`QR Code`}
                className="w-64 h-64"
              />
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => window.open(getOrderUrl(selectedToken.token), '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Link öffnen
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  const printWindow = window.open('', '_blank');
                  if (printWindow) {
                    const employeeName = selectedToken.employee?.name || selectedToken.employee_name || 'Bestelllink';
                    const supplierInfo = selectedToken.is_multi_supplier 
                      ? `${selectedToken.token_suppliers?.length || 0} Lieferanten`
                      : selectedToken.supplier?.name || '';
                    printWindow.document.write(`
                      <html>
                        <head><title>QR-Code: ${employeeName}</title></head>
                        <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:sans-serif;">
                          <h1 style="margin-bottom:20px;">${employeeName}</h1>
                          <img src="${generateQrCodeUrl(selectedToken.token)}" style="width:300px;height:300px;" />
                          <p style="margin-top:20px;color:#666;">${supplierInfo}</p>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                    printWindow.print();
                  }
                }}
              >
                Drucken
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* PIN Edit Dialog */}
      <Dialog open={!!pinDialogToken} onOpenChange={(open) => !open && closePinDialog()}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              PIN bearbeiten
            </DialogTitle>
            <DialogDescription>
              PIN für {pinDialogToken?.employee?.name || 'Mitarbeiter'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pin-edit">4-stelliger PIN-Code</Label>
              <Input
                id="pin-edit"
                type="text"
                inputMode="numeric"
                maxLength={4}
                pattern="[0-9]*"
                value={pinValue}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setPinValue(value);
                }}
                placeholder="z.B. 1234"
                className="font-mono text-center tracking-widest text-lg"
              />
              {pinValue && pinValue.length !== 4 && pinValue.length > 0 && (
                <p className="text-xs text-destructive">
                  PIN muss genau 4 Ziffern haben
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateRandomPin}
                className="flex-1"
              >
                Generieren
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPinValue('')}
                className="flex-1"
                disabled={!pinValue}
              >
                Entfernen
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closePinDialog}>
              Abbrechen
            </Button>
            <Button 
              onClick={handleSavePin} 
              disabled={isSavingPin || (pinValue.length > 0 && pinValue.length !== 4)}
            >
              {isSavingPin ? 'Speichern...' : 'Speichern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
