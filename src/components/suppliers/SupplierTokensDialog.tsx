import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Ban, Clock, RefreshCw, Trash2, Key } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Supplier } from '@/hooks/useSuppliers';

interface SupplierToken {
  id: string;
  token: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  price_edit_expires_at: string | null;
  is_active: boolean;
}

interface SupplierTokensDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
}

export const SupplierTokensDialog = ({ open, onOpenChange, supplier }: SupplierTokensDialogProps) => {
  const [tokens, setTokens] = useState<SupplierToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [tokenToRevoke, setTokenToRevoke] = useState<SupplierToken | null>(null);
  const [revokeAllDialogOpen, setRevokeAllDialogOpen] = useState(false);

  const loadTokens = async () => {
    if (!supplier) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('supplier_portal_tokens')
        .select('*')
        .eq('supplier_id', supplier.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTokens(data || []);
    } catch (error: any) {
      console.error('Error loading tokens:', error);
      toast.error('Fehler beim Laden der Tokens');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && supplier) {
      loadTokens();
    }
  }, [open, supplier]);

  const getTokenStatus = (token: SupplierToken): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } => {
    if (!token.is_active) {
      return { label: 'Widerrufen', variant: 'destructive' };
    }
    if (new Date(token.expires_at) < new Date()) {
      return { label: 'Abgelaufen', variant: 'secondary' };
    }
    if (token.used_at) {
      return { label: 'Aktiv', variant: 'default' };
    }
    return { label: 'Unbenutzt', variant: 'outline' };
  };

  const getPriceEditStatus = (token: SupplierToken): { label: string; canEdit: boolean } => {
    if (!token.is_active || new Date(token.expires_at) < new Date()) {
      return { label: '-', canEdit: false };
    }
    if (!token.price_edit_expires_at) {
      return { label: 'Nicht erlaubt', canEdit: false };
    }
    const priceEditExpires = new Date(token.price_edit_expires_at);
    if (priceEditExpires < new Date()) {
      return { label: 'Abgelaufen', canEdit: false };
    }
    return { 
      label: `Bis ${format(priceEditExpires, 'dd.MM.yyyy', { locale: de })}`, 
      canEdit: true 
    };
  };

  const handleRevokeToken = async () => {
    if (!tokenToRevoke) return;
    setActionLoading(tokenToRevoke.id);
    try {
      const { error } = await supabase
        .from('supplier_portal_tokens')
        .update({ is_active: false })
        .eq('id', tokenToRevoke.id);

      if (error) throw error;
      toast.success('Token widerrufen');
      loadTokens();
    } catch (error: any) {
      console.error('Error revoking token:', error);
      toast.error('Fehler beim Widerrufen des Tokens');
    } finally {
      setActionLoading(null);
      setRevokeDialogOpen(false);
      setTokenToRevoke(null);
    }
  };

  const handleRevokeAll = async () => {
    if (!supplier) return;
    setActionLoading('all');
    try {
      const { error } = await supabase
        .from('supplier_portal_tokens')
        .update({ is_active: false })
        .eq('supplier_id', supplier.id)
        .eq('is_active', true);

      if (error) throw error;
      toast.success('Alle Tokens widerrufen');
      loadTokens();
    } catch (error: any) {
      console.error('Error revoking all tokens:', error);
      toast.error('Fehler beim Widerrufen aller Tokens');
    } finally {
      setActionLoading(null);
      setRevokeAllDialogOpen(false);
    }
  };

  const handleExtendPriceEdit = async (token: SupplierToken) => {
    setActionLoading(token.id);
    try {
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 7);

      const { error } = await supabase
        .from('supplier_portal_tokens')
        .update({ price_edit_expires_at: newExpiry.toISOString() })
        .eq('id', token.id);

      if (error) throw error;
      toast.success('Preisbearbeitungsfrist um 7 Tage verlängert');
      loadTokens();
    } catch (error: any) {
      console.error('Error extending price edit:', error);
      toast.error('Fehler beim Verlängern der Frist');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteExpired = async () => {
    if (!supplier) return;
    setActionLoading('delete');
    try {
      const { error } = await supabase
        .from('supplier_portal_tokens')
        .delete()
        .eq('supplier_id', supplier.id)
        .or(`expires_at.lt.${new Date().toISOString()},is_active.eq.false`);

      if (error) throw error;
      toast.success('Abgelaufene/widerrufene Tokens gelöscht');
      loadTokens();
    } catch (error: any) {
      console.error('Error deleting tokens:', error);
      toast.error('Fehler beim Löschen');
    } finally {
      setActionLoading(null);
    }
  };

  const activeTokenCount = tokens.filter(t => t.is_active && new Date(t.expires_at) > new Date()).length;
  const expiredTokenCount = tokens.filter(t => !t.is_active || new Date(t.expires_at) < new Date()).length;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Token-Verwaltung: {supplier?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <Badge variant="default">{activeTokenCount} aktiv</Badge>
              <Badge variant="secondary">{expiredTokenCount} abgelaufen/widerrufen</Badge>
            </div>
            <div className="flex gap-2">
              {expiredTokenCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteExpired}
                  disabled={actionLoading === 'delete'}
                >
                  {actionLoading === 'delete' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Aufräumen
                </Button>
              )}
              {activeTokenCount > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setRevokeAllDialogOpen(true)}
                  disabled={actionLoading === 'all'}
                >
                  {actionLoading === 'all' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Ban className="w-4 h-4 mr-2" />
                  )}
                  Alle widerrufen
                </Button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : tokens.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Keine Tokens vorhanden
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Erstellt</TableHead>
                    <TableHead>Benutzt</TableHead>
                    <TableHead>Gültig bis</TableHead>
                    <TableHead>Preisbearbeitung</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tokens.map((token) => {
                    const status = getTokenStatus(token);
                    const priceEdit = getPriceEditStatus(token);
                    const isActive = token.is_active && new Date(token.expires_at) > new Date();

                    return (
                      <TableRow key={token.id} className={!isActive ? 'opacity-60' : ''}>
                        <TableCell>
                          <div>
                            <p className="text-sm">{format(new Date(token.created_at), 'dd.MM.yyyy', { locale: de })}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(token.created_at), 'HH:mm', { locale: de })} Uhr</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {token.used_at ? (
                            <div>
                              <p className="text-sm">{format(new Date(token.used_at), 'dd.MM.yyyy', { locale: de })}</p>
                              <p className="text-xs text-muted-foreground">{format(new Date(token.used_at), 'HH:mm', { locale: de })} Uhr</p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{format(new Date(token.expires_at), 'dd.MM.yyyy', { locale: de })}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(token.expires_at), 'HH:mm', { locale: de })} Uhr</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={priceEdit.canEdit ? 'text-green-600' : 'text-muted-foreground'}>
                            {priceEdit.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {isActive && (
                            <div className="flex justify-end gap-1">
                              <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => handleExtendPriceEdit(token)}
                                      disabled={actionLoading === token.id}
                                    >
                                      {actionLoading === token.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Clock className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Preisbearbeitung +7 Tage</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive hover:text-destructive"
                                      onClick={() => {
                                        setTokenToRevoke(token);
                                        setRevokeDialogOpen(true);
                                      }}
                                      disabled={actionLoading === token.id}
                                    >
                                      <Ban className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Token widerrufen</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Token widerrufen?</AlertDialogTitle>
            <AlertDialogDescription>
              Der Lieferant kann sich mit diesem Token nicht mehr anmelden. 
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevokeToken} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Widerrufen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={revokeAllDialogOpen} onOpenChange={setRevokeAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alle Tokens widerrufen?</AlertDialogTitle>
            <AlertDialogDescription>
              Der Lieferant kann sich mit keinem der bestehenden Tokens mehr anmelden.
              Er benötigt eine neue Einladung oder einen neuen QR-Code.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevokeAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Alle widerrufen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
