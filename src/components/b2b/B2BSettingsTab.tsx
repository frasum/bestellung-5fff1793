import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Accordion } from '@/components/ui/accordion';
import B2BSupplierFormDialog from './B2BSupplierFormDialog';
import {
  SupplierProfileSection,
  SupplierUsersSection,
  PortalUrlSection,
  SupplierLinkingSection,
  PortalSettingsSection,
  BrandingSection,
  useB2BSettingsState,
  InviteUserDialog,
  DeleteSupplierDialog,
  DeleteUserDialog,
} from './settings';

interface B2BAccount {
  id: string;
  company_name: string;
  subdomain: string;
  email: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  welcome_message: string | null;
  subscription_tier: string | null;
  is_active: boolean | null;
  linked_supplier_id: string | null;
}

interface B2BSettingsTabProps {
  account: B2BAccount;
  onUpdate: () => void;
  selectedSupplierId?: string;
  suppliers?: { id: string; name: string }[];
  onSuppliersChange?: () => void;
  isSupplierUser?: boolean;
  supplierUserRole?: string;
}

const B2BSettingsTab = ({
  account,
  onUpdate,
  selectedSupplierId,
  suppliers: dashboardSuppliers,
  onSuppliersChange,
  isSupplierUser = false,
  supplierUserRole = 'manager',
}: B2BSettingsTabProps) => {
  const state = useB2BSettingsState({
    account,
    onUpdate,
    selectedSupplierId,
    onSuppliersChange,
    isSupplierUser,
  });

  return (
    <div className="space-y-6">
      <Card>
        <Accordion type="multiple" className="w-full">
          {/* Selected Supplier Profile */}
          <SupplierProfileSection
            selectedSupplierId={selectedSupplierId}
            supplierName={state.supplierName}
            setSupplierName={state.setSupplierName}
            supplierEmail={state.supplierEmail}
            setSupplierEmail={state.setSupplierEmail}
            supplierPhone={state.supplierPhone}
            setSupplierPhone={state.setSupplierPhone}
            supplierDescription={state.supplierDescription}
            setSupplierDescription={state.setSupplierDescription}
            supplierOrderDeliveryMethod={state.supplierOrderDeliveryMethod}
            setSupplierOrderDeliveryMethod={state.setSupplierOrderDeliveryMethod}
            onSaveSupplier={state.handleSaveSupplier}
            savingSupplier={state.savingSupplier}
            onDeleteSupplier={() => {
              const supplier = state.b2bSuppliers.find(s => s.id === selectedSupplierId);
              if (supplier) state.setDeleteSupplierToDelete(supplier);
            }}
            b2bSuppliers={state.b2bSuppliers}
          />

          {/* Supplier Users Management */}
          <SupplierUsersSection
            isSupplierUser={isSupplierUser}
            supplierUsers={state.supplierUsers}
            loadingSupplierUsers={state.loadingSupplierUsers}
            onInviteClick={() => state.setInviteDialogOpen(true)}
            onDeleteUser={(user) => state.setDeleteUserToDelete(user)}
          />

          {/* Supplier Linking */}
          <SupplierLinkingSection
            isSupplierUser={isSupplierUser}
            linkedSupplierId={state.linkedSupplierId}
            setLinkedSupplierId={state.setLinkedSupplierId}
            bestellungSuppliers={state.bestellungSuppliers}
          />

          {/* Portal URL */}
          <PortalUrlSection
            portalUrl={state.portalUrl}
            subdomain={account.subdomain}
            copied={state.copied}
            onCopyUrl={state.copyPortalUrl}
          />

          {/* Portal Settings */}
          <PortalSettingsSection
            welcomeMessage={state.welcomeMessage}
            setWelcomeMessage={state.setWelcomeMessage}
          />

          {/* Branding */}
          <BrandingSection
            primaryColor={state.primaryColor}
            setPrimaryColor={state.setPrimaryColor}
            secondaryColor={state.secondaryColor}
            setSecondaryColor={state.setSecondaryColor}
            logoUrl={state.logoUrl}
            uploadingLogo={state.uploadingLogo}
            onLogoUpload={state.handleLogoUpload}
            onRemoveLogo={state.handleRemoveLogo}
          />
        </Accordion>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={state.handleSave} disabled={state.loading}>
          {state.loading ? 'Speichern...' : 'Einstellungen speichern'}
        </Button>
      </div>

      {/* Dialogs */}
      <B2BSupplierFormDialog
        open={state.supplierDialogOpen}
        onOpenChange={state.setSupplierDialogOpen}
        supplier={state.editingSupplier}
        accountId={account.id}
        onSuccess={() => {
          state.loadB2bSuppliers();
          onUpdate();
        }}
      />

      <InviteUserDialog
        open={state.inviteDialogOpen}
        onOpenChange={state.setInviteDialogOpen}
        accountId={account.id}
        b2bSuppliers={state.b2bSuppliers}
        onSuccess={state.loadSupplierUsers}
      />

      <DeleteSupplierDialog
        supplier={state.deleteSupplierToDelete}
        onOpenChange={() => state.setDeleteSupplierToDelete(null)}
        onConfirm={state.handleDeleteSupplier}
      />

      <DeleteUserDialog
        user={state.deleteUserToDelete}
        onOpenChange={() => state.setDeleteUserToDelete(null)}
        onConfirm={state.handleDeleteSupplierUser}
      />
    </div>
  );
};

export default B2BSettingsTab;
