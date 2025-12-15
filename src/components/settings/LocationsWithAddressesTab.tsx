import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plus, Pencil, Trash2, Star, Store, MapPin, Check, Mail } from 'lucide-react';
import { useLocations, useCreateLocation, useUpdateLocation, useDeleteLocation, Location } from '@/hooks/useLocations';
import {
  useDeliveryAddresses,
  useCreateDeliveryAddress,
  useUpdateDeliveryAddress,
  useDeleteDeliveryAddress,
  DeliveryAddress,
} from '@/hooks/useSettings';
import { useAllUserDeliveryPreferences, useUpsertUserDeliveryPreferenceForLocation } from '@/hooks/useUserDeliveryPreference';

// Combined Location + Address Form Dialog
const LocationFormDialog = ({
  open,
  onOpenChange,
  location,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: Location | null;
}) => {
  const { t } = useTranslation();
  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();
  const createAddress = useCreateDeliveryAddress();
  const updateAddress = useUpdateDeliveryAddress();
  const deleteAddress = useDeleteDeliveryAddress();
  
  const { data: addresses = [] } = useDeliveryAddresses(location?.id || '');
  const primaryAddress = addresses.find(a => a.is_default) || addresses[0];
  
  // User delivery preference
  const { data: allPreferences = [] } = useAllUserDeliveryPreferences();
  const upsertPreference = useUpsertUserDeliveryPreferenceForLocation();
  const currentPreference = location ? allPreferences.find(p => p.location_id === location.id) : null;
  
  // Location fields
  const [name, setName] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  
  // Email validation helper
  const validateEmail = (value: string): boolean => {
    if (!value.trim()) return true; // Empty is valid (optional field)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value.trim());
  };
  
  // Address fields
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Germany');
  
  // Additional addresses
  const [showAdditionalAddresses, setShowAdditionalAddresses] = useState(false);

  // Reset form when dialog opens/closes or location changes
  useEffect(() => {
    if (open) {
      if (location) {
        setName(location.name);
        setShortCode(location.short_code || '');
        setEmail(location.email || '');
        setIsDefault(location.is_default);
      } else {
        setName('');
        setShortCode('');
        setEmail('');
        setIsDefault(false);
      }
      setShowAdditionalAddresses(false);
    }
  }, [open, location]);

  // Update address fields when primary address data loads
  useEffect(() => {
    if (primaryAddress) {
      setAddressLine1(primaryAddress.address_line1);
      setAddressLine2(primaryAddress.address_line2 || '');
      setPostalCode(primaryAddress.postal_code);
      setCity(primaryAddress.city);
      setCountry(primaryAddress.country || 'Germany');
    } else if (!location) {
      // Reset for new location
      setAddressLine1('');
      setAddressLine2('');
      setPostalCode('');
      setCity('');
      setCountry('Germany');
    }
  }, [primaryAddress, location]);

  const additionalAddresses = addresses.filter(a => a.id !== primaryAddress?.id);
  const isSaving = createLocation.isPending || updateLocation.isPending || createAddress.isPending || updateAddress.isPending;

  const handleSetAsMyDefault = (addressId: string) => {
    if (!location) return;
    upsertPreference.mutate({ locationId: location.id, deliveryAddressId: addressId });
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    if (email.trim() && !validateEmail(email)) {
      setEmailError(t('validation.invalidEmail'));
      return;
    }

    if (location) {
      // Update existing location
      updateLocation.mutate({
        id: location.id,
        name: name.trim(),
        short_code: shortCode.trim() || undefined,
        email: email.trim() || undefined,
        is_default: isDefault,
      });

      // Update or create primary address
      if (addressLine1.trim() && postalCode.trim() && city.trim()) {
        if (primaryAddress) {
          updateAddress.mutate({
            id: primaryAddress.id,
            label: name.trim(),
            address_line1: addressLine1.trim(),
            address_line2: addressLine2.trim() || undefined,
            postal_code: postalCode.trim(),
            city: city.trim(),
            country: country.trim(),
          });
        } else {
          createAddress.mutate({
            location_id: location.id,
            label: name.trim(),
            address_line1: addressLine1.trim(),
            address_line2: addressLine2.trim() || undefined,
            postal_code: postalCode.trim(),
            city: city.trim(),
            country: country.trim(),
            is_default: true,
          });
        }
      }
      onOpenChange(false);
    } else {
      // Create new location with address
      createLocation.mutate({
        name: name.trim(),
        short_code: shortCode.trim() || undefined,
        email: email.trim() || undefined,
        is_default: isDefault,
      }, {
        onSuccess: (newLocation) => {
          // Create address for new location
          if (addressLine1.trim() && postalCode.trim() && city.trim()) {
            createAddress.mutate({
              location_id: newLocation.id,
              label: name.trim(),
              address_line1: addressLine1.trim(),
              address_line2: addressLine2.trim() || undefined,
              postal_code: postalCode.trim(),
              city: city.trim(),
              country: country.trim(),
              is_default: true,
            });
          }
          onOpenChange(false);
        },
      });
    }
  };

  const isMyDefaultAddress = (addressId: string) => {
    return currentPreference?.delivery_address_id === addressId;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            {location ? t('settings.editLocation') : t('settings.createLocation')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Location Section */}
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="location-name" className="text-sm">{t('settings.locationName')} *</Label>
                <Input
                  id="location-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('settings.locationNamePlaceholder')}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="location-code" className="text-sm">{t('settings.locationCode')}</Label>
                <Input
                  id="location-code"
                  value={shortCode}
                  onChange={(e) => setShortCode(e.target.value)}
                  placeholder="z.B. YUM"
                  maxLength={10}
                />
              </div>
            </div>
            <div className="flex items-center justify-between py-1">
              <Label htmlFor="is-default" className="text-sm font-normal">{t('settings.defaultLocation')}</Label>
              <Switch
                id="is-default"
                checked={isDefault}
                onCheckedChange={setIsDefault}
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="location-email" className="text-sm">{t('settings.locationEmail')}</Label>
              <Input
                id="location-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError('');
                }}
                placeholder={t('settings.locationEmailPlaceholder')}
                className={emailError ? 'border-destructive' : ''}
              />
              {emailError && (
                <p className="text-xs text-destructive">{emailError}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Primary Address Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">{t('settings.primaryAddress')}</Label>
              {location && primaryAddress && (
                <Button
                  variant={isMyDefaultAddress(primaryAddress.id) ? "secondary" : "outline"}
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => handleSetAsMyDefault(primaryAddress.id)}
                  disabled={upsertPreference.isPending || isMyDefaultAddress(primaryAddress.id)}
                >
                  {isMyDefaultAddress(primaryAddress.id) ? (
                    <>
                      <Check className="h-3 w-3" />
                      {t('settings.myDefaultAddress')}
                    </>
                  ) : (
                    <>
                      <Star className="h-3 w-3" />
                      {t('settings.setAsMyDefault')}
                    </>
                  )}
                </Button>
              )}
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="address_line1" className="text-sm">{t('settings.addressLine1')} *</Label>
              <Input
                id="address_line1"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder={t('settings.addressLine1Placeholder')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address_line2" className="text-sm">{t('settings.addressLine2')}</Label>
              <Input
                id="address_line2"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                placeholder={t('settings.addressLine2Placeholder')}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="postal_code" className="text-sm">{t('settings.postalCode')} *</Label>
                <Input
                  id="postal_code"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="80469"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="city" className="text-sm">{t('settings.city')} *</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="München"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="country" className="text-sm">{t('settings.country')}</Label>
              <Input
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Germany"
              />
            </div>
          </div>

          {/* Additional addresses for existing locations */}
          {location && additionalAddresses.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-muted-foreground"
                  onClick={() => setShowAdditionalAddresses(!showAdditionalAddresses)}
                >
                  {showAdditionalAddresses ? '▼' : '▶'} {additionalAddresses.length} {t('settings.additionalAddresses', { count: additionalAddresses.length })}
                </Button>
                
                {showAdditionalAddresses && (
                  <div className="space-y-2 pl-4">
                    {additionalAddresses.map((addr) => (
                      <div key={addr.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{addr.label}</span>
                            {isMyDefaultAddress(addr.id) && (
                              <Badge variant="secondary" className="text-xs h-5">
                                <Check className="h-3 w-3 mr-1" />
                                {t('settings.myDefault')}
                              </Badge>
                            )}
                          </div>
                          <span className="text-muted-foreground truncate block">
                            {addr.address_line1}, {addr.postal_code} {addr.city}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          {!isMyDefaultAddress(addr.id) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              title={t('settings.setAsMyDefault')}
                              onClick={() => handleSetAsMyDefault(addr.id)}
                              disabled={upsertPreference.isPending}
                            >
                              <Star className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => deleteAddress.mutate(addr.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          <Button onClick={handleSave} className="w-full" disabled={isSaving || !name.trim()}>
            {isSaving ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Location Item (simplified - just shows inline, clicking opens combined dialog)
const LocationItem = ({ 
  location, 
  onEdit 
}: { 
  location: Location; 
  onEdit: () => void;
}) => {
  const { t } = useTranslation();
  const { data: addresses = [] } = useDeliveryAddresses(location.id);
  const { data: allPreferences = [] } = useAllUserDeliveryPreferences();
  const deleteLocation = useDeleteLocation();
  const primaryAddress = addresses.find(a => a.is_default) || addresses[0];
  
  const myDefaultAddress = allPreferences.find(p => p.location_id === location.id);
  const myDefaultAddressData = myDefaultAddress 
    ? addresses.find(a => a.id === myDefaultAddress.delivery_address_id) 
    : null;

  const handleDelete = () => {
    if (confirm(t('settings.deleteLocationConfirm'))) {
      deleteLocation.mutate(location.id);
    }
  };

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors group bg-background">
      <div className="flex items-center gap-3 min-w-0">
        <Store className="h-4 w-4 text-primary shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium">{location.short_code || location.name}</span>
            {location.short_code && (
              <span className="text-sm text-muted-foreground ml-1">({location.name})</span>
            )}
            {location.is_default && (
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            )}
          </div>
          {primaryAddress && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="truncate">
                {primaryAddress.address_line1}, {primaryAddress.postal_code} {primaryAddress.city}
              </span>
              {addresses.length > 1 && (
                <span className="text-xs">+{addresses.length - 1}</span>
              )}
            </div>
          )}
          {!primaryAddress && (
            <div className="text-sm text-muted-foreground italic">
              {t('settings.noAddress')}
            </div>
          )}
          {location.email && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span className="truncate">{location.email}</span>
            </div>
          )}
          {myDefaultAddressData && myDefaultAddressData.id !== primaryAddress?.id && (
            <div className="flex items-center gap-1.5 text-xs text-primary mt-0.5">
              <Check className="h-3 w-3" />
              <span>{t('settings.myDefaultShort')}: {myDefaultAddressData.label}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
        <Button size="sm" variant="ghost" className="h-10 w-10 sm:h-8 sm:w-8 p-0" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
        </Button>
        {!location.is_default && (
          <Button
            size="sm"
            variant="ghost"
            className="h-10 w-10 sm:h-8 sm:w-8 p-0 text-destructive hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export const LocationsWithAddressesTab = () => {
  const { t } = useTranslation();
  const { data: locations = [], isLoading } = useLocations();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  const handleOpenDialog = (location?: Location) => {
    setEditingLocation(location || null);
    setDialogOpen(true);
  };

  if (isLoading) {
    return <Card><CardContent className="p-6">{t('common.loading')}</CardContent></Card>;
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <Accordion type="multiple" className="w-full">
            <AccordionItem value="locations">
              <AccordionTrigger className="group px-4 py-3 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-primary/5">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-muted-foreground group-data-[state=open]:text-primary transition-colors" />
                  <span className="font-medium group-data-[state=open]:text-primary transition-colors">{t('settings.manageLocations')}</span>
                  <Badge variant="secondary" className="ml-1">{locations.length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 bg-primary/5">
                <p className="text-sm text-muted-foreground mb-4">{t('settings.locationsWithAddressesDesc')}</p>
                
                <Button className="gap-2 w-full sm:w-auto mb-4" onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4" />
                  <span>{t('settings.addLocation')}</span>
                </Button>

                {locations.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    {t('settings.noLocations')}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {locations.map((location) => (
                      <LocationItem 
                        key={location.id} 
                        location={location} 
                        onEdit={() => handleOpenDialog(location)}
                      />
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <LocationFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        location={editingLocation}
      />
    </>
  );
};