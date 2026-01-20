import { useState, useEffect, useMemo } from 'react';
import { Plus, User, UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useEmployees,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
  Employee,
} from '@/hooks/useEmployees';
import { useHashEmployeePin } from '@/hooks/useHashEmployeePin';
import { useSimpleOrderTokens, useCreateSimpleOrderToken, useUpdateSimpleOrderToken, useDeleteSimpleOrderToken } from '@/hooks/useSimpleOrderTokens';
import { useLocations } from '@/hooks/useLocations';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useAllEmployeeLocations, useUpdateEmployeeLocations } from '@/hooks/useEmployeeLocations';
import { 
  useAllEmployeeLocationSuppliers, 
  useUpdateEmployeeLocationSuppliers,
  LocationSupplierAssignment 
} from '@/hooks/useEmployeeLocationSuppliers';
import { useToast } from '@/hooks/use-toast';
import {
  EmployeeCard,
  EmployeeFormDialog,
  EmployeePinDialog,
  EmployeeDeleteDialog,
  LocationAssignment,
  EmployeeFormData,
  initialFormData,
} from './employees';

export function EmployeesTab() {
  const { toast } = useToast();
  const { data: employees = [], isLoading } = useEmployees();
  const { data: tokens = [], isLoading: isLoadingTokens } = useSimpleOrderTokens();
  const { data: locations = [] } = useLocations();
  const { data: suppliers = [], isLoading: isLoadingSuppliers } = useSuppliers();
  const { data: employeeLocations = [], isLoading: isLoadingEmployeeLocations } = useAllEmployeeLocations();
  const { data: employeeLocationSuppliers = [], isLoading: isLoadingELS } = useAllEmployeeLocationSuppliers();
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();
  const hashEmployeePin = useHashEmployeePin();
  const updateEmployeeLocations = useUpdateEmployeeLocations();
  const updateEmployeeLocationSuppliers = useUpdateEmployeeLocationSuppliers();
  const createToken = useCreateSimpleOrderToken();
  const updateToken = useUpdateSimpleOrderToken();
  const deleteToken = useDeleteSimpleOrderToken();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deleteConfirmEmployee, setDeleteConfirmEmployee] = useState<Employee | null>(null);
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());
  const [isMigratingTokens, setIsMigratingTokens] = useState(false);
  const [hasMigrated, setHasMigrated] = useState(false);
  
  // Advanced settings state
  const [advancedSettingsEnabled, setAdvancedSettingsEnabled] = useState(() => 
    localStorage.getItem('advanced-settings-enabled') === 'true'
  );
  
  // PIN Quick-Edit Dialog
  const [pinDialogEmployee, setPinDialogEmployee] = useState<Employee | null>(null);
  const [pinValue, setPinValue] = useState('');
  const [isSavingPin, setIsSavingPin] = useState(false);

  const [formData, setFormData] = useState<EmployeeFormData>(initialFormData);
  const [locationAssignments, setLocationAssignments] = useState<LocationAssignment[]>([]);

  // Listen for advanced settings changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'advanced-settings-enabled') {
        setAdvancedSettingsEnabled(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const activeSuppliers = useMemo(() => 
    suppliers.filter(s => s.is_active), 
    [suppliers]
  );

  // Auto-migrate: Create missing tokens for employees with assignments but no token
  useEffect(() => {
    const createMissingTokens = async () => {
      if (isLoading || isLoadingTokens || isLoadingSuppliers || isLoadingELS) return;
      if (employees.length === 0 || isMigratingTokens || hasMigrated) return;
      
      const employeesNeedingTokens: { employee: Employee; supplierIds: string[] }[] = [];
      
      for (const employee of employees) {
        const hasToken = tokens.some(t => t.employee_id === employee.id);
        if (hasToken) continue;
        
        const supplierIds = [...new Set(
          employeeLocationSuppliers
            .filter(els => els.employee_id === employee.id)
            .map(els => els.supplier_id)
        )];
        
        if (supplierIds.length > 0) {
          employeesNeedingTokens.push({ employee, supplierIds });
        }
      }
      
      if (employeesNeedingTokens.length === 0) return;
      
      setIsMigratingTokens(true);
      
      try {
        for (const { employee, supplierIds } of employeesNeedingTokens) {
          const supplierNames = supplierIds
            .map(id => suppliers.find(s => s.id === id)?.name)
            .filter(Boolean)
            .join(', ');
          const label = supplierNames || employee.name;
          
          const employeeLocationIds = employeeLocations
            .filter(el => el.employee_id === employee.id)
            .map(el => el.location_id);
          const locationId = employeeLocationIds.length >= 1 ? employeeLocationIds[0] : undefined;
          
          await createToken.mutateAsync({
            label,
            language: 'de',
            is_multi_supplier: supplierIds.length > 1,
            supplier_id: supplierIds.length === 1 ? supplierIds[0] : undefined,
            supplier_ids: supplierIds.length > 1 ? supplierIds : undefined,
            employee_id: employee.id,
            employee_name: employee.name,
            location_id: locationId,
          });
        }
        
        toast({
          title: `${employeesNeedingTokens.length} QR-Code(s) generiert`,
          description: 'Fehlende QR-Codes wurden automatisch erstellt.',
        });
      } catch (error) {
        console.error('Error creating missing tokens:', error);
      } finally {
        setIsMigratingTokens(false);
        setHasMigrated(true);
      }
    };
    
    createMissingTokens();
  }, [employees, tokens, employeeLocationSuppliers, suppliers, isLoading, isLoadingTokens, isLoadingSuppliers, isLoadingELS, isMigratingTokens, hasMigrated]);

  const initializeLocationAssignments = (employeeId?: string) => {
    const assignments: LocationAssignment[] = locations.map(location => {
      if (employeeId) {
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
        return {
          locationId: location.id,
          enabled: true,
          supplierIds: activeSuppliers.map(s => s.id),
        };
      }
    });
    setLocationAssignments(assignments);
    const enabledLocationIds = new Set(
      assignments.filter(a => a.enabled).map(a => a.locationId)
    );
    setExpandedLocations(enabledLocationIds);
  };

  const openCreateDialog = () => {
    setEditingEmployee(null);
    setFormData(initialFormData);
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
      language: employee.language || 'de',
      autoApprove: employee.auto_approve_orders || false,
      pinCode: '',
      voiceInputEnabled: employee.voice_input_enabled || false,
      canAddFreeItems: employee.can_add_free_items || false,
      canCapturePhotos: employee.can_capture_photos || false,
      wineCatalogAccess: (employee.wine_catalog_access as 'none' | 'view' | 'edit') || 'none',
    });
    initializeLocationAssignments(employee.id);
    setIsDialogOpen(true);
  };

  const getTokenForEmployee = (employeeId: string) => {
    return tokens.find(t => t.employee_id === employeeId);
  };

  const getOrderUrl = (token: string) => {
    return `https://bestellung.pro/simple-order/${token}`;
  };

  const copyToClipboard = (token: string) => {
    navigator.clipboard.writeText(getOrderUrl(token));
    toast({
      title: 'Link kopiert',
      description: 'Der Bestelllink wurde in die Zwischenablage kopiert.',
    });
  };

  const openWhatsApp = (employee: Employee, token: string) => {
    if (!employee.phone) return;
    const url = getOrderUrl(token);
    const message = encodeURIComponent(`Hallo ${employee.name}, hier ist dein Bestelllink: ${url}`);
    const phone = employee.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const generateQrCodeUrl = (token: string) => {
    const url = encodeURIComponent(getOrderUrl(token));
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${url}`;
  };

  // PIN Quick-Edit handlers
  const openPinDialog = (employee: Employee) => {
    setPinDialogEmployee(employee);
    setPinValue('');
  };

  const closePinDialog = () => {
    setPinDialogEmployee(null);
    setPinValue('');
  };

  const handleSavePin = async () => {
    if (!pinDialogEmployee) return;
    
    setIsSavingPin(true);
    try {
      await hashEmployeePin.mutateAsync({
        employeeId: pinDialogEmployee.id,
        pin: pinValue.length === 4 ? pinValue : null,
      });
      toast({
        title: pinValue.length === 4 ? 'PIN gespeichert' : 'PIN entfernt',
        description: pinValue.length === 4 
          ? `PIN für ${pinDialogEmployee.name} wurde gesetzt.`
          : `PIN für ${pinDialogEmployee.name} wurde entfernt.`,
      });
      closePinDialog();
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'PIN konnte nicht gespeichert werden.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingPin(false);
    }
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

    const allSupplierIds = [...new Set(supplierAssignments.flatMap(a => a.supplierIds))];

    if (editingEmployee) {
      const hasNewPin = formData.pinCode && formData.pinCode.length === 4;
      const pinChanged = hasNewPin;
      
      await updateEmployee.mutateAsync({
        id: editingEmployee.id,
        name: formData.name,
        phone: formData.phone || null,
        email: formData.email || null,
        notes: formData.notes || null,
        auto_approve_orders: formData.autoApprove,
        voice_input_enabled: formData.voiceInputEnabled,
        can_add_free_items: formData.canAddFreeItems,
        can_capture_photos: formData.canCapturePhotos,
        wine_catalog_access: formData.wineCatalogAccess,
        language: formData.language,
      });
      
      if (pinChanged) {
        await hashEmployeePin.mutateAsync({
          employeeId: editingEmployee.id,
          pin: hasNewPin ? formData.pinCode : null,
        });
      }
      
      await updateEmployeeLocations.mutateAsync({
        employeeId: editingEmployee.id,
        locationIds: enabledLocationIds,
      });
      await updateEmployeeLocationSuppliers.mutateAsync({
        employeeId: editingEmployee.id,
        assignments: supplierAssignments,
      });

      const existingToken = getTokenForEmployee(editingEmployee.id);
      if (allSupplierIds.length > 0) {
        const label = formData.name;

        if (existingToken) {
          await updateToken.mutateAsync({
            id: existingToken.id,
            label,
            language: formData.language,
            is_multi_supplier: allSupplierIds.length > 1,
            supplier_id: allSupplierIds.length === 1 ? allSupplierIds[0] : null,
            supplier_ids: allSupplierIds.length > 1 ? allSupplierIds : [],
            employee_id: editingEmployee.id,
          });
        } else {
          await createToken.mutateAsync({
            label,
            language: formData.language,
            is_multi_supplier: allSupplierIds.length > 1,
            supplier_id: allSupplierIds.length === 1 ? allSupplierIds[0] : undefined,
            supplier_ids: allSupplierIds.length > 1 ? allSupplierIds : undefined,
            employee_id: editingEmployee.id,
          });
        }
      } else if (existingToken) {
        await deleteToken.mutateAsync(existingToken.id);
      }
    } else {
      const newEmployee = await createEmployee.mutateAsync({
        name: formData.name,
        phone: formData.phone || null,
        email: formData.email || null,
        notes: formData.notes || null,
        voice_input_enabled: formData.voiceInputEnabled,
        language: formData.language,
      });
      if (newEmployee?.id) {
        await updateEmployeeLocations.mutateAsync({
          employeeId: newEmployee.id,
          locationIds: enabledLocationIds,
        });
        await updateEmployeeLocationSuppliers.mutateAsync({
          employeeId: newEmployee.id,
          assignments: supplierAssignments,
        });

        if (allSupplierIds.length > 0) {
          const label = formData.name;

          await createToken.mutateAsync({
            label,
            language: formData.language,
            is_multi_supplier: allSupplierIds.length > 1,
            supplier_id: allSupplierIds.length === 1 ? allSupplierIds[0] : undefined,
            supplier_ids: allSupplierIds.length > 1 ? allSupplierIds : undefined,
            employee_id: newEmployee.id,
          });
        }
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
      const token = getTokenForEmployee(deleteConfirmEmployee.id);
      if (token) {
        await deleteToken.mutateAsync(token.id);
      }
      await deleteEmployee.mutateAsync(deleteConfirmEmployee.id);
      setDeleteConfirmEmployee(null);
    }
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
          supplierIds: newEnabled ? activeSuppliers.map(s => s.id) : [],
        };
      }
      return a;
    }));
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

  if (isLoading || isLoadingTokens || isLoadingEmployeeLocations || isLoadingELS || isLoadingSuppliers) {
    return <div className="p-4 text-muted-foreground">Laden...</div>;
  }

  const activeEmployees = employees.filter(e => e.is_active);
  const inactiveEmployees = employees.filter(e => !e.is_active);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-medium">Bestellberechtigte Mitarbeiter</h3>
          <p className="text-sm text-muted-foreground">
            Verwalte Mitarbeiter und ihre Easy Order Zugänge
          </p>
        </div>
        <Button onClick={openCreateDialog} size="sm" className="w-full sm:w-auto">
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
            Füge Mitarbeiter hinzu, um ihnen Easy Order Zugänge zu erstellen
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {employees.map((employee) => {
            const token = getTokenForEmployee(employee.id);
            const locationSuppliersInfo = getEmployeeLocationSuppliersInfo(employee.id);
            
            return (
              <EmployeeCard
                key={employee.id}
                employee={employee}
                token={token}
                locationSuppliersInfo={locationSuppliersInfo}
                advancedSettingsEnabled={advancedSettingsEnabled}
                onEdit={openEditDialog}
                onDelete={setDeleteConfirmEmployee}
                onToggleActive={handleToggleActive}
                onOpenPinDialog={openPinDialog}
                onCopyLink={copyToClipboard}
                onOpenWhatsApp={openWhatsApp}
                getOrderUrl={getOrderUrl}
                generateQrCodeUrl={generateQrCodeUrl}
              />
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <EmployeeFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingEmployee={editingEmployee}
        formData={formData}
        setFormData={setFormData}
        locationAssignments={locationAssignments}
        expandedLocations={expandedLocations}
        locations={locations}
        activeSuppliers={activeSuppliers}
        onSubmit={handleSubmit}
        isSubmitting={createEmployee.isPending || updateEmployee.isPending}
        onToggleLocation={toggleLocation}
        onToggleSupplierForLocation={toggleSupplierForLocation}
        onSelectAllSuppliers={selectAllSuppliersForLocation}
        onDeselectAllSuppliers={deselectAllSuppliersForLocation}
        onToggleExpandLocation={toggleExpandLocation}
      />

      {/* Delete Confirmation */}
      <EmployeeDeleteDialog
        employee={deleteConfirmEmployee}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmEmployee(null)}
      />

      {/* PIN Quick-Edit Dialog */}
      <EmployeePinDialog
        employee={pinDialogEmployee}
        pinValue={pinValue}
        setPinValue={setPinValue}
        isSaving={isSavingPin}
        onSave={handleSavePin}
        onClose={closePinDialog}
      />
    </div>
  );
}
