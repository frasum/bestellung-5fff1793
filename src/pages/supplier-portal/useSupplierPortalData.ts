import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { 
  SupplierSession, 
  Article, 
  PendingChange, 
  Unit, 
  Category, 
  OrderUnit, 
  PortalSettings, 
  DraftData 
} from './types';
import { defaultPortalSettings } from './types';

interface UseSupplierPortalDataReturn {
  session: SupplierSession | null;
  articles: Article[];
  setArticles: React.Dispatch<React.SetStateAction<Article[]>>;
  pendingChanges: PendingChange[];
  setPendingChanges: React.Dispatch<React.SetStateAction<PendingChange[]>>;
  loading: boolean;
  units: Unit[];
  setUnits: React.Dispatch<React.SetStateAction<Unit[]>>;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  orderUnits: OrderUnit[];
  portalSettings: PortalSettings;
  hasDraft: boolean;
  setHasDraft: React.Dispatch<React.SetStateAction<boolean>>;
  initialDraftData: DraftData | null;
  handleLogout: () => void;
}

export function useSupplierPortalData(): UseSupplierPortalDataReturn {
  const navigate = useNavigate();
  const [session, setSession] = useState<SupplierSession | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [units, setUnits] = useState<Unit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orderUnits, setOrderUnits] = useState<OrderUnit[]>([]);
  const [portalSettings, setPortalSettings] = useState<PortalSettings>(defaultPortalSettings);
  const [hasDraft, setHasDraft] = useState(false);
  const [initialDraftData, setInitialDraftData] = useState<DraftData | null>(null);

  useEffect(() => {
    const checkSession = () => {
      const storedSession = localStorage.getItem('supplierSession');
      if (!storedSession) {
        navigate('/supplier-login');
        return;
      }

      const parsed: SupplierSession = JSON.parse(storedSession);
      
      if (new Date(parsed.expiresAt) < new Date()) {
        localStorage.removeItem('supplierSession');
        toast.error('Ihre Sitzung ist abgelaufen');
        navigate('/supplier-login');
        return;
      }

      setSession(parsed);
    };

    checkSession();
  }, [navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!session) return;

      try {
        // Fetch portal settings
        const { data: settingsData, error: settingsError } = await supabase.functions.invoke('supplier-portal-articles', {
          body: {
            action: 'get-settings',
            supplierId: session.supplierId,
            organizationId: session.organizationId,
            sessionToken: session.sessionToken,
          },
        });

        if (!settingsError && settingsData?.settings) {
          setPortalSettings(settingsData.settings);
        }

        // Fetch units
        const { data: unitsData, error: unitsError } = await supabase.functions.invoke('supplier-portal-articles', {
          body: {
            action: 'get-units',
            supplierId: session.supplierId,
            organizationId: session.organizationId,
            sessionToken: session.sessionToken,
          },
        });

        if (!unitsError && unitsData?.units) {
          setUnits(unitsData.units);
        }

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase.functions.invoke('supplier-portal-articles', {
          body: {
            action: 'get-categories',
            supplierId: session.supplierId,
            organizationId: session.organizationId,
            sessionToken: session.sessionToken,
          },
        });

        if (!categoriesError && categoriesData?.categories) {
          setCategories(categoriesData.categories);
        }

        // Fetch order units
        const { data: orderUnitsData, error: orderUnitsError } = await supabase.functions.invoke('supplier-portal-articles', {
          body: {
            action: 'get-order-units',
            supplierId: session.supplierId,
            organizationId: session.organizationId,
            sessionToken: session.sessionToken,
          },
        });

        if (!orderUnitsError && orderUnitsData?.orderUnits) {
          setOrderUnits(orderUnitsData.orderUnits);
        }

        // Fetch articles
        const { data, error } = await supabase.functions.invoke('supplier-portal-articles', {
          body: {
            action: 'list',
            supplierId: session.supplierId,
            organizationId: session.organizationId,
            sessionToken: session.sessionToken,
          },
        });

        if (error) throw error;
        setArticles(data?.articles || []);
        setPendingChanges(data?.pendingChanges || []);

        // Fetch draft if exists
        const { data: draftData, error: draftError } = await supabase.functions.invoke('supplier-portal-articles', {
          body: {
            action: 'get-draft',
            supplierId: session.supplierId,
            organizationId: session.organizationId,
            sessionToken: session.sessionToken,
          },
        });

        if (!draftError && draftData?.draft) {
          setInitialDraftData(draftData.draft as DraftData);
          setHasDraft(true);
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
        console.error('Error fetching data:', message);
        toast.error('Fehler beim Laden der Daten');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session]);

  const handleLogout = () => {
    localStorage.removeItem('supplierSession');
    toast.success('Erfolgreich abgemeldet');
    navigate('/supplier-login');
  };

  return {
    session,
    articles,
    setArticles,
    pendingChanges,
    setPendingChanges,
    loading,
    units,
    setUnits,
    categories,
    setCategories,
    orderUnits,
    portalSettings,
    hasDraft,
    setHasDraft,
    initialDraftData,
    handleLogout,
  };
}
