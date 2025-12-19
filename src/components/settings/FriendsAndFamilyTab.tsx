import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Heart, Gift, Search, Check, X, Edit2, Building2, Users, Crown, Trash2, MoreHorizontal, UserPlus } from 'lucide-react';
import { useSponsoredAccounts, useSponsoredAccountStats, useSetSponsored, useUpdateSponsoredNote, useDeleteOrganization, useUpdateOrganization, SponsoredAccount } from '@/hooks/useSponsoredAccounts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { InviteSponsoredDialog } from './InviteSponsoredDialog';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';

export function FriendsAndFamilyTab() {
  const { t } = useTranslation();
  const { data: accounts, isLoading } = useSponsoredAccounts();
  const stats = useSponsoredAccountStats();
  const setSponsored = useSetSponsored();
  const updateNote = useUpdateSponsoredNote();
  const deleteOrganization = useDeleteOrganization();
  const updateOrganization = useUpdateOrganization();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'sponsored' | 'regular'>('all');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [sponsorDialog, setSponsorDialog] = useState<{ account: SponsoredAccount; action: 'add' | 'remove' } | null>(null);
  const [sponsorNote, setSponsorNote] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<SponsoredAccount | null>(null);
  const [editDialog, setEditDialog] = useState<SponsoredAccount | null>(null);
  const [editName, setEditName] = useState('');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredAccounts = accounts?.filter(account => {
    const matchesSearch = 
      account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.sponsored_note?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterMode === 'sponsored') return matchesSearch && account.is_sponsored;
    if (filterMode === 'regular') return matchesSearch && !account.is_sponsored && !account.is_demo;
    return matchesSearch;
  }) || [];

  const handleSponsorConfirm = () => {
    if (!sponsorDialog) return;
    
    setSponsored.mutate({
      organizationId: sponsorDialog.account.id,
      isSponsored: sponsorDialog.action === 'add',
      sponsoredNote: sponsorDialog.action === 'add' ? sponsorNote : undefined,
    }, {
      onSuccess: () => {
        setSponsorDialog(null);
        setSponsorNote('');
      }
    });
  };

  const handleSaveNote = (accountId: string) => {
    updateNote.mutate({
      organizationId: accountId,
      sponsoredNote: noteText,
    }, {
      onSuccess: () => {
        setEditingNote(null);
        setNoteText('');
      }
    });
  };

  const getTierBadge = (account: SponsoredAccount) => {
    if (account.is_sponsored) {
      return <Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0"><Gift className="h-3 w-3 mr-1" />Sponsored</Badge>;
    }
    if (account.is_demo) {
      return <Badge variant="secondary">Demo</Badge>;
    }
    return <Badge variant="outline">{account.subscription_tier}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card 
          className={cn("cursor-pointer transition-all", filterMode === 'all' && "ring-2 ring-primary")}
          onClick={() => setFilterMode('all')}
        >
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gesamt</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Building2 className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={cn("cursor-pointer transition-all", filterMode === 'sponsored' && "ring-2 ring-primary")}
          onClick={() => setFilterMode('sponsored')}
        >
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sponsored</p>
                <p className="text-2xl font-bold text-pink-500">{stats.sponsored}</p>
              </div>
              <Heart className="h-8 w-8 text-pink-500/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Demo</p>
                <p className="text-2xl font-bold">{stats.demo}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={cn("cursor-pointer transition-all", filterMode === 'regular' && "ring-2 ring-primary")}
          onClick={() => setFilterMode('regular')}
        >
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Regulär</p>
                <p className="text-2xl font-bold">{stats.regular}</p>
              </div>
              <Crown className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-pink-500" />
              Friends & Family Accounts
            </CardTitle>
            <CardDescription>
              Verwalte gesponserte Accounts mit kostenlosen Pro-Features
            </CardDescription>
          </div>
          <Button 
            onClick={() => setInviteDialogOpen(true)}
            className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Einladen
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Suche nach Name, E-Mail oder Notiz..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organisation</TableHead>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notiz</TableHead>
                  <TableHead>Erstellt</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Keine Accounts gefunden
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.name}</TableCell>
                      <TableCell className="text-muted-foreground">{account.email || '—'}</TableCell>
                      <TableCell>{getTierBadge(account)}</TableCell>
                      <TableCell className="max-w-[200px]">
                        {editingNote === account.id ? (
                          <div className="flex items-center gap-2">
                            <Textarea
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              className="text-sm min-h-[60px]"
                              placeholder="z.B. Restaurant von Marco"
                            />
                            <div className="flex flex-col gap-1">
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-7 w-7"
                                onClick={() => handleSaveNote(account.id)}
                                disabled={updateNote.isPending}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-7 w-7"
                                onClick={() => {
                                  setEditingNote(null);
                                  setNoteText('');
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground truncate">
                              {account.sponsored_note || '—'}
                            </span>
                            {account.is_sponsored && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 shrink-0"
                                onClick={() => {
                                  setEditingNote(account.id);
                                  setNoteText(account.sponsored_note || '');
                                }}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(account.created_at), 'dd.MM.yyyy', { locale: de })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {account.is_sponsored ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSponsorDialog({ account, action: 'remove' })}
                              className="text-destructive hover:text-destructive"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Entfernen
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => setSponsorDialog({ account, action: 'add' })}
                              className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white"
                            >
                              <Gift className="h-4 w-4 mr-1" />
                              Sponsern
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setEditDialog(account);
                                setEditName(account.name);
                              }}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Bearbeiten
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => setDeleteDialog(account)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Löschen
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Sponsor Dialog */}
      <Dialog open={!!sponsorDialog} onOpenChange={() => setSponsorDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {sponsorDialog?.action === 'add' 
                ? 'Account sponsern' 
                : 'Sponsored-Status entfernen'}
            </DialogTitle>
            <DialogDescription>
              {sponsorDialog?.action === 'add' 
                ? `"${sponsorDialog?.account.name}" erhält unbegrenzte Bestellungen, Lieferanten und 3 Benutzer - kostenlos.`
                : `"${sponsorDialog?.account.name}" verliert die Pro-Features und wird auf den regulären Plan zurückgesetzt.`}
            </DialogDescription>
          </DialogHeader>
          
          {sponsorDialog?.action === 'add' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Notiz (optional)</label>
              <Textarea
                value={sponsorNote}
                onChange={(e) => setSponsorNote(e.target.value)}
                placeholder="z.B. Restaurant von Marco - Freund aus der Schule"
              />
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSponsorDialog(null)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleSponsorConfirm}
              disabled={setSponsored.isPending}
              className={cn(
                sponsorDialog?.action === 'add' 
                  && "bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
              )}
              variant={sponsorDialog?.action === 'remove' ? 'destructive' : 'default'}
            >
              {setSponsored.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {sponsorDialog?.action === 'add' ? 'Sponsern' : 'Entfernen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editDialog} onOpenChange={() => setEditDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Account bearbeiten</DialogTitle>
            <DialogDescription>
              Ändere die Organisationsdaten für "{editDialog?.name}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organisationsname</Label>
              <Input
                id="org-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Name der Organisation"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(null)}>
              Abbrechen
            </Button>
            <Button
              onClick={() => {
                if (editDialog) {
                  updateOrganization.mutate(
                    { organizationId: editDialog.id, name: editName },
                    { onSuccess: () => setEditDialog(null) }
                  );
                }
              }}
              disabled={updateOrganization.isPending || !editName.trim()}
            >
              {updateOrganization.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Account löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Bist du sicher, dass du "{deleteDialog?.name}" löschen möchtest? 
              Diese Aktion kann nicht rückgängig gemacht werden. Alle Daten dieser Organisation werden unwiderruflich gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteDialog) {
                  deleteOrganization.mutate(deleteDialog.id, {
                    onSuccess: () => setDeleteDialog(null)
                  });
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteOrganization.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Invite Dialog */}
      <InviteSponsoredDialog 
        open={inviteDialogOpen} 
        onOpenChange={setInviteDialogOpen} 
      />
    </div>
  );
}
