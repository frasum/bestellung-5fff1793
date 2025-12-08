import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  MoreHorizontal,
  RefreshCw,
  UserCheck,
  Trash2,
  Loader2
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  useDemoAccounts,
  useDemoAccountStats,
  useExtendDemo,
  useConvertDemo,
  useDeleteDemoAccount,
  DemoAccount,
} from '@/hooks/useDemoAccounts';

export function DemoAccountsTab() {
  const { data: accounts, isLoading } = useDemoAccounts();
  const stats = useDemoAccountStats();
  const extendDemo = useExtendDemo();
  const convertDemo = useConvertDemo();
  const deleteDemo = useDeleteDemoAccount();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<DemoAccount | null>(null);

  const handleExtend = (account: DemoAccount, days: number) => {
    extendDemo.mutate({ organizationId: account.id, days });
  };

  const handleConvert = (account: DemoAccount) => {
    setSelectedAccount(account);
    setConvertDialogOpen(true);
  };

  const handleDelete = (account: DemoAccount) => {
    setSelectedAccount(account);
    setDeleteDialogOpen(true);
  };

  const confirmConvert = () => {
    if (selectedAccount) {
      convertDemo.mutate(selectedAccount.id);
    }
    setConvertDialogOpen(false);
    setSelectedAccount(null);
  };

  const confirmDelete = () => {
    if (selectedAccount) {
      deleteDemo.mutate(selectedAccount.id);
    }
    setDeleteDialogOpen(false);
    setSelectedAccount(null);
  };

  const getExpiryBadge = (account: DemoAccount) => {
    if (account.is_expired) {
      return <Badge variant="destructive">Abgelaufen</Badge>;
    }
    
    if (!account.demo_expires_at) {
      return <Badge variant="secondary">Kein Ablauf</Badge>;
    }

    const expiryDate = new Date(account.demo_expires_at);
    const now = new Date();
    const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft <= 2) {
      return <Badge variant="destructive">{daysLeft} Tag(e)</Badge>;
    } else if (daysLeft <= 7) {
      return <Badge variant="outline" className="border-orange-500 text-orange-600">{daysLeft} Tage</Badge>;
    }
    return <Badge variant="secondary">{daysLeft} Tage</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Gesamt</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              {stats.total}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Aktiv</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              {stats.active}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Abgelaufen</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              {stats.expired}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Läuft bald ab</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              {stats.expiringIn7Days}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Demo Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Demo-Accounts</CardTitle>
          <CardDescription>
            Übersicht aller Demo-Accounts und deren Status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {accounts && accounts.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organisation</TableHead>
                    <TableHead>E-Mail</TableHead>
                    <TableHead>Erstellt</TableHead>
                    <TableHead>Verbleibend</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.id} className={account.is_expired ? 'opacity-60' : ''}>
                      <TableCell className="font-medium">{account.name}</TableCell>
                      <TableCell className="text-muted-foreground">{account.email}</TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(account.created_at), { 
                            addSuffix: true, 
                            locale: de 
                          })}
                        </span>
                      </TableCell>
                      <TableCell>{getExpiryBadge(account)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleExtend(account, 7)}>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              +7 Tage verlängern
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExtend(account, 30)}>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              +30 Tage verlängern
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleConvert(account)}>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Zu echtem Account konvertieren
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(account)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Löschen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Keine Demo-Accounts vorhanden</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Convert Dialog */}
      <AlertDialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Account konvertieren</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie "{selectedAccount?.name}" zu einem echten Account konvertieren? 
              Der Demo-Status wird entfernt und das Ablaufdatum gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={confirmConvert}>
              Konvertieren
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Account löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie "{selectedAccount?.name}" wirklich löschen? 
              Alle zugehörigen Daten (Bestellungen, Artikel, Lieferanten) werden unwiderruflich gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Endgültig löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
