import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2, Users, Store, Activity } from 'lucide-react';
import { useB2BAccountsOverview, useB2BStats } from '@/hooks/useSuperAdminB2BOverview';
import { formatDistanceToNow } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import i18n from '@/i18n';

export function B2BPortalOverviewTab() {
  const { t } = useTranslation();
  const { data: accounts, isLoading } = useB2BAccountsOverview();
  const stats = useB2BStats();

  const locale = i18n.language === 'de' ? de : enUS;

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalAccounts}</p>
              <p className="text-sm text-muted-foreground">B2B Accounts</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Store className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalSuppliers}</p>
              <p className="text-sm text-muted-foreground">Lieferanten</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
              <p className="text-sm text-muted-foreground">Lieferanten-Benutzer</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Activity className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.activeSuppliers}</p>
              <p className="text-sm text-muted-foreground">Aktive Lieferanten</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Accounts Overview */}
      <Card>
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="accounts" className="border-b">
            <AccordionTrigger className="group px-4 py-3 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-primary/5">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 group-data-[state=open]:text-primary transition-colors" />
                <span className="group-data-[state=open]:text-primary transition-colors">
                  B2B-Accounts Übersicht
                </span>
                <Badge variant="secondary" className="ml-2">{stats.totalAccounts}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 bg-primary/5">
              <div className="rounded-md border bg-background">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Firma</TableHead>
                      <TableHead>Subdomain</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead className="text-center">Lieferanten</TableHead>
                      <TableHead className="text-center">Benutzer</TableHead>
                      <TableHead>Erstellt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts?.map(account => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">{account.company_name}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            {account.subdomain}.bestellung.pro
                          </code>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{account.email}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{account.suppliers.length}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{account.supplier_users.length}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDistanceToNow(new Date(account.created_at), { addSuffix: true, locale })}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!accounts || accounts.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Keine B2B-Accounts vorhanden
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="suppliers" className="border-b">
            <AccordionTrigger className="group px-4 py-3 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-primary/5">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 group-data-[state=open]:text-primary transition-colors" />
                <span className="group-data-[state=open]:text-primary transition-colors">
                  Lieferanten pro Account
                </span>
                <Badge variant="secondary" className="ml-2">{stats.totalSuppliers}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 bg-primary/5">
              <div className="rounded-md border bg-background">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lieferant</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Benutzer</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts?.flatMap(account => 
                      account.suppliers.map(supplier => (
                        <TableRow key={supplier.id}>
                          <TableCell className="font-medium">{supplier.name}</TableCell>
                          <TableCell className="text-muted-foreground">{account.company_name}</TableCell>
                          <TableCell>
                            <Badge variant={supplier.is_active ? "default" : "secondary"}>
                              {supplier.is_active ? 'Aktiv' : 'Inaktiv'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">
                              {account.supplier_users.filter(u => u.supplier_id === supplier.id).length}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                    {(!accounts || accounts.flatMap(a => a.suppliers).length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          Keine Lieferanten vorhanden
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="users" className="border-b-0">
            <AccordionTrigger className="group px-4 py-3 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-primary/5">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 group-data-[state=open]:text-primary transition-colors" />
                <span className="group-data-[state=open]:text-primary transition-colors">
                  Lieferanten-Benutzer Übersicht
                </span>
                <Badge variant="secondary" className="ml-2">{stats.totalUsers}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 bg-primary/5">
              <div className="rounded-md border bg-background">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>E-Mail</TableHead>
                      <TableHead>Lieferant</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Rolle</TableHead>
                      <TableHead>Erstellt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts?.flatMap(account => 
                      account.supplier_users.map(user => {
                        const supplier = account.suppliers.find(s => s.id === user.supplier_id);
                        return (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.email}</TableCell>
                            <TableCell>{supplier?.name || '-'}</TableCell>
                            <TableCell className="text-muted-foreground">{account.company_name}</TableCell>
                            <TableCell>
                              <Badge variant={user.role === 'owner' ? 'default' : 'secondary'}>
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {user.created_at ? formatDistanceToNow(new Date(user.created_at), { addSuffix: true, locale }) : '—'}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                    {(!accounts || accounts.flatMap(a => a.supplier_users).length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Keine Lieferanten-Benutzer vorhanden
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>
    </div>
  );
}
