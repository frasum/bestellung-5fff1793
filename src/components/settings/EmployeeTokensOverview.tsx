import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { User, Users, ChevronDown, ChevronRight, Copy, QrCode, Pencil, Trash2, ExternalLink, Printer, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmployeeTokensOverviewProps {
  tokens: any[];
  onEdit: (token: any) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
}

const LANGUAGES = [
  { code: 'th', name: 'ไทย (Thai)' },
  { code: 'de', name: 'Deutsch' },
  { code: 'en', name: 'English' },
  { code: 'vi', name: 'Tiếng Việt' },
];

export function EmployeeTokensOverview({ tokens, onEdit, onToggleActive, onDelete }: EmployeeTokensOverviewProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());
  const [selectedQrToken, setSelectedQrToken] = useState<string | null>(null);

  // Group tokens by employee_name
  const groupedTokens = useMemo(() => {
    const groups: Record<string, any[]> = {};
    
    tokens.forEach(token => {
      const key = token.employee_name || '__unassigned__';
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(token);
    });

    // Sort: employees with names first (alphabetically), then unassigned at the end
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === '__unassigned__') return 1;
      if (b === '__unassigned__') return -1;
      return a.localeCompare(b, 'de');
    });

    return sortedKeys.map(key => ({
      employeeName: key === '__unassigned__' ? null : key,
      tokens: groups[key],
      activeCount: groups[key].filter(t => t.is_active).length,
      inactiveCount: groups[key].filter(t => !t.is_active).length,
    }));
  }, [tokens]);

  // Statistics
  const stats = useMemo(() => {
    const employeesWithCodes = groupedTokens.filter(g => g.employeeName !== null).length;
    const totalActive = tokens.filter(t => t.is_active).length;
    const totalInactive = tokens.filter(t => !t.is_active).length;
    const unassignedCount = groupedTokens.find(g => g.employeeName === null)?.tokens.length || 0;
    
    return { employeesWithCodes, totalActive, totalInactive, unassignedCount };
  }, [groupedTokens, tokens]);

  const toggleEmployee = (employeeName: string | null) => {
    const key = employeeName || '__unassigned__';
    setExpandedEmployees(prev => {
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

  const getSupplierNames = (token: any) => {
    if (token.is_multi_supplier && token.token_suppliers) {
      return token.token_suppliers.map((ts: any) => ts.supplier?.name).filter(Boolean).join(', ');
    }
    return token.supplier?.name || '';
  };

  const printAllQrCodes = (employeeTokens: any[], employeeName: string | null) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const qrCodesHtml = employeeTokens.map(token => {
      const supplierInfo = token.is_multi_supplier 
        ? `${token.token_suppliers?.length || 0} Lieferanten`
        : token.supplier?.name || '';
      
      return `
        <div style="page-break-inside:avoid;text-align:center;margin:20px 0;padding:20px;border:1px solid #eee;border-radius:8px;">
          <h3 style="margin:0 0 10px 0;">${token.label}</h3>
          <img src="${generateQrCodeUrl(token.token)}" style="width:200px;height:200px;" />
          <p style="margin:10px 0 0 0;color:#666;font-size:14px;">${supplierInfo}</p>
        </div>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head><title>QR-Codes: ${employeeName || 'Ohne Zuordnung'}</title></head>
        <body style="font-family:sans-serif;padding:20px;">
          <h1 style="text-align:center;margin-bottom:30px;">
            ${employeeName ? `QR-Codes für ${employeeName}` : 'QR-Codes ohne Mitarbeiter-Zuordnung'}
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
          <div className="text-2xl font-bold">{stats.employeesWithCodes}</div>
          <div className="text-xs text-muted-foreground">Mitarbeiter</div>
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
          <div className="text-2xl font-bold text-orange-500">{stats.unassignedCount}</div>
          <div className="text-xs text-muted-foreground">Ohne Zuordnung</div>
        </Card>
      </div>

      {/* Grouped List */}
      <div className="space-y-2">
        {groupedTokens.map(group => {
          const key = group.employeeName || '__unassigned__';
          const isExpanded = expandedEmployees.has(key);

          return (
            <Card key={key} className="overflow-hidden">
              <Collapsible open={isExpanded} onOpenChange={() => toggleEmployee(group.employeeName)}>
                <CollapsibleTrigger asChild>
                  <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      {group.employeeName ? (
                        <div className="flex items-center gap-2">
                          <User className="h-5 w-5 text-primary" />
                          <span className="font-semibold">{group.employeeName}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <span className="font-semibold text-muted-foreground">Ohne Mitarbeiter-Zuordnung</span>
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
                    {/* Quick Actions for Employee */}
                    <div className="px-4 py-2 bg-muted/30 flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          printAllQrCodes(group.tokens, group.employeeName);
                        }}
                      >
                        <Printer className="h-4 w-4 mr-1" />
                        Alle QR-Codes drucken
                      </Button>
                    </div>

                    {/* Token List */}
                    <div className="divide-y">
                      {group.tokens.map(token => (
                        <div key={token.id} className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-muted/30">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{token.label}</span>
                              {token.is_multi_supplier ? (
                                <Badge variant="outline" className="text-xs flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {token.token_suppliers?.length || 0}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">{token.supplier?.name}</Badge>
                              )}
                              {token.location && (
                                <Badge variant="secondary" className="text-xs">{token.location.name}</Badge>
                              )}
                              <Badge variant={token.is_active ? 'default' : 'destructive'} className="text-xs">
                                {token.is_active ? 'Aktiv' : 'Inaktiv'}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {token.is_multi_supplier && getSupplierNames(token)}
                              {!token.is_multi_supplier && LANGUAGES.find(l => l.code === token.language)?.name}
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
                            <Button variant="ghost" size="icon" onClick={() => copyToClipboard(token.token)} title="Link kopieren">
                              <Copy className="h-4 w-4" />
                            </Button>
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
                                    Der Link "{token.label}" wird dauerhaft gelöscht.
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
                      ))}
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
              <DialogTitle>QR-Code: {selectedToken.label}</DialogTitle>
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
                alt={`QR Code for ${selectedToken.label}`}
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
                    const supplierInfo = selectedToken.is_multi_supplier 
                      ? `${selectedToken.token_suppliers?.length || 0} Lieferanten`
                      : selectedToken.supplier?.name || '';
                    printWindow.document.write(`
                      <html>
                        <head><title>QR-Code: ${selectedToken.label}</title></head>
                        <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:sans-serif;">
                          <h1 style="margin-bottom:20px;">${selectedToken.label}</h1>
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
    </div>
  );
}
