import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Phone, Mail, User, UserCheck, UserX, MapPin, ChevronDown, ChevronRight, Package, Copy, MessageCircle, ExternalLink, QrCode, Zap, KeyRound, Shield, ShieldAlert, Mic } from 'lucide-react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

const LANGUAGES = [
  { code: 'th', name: 'ไทย (Thai)' },
  { code: 'de', name: 'Deutsch' },
  { code: 'en', name: 'English' },
  { code: 'vi', name: 'Tiếng Việt' },
];

interface LocationAssignment {
  locationId: string;
  enabled: boolean;
  supplierIds: string[];
}

export function EmployeesTab() {
  const { t } = useTranslation();
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
  
  // PIN Quick-Edit Dialog
  const [pinDialogEmployee, setPinDialogEmployee] = useState<Employee | null>(null);
  const [pinValue, setPinValue] = useState('');
  const [isSavingPin, setIsSavingPin] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
    language: 'th',
    autoApprove: false,
    pinCode: '',
    voiceInputEnabled: false,
    canAddFreeItems: false,
  });
  
  // New structure: location -> suppliers mapping
  const [locationAssignments, setLocationAssignments] = useState<LocationAssignment[]>([]);

  // Auto-migrate: Create missing tokens for employees with assignments but no token
  useEffect(() => {
    const createMissingTokens = async () => {
      // Wait until ALL data is fully loaded
      if (isLoading || isLoadingTokens || isLoadingSuppliers || isLoadingELS) return;
      if (employees.length === 0 || isMigratingTokens || hasMigrated) return;
      
      const employeesNeedingTokens: { employee: Employee; supplierIds: string[] }[] = [];
      
      for (const employee of employees) {
        const hasToken = tokens.some(t => t.employee_id === employee.id);
        if (hasToken) continue;
        
        // Get supplier IDs from employee's location-supplier assignments
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
          
          // Find location for this employee (use first if multiple)
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
    setFormData({ name: '', phone: '', email: '', notes: '', language: 'th', autoApprove: false, pinCode: '', voiceInputEnabled: false, canAddFreeItems: false });
    initializeLocationAssignments();
    setIsDialogOpen(true);
  };

  const openEditDialog = (employee: Employee) => {
    setEditingEmployee(employee);
    // Get existing token language if available
    const existingToken = getTokenForEmployee(employee.id);
    setFormData({
      name: employee.name,
      phone: employee.phone || '',
      email: employee.email || '',
      notes: employee.notes || '',
      language: existingToken?.language || 'th',
      autoApprove: employee.auto_approve_orders || false,
      // Don't pre-populate PIN - it's now hashed and not readable
      // User can enter a new PIN or leave empty to keep existing
      pinCode: '',
      voiceInputEnabled: employee.voice_input_enabled || false,
      canAddFreeItems: employee.can_add_free_items || false,
    });
    initializeLocationAssignments(employee.id);
    setIsDialogOpen(true);
  };

  // Get or create token for employee
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
    // Don't pre-populate - PIN is now hashed and not readable
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
      // Use the secure hash function to store PIN
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

  const generateRandomPin = () => {
    const randomPin = String(Math.floor(1000 + Math.random() * 9000));
    setPinValue(randomPin);
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

    // Get all unique supplier IDs across all locations
    const allSupplierIds = [...new Set(supplierAssignments.flatMap(a => a.supplierIds))];

    if (editingEmployee) {
      // Check if PIN changed (comparing raw input to check if user entered a new PIN)
      const hasNewPin = formData.autoApprove && formData.pinCode && formData.pinCode.length === 4;
      const hadPin = !!editingEmployee.pin_code;
      const pinChanged = hasNewPin || (!formData.autoApprove && hadPin) || (!formData.pinCode && hadPin);
      
      await updateEmployee.mutateAsync({
        id: editingEmployee.id,
        name: formData.name,
        phone: formData.phone || null,
        email: formData.email || null,
        notes: formData.notes || null,
        auto_approve_orders: formData.autoApprove,
        voice_input_enabled: formData.voiceInputEnabled,
        can_add_free_items: formData.canAddFreeItems,
        // Don't update pin_code directly - use the secure hash function below
      });
      
      // Use secure hash function for PIN updates
      if (pinChanged) {
        await hashEmployeePin.mutateAsync({
          employeeId: editingEmployee.id,
          pin: hasNewPin ? formData.pinCode : null,
        });
      }
      
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

      // Update or create token for this employee
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
        // No suppliers assigned, delete token
        await deleteToken.mutateAsync(existingToken.id);
      }
    } else {
      const newEmployee = await createEmployee.mutateAsync({
        name: formData.name,
        phone: formData.phone || null,
        email: formData.email || null,
        notes: formData.notes || null,
        voice_input_enabled: formData.voiceInputEnabled,
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

        // Create token for new employee if suppliers assigned
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
      // Delete associated token first
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
            const hasAssignments = locationSuppliersInfo.some(info => info.supplierNames.length > 0);
            
            return (
              <div
                key={employee.id}
                className={`border rounded-lg p-3 sm:p-4 ${
                  !employee.is_active ? 'opacity-60 bg-muted/30' : ''
                }`}
              >
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  {/* Mitarbeiter-Infos */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{employee.name}</span>
                          {employee.auto_approve_orders && (
                            <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-600">
                              <Zap className="h-3 w-3 mr-1" />
                              Auto-Freigabe
                            </Badge>
                          )}
                          {/* PIN Status Badge for Auto-Approve employees */}
                          {employee.auto_approve_orders && (
                            employee.pin_code ? (
                              <Badge variant="outline" className="text-xs border-green-500 text-green-600">
                                <Shield className="h-3 w-3 mr-1" />
                                PIN aktiv
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">
                                <ShieldAlert className="h-3 w-3 mr-1" />
                                Kein PIN
                              </Badge>
                            )
                          )}
                          {!employee.is_active && (
                            <Badge variant="secondary">Inaktiv</Badge>
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
                                  info.supplierNames.length > 3 ? (
                                    <Badge variant="secondary" className="text-xs">
                                      {info.supplierNames.length} Lieferanten
                                    </Badge>
                                  ) : (
                                    info.supplierNames.map((name, sIdx) => (
                                      <Badge key={sIdx} variant="secondary" className="text-xs">
                                        {name}
                                      </Badge>
                                    ))
                                  )
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
                      <div className="flex items-center gap-1 flex-shrink-0 flex-wrap justify-end">
                        {/* Link Buttons - only show if token exists */}
                        {token && (
                          <>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-10 w-10"
                                  title="QR-Code anzeigen"
                                >
                                  <QrCode className="h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-2">
                                <img 
                                  src={generateQrCodeUrl(token.token)} 
                                  alt="QR-Code" 
                                  className="w-40 h-40 rounded border bg-white"
                                />
                              </PopoverContent>
                            </Popover>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10"
                              onClick={() => copyToClipboard(token.token)}
                              title="Link kopieren"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            {employee.phone && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => openWhatsApp(employee, token.token)}
                                title="Per WhatsApp senden"
                              >
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10"
                              onClick={() => window.open(getOrderUrl(token.token), '_blank')}
                              title="Link testen"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {/* PIN Quick-Edit Button for Auto-Approve employees */}
                        {employee.auto_approve_orders && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className={`h-10 w-10 ${employee.pin_code ? "text-green-600 hover:text-green-700" : "text-amber-600 hover:text-amber-700"}`}
                            onClick={() => openPinDialog(employee)}
                            title="PIN bearbeiten"
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>
                        )}
                        <div className="hidden sm:block w-px h-6 bg-border mx-1" />
                        <Switch
                          checked={employee.is_active}
                          onCheckedChange={() => handleToggleActive(employee)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10"
                          onClick={() => openEditDialog(employee)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10"
                          onClick={() => setDeleteConfirmEmployee(employee)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-lg max-h-[90vh] p-0 gap-0 overflow-hidden">
          <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
            <DialogTitle>
              {editingEmployee ? 'Mitarbeiter bearbeiten' : 'Neuen Mitarbeiter anlegen'}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto px-6" style={{ maxHeight: 'calc(85vh - 150px)' }}>
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

              {/* Language Selection */}
              <div>
                <Label>Sprache für Easy Order</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) => setFormData({ ...formData, language: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location + Supplier Assignment */}
              {locations.length > 0 ? (
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
                              {location.short_code || location.name}
                                {location.short_code && (
                                  <span className="text-muted-foreground ml-1">
                                    ({location.name})
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
              ) : (
                <div className="border rounded-lg p-4 bg-muted/50">
                  <Label className="mb-2 block text-muted-foreground">Standorte & Lieferanten</Label>
                  <p className="text-sm text-muted-foreground">
                    Noch keine Standorte angelegt.{' '}
                    <a href="/settings?tab=locations" className="text-primary underline">
                      Standort in den Einstellungen anlegen
                    </a>
                  </p>
                </div>
              )}

              {/* Auto-Approve Toggle */}
              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-approve" className="text-sm font-medium">
                    Bestellungen automatisch freigeben
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    EasyOrder-Bestellungen werden direkt an den Lieferanten gesendet
                  </p>
                </div>
                <Switch
                  id="auto-approve"
                  checked={formData.autoApprove}
                  onCheckedChange={(checked) => setFormData({ ...formData, autoApprove: checked, pinCode: checked ? formData.pinCode : '' })}
                />
              </div>

              {/* PIN Code - required when Auto-Approve is enabled */}
              {formData.autoApprove && (
                <div className={`p-3 border rounded-lg space-y-3 ${formData.pinCode.length !== 4 ? 'border-destructive/50 bg-destructive/5' : 'bg-muted/30'}`}>
                  <div className="space-y-0.5">
                    <Label htmlFor="pin-code" className="text-sm font-medium flex items-center gap-1">
                      PIN-Code (erforderlich)
                      <span className="text-destructive">*</span>
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      4-stelliger Code, den der Mitarbeiter eingeben muss, bevor er bestellen kann
                    </p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="pin-code"
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      pattern="[0-9]*"
                      value={formData.pinCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setFormData({ ...formData, pinCode: value });
                      }}
                      placeholder="z.B. 1234"
                      className={`w-32 font-mono text-center tracking-widest ${formData.pinCode.length !== 4 ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {formData.pinCode.length !== 4 && (
                    <p className="text-xs text-destructive">
                      PIN muss genau 4 Ziffern haben
                    </p>
              )}

              {/* Voice Input Toggle (Prototype) */}
              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="voice-input" className="text-sm font-medium">
                        {t('settings.employees.voiceInput', 'Voice Input')}
                      </Label>
                      <Badge variant="outline" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                        {t('voice.prototype', 'Prototype')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('settings.employees.voiceInputDescription', 'Place orders by voice (Whisper + AI)')}
                    </p>
                  </div>
                </div>
                <Switch
                  id="voice-input"
                  checked={formData.voiceInputEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, voiceInputEnabled: checked })}
                />
              </div>

              {/* Free Items Toggle */}
              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="free-items" className="text-sm font-medium">
                      {t('settings.employees.canAddFreeItems', 'Freie Artikel erlauben')}
                    </Label>
                    <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      Neu
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('settings.employees.canAddFreeItemsDescription', 'Mitarbeiter kann freie Artikel zur Bestellung hinzufügen')}
                  </p>
                </div>
                <Switch
                  id="free-items"
                  checked={formData.canAddFreeItems}
                  onCheckedChange={(checked) => setFormData({ ...formData, canAddFreeItems: checked })}
                />
              </div>
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
              disabled={!formData.name.trim() || (formData.autoApprove && formData.pinCode.length !== 4) || createEmployee.isPending || updateEmployee.isPending}
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
              {deleteConfirmEmployee?.name} und der zugehörige Easy Order Link werden gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Löschen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* PIN Quick-Edit Dialog */}
      <Dialog open={!!pinDialogEmployee} onOpenChange={(open) => !open && closePinDialog()}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              PIN bearbeiten
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              PIN für <span className="font-medium">{pinDialogEmployee?.name}</span>
            </p>
            <div className="space-y-2">
              <Label htmlFor="pin-quick-edit">4-stelliger PIN-Code</Label>
              <Input
                id="pin-quick-edit"
                type="text"
                inputMode="numeric"
                maxLength={4}
                pattern="[0-9]*"
                value={pinValue}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setPinValue(value);
                }}
                placeholder="z.B. 1234"
                className="font-mono text-center tracking-widest text-lg"
              />
              {pinValue && pinValue.length !== 4 && pinValue.length > 0 && (
                <p className="text-xs text-destructive">
                  PIN muss genau 4 Ziffern haben
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateRandomPin}
                className="flex-1"
              >
                Generieren
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPinValue('')}
                className="flex-1"
                disabled={!pinValue}
              >
                Entfernen
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closePinDialog}>
              Abbrechen
            </Button>
            <Button 
              onClick={handleSavePin} 
              disabled={isSavingPin || (pinValue.length > 0 && pinValue.length !== 4)}
            >
              {isSavingPin ? 'Speichern...' : 'Speichern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
