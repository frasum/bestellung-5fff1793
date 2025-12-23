import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Building2, Users, MapPin, Store, Search, Trash2, ArrowRightLeft, 
  Crown, Gift, FlaskConical, Loader2, Mail, Shield
} from 'lucide-react';
import { 
  useSuperAdminOrganizations, 
  useSuperAdminStats, 
  useDeleteOrganization, 
  useMoveUserToOrganization,
  OrganizationOverview,
  OrganizationUser
} from '@/hooks/useSuperAdminOrganizations';

type FilterType = 'all' | 'demo' | 'sponsored' | 'enterprise' | 'free';

export function OrganizationsOverviewTab() {
  const { t } = useTranslation();
  const { data: organizations, isLoading } = useSuperAdminOrganizations();
  const stats = useSuperAdminStats();
  const deleteOrganization = useDeleteOrganization();
  const moveUser = useMoveUserToOrganization();

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ user: OrganizationUser; fromOrg: OrganizationOverview } | null>(null);
  const [targetOrgId, setTargetOrgId] = useState('');

  const filteredOrganizations = useMemo(() => {
    if (!organizations) return [];

    return organizations.filter(org => {
      // Apply search filter
      const matchesSearch = 
        org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.users.some(u => 
          u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
        );

      // Apply category filter
      let matchesFilter = true;
      switch (filter) {
        case 'demo':
          matchesFilter = org.is_demo === true;
          break;
        case 'sponsored':
          matchesFilter = org.is_sponsored === true;
          break;
        case 'enterprise':
          matchesFilter = org.subscription_tier === 'enterprise';
          break;
        case 'free':
          matchesFilter = org.subscription_tier === 'free';
          break;
      }

      return matchesSearch && matchesFilter;
    });
  }, [organizations, searchQuery, filter]);

  const handleMoveUser = (user: OrganizationUser, fromOrg: OrganizationOverview) => {
    setSelectedUser({ user, fromOrg });
    setTargetOrgId('');
    setMoveDialogOpen(true);
  };

  const confirmMoveUser = () => {
    if (selectedUser && targetOrgId) {
      moveUser.mutate({ userId: selectedUser.user.id, targetOrgId });
      setMoveDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const handleDeleteOrganization = (orgId: string) => {
    deleteOrganization.mutate(orgId);
  };

  const getTierBadge = (org: OrganizationOverview) => {
    if (org.is_demo) {
      return <Badge variant="outline" className="gap-1"><FlaskConical className="h-3 w-3" /> Demo</Badge>;
    }
    if (org.is_sponsored) {
      return <Badge variant="secondary" className="gap-1"><Gift className="h-3 w-3" /> Sponsored</Badge>;
    }
    if (org.subscription_tier === 'enterprise') {
      return <Badge className="gap-1 bg-amber-500"><Crown className="h-3 w-3" /> Enterprise</Badge>;
    }
    return <Badge variant="outline">Free</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organisationen</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrganizations}</div>
            <p className="text-xs text-muted-foreground">
              {stats.enterpriseOrganizations} Enterprise, {stats.demoOrganizations} Demo
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Benutzer</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Registrierte Benutzer
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Standorte</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLocations}</div>
            <p className="text-xs text-muted-foreground">
              Aktive Standorte
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lieferanten</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSuppliers}</div>
            <p className="text-xs text-muted-foreground">
              Konfigurierte Lieferanten
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organisations-Übersicht
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Suche nach Organisation, E-Mail oder Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="demo">Demo</SelectItem>
                <SelectItem value="sponsored">Sponsored</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Organizations Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Organisation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Benutzer</TableHead>
                  <TableHead className="text-center">Standorte</TableHead>
                  <TableHead className="text-center">Lieferanten</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrganizations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Keine Organisationen gefunden
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrganizations.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell>
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value={org.id} className="border-0">
                            <AccordionTrigger className="py-0 hover:no-underline">
                              <span className="font-medium text-left">{org.name}</span>
                            </AccordionTrigger>
                            <AccordionContent className="pt-3 space-y-3">
                              {/* Users Section */}
                              {org.users.length > 0 && (
                                <div>
                                  <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                                    <Users className="h-3 w-3" /> Benutzer
                                  </h4>
                                  <div className="space-y-1">
                                    {org.users.map((user) => (
                                      <div key={user.id} className="flex items-center justify-between text-sm bg-muted/50 rounded px-2 py-1">
                                        <div className="flex items-center gap-2">
                                          <Mail className="h-3 w-3 text-muted-foreground" />
                                          <span>{user.email}</span>
                                          {user.role && (
                                            <Badge variant="outline" className="text-xs gap-1">
                                              <Shield className="h-2.5 w-2.5" />
                                              {user.role}
                                            </Badge>
                                          )}
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 px-2"
                                          onClick={() => handleMoveUser(user, org)}
                                        >
                                          <ArrowRightLeft className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Locations Section */}
                              {org.locations.length > 0 && (
                                <div>
                                  <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                                    <MapPin className="h-3 w-3" /> Standorte
                                  </h4>
                                  <div className="flex flex-wrap gap-1">
                                    {org.locations.map((loc) => (
                                      <Badge key={loc.id} variant="secondary" className="text-xs">
                                        {loc.name}
                                        {loc.short_code && <span className="ml-1 text-muted-foreground">({loc.short_code})</span>}
                                        {loc.is_default && <span className="ml-1">⭐</span>}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Suppliers Section */}
                              {org.suppliers.length > 0 && (
                                <div>
                                  <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                                    <Store className="h-3 w-3" /> Lieferanten
                                  </h4>
                                  <div className="flex flex-wrap gap-1">
                                    {org.suppliers.map((supplier) => (
                                      <Badge 
                                        key={supplier.id} 
                                        variant={supplier.is_active ? "secondary" : "outline"}
                                        className="text-xs"
                                      >
                                        {supplier.name}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </TableCell>
                      <TableCell>{getTierBadge(org)}</TableCell>
                      <TableCell className="text-center">{org.users.length}</TableCell>
                      <TableCell className="text-center">{org.locations.length}</TableCell>
                      <TableCell className="text-center">{org.suppliers.length}</TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              disabled={org.users.length > 0 || deleteOrganization.isPending}
                            >
                              {deleteOrganization.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Organisation löschen?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Möchten Sie die Organisation "{org.name}" wirklich löschen? 
                                Diese Aktion kann nicht rückgängig gemacht werden.
                                Alle zugehörigen Standorte und Lieferanten werden ebenfalls gelöscht.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteOrganization(org.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Löschen
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Move User Dialog */}
      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Benutzer verschieben</DialogTitle>
            <DialogDescription>
              Verschieben Sie "{selectedUser?.user.email}" von "{selectedUser?.fromOrg.name}" zu einer anderen Organisation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={targetOrgId} onValueChange={setTargetOrgId}>
              <SelectTrigger>
                <SelectValue placeholder="Ziel-Organisation auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {organizations
                  ?.filter(org => org.id !== selectedUser?.fromOrg.id)
                  .map(org => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name} ({org.subscription_tier})
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button 
              onClick={confirmMoveUser} 
              disabled={!targetOrgId || moveUser.isPending}
            >
              {moveUser.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verschieben
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
