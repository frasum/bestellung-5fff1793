import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Building2, MapPin, Bell, Plus, Pencil, Trash2, Star } from 'lucide-react';
import {
  useOrganization,
  useUpdateOrganization,
  useDeliveryAddresses,
  useCreateDeliveryAddress,
  useUpdateDeliveryAddress,
  useDeleteDeliveryAddress,
  useNotificationPreferences,
  useUpsertNotificationPreferences,
  DeliveryAddress,
} from '@/hooks/useSettings';

const Settings = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your organization and preferences</p>
        </div>

        <Tabs defaultValue="organization" className="space-y-6">
          <TabsList>
            <TabsTrigger value="organization" className="gap-2">
              <Building2 className="h-4 w-4" />
              Organization
            </TabsTrigger>
            <TabsTrigger value="addresses" className="gap-2">
              <MapPin className="h-4 w-4" />
              Addresses
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="organization">
            <OrganizationTab />
          </TabsContent>

          <TabsContent value="addresses">
            <AddressesTab />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationsTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

const OrganizationTab = () => {
  const { data: organization, isLoading } = useOrganization();
  const updateOrganization = useUpdateOrganization();
  const [name, setName] = useState('');

  const handleSave = () => {
    if (organization && name.trim()) {
      updateOrganization.mutate({ id: organization.id, name: name.trim() });
    }
  };

  if (isLoading) {
    return <Card><CardContent className="p-6">Loading...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Profile</CardTitle>
        <CardDescription>Manage your organization details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="org-name">Organization Name</Label>
          <Input
            id="org-name"
            defaultValue={organization?.name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter organization name"
          />
        </div>

        <div className="space-y-2">
          <Label>Subscription</Label>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {organization?.subscription_tier || 'free'}
            </Badge>
            {organization?.trial_ends_at && (
              <span className="text-sm text-muted-foreground">
                Trial ends: {new Date(organization.trial_ends_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        <Button onClick={handleSave} disabled={updateOrganization.isPending}>
          {updateOrganization.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardContent>
    </Card>
  );
};

const AddressesTab = () => {
  const { data: addresses = [], isLoading } = useDeliveryAddresses();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<DeliveryAddress | null>(null);

  const handleEdit = (address: DeliveryAddress) => {
    setEditingAddress(address);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingAddress(null);
    setDialogOpen(true);
  };

  if (isLoading) {
    return <Card><CardContent className="p-6">Loading...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Delivery Addresses</CardTitle>
          <CardDescription>Manage your organization's delivery addresses</CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Address
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAddress ? 'Edit Address' : 'Add Address'}</DialogTitle>
            </DialogHeader>
            <AddressForm
              address={editingAddress}
              onSuccess={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {addresses.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No addresses yet. Add your first delivery address.</p>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <AddressCard key={address.id} address={address} onEdit={() => handleEdit(address)} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const AddressCard = ({ address, onEdit }: { address: DeliveryAddress; onEdit: () => void }) => {
  const deleteAddress = useDeleteDeliveryAddress();
  const updateAddress = useUpdateDeliveryAddress();

  return (
    <div className="flex items-start justify-between p-4 border rounded-lg">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{address.label}</span>
          {address.is_default && (
            <Badge variant="secondary" className="gap-1">
              <Star className="h-3 w-3" />
              Default
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {address.address_line1}
          {address.address_line2 && `, ${address.address_line2}`}
        </p>
        <p className="text-sm text-muted-foreground">
          {address.postal_code} {address.city}, {address.country}
        </p>
      </div>
      <div className="flex gap-2">
        {!address.is_default && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => updateAddress.mutate({ id: address.id, is_default: true })}
          >
            Set Default
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => deleteAddress.mutate(address.id)}
          disabled={deleteAddress.isPending}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
};

const AddressForm = ({ address, onSuccess }: { address: DeliveryAddress | null; onSuccess: () => void }) => {
  const createAddress = useCreateDeliveryAddress();
  const updateAddress = useUpdateDeliveryAddress();
  const [formData, setFormData] = useState({
    label: address?.label || '',
    address_line1: address?.address_line1 || '',
    address_line2: address?.address_line2 || '',
    city: address?.city || '',
    postal_code: address?.postal_code || '',
    country: address?.country || 'Germany',
    is_default: address?.is_default || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (address) {
      updateAddress.mutate({ id: address.id, ...formData }, { onSuccess });
    } else {
      createAddress.mutate(formData, { onSuccess });
    }
  };

  const isPending = createAddress.isPending || updateAddress.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="label">Label</Label>
        <Input
          id="label"
          value={formData.label}
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
          placeholder="e.g., Main Kitchen"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address_line1">Address Line 1</Label>
        <Input
          id="address_line1"
          value={formData.address_line1}
          onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
          placeholder="Street and number"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address_line2">Address Line 2</Label>
        <Input
          id="address_line2"
          value={formData.address_line2}
          onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
          placeholder="Building, floor, etc. (optional)"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="postal_code">Postal Code</Label>
          <Input
            id="postal_code"
            value={formData.postal_code}
            onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="country">Country</Label>
        <Input
          id="country"
          value={formData.country}
          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
          required
        />
      </div>
      <div className="flex items-center gap-2">
        <Switch
          id="is_default"
          checked={formData.is_default}
          onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
        />
        <Label htmlFor="is_default">Set as default address</Label>
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Saving...' : address ? 'Update Address' : 'Add Address'}
      </Button>
    </form>
  );
};

const NotificationsTab = () => {
  const { data: preferences, isLoading } = useNotificationPreferences();
  const upsertPreferences = useUpsertNotificationPreferences();
  const [prefs, setPrefs] = useState({
    email_order_confirmation: true,
    email_order_status: true,
    email_weekly_report: false,
    email_supplier_updates: true,
  });

  // Update local state when data loads
  useState(() => {
    if (preferences) {
      setPrefs({
        email_order_confirmation: preferences.email_order_confirmation,
        email_order_status: preferences.email_order_status,
        email_weekly_report: preferences.email_weekly_report,
        email_supplier_updates: preferences.email_supplier_updates,
      });
    }
  });

  const handleToggle = (key: keyof typeof prefs) => {
    const newPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(newPrefs);
    upsertPreferences.mutate(newPrefs);
  };

  if (isLoading) {
    return <Card><CardContent className="p-6">Loading...</CardContent></Card>;
  }

  const currentPrefs = preferences || prefs;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>Choose what notifications you want to receive</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Order Confirmations</Label>
              <p className="text-sm text-muted-foreground">Receive email when orders are placed</p>
            </div>
            <Switch
              checked={currentPrefs.email_order_confirmation}
              onCheckedChange={() => handleToggle('email_order_confirmation')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Order Status Updates</Label>
              <p className="text-sm text-muted-foreground">Get notified when order status changes</p>
            </div>
            <Switch
              checked={currentPrefs.email_order_status}
              onCheckedChange={() => handleToggle('email_order_status')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Weekly Reports</Label>
              <p className="text-sm text-muted-foreground">Receive weekly spending summaries</p>
            </div>
            <Switch
              checked={currentPrefs.email_weekly_report}
              onCheckedChange={() => handleToggle('email_weekly_report')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Supplier Updates</Label>
              <p className="text-sm text-muted-foreground">Get notified about supplier changes</p>
            </div>
            <Switch
              checked={currentPrefs.email_supplier_updates}
              onCheckedChange={() => handleToggle('email_supplier_updates')}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Settings;
