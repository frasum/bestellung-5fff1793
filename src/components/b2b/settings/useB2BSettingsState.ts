import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errorUtils';

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

interface Supplier {
  id: string;
  name: string;
}

export interface B2BSupplier {
  id: string;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  description: string | null;
  is_active: boolean | null;
  article_count?: number;
  account_id: string;
  logo_url: string | null;
  sort_order: number | null;
  created_at: string | null;
  updated_at: string | null;
  order_delivery_method: string;
}

export interface B2BSupplierUser {
  id: string;
  user_id: string;
  supplier_id: string;
  account_id: string;
  role: string;
  email: string;
  name: string | null;
  created_at: string | null;
  supplier_name?: string;
}

interface UseB2BSettingsStateProps {
  account: B2BAccount;
  onUpdate: () => void;
  selectedSupplierId?: string;
  onSuppliersChange?: () => void;
  isSupplierUser?: boolean;
}

export function useB2BSettingsState({
  account,
  onUpdate,
  selectedSupplierId,
  onSuppliersChange,
  isSupplierUser = false,
}: UseB2BSettingsStateProps) {
  // Portal settings state
  const [loading, setLoading] = useState(false);
  const [primaryColor, setPrimaryColor] = useState(account.primary_color);
  const [secondaryColor, setSecondaryColor] = useState(account.secondary_color);
  const [welcomeMessage, setWelcomeMessage] = useState(account.welcome_message || '');
  const [linkedSupplierId, setLinkedSupplierId] = useState(account.linked_supplier_id || 'none');
  const [bestellungSuppliers, setBestellungSuppliers] = useState<Supplier[]>([]);
  const [copied, setCopied] = useState(false);
  const [logoUrl, setLogoUrl] = useState(account.logo_url);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // B2B Suppliers state
  const [b2bSuppliers, setB2bSuppliers] = useState<B2BSupplier[]>([]);
  const [loadingB2bSuppliers, setLoadingB2bSuppliers] = useState(false);
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<B2BSupplier | null>(null);
  const [deleteSupplierToDelete, setDeleteSupplierToDelete] = useState<B2BSupplier | null>(null);

  // Selected supplier profile state
  const [supplierName, setSupplierName] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierDescription, setSupplierDescription] = useState('');
  const [supplierOrderDeliveryMethod, setSupplierOrderDeliveryMethod] = useState<string>('email');
  const [savingSupplier, setSavingSupplier] = useState(false);

  // Supplier users state
  const [supplierUsers, setSupplierUsers] = useState<B2BSupplierUser[]>([]);
  const [loadingSupplierUsers, setLoadingSupplierUsers] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [deleteUserToDelete, setDeleteUserToDelete] = useState<B2BSupplierUser | null>(null);

  const portalUrl = `${window.location.origin}/b2b/portal/${account.subdomain}`;

  // Load data on mount
  useEffect(() => {
    loadBestellungSuppliers();
    loadB2bSuppliers();
    if (!isSupplierUser) {
      loadSupplierUsers();
    }
  }, [isSupplierUser]);

  // Load selected supplier data
  useEffect(() => {
    if (selectedSupplierId && b2bSuppliers.length > 0) {
      const supplier = b2bSuppliers.find(s => s.id === selectedSupplierId);
      if (supplier) {
        setSupplierName(supplier.name);
        setSupplierEmail(supplier.contact_email || '');
        setSupplierPhone(supplier.contact_phone || '');
        setSupplierDescription(supplier.description || '');
        setSupplierOrderDeliveryMethod(supplier.order_delivery_method || 'email');
      }
    }
  }, [selectedSupplierId, b2bSuppliers]);

  const loadBestellungSuppliers = async () => {
    try {
      const allSuppliers: Supplier[] = [];

      if (account.linked_supplier_id) {
        const { data: linkedSupplier } = await supabase
          .from('suppliers')
          .select('id, name')
          .eq('id', account.linked_supplier_id)
          .maybeSingle();
        if (linkedSupplier) allSuppliers.push(linkedSupplier);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.organization_id) {
          const { data: orgSuppliers } = await supabase
            .from('suppliers')
            .select('id, name')
            .eq('organization_id', profile.organization_id)
            .order('name');

          if (orgSuppliers) {
            const existingIds = new Set(allSuppliers.map(s => s.id));
            for (const s of orgSuppliers) {
              if (!existingIds.has(s.id)) allSuppliers.push(s);
            }
          }
        }
      }
      setBestellungSuppliers(allSuppliers);
    } catch (error) {
      console.error('Error loading suppliers:', getErrorMessage(error));
    }
  };

  const loadB2bSuppliers = async () => {
    setLoadingB2bSuppliers(true);
    try {
      const { data, error } = await supabase
        .from('b2b_suppliers')
        .select('*')
        .eq('account_id', account.id)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      const suppliersWithCounts = await Promise.all(
        (data || []).map(async (supplier) => {
          const { count } = await supabase
            .from('supplier_b2b_articles')
            .select('id', { count: 'exact', head: true })
            .eq('supplier_id', supplier.id);
          return { ...supplier, article_count: count || 0 };
        })
      );
      setB2bSuppliers(suppliersWithCounts);
    } catch (error) {
      console.error('Error loading B2B suppliers:', getErrorMessage(error));
    } finally {
      setLoadingB2bSuppliers(false);
    }
  };

  const loadSupplierUsers = async () => {
    setLoadingSupplierUsers(true);
    try {
      const { data, error } = await supabase
        .from('b2b_supplier_users')
        .select('*')
        .eq('account_id', account.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const usersWithSupplierNames = (data || []).map(user => {
        const supplier = b2bSuppliers.find(s => s.id === user.supplier_id);
        return { ...user, supplier_name: supplier?.name || 'Unbekannt' };
      });
      setSupplierUsers(usersWithSupplierNames);
    } catch (error) {
      console.error('Error loading supplier users:', getErrorMessage(error));
    } finally {
      setLoadingSupplierUsers(false);
    }
  };

  const handleSaveSupplier = async () => {
    if (!selectedSupplierId) return;

    setSavingSupplier(true);
    try {
      const { error } = await supabase
        .from('b2b_suppliers')
        .update({
          name: supplierName,
          contact_email: supplierEmail || null,
          contact_phone: supplierPhone || null,
          description: supplierDescription || null,
          order_delivery_method: supplierOrderDeliveryMethod,
        })
        .eq('id', selectedSupplierId);

      if (error) throw error;

      toast.success('Lieferanten-Daten gespeichert');
      loadB2bSuppliers();
      onSuppliersChange?.();
      onUpdate();
    } catch (error) {
      toast.error('Fehler beim Speichern');
    } finally {
      setSavingSupplier(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('supplier_b2b_accounts')
        .update({
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          welcome_message: welcomeMessage || null,
          linked_supplier_id: linkedSupplierId === 'none' ? null : linkedSupplierId,
        })
        .eq('id', account.id);

      if (error) throw error;

      toast.success('Portal-Einstellungen gespeichert');
      onUpdate();
    } catch (error) {
      toast.error('Fehler beim Speichern');
    } finally {
      setLoading(false);
    }
  };

  const copyPortalUrl = async () => {
    await navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    toast.success('URL kopiert');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Bitte wählen Sie eine Bilddatei');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Datei zu groß (max. 2MB)');
      return;
    }

    setUploadingLogo(true);
    try {
      if (logoUrl) {
        const oldPath = logoUrl.split('/b2b-portal-logos/')[1]?.split('?')[0];
        if (oldPath) {
          await supabase.storage.from('b2b-portal-logos').remove([oldPath]);
        }
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${account.id}/logo-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('b2b-portal-logos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('b2b-portal-logos')
        .getPublicUrl(fileName);

      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('supplier_b2b_accounts')
        .update({ logo_url: urlWithCacheBust })
        .eq('id', account.id);

      if (updateError) throw updateError;

      setLogoUrl(urlWithCacheBust);
      toast.success('Logo hochgeladen');
      onUpdate();
    } catch (error) {
      toast.error('Fehler beim Hochladen: ' + getErrorMessage(error));
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!logoUrl) return;

    try {
      const path = logoUrl.split('/b2b-portal-logos/')[1]?.split('?')[0];
      if (path) {
        await supabase.storage.from('b2b-portal-logos').remove([path]);
      }

      await supabase
        .from('supplier_b2b_accounts')
        .update({ logo_url: null })
        .eq('id', account.id);

      setLogoUrl(null);
      toast.success('Logo entfernt');
      onUpdate();
    } catch (error) {
      toast.error('Fehler beim Entfernen: ' + getErrorMessage(error));
    }
  };

  const handleDeleteSupplier = async () => {
    if (!deleteSupplierToDelete) return;

    if (deleteSupplierToDelete.article_count && deleteSupplierToDelete.article_count > 0) {
      toast.error(`Lieferant hat ${deleteSupplierToDelete.article_count} Artikel. Bitte löschen Sie zuerst alle Artikel.`);
      setDeleteSupplierToDelete(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('b2b_suppliers')
        .delete()
        .eq('id', deleteSupplierToDelete.id);

      if (error) throw error;

      toast.success('Lieferant gelöscht');
      loadB2bSuppliers();
      onSuppliersChange?.();
      onUpdate();
    } catch (error) {
      toast.error('Fehler beim Löschen');
    } finally {
      setDeleteSupplierToDelete(null);
    }
  };

  const handleDeleteSupplierUser = async () => {
    if (!deleteUserToDelete) return;

    try {
      const { error } = await supabase
        .from('b2b_supplier_users')
        .delete()
        .eq('id', deleteUserToDelete.id);

      if (error) throw error;

      toast.success('Benutzer-Zugang entfernt');
      loadSupplierUsers();
    } catch (error) {
      toast.error('Fehler beim Entfernen');
    } finally {
      setDeleteUserToDelete(null);
    }
  };

  return {
    // Portal settings
    loading,
    primaryColor,
    setPrimaryColor,
    secondaryColor,
    setSecondaryColor,
    welcomeMessage,
    setWelcomeMessage,
    linkedSupplierId,
    setLinkedSupplierId,
    bestellungSuppliers,
    copied,
    logoUrl,
    uploadingLogo,
    portalUrl,
    
    // B2B suppliers
    b2bSuppliers,
    loadingB2bSuppliers,
    supplierDialogOpen,
    setSupplierDialogOpen,
    editingSupplier,
    setEditingSupplier,
    deleteSupplierToDelete,
    setDeleteSupplierToDelete,
    
    // Selected supplier
    supplierName,
    setSupplierName,
    supplierEmail,
    setSupplierEmail,
    supplierPhone,
    setSupplierPhone,
    supplierDescription,
    setSupplierDescription,
    supplierOrderDeliveryMethod,
    setSupplierOrderDeliveryMethod,
    savingSupplier,
    
    // Supplier users
    supplierUsers,
    loadingSupplierUsers,
    inviteDialogOpen,
    setInviteDialogOpen,
    deleteUserToDelete,
    setDeleteUserToDelete,
    
    // Actions
    handleSaveSupplier,
    handleSave,
    copyPortalUrl,
    handleLogoUpload,
    handleRemoveLogo,
    handleDeleteSupplier,
    handleDeleteSupplierUser,
    loadB2bSuppliers,
    loadSupplierUsers,
  };
}
