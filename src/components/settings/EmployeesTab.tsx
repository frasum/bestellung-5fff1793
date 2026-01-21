import { Plus, User, UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  EmployeeCard,
  EmployeeFormDialog,
  EmployeePinDialog,
  EmployeeDeleteDialog,
  useEmployeesTabState,
} from './employees';

export function EmployeesTab() {
  const state = useEmployeesTabState();

  if (state.isLoading) {
    return <div className="p-4 text-muted-foreground">Laden...</div>;
  }

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
        <Button onClick={state.openCreateDialog} size="sm" className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Mitarbeiter hinzufügen
        </Button>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-green-500" />
          <span>{state.activeEmployees.length} aktiv</span>
        </div>
        <div className="flex items-center gap-2">
          <UserX className="h-4 w-4 text-muted-foreground" />
          <span>{state.inactiveEmployees.length} inaktiv</span>
        </div>
      </div>

      {/* Employee List */}
      {state.employees.length === 0 ? (
        <div className="border border-dashed rounded-lg p-8 text-center text-muted-foreground">
          <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Noch keine Mitarbeiter angelegt</p>
          <p className="text-sm mt-1">
            Füge Mitarbeiter hinzu, um ihnen Easy Order Zugänge zu erstellen
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {state.employees.map((employee) => {
            const token = state.getTokenForEmployee(employee.id);
            const locationSuppliersInfo = state.getEmployeeLocationSuppliersInfo(employee.id);
            
            return (
              <EmployeeCard
                key={employee.id}
                employee={employee}
                token={token}
                locationSuppliersInfo={locationSuppliersInfo}
                advancedSettingsEnabled={state.advancedSettingsEnabled}
                onEdit={state.openEditDialog}
                onDelete={state.setDeleteConfirmEmployee}
                onToggleActive={state.handleToggleActive}
                onOpenPinDialog={state.openPinDialog}
                onCopyLink={state.copyToClipboard}
                onOpenWhatsApp={state.openWhatsApp}
                getOrderUrl={state.getOrderUrl}
                generateQrCodeUrl={state.generateQrCodeUrl}
              />
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <EmployeeFormDialog
        open={state.isDialogOpen}
        onOpenChange={state.setIsDialogOpen}
        editingEmployee={state.editingEmployee}
        formData={state.formData}
        setFormData={state.setFormData}
        locationAssignments={state.locationAssignments}
        expandedLocations={state.expandedLocations}
        locations={state.locations}
        activeSuppliers={state.activeSuppliers}
        onSubmit={state.handleSubmit}
        isSubmitting={state.isSubmitting}
        onToggleLocation={state.toggleLocation}
        onToggleSupplierForLocation={state.toggleSupplierForLocation}
        onSelectAllSuppliers={state.selectAllSuppliersForLocation}
        onDeselectAllSuppliers={state.deselectAllSuppliersForLocation}
        onToggleExpandLocation={state.toggleExpandLocation}
      />

      {/* Delete Confirmation */}
      <EmployeeDeleteDialog
        employee={state.deleteConfirmEmployee}
        onConfirm={state.handleDelete}
        onCancel={() => state.setDeleteConfirmEmployee(null)}
      />

      {/* PIN Quick-Edit Dialog */}
      <EmployeePinDialog
        employee={state.pinDialogEmployee}
        pinValue={state.pinValue}
        setPinValue={state.setPinValue}
        isSaving={state.isSavingPin}
        onSave={state.handleSavePin}
        onClose={state.closePinDialog}
      />
    </div>
  );
}
