import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Star, Store } from 'lucide-react';
import { useLocations, useCreateLocation, useUpdateLocation, useDeleteLocation, Location } from '@/hooks/useLocations';

export const LocationsTab = () => {
  const { t } = useTranslation();
  const { data: locations = [], isLoading } = useLocations();
  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();
  const deleteLocation = useDeleteLocation();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [name, setName] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const handleOpenDialog = (location?: Location) => {
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
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    
    if (editingLocation) {
      updateLocation.mutate({
        id: editingLocation.id,
        name: name.trim(),
        short_code: shortCode.trim() || undefined,
        is_default: isDefault,
      }, {
        onSuccess: () => setDialogOpen(false),
      });
    } else {
      createLocation.mutate({
        name: name.trim(),
        short_code: shortCode.trim() || undefined,
        is_default: isDefault,
      }, {
        onSuccess: () => setDialogOpen(false),
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm(t('settings.deleteLocationConfirm'))) {
      deleteLocation.mutate(id);
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
            {t('settings.manageLocationsDesc')}
          </CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4" />
              {t('settings.addLocation')}
            </Button>
          </DialogTrigger>
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
              <Button onClick={handleSave} className="w-full" disabled={createLocation.isPending || updateLocation.isPending}>
                {(createLocation.isPending || updateLocation.isPending) ? t('settings.savingProfile') : t('common.save')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {locations.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            {t('settings.noLocations')}
          </p>
        ) : (
          <div className="space-y-3">
            {locations.map((location) => (
              <div 
                key={location.id} 
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Store className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{location.name}</p>
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
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenDialog(location)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {!location.is_default && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(location.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
