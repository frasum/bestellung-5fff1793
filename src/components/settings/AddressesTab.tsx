import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Star } from 'lucide-react';
import { useLocationContext } from '@/contexts/LocationContext';
import {
  useDeliveryAddresses,
  useCreateDeliveryAddress,
  useUpdateDeliveryAddress,
  useDeleteDeliveryAddress,
  DeliveryAddress,
} from '@/hooks/useSettings';

const AddressCard = ({ address, onEdit }: { address: DeliveryAddress; onEdit: () => void }) => {
  const { t } = useTranslation();
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
              {t('settings.defaultAddress')}
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
            <Star className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => deleteAddress.mutate(address.id)}
          disabled={deleteAddress.isPending}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
};

const AddressForm = ({
  address,
  locationId,
  onSuccess,
}: {
  address: DeliveryAddress | null;
  locationId: string | null;
  onSuccess: () => void;
}) => {
  const { t } = useTranslation();
  const createAddress = useCreateDeliveryAddress();
  const updateAddress = useUpdateDeliveryAddress();
  const [formData, setFormData] = useState({
    label: address?.label || '',
    address_line1: address?.address_line1 || '',
    address_line2: address?.address_line2 || '',
    postal_code: address?.postal_code || '',
    city: address?.city || '',
    country: address?.country || 'Germany',
    is_default: address?.is_default || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.label.trim() || !formData.address_line1.trim() || !formData.postal_code.trim() || !formData.city.trim()) {
      return;
    }

    if (address) {
      updateAddress.mutate(
        { id: address.id, ...formData },
        { onSuccess }
      );
    } else {
      createAddress.mutate(
        { ...formData, location_id: locationId },
        { onSuccess }
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="label">{t('settings.labelField')} *</Label>
        <Input
          id="label"
          value={formData.label}
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
          placeholder={t('settings.labelPlaceholder')}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address_line1">{t('settings.addressLine1')} *</Label>
        <Input
          id="address_line1"
          value={formData.address_line1}
          onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
          placeholder={t('settings.addressLine1Placeholder')}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address_line2">{t('settings.addressLine2')}</Label>
        <Input
          id="address_line2"
          value={formData.address_line2}
          onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
          placeholder={t('settings.addressLine2Placeholder')}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="postal_code">{t('settings.postalCode')} *</Label>
          <Input
            id="postal_code"
            value={formData.postal_code}
            onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
            placeholder={t('settings.postalCodePlaceholder')}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">{t('settings.city')} *</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder={t('settings.cityPlaceholder')}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="country">{t('settings.country')}</Label>
        <Input
          id="country"
          value={formData.country}
          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
          placeholder={t('settings.countryPlaceholder')}
        />
      </div>

      <Button type="submit" className="w-full" disabled={createAddress.isPending || updateAddress.isPending}>
        {(createAddress.isPending || updateAddress.isPending) ? t('common.saving') : t('common.save')}
      </Button>
    </form>
  );
};

export const AddressesTab = () => {
  const { t } = useTranslation();
  const { activeLocation } = useLocationContext();
  const { data: addresses = [], isLoading } = useDeliveryAddresses(activeLocation?.id);
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
    return <Card><CardContent className="p-6">{t('common.loading')}</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t('settings.deliveryAddresses')}</CardTitle>
          <CardDescription>
            {t('settings.addressDescription', { location: activeLocation?.name || t('locations.title') })}
          </CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              {t('settings.addAddress')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAddress ? t('settings.editAddress') : t('settings.addAddress')}</DialogTitle>
            </DialogHeader>
            <AddressForm
              address={editingAddress}
              locationId={activeLocation?.id || null}
              onSuccess={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {addresses.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            {t('settings.noAddresses', { location: activeLocation?.name || t('locations.title') })}
          </p>
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
