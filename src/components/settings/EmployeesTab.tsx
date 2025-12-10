import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Phone, Mail, User, UserCheck, UserX, MapPin, ChevronDown, ChevronRight, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
  useEmployees,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
  Employee,
} from '@/hooks/useEmployees';
import { useSimpleOrderTokens } from '@/hooks/useSimpleOrderTokens';
import { useLocations } from '@/hooks/useLocations';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useAllEmployeeLocations, useUpdateEmployeeLocations } from '@/hooks/useEmployeeLocations';
import { 
  useAllEmployeeLocationSuppliers, 
  useUpdateEmployeeLocationSuppliers,
  LocationSupplierAssignment 
} from '@/hooks/useEmployeeLocationSuppliers';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LocationAssignment {
  locationId: string;
  enabled: boolean;
  supplierIds: string[];
}

export function EmployeesTab() {
  const { t } = useTranslation();
  const { data: employees = [], isLoading } = useEmployees();
  const { data: tokens = [] } = useSimpleOrderTokens();
  const { data: locations = [] } = useLocations();
  const { data: suppliers = [] } = useSuppliers();
  const { data: employeeLocations = [] } = useAllEmployeeLocations();
  const { data: employeeLocationSuppliers = [] } = useAllEmployeeLocationSuppliers();
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();
  const updateEmployeeLocations = useUpdateEmployeeLocations();
  const updateEmployeeLocationSuppliers = useUpdateEmployeeLocationSuppliers();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deleteConfirmEmployee, setDeleteConfirmEmployee] = useState<Employee | null>(null);
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });
  
  // New structure: location -> suppliers mapping
  const [locationAssignments, setLocationAssignments] = useState<LocationAssignment[]>([]);

  const activeSuppliers = useMemo(() => 
    suppliers.filter(s => s.is_active), 
    [suppliers]
  );

  const initializeLocationAssignments = (employeeId?: string) => {
    const assignments: LocationAssignment[] = locations.map(location => {
      if (employeeId) {
        // Load existing assignments for this employee
        const isLocationEnabled = employeeLocations.some(
          el => el.employee_id === employeeId && el.location_id === location.id
        );
        const assignedSupplierIds = employeeLocationSuppliers
          .filter(els => els.employee_id === employeeId && els.location_id === location.id)
          .map(els => els.supplier_id);
        
        return {
          locationId: location.id,
          enabled: isLocationEnabled,
          supplierIds: assignedSupplierIds,
        };
      } else {
        // New employee: all locations with all suppliers by default
        return {
          locationId: location.id,
          enabled: true,
          supplierIds: activeSuppliers.map(s => s.id),
        };
      }
    });
    setLocationAssignments(assignments);
    // Expand all enabled locations
    const enabledLocationIds = new Set(
      assignments.filter(a => a.enabled).map(a => a.locationId)
    );
    setExpandedLocations(enabledLocationIds);
  };

  const openCreateDialog = () => {
    setEditingEmployee(null);
    setFormData({ name: '', phone: '', email: '', notes: '' });
    initializeLocationAssignments();
    setIsDialogOpen(true);
  };

  const openEditDialog = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      phone: employee.phone || '',
      email: employee.email || '',
      notes: employee.notes || '',
    });
    initializeLocationAssignments(employee.id);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    const enabledLocationIds = locationAssignments
      .filter(a => a.enabled)
      .map(a => a.locationId);
    
    const supplierAssignments: LocationSupplierAssignment[] = locationAssignments
      .filter(a => a.enabled && a.supplierIds.length > 0)
      .map(a => ({
        locationId: a.locationId,
        supplierIds: a.supplierIds,
      }));

    if (editingEmployee) {
      await updateEmployee.mutateAsync({
        id: editingEmployee.id,
        name: formData.name,
        phone: formData.phone || null,
        email: formData.email || null,
        notes: formData.notes || null,
      });
      // Update locations
      await updateEmployeeLocations.mutateAsync({
        employeeId: editingEmployee.id,
        locationIds: enabledLocationIds,
      });
      // Update location-supplier assignments
      await updateEmployeeLocationSuppliers.mutateAsync({
        employeeId: editingEmployee.id,
        assignments: supplierAssignments,
      });
    } else {
      const newEmployee = await createEmployee.mutateAsync({
        name: formData.name,
        phone: formData.phone || null,
        email: formData.email || null,
        notes: formData.notes || null,
      });
      // Assign locations to new employee
      if (newEmployee?.id) {
        await updateEmployeeLocations.mutateAsync({
          employeeId: newEmployee.id,
          locationIds: enabledLocationIds,
        });
        await updateEmployeeLocationSuppliers.mutateAsync({
          employeeId: newEmployee.id,
          assignments: supplierAssignments,
        });
      }
    }
    setIsDialogOpen(false);
  };

  const handleToggleActive = async (employee: Employee) => {
    await updateEmployee.mutateAsync({
      id: employee.id,
      is_active: !employee.is_active,
    });
  };

  const handleDelete = async () => {
    if (deleteConfirmEmployee) {
      await deleteEmployee.mutateAsync(deleteConfirmEmployee.id);
      setDeleteConfirmEmployee(null);
    }
  };

  const getTokenCountForEmployee = (employeeId: string) => {
    return tokens.filter(t => {
      const tokenEmployeeId = (t as any).employee_id || (t as any).employee?.id;
      return tokenEmployeeId === employeeId;
    }).length;
  };

  const getEmployeeLocationSuppliersInfo = (employeeId: string) => {
    const assignedLocationIds = employeeLocations
      .filter(el => el.employee_id === employeeId)
      .map(el => el.location_id);
    
    return locations
      .filter(l => assignedLocationIds.includes(l.id))
      .map(location => {
        const supplierIds = employeeLocationSuppliers
          .filter(els => els.employee_id === employeeId && els.location_id === location.id)
          .map(els => els.supplier_id);
        const supplierNames = suppliers
          .filter(s => supplierIds.includes(s.id))
          .map(s => s.name);
        return {
          locationName: location.short_code || location.name,
          supplierNames,
        };
      });
  };

  // Location assignment handlers
  const toggleLocation = (locationId: string) => {
    setLocationAssignments(prev => prev.map(a => {
      if (a.locationId === locationId) {
        const newEnabled = !a.enabled;
        return {
          ...a,
          enabled: newEnabled,
          // When enabling, select all suppliers by default
          supplierIds: newEnabled ? activeSuppliers.map(s => s.id) : [],
        };
      }
      return a;
    }));
    // Toggle expansion when enabling
    setExpandedLocations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(locationId)) {
        newSet.delete(locationId);
      } else {
        newSet.add(locationId);
      }
      return newSet;
    });
  };

  const toggleSupplierForLocation = (locationId: string, supplierId: string) => {
    setLocationAssignments(prev => prev.map(a => {
      if (a.locationId === locationId) {
        const hasSupplier = a.supplierIds.includes(supplierId);
        return {
          ...a,
          supplierIds: hasSupplier
            ? a.supplierIds.filter(id => id !== supplierId)
            : [...a.supplierIds, supplierId],
        };
      }
      return a;
    }));
  };

  const selectAllSuppliersForLocation = (locationId: string) => {
    setLocationAssignments(prev => prev.map(a => {
      if (a.locationId === locationId) {
        return { ...a, supplierIds: activeSuppliers.map(s => s.id) };
      }
      return a;
    }));
  };

  const deselectAllSuppliersForLocation = (locationId: string) => {
    setLocationAssignments(prev => prev.map(a => {
      if (a.locationId === locationId) {
        return { ...a, supplierIds: [] };
      }
      return a;
    }));
  };

  const toggleExpandLocation = (locationId: string) => {
    setExpandedLocations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(locationId)) {
        newSet.delete(locationId);
      } else {
        newSet.add(locationId);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return <div className="p-4 text-muted-foreground">Laden...</div>;
  }

  const activeEmployees = employees.filter(e => e.is_active);
  const inactiveEmployees = employees.filter(e => !e.is_active);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Bestellberechtigte Mitarbeiter</h3>
          <p className="text-sm text-muted-foreground">
            Verwalte Mitarbeiter, die über Easy Order bestellen dürfen
          </p>
        </div>
        <Button onClick={openCreateDialog} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Mitarbeiter hinzufügen
        </Button>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-green-500" />
          <span>{activeEmployees.length} aktiv</span>
        </div>
        <div className="flex items-center gap-2">
          <UserX className="h-4 w-4 text-muted-foreground" />
          <span>{inactiveEmployees.length} inaktiv</span>
        </div>
      </div>

      {/* Employee List */}
      {employees.length === 0 ? (
        <div className="border border-dashed rounded-lg p-8 text-center text-muted-foreground">
          <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Noch keine Mitarbeiter angelegt</p>
          <p className="text-sm mt-1">
            Füge Mitarbeiter hinzu, um ihnen Easy Order Links zuzuweisen
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {employees.map((employee) => {
            const tokenCount = getTokenCountForEmployee(employee.id);
            const locationSuppliersInfo = getEmployeeLocationSuppliersInfo(employee.id);
            return (
              <div
                key={employee.id}
                className={`border rounded-lg p-4 ${
                  !employee.is_active ? 'opacity-60 bg-muted/30' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{employee.name}</span>
                      {!employee.is_active && (
                        <Badge variant="secondary">Inaktiv</Badge>
                      )}
                      {tokenCount > 0 && (
                        <Badge variant="outline">
                          {tokenCount} {tokenCount === 1 ? 'Link' : 'Links'}
                        </Badge>
                      )}
                    </div>
                    {/* Location + Suppliers badges */}
                    {locationSuppliersInfo.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {locationSuppliersInfo.map((info, idx) => (
                          <div key={idx} className="flex items-center gap-1 flex-wrap text-sm">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium text-muted-foreground">{info.locationName}:</span>
                            {info.supplierNames.length > 0 ? (
                              info.supplierNames.map((name, sIdx) => (
                                <Badge key={sIdx} variant="secondary" className="text-xs">
                                  {name}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-amber-600">Keine Lieferanten</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                      {employee.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span>{employee.phone}</span>
                        </div>
                      )}
                      {employee.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span>{employee.email}</span>
                        </div>
                      )}
                    </div>
                    {employee.notes && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {employee.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={employee.is_active}
                      onCheckedChange={() => handleToggleActive(employee)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(employee)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteConfirmEmployee(employee)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg !flex !flex-col !h-[85vh] !p-0 !gap-0">
          <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
            <DialogTitle>
              {editingEmployee ? 'Mitarbeiter bearbeiten' : 'Neuen Mitarbeiter anlegen'}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto min-h-0 px-6" style={{ maxHeight: 'calc(85vh - 140px)' }}>
            <div className="space-y-4 pb-6">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="z.B. Somchai"
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+49 151 12345678"
                />
              </div>
              <div>
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="mitarbeiter@example.com"
                />
              </div>

              {/* Location + Supplier Assignment */}
              {locations.length > 0 && (
                <div>
                  <Label className="mb-2 block">Standorte & Lieferanten</Label>
                  <div className="border rounded-lg divide-y">
                    {locations.map((location) => {
                      const assignment = locationAssignments.find(a => a.locationId === location.id);
                      const isEnabled = assignment?.enabled ?? false;
                      const isExpanded = expandedLocations.has(location.id);
                      const selectedCount = assignment?.supplierIds.length ?? 0;

                      return (
                        <div key={location.id} className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={`location-${location.id}`}
                                checked={isEnabled}
                                onCheckedChange={() => toggleLocation(location.id)}
                              />
                              <label
                                htmlFor={`location-${location.id}`}
                                className="text-sm font-medium cursor-pointer"
                              >
                                {location.name}
                                {location.short_code && (
                                  <span className="text-muted-foreground ml-1">
                                    ({location.short_code})
                                  </span>
                                )}
                              </label>
                              {isEnabled && (
                                <Badge variant="secondary" className="text-xs">
                                  {selectedCount}/{activeSuppliers.length}
                                </Badge>
                              )}
                            </div>
                            {isEnabled && activeSuppliers.length > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleExpandLocation(location.id)}
                                className="h-7 w-7 p-0"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>

                          {isEnabled && isExpanded && activeSuppliers.length > 0 && (
                            <div className="mt-3 ml-6 space-y-2">
                              <div className="flex gap-2 mb-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => selectAllSuppliersForLocation(location.id)}
                                  className="text-xs h-6"
                                >
                                  Alle
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deselectAllSuppliersForLocation(location.id)}
                                  className="text-xs h-6"
                                >
                                  Keine
                                </Button>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {activeSuppliers.map((supplier) => (
                                  <div key={supplier.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`supplier-${location.id}-${supplier.id}`}
                                      checked={assignment?.supplierIds.includes(supplier.id) ?? false}
                                      onCheckedChange={() => toggleSupplierForLocation(location.id, supplier.id)}
                                    />
                                    <label
                                      htmlFor={`supplier-${location.id}-${supplier.id}`}
                                      className="text-xs cursor-pointer truncate"
                                    >
                                      {supplier.name}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {locationAssignments.every(a => !a.enabled) && (
                    <p className="text-xs text-amber-600 mt-1">
                      Ohne Standortzuweisung kann der Mitarbeiter keine Bestellungen aufgeben
                    </p>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="notes">Notizen</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="z.B. Küche, nur vormittags erreichbar"
                  rows={2}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 px-6 pb-6 pt-4 border-t bg-background">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name.trim() || createEmployee.isPending || updateEmployee.isPending}
            >
              {editingEmployee ? 'Speichern' : 'Anlegen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteConfirmEmployee}
        onOpenChange={() => setDeleteConfirmEmployee(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mitarbeiter löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirmEmployee?.name} wird gelöscht. Zugewiesene Easy Order Links
              bleiben bestehen, verlieren aber die Mitarbeiter-Zuordnung.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Löschen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
