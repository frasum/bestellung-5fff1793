import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useWineCatalogTokens, useCreateWineCatalogToken, useUpdateWineCatalogToken, useDeleteWineCatalogToken, WineCatalogToken, CreateWineCatalogTokenInput } from '@/hooks/useWineCatalogTokens';
import { useEmployees } from '@/hooks/useEmployees';
import { Plus, Copy, QrCode, Trash2, Edit, Eye, Wine, Loader2, ExternalLink, Key, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import QRCode from 'qrcode';

export function WineTokensTab() {
  const { t } = useTranslation();
  const { data: tokens, isLoading } = useWineCatalogTokens();
  const { data: employees } = useEmployees();
  const createToken = useCreateWineCatalogToken();
  const updateToken = useUpdateWineCatalogToken();
  const deleteToken = useDeleteWineCatalogToken();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedToken, setSelectedToken] = useState<WineCatalogToken | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Create form state
  const [formLabel, setFormLabel] = useState('');
  const [formPermission, setFormPermission] = useState<'view' | 'edit'>('view');
  const [formEmployeeId, setFormEmployeeId] = useState<string>('');
  const [formPin, setFormPin] = useState('');

  const getTokenUrl = (token: string) => {
    return `${window.location.origin}/wines/${token}`;
  };

  const handleCopyLink = (token: string) => {
    navigator.clipboard.writeText(getTokenUrl(token));
    toast.success(t('wineTokens.linkCopied'));
  };

  const handleShowQr = async (token: WineCatalogToken) => {
    setSelectedToken(token);
    try {
      const url = await QRCode.toDataURL(getTokenUrl(token.token), { width: 300 });
      setQrCodeUrl(url);
      setShowQrDialog(true);
    } catch (err) {
      console.error('QR code generation failed:', err);
    }
  };

  const handleCreate = async () => {
    if (!formLabel.trim()) return;

    const input: CreateWineCatalogTokenInput = {
      label: formLabel.trim(),
      permission: formPermission,
      employee_id: formEmployeeId || null,
      pin_code: formPin || null,
    };

    await createToken.mutateAsync(input);
    toast.success(t('wineTokens.created'));
    setShowCreateDialog(false);
    resetForm();
  };

  const handleToggleActive = async (token: WineCatalogToken) => {
    await updateToken.mutateAsync({
      id: token.id,
      is_active: !token.is_active,
    });
    toast.success(token.is_active ? t('wineTokens.deactivated') : t('wineTokens.activated'));
  };

  const handleDelete = async () => {
    if (!selectedToken) return;
    await deleteToken.mutateAsync(selectedToken.id);
    toast.success(t('wineTokens.deleted'));
    setShowDeleteDialog(false);
    setSelectedToken(null);
  };

  const resetForm = () => {
    setFormLabel('');
    setFormPermission('view');
    setFormEmployeeId('');
    setFormPin('');
  };

  const generateRandomPin = () => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    setFormPin(pin);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wine className="h-5 w-5" />
                {t('wineTokens.title')}
              </CardTitle>
              <CardDescription>{t('wineTokens.description')}</CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('wineTokens.create')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {tokens?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wine className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('wineTokens.noTokens')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tokens?.map((token) => (
                <div
                  key={token.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    token.is_active ? 'bg-card' : 'bg-muted/50 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{token.label}</span>
                        <Badge variant={token.permission === 'edit' ? 'default' : 'secondary'}>
                          {token.permission === 'edit' ? (
                            <><Edit className="h-3 w-3 mr-1" />{t('wineTokens.canEdit')}</>
                          ) : (
                            <><Eye className="h-3 w-3 mr-1" />{t('wineTokens.viewOnly')}</>
                          )}
                        </Badge>
                        {token.pin_code && (
                          <Badge variant="outline">
                            <KeyRound className="h-3 w-3 mr-1" />
                            PIN
                          </Badge>
                        )}
                        {!token.is_active && (
                          <Badge variant="destructive">{t('wineTokens.inactive')}</Badge>
                        )}
                      </div>
                      {token.employee && (
                        <p className="text-sm text-muted-foreground mt-1">
                          👤 {token.employee.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={token.is_active}
                      onCheckedChange={() => handleToggleActive(token)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleCopyLink(token.token)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleShowQr(token)}>
                      <QrCode className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.open(getTokenUrl(token.token), '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedToken(token);
                        setShowDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('wineTokens.createTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('wineTokens.label')}</Label>
              <Input
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                placeholder={t('wineTokens.labelPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('wineTokens.permission')}</Label>
              <Select value={formPermission} onValueChange={(v: 'view' | 'edit') => setFormPermission(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      {t('wineTokens.viewOnly')}
                    </div>
                  </SelectItem>
                  <SelectItem value="edit">
                    <div className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      {t('wineTokens.canEdit')}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('wineTokens.employee')} ({t('common.optional')})</Label>
              <Select value={formEmployeeId} onValueChange={setFormEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('wineTokens.selectEmployee')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('wineTokens.noEmployee')}</SelectItem>
                  {employees?.filter(e => e.is_active).map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('wineTokens.pin')} ({t('common.optional')})</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={formPin}
                  onChange={(e) => setFormPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={generateRandomPin}>
                  <Key className="h-4 w-4 mr-2" />
                  {t('wineTokens.generatePin')}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{t('wineTokens.pinHint')}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreate} disabled={!formLabel.trim() || createToken.isPending}>
              {createToken.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('wineTokens.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{selectedToken?.label}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-4">
            {qrCodeUrl && (
              <img src={qrCodeUrl} alt="QR Code" className="rounded-lg" />
            )}
            <p className="text-sm text-muted-foreground mt-4 text-center">
              {t('wineTokens.scanQr')}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleCopyLink(selectedToken?.token || '')}>
              <Copy className="h-4 w-4 mr-2" />
              {t('wineTokens.copyLink')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('wineTokens.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('wineTokens.deleteConfirmDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
