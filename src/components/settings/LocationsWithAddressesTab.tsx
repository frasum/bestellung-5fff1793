import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Pencil, Trash2, Star, Store, MapPin, ChevronRight } from 'lucide-react';
import { useLocations, useCreateLocation, useUpdateLocation, useDeleteLocation, Location } from '@/hooks/useLocations';
import {
  useDeliveryAddresses,
  useCreateDeliveryAddress,
  useUpdateDeliveryAddress,
  useDeleteDeliveryAddress,
  DeliveryAddress,
} from '@/hooks/useSettings';

// Address Form Component
const AddressForm = ({
  address,
  locationId,
  onSuccess,
}: {
  address: DeliveryAddress | null;
  locationId: string;
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
      updateAddress.mutate({ id: address.id, ...formData }, { onSuccess });
    } else {
      createAddress.mutate({ ...formData, location_id: locationId }, { onSuccess });
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

// Location Item with Addresses
const LocationItem = ({ 
  location, 
  onEditLocation 
}: { 
  location: Location; 
  onEditLocation: (location: Location) => void;
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(location.is_default);
  const { data: addresses = [] } = useDeliveryAddresses(location.id);
  const deleteLocation = useDeleteLocation();
  const updateAddress = useUpdateDeliveryAddress();
  const deleteAddress = useDeleteDeliveryAddress();
  
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<DeliveryAddress | null>(null);

  const handleDeleteLocation = () => {
    if (confirm(t('settings.deleteLocationConfirm'))) {
      deleteLocation.mutate(location.id);
    }
  };

  const handleEditAddress = (address: DeliveryAddress) => {
    setEditingAddress(address);
    setAddressDialogOpen(true);
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setAddressDialogOpen(true);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border rounded-lg">
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3">
            <ChevronRight className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Store className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{location.name}</span>
                {location.short_code && (
                  <Badge variant="outline" className="text-xs">
                    {location.short_code}
                  </Badge>
                )}
                {location.is_default && (
                  <Badge variant="secondary" className="text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    {t('settings.defaultAddress')}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {addresses.length} {addresses.length === 1 ? t('settings.address') : t('settings.addresses')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Button size="sm" variant="ghost" onClick={() => onEditLocation(location)}>
              <Pencil className="h-4 w-4" />
            </Button>
            {!location.is_default && (
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={handleDeleteLocation}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="px-4 pb-4 pt-0 space-y-2 border-t bg-muted/20">
          {addresses.map((address) => (
            <div key={address.id} className="flex items-start justify-between p-3 bg-background rounded-lg border ml-6">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{address.label}</span>
                    {address.is_default && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Star className="h-2.5 w-2.5" />
                        {t('settings.defaultAddress')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {address.address_line1}
                    {address.address_line2 && `, ${address.address_line2}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {address.postal_code} {address.city}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {!address.is_default && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => updateAddress.mutate({ id: address.id, is_default: true })}
                    title={t('settings.setAsDefault')}
                  >
                    <Star className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => handleEditAddress(address)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  onClick={() => deleteAddress.mutate(address.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-6 gap-2 text-muted-foreground hover:text-foreground"
            onClick={handleAddAddress}
          >
            <Plus className="h-4 w-4" />
            {t('settings.addAddress')}
          </Button>
        </div>
      </CollapsibleContent>

      <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAddress ? t('settings.editAddress') : t('settings.addAddress')}</DialogTitle>
          </DialogHeader>
          <AddressForm
            address={editingAddress}
            locationId={location.id}
            onSuccess={() => setAddressDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Collapsible>
  );
};

export const LocationsWithAddressesTab = () => {
  const { t } = useTranslation();
  const { data: locations = [], isLoading } = useLocations();
  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();
  
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [name, setName] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const handleOpenLocationDialog = (location?: Location) => {
    if (location) {
      setEditingLocation(location);
      setName(location.name);
      setShortCode(location.short_code || '');
      setIsDefault(location.is_default);
    } else {
      setEditingLocation(null);
      setName('');
      setShortCode('');
      setIsDefault(false);
    }
    setLocationDialogOpen(true);
  };

  const handleSaveLocation = () => {
    if (!name.trim()) return;
    
    if (editingLocation) {
      updateLocation.mutate({
        id: editingLocation.id,
        name: name.trim(),
        short_code: shortCode.trim() || undefined,
        is_default: isDefault,
      }, {
        onSuccess: () => setLocationDialogOpen(false),
      });
    } else {
      createLocation.mutate({
        name: name.trim(),
        short_code: shortCode.trim() || undefined,
        is_default: isDefault,
      }, {
        onSuccess: () => setLocationDialogOpen(false),
      });
    }
  };

  if (isLoading) {
    return <Card><CardContent className="p-6">{t('common.loading')}</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            {t('settings.manageLocations')}
          </CardTitle>
          <CardDescription>
            {t('settings.locationsWithAddressesDesc')}
          </CardDescription>
        </div>
        <Button className="gap-2" onClick={() => handleOpenLocationDialog()}>
          <Plus className="h-4 w-4" />
          {t('settings.addLocation')}
        </Button>
      </CardHeader>
      <CardContent>
        {locations.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            {t('settings.noLocations')}
          </p>
        ) : (
          <div className="space-y-3">
            {locations.map((location) => (
              <LocationItem 
                key={location.id} 
                location={location} 
                onEditLocation={handleOpenLocationDialog}
              />
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLocation ? t('settings.editLocation') : t('settings.createLocation')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location-name">{t('settings.locationName')} *</Label>
              <Input
                id="location-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('settings.locationNamePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location-code">{t('settings.locationCode')}</Label>
              <Input
                id="location-code"
                value={shortCode}
                onChange={(e) => setShortCode(e.target.value)}
                placeholder={t('settings.locationCodePlaceholder')}
                maxLength={5}
              />
              <p className="text-xs text-muted-foreground">{t('settings.locationCodeDesc')}</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is-default">{t('settings.defaultLocation')}</Label>
                <p className="text-xs text-muted-foreground">{t('settings.defaultLocationDesc')}</p>
              </div>
              <Switch
                id="is-default"
                checked={isDefault}
                onCheckedChange={setIsDefault}
              />
            </div>
            <Button onClick={handleSaveLocation} className="w-full" disabled={createLocation.isPending || updateLocation.isPending}>
              {(createLocation.isPending || updateLocation.isPending) ? t('settings.savingProfile') : t('common.save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
