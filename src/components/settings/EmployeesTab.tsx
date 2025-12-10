import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Phone, Mail, User, UserCheck, UserX, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
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
import { useAllEmployeeLocations, useUpdateEmployeeLocations } from '@/hooks/useEmployeeLocations';

export function EmployeesTab() {
  const { t } = useTranslation();
  const { data: employees = [], isLoading } = useEmployees();
  const { data: tokens = [] } = useSimpleOrderTokens();
  const { data: locations = [] } = useLocations();
  const { data: employeeLocations = [] } = useAllEmployeeLocations();
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();
  const updateEmployeeLocations = useUpdateEmployeeLocations();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deleteConfirmEmployee, setDeleteConfirmEmployee] = useState<Employee | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);

  const openCreateDialog = () => {
    setEditingEmployee(null);
    setFormData({ name: '', phone: '', email: '', notes: '' });
    // Default: all locations selected for new employees
    setSelectedLocationIds(locations.map(l => l.id));
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
    // Load assigned locations
    const assignedLocationIds = employeeLocations
      .filter(el => el.employee_id === employee.id)
      .map(el => el.location_id);
    setSelectedLocationIds(assignedLocationIds);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

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
        locationIds: selectedLocationIds,
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
          locationIds: selectedLocationIds,
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

  const getEmployeeLocationNames = (employeeId: string) => {
    const assignedLocationIds = employeeLocations
      .filter(el => el.employee_id === employeeId)
      .map(el => el.location_id);
    return locations
      .filter(l => assignedLocationIds.includes(l.id))
      .map(l => l.short_code || l.name);
  };

  const toggleLocationSelection = (locationId: string) => {
    setSelectedLocationIds(prev => 
      prev.includes(locationId)
        ? prev.filter(id => id !== locationId)
        : [...prev, locationId]
    );
  };

  const selectAllLocations = () => {
    setSelectedLocationIds(locations.map(l => l.id));
  };

  const deselectAllLocations = () => {
    setSelectedLocationIds([]);
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
            const locationNames = getEmployeeLocationNames(employee.id);
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
                    {/* Location badges */}
                    {locationNames.length > 0 && (
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {locationNames.map((name, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {name}
                          </Badge>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? 'Mitarbeiter bearbeiten' : 'Neuen Mitarbeiter anlegen'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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

            {/* Location Assignment */}
            {locations.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Standorte</Label>
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={selectAllLocations}
                      className="text-xs h-7"
                    >
                      Alle
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={deselectAllLocations}
                      className="text-xs h-7"
                    >
                      Keine
                    </Button>
                  </div>
                </div>
                <div className="border rounded-lg p-3 space-y-2">
                  {locations.map((location) => (
                    <div key={location.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`location-${location.id}`}
                        checked={selectedLocationIds.includes(location.id)}
                        onCheckedChange={() => toggleLocationSelection(location.id)}
                      />
                      <label
                        htmlFor={`location-${location.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {location.name}
                        {location.short_code && (
                          <span className="text-muted-foreground ml-1">
                            ({location.short_code})
                          </span>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
                {selectedLocationIds.length === 0 && (
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
          <DialogFooter>
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