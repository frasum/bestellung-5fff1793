import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, X, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

type Role = 'admin' | 'manager' | 'purchaser' | 'viewer';

interface Permission {
  key: string;
  category: string;
}

const PERMISSIONS: Permission[] = [
  // Suppliers
  { key: 'suppliers.view', category: 'suppliers' },
  { key: 'suppliers.create', category: 'suppliers' },
  { key: 'suppliers.edit', category: 'suppliers' },
  { key: 'suppliers.delete', category: 'suppliers' },
  // Articles
  { key: 'articles.view', category: 'articles' },
  { key: 'articles.create', category: 'articles' },
  { key: 'articles.edit', category: 'articles' },
  { key: 'articles.delete', category: 'articles' },
  // Orders
  { key: 'orders.view', category: 'orders' },
  { key: 'orders.place', category: 'orders' },
  { key: 'orders.deleteTest', category: 'orders' },
  // Team
  { key: 'team.invite', category: 'team' },
  { key: 'team.changeRoles', category: 'team' },
  { key: 'team.remove', category: 'team' },
  // Settings
  { key: 'settings.editOrg', category: 'settings' },
  { key: 'settings.manageLocations', category: 'settings' },
  { key: 'settings.editTemplates', category: 'settings' },
  // Employee Orders
  { key: 'staffOrders.submit', category: 'staffOrders' },
  { key: 'staffOrders.approve', category: 'staffOrders' },
  // Inventory
  { key: 'inventory.view', category: 'inventory' },
  { key: 'inventory.manage', category: 'inventory' },
  // Supplier Changes
  { key: 'supplierChanges.review', category: 'supplierChanges' },
];

const PERMISSION_MATRIX: Record<string, Record<Role, boolean>> = {
  // Suppliers
  'suppliers.view': { admin: true, manager: true, purchaser: true, viewer: true },
  'suppliers.create': { admin: true, manager: true, purchaser: false, viewer: false },
  'suppliers.edit': { admin: true, manager: true, purchaser: false, viewer: false },
  'suppliers.delete': { admin: true, manager: false, purchaser: false, viewer: false },
  // Articles
  'articles.view': { admin: true, manager: true, purchaser: true, viewer: true },
  'articles.create': { admin: true, manager: true, purchaser: false, viewer: false },
  'articles.edit': { admin: true, manager: true, purchaser: false, viewer: false },
  'articles.delete': { admin: true, manager: false, purchaser: false, viewer: false },
  // Orders
  'orders.view': { admin: true, manager: true, purchaser: true, viewer: true },
  'orders.place': { admin: true, manager: true, purchaser: true, viewer: false },
  'orders.deleteTest': { admin: true, manager: true, purchaser: false, viewer: false },
  // Team
  'team.invite': { admin: true, manager: false, purchaser: false, viewer: false },
  'team.changeRoles': { admin: true, manager: false, purchaser: false, viewer: false },
  'team.remove': { admin: true, manager: false, purchaser: false, viewer: false },
  // Settings
  'settings.editOrg': { admin: true, manager: false, purchaser: false, viewer: false },
  'settings.manageLocations': { admin: true, manager: true, purchaser: false, viewer: false },
  'settings.editTemplates': { admin: true, manager: true, purchaser: false, viewer: false },
  // Employee Orders
  'staffOrders.submit': { admin: true, manager: true, purchaser: true, viewer: false },
  'staffOrders.approve': { admin: true, manager: true, purchaser: false, viewer: false },
  // Inventory
  'inventory.view': { admin: true, manager: true, purchaser: true, viewer: true },
  'inventory.manage': { admin: true, manager: true, purchaser: true, viewer: false },
  // Supplier Changes
  'supplierChanges.review': { admin: true, manager: true, purchaser: false, viewer: false },
};

const ROLES: Role[] = ['admin', 'manager', 'purchaser', 'viewer'];

export const PermissionsOverview = () => {
  const { t } = useTranslation();

  const categories = [...new Set(PERMISSIONS.map((p) => p.category))];

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      suppliers: t('settings.permissions.categories.suppliers'),
      articles: t('settings.permissions.categories.articles'),
      orders: t('settings.permissions.categories.orders'),
      team: t('settings.permissions.categories.team'),
      settings: t('settings.permissions.categories.settings'),
      staffOrders: t('settings.permissions.categories.staffOrders'),
      inventory: t('settings.permissions.categories.inventory'),
      supplierChanges: t('settings.permissions.categories.supplierChanges'),
    };
    return labels[category] || category;
  };

  const getPermissionLabel = (key: string) => {
    return t(`settings.permissions.${key}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          {t('settings.permissions.title')}
        </CardTitle>
        <CardDescription>{t('settings.permissions.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto -mx-6 px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">{t('settings.permissions.permission')}</TableHead>
                {ROLES.map((role) => (
                  <TableHead key={role} className="text-center w-[100px]">
                    {t(`settings.roles.${role}`)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <>
                  <TableRow key={`category-${category}`} className="bg-muted/50">
                    <TableCell colSpan={5} className="font-semibold text-sm py-2">
                      {getCategoryLabel(category)}
                    </TableCell>
                  </TableRow>
                  {PERMISSIONS.filter((p) => p.category === category).map((permission) => (
                    <TableRow key={permission.key}>
                      <TableCell className="text-sm pl-6">
                        {getPermissionLabel(permission.key)}
                      </TableCell>
                      {ROLES.map((role) => {
                        const hasPermission = PERMISSION_MATRIX[permission.key]?.[role] ?? false;
                        return (
                          <TableCell key={role} className="text-center">
                            {hasPermission ? (
                              <Check className={cn("h-5 w-5 mx-auto text-green-600 dark:text-green-400")} />
                            ) : (
                              <X className={cn("h-5 w-5 mx-auto text-muted-foreground/40")} />
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
