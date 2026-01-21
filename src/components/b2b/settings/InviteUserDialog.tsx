import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errorUtils';
import type { B2BSupplier } from './useB2BSettingsState';

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  b2bSuppliers: B2BSupplier[];
  onSuccess: () => void;
}

export function InviteUserDialog({
  open,
  onOpenChange,
  accountId,
  b2bSuppliers,
  onSuccess,
}: InviteUserDialogProps) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteSupplierId, setInviteSupplierId] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('manager');
  const [inviting, setInviting] = useState(false);

  const handleInvite = async () => {
    if (!inviteEmail || !inviteSupplierId) {
      toast.error('Bitte füllen Sie alle Felder aus');
      return;
    }

    setInviting(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: inviteEmail,
        password: crypto.randomUUID(),
        options: {
          emailRedirectTo: `${window.location.origin}/b2b/login`,
        },
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          toast.error('Diese E-Mail ist bereits registriert.');
          return;
        }
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Benutzer konnte nicht erstellt werden');
      }

      const { error: insertError } = await supabase
        .from('b2b_supplier_users')
        .insert({
          user_id: authData.user.id,
          supplier_id: inviteSupplierId,
          account_id: accountId,
          role: inviteRole as 'owner' | 'manager' | 'viewer',
          email: inviteEmail,
          name: inviteName || null,
        });

      if (insertError) throw insertError;

      toast.success(`Einladung an ${inviteEmail} gesendet.`);
      onOpenChange(false);
      setInviteEmail('');
      setInviteName('');
      setInviteSupplierId('');
      setInviteRole('manager');
      onSuccess();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setInviting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lieferanten-Benutzer einladen</DialogTitle>
          <DialogDescription>
            Der Benutzer erhält einen eigenen Login und kann nur den ausgewählten Lieferanten verwalten.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="inviteName">Name</Label>
            <Input
              id="inviteName"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="Luigi Rossi"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inviteEmail">E-Mail</Label>
            <Input
              id="inviteEmail"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="luigi@esempio.it"
            />
          </div>
          <div className="space-y-2">
            <Label>Lieferant</Label>
            <Select value={inviteSupplierId} onValueChange={setInviteSupplierId}>
              <SelectTrigger>
                <SelectValue placeholder="Lieferant auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {b2bSuppliers.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Rolle</Label>
            <Select value={inviteRole} onValueChange={setInviteRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manager">Manager (kann bearbeiten)</SelectItem>
                <SelectItem value="viewer">Betrachter (nur lesen)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={handleInvite} disabled={inviting}>
            {inviting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
            Einladen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
