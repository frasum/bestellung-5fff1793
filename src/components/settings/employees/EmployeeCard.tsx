import { memo } from 'react';
import type { Employee } from '@/hooks/useEmployees';
import { EmployeeBadges } from './EmployeeBadges';
import { EmployeeLocationInfo } from './EmployeeLocationInfo';
import { EmployeeContactInfo } from './EmployeeContactInfo';
import { EmployeeActions } from './EmployeeActions';

interface LocationSuppliersInfo {
  locationName: string;
  supplierNames: string[];
}

interface SimpleOrderToken {
  id: string;
  token: string;
  employee_id: string | null;
}

interface EmployeeCardProps {
  employee: Employee;
  token: SimpleOrderToken | undefined;
  locationSuppliersInfo: LocationSuppliersInfo[];
  advancedSettingsEnabled: boolean;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  onToggleActive: (employee: Employee) => void;
  onOpenPinDialog: (employee: Employee) => void;
  onCopyLink: (token: string) => void;
  onOpenWhatsApp: (employee: Employee, token: string) => void;
  getOrderUrl: (token: string) => string;
  generateQrCodeUrl: (token: string) => string;
}

export const EmployeeCard = memo(function EmployeeCard({
  employee,
  token,
  locationSuppliersInfo,
  advancedSettingsEnabled,
  onEdit,
  onDelete,
  onToggleActive,
  onOpenPinDialog,
  onCopyLink,
  onOpenWhatsApp,
  getOrderUrl,
  generateQrCodeUrl,
}: EmployeeCardProps) {
  return (
    <div
      className={`border rounded-lg p-3 sm:p-4 ${
        !employee.is_active ? 'opacity-60 bg-muted/30' : ''
      }`}
    >
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{employee.name}</span>
                <EmployeeBadges
                  autoApproveOrders={employee.auto_approve_orders}
                  pinCode={employee.pin_code}
                  voiceInputEnabled={employee.voice_input_enabled}
                  canAddFreeItems={employee.can_add_free_items}
                  canCapturePhotos={employee.can_capture_photos}
                  wineCatalogAccess={employee.wine_catalog_access}
                  isActive={employee.is_active}
                />
              </div>
              
              <EmployeeLocationInfo locationSuppliersInfo={locationSuppliersInfo} />
              
              <EmployeeContactInfo
                phone={employee.phone}
                email={employee.email}
                notes={employee.notes}
              />
            </div>
            
            <EmployeeActions
              employee={employee}
              token={token}
              advancedSettingsEnabled={advancedSettingsEnabled}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleActive={onToggleActive}
              onOpenPinDialog={onOpenPinDialog}
              onCopyLink={onCopyLink}
              onOpenWhatsApp={onOpenWhatsApp}
              getOrderUrl={getOrderUrl}
              generateQrCodeUrl={generateQrCodeUrl}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

EmployeeCard.displayName = 'EmployeeCard';
