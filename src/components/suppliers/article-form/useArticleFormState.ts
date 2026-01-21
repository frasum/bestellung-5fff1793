import { useEffect, useState, useRef, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { articleSchema, ArticleFormData } from '../schemas';
import { useOrderUnits, useCreateOrderUnit } from '@/hooks/useOrderUnits';
import { useLocations } from '@/hooks/useLocations';
import { useArticleLocations, useUpdateArticleLocations } from '@/hooks/useArticleLocations';
import { supabase } from '@/integrations/supabase/client';
import { Article } from '@/hooks/useArticles';
import { getErrorMessage } from '@/lib/errorUtils';

interface UseArticleFormStateProps {
  open: boolean;
  editingArticle: Article | null;
  preselectedSupplierId?: string | null;
}

export function useArticleFormState({
  open,
  editingArticle,
  preselectedSupplierId,
}: UseArticleFormStateProps) {
  // State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [imageCleared, setImageCleared] = useState(false);
  const [advancedSettingsEnabled, setAdvancedSettingsEnabled] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [translationsOpen, setTranslationsOpen] = useState(false);
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);

  // Hooks
  const { data: orderUnits = [] } = useOrderUnits();
  const createOrderUnit = useCreateOrderUnit();
  const { data: locations = [] } = useLocations();
  const { data: articleLocations = [] } = useArticleLocations(editingArticle?.id);
  const updateArticleLocations = useUpdateArticleLocations();

  // Refs for auto-growing textareas
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const grapeVarietyRef = useRef<HTMLTextAreaElement>(null);
  const flavorProfileRef = useRef<HTMLTextAreaElement>(null);
  const foodPairingsRef = useRef<HTMLTextAreaElement>(null);

  // Form
  const form = useForm<ArticleFormData>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      supplier_id: '', name: '', description: '', sku: '', unit: 'pcs', price: '', category: '',
      origin_country: '', packaging_unit: '', order_unit_id: '', reference_price: '', reference_unit: '',
      selling_price: '', grape_variety: '', flavor_profile: '', food_pairings: '', special_attributes: '',
      description_en: '', grape_variety_en: '', flavor_profile_en: '', food_pairings_en: '', origin_country_en: '',
      description_th: '', grape_variety_th: '', flavor_profile_th: '', food_pairings_th: '', origin_country_th: '',
      description_fr: '', grape_variety_fr: '', flavor_profile_fr: '', food_pairings_fr: '', origin_country_fr: '',
    },
  });

  // Watch category for conditional rendering
  const watchedCategory = form.watch('category');
  const isWineCategory = watchedCategory?.toLowerCase().includes('wein');

  // Fetch organization ID
  useEffect(() => {
    const fetchOrgId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();
          if (profile) {
            setOrganizationId(profile.organization_id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch org ID:', getErrorMessage(error));
      }
    };
    fetchOrgId();
  }, []);

  // Check for advanced settings
  useEffect(() => {
    const stored = localStorage.getItem('advanced-settings-enabled');
    setAdvancedSettingsEnabled(stored === 'true');

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'advanced-settings-enabled') {
        setAdvancedSettingsEnabled(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Auto-resize textareas when form data changes
  useEffect(() => {
    const adjustHeight = (textarea: HTMLTextAreaElement | null, minHeight: number) => {
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.max(minHeight, textarea.scrollHeight)}px`;
      }
    };

    const timeoutId = setTimeout(() => {
      adjustHeight(descriptionRef.current, 80);
      adjustHeight(grapeVarietyRef.current, 60);
      adjustHeight(flavorProfileRef.current, 60);
      adjustHeight(foodPairingsRef.current, 60);
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [open, editingArticle]);

  // Reset form when editingArticle changes
  useEffect(() => {
    if (editingArticle) {
      form.reset({
        supplier_id: editingArticle.supplier_id,
        name: editingArticle.name,
        description: editingArticle.description || '',
        sku: editingArticle.sku || '',
        unit: editingArticle.unit,
        price: String(editingArticle.price),
        category: editingArticle.category || '',
        origin_country: editingArticle.origin_country || '',
        packaging_unit: editingArticle.packaging_unit ? String(editingArticle.packaging_unit) : '',
        order_unit_id: editingArticle.order_unit_id || '',
        reference_price: editingArticle.reference_price ? String(editingArticle.reference_price).replace('.', ',') : '',
        reference_unit: editingArticle.reference_unit || '',
        selling_price: editingArticle.selling_price ? String(editingArticle.selling_price) : '',
        grape_variety: editingArticle.grape_variety || '',
        flavor_profile: editingArticle.flavor_profile || '',
        food_pairings: editingArticle.food_pairings || '',
        special_attributes: editingArticle.special_attributes || '',
        description_en: editingArticle.description_en || '',
        grape_variety_en: editingArticle.grape_variety_en || '',
        flavor_profile_en: editingArticle.flavor_profile_en || '',
        food_pairings_en: editingArticle.food_pairings_en || '',
        origin_country_en: editingArticle.origin_country_en || '',
        description_th: editingArticle.description_th || '',
        grape_variety_th: editingArticle.grape_variety_th || '',
        flavor_profile_th: editingArticle.flavor_profile_th || '',
        food_pairings_th: editingArticle.food_pairings_th || '',
        origin_country_th: editingArticle.origin_country_th || '',
        description_fr: editingArticle.description_fr || '',
        grape_variety_fr: editingArticle.grape_variety_fr || '',
        flavor_profile_fr: editingArticle.flavor_profile_fr || '',
        food_pairings_fr: editingArticle.food_pairings_fr || '',
        origin_country_fr: editingArticle.origin_country_fr || '',
      });
      setCapturedImage(editingArticle.image_url || null);
    } else {
      form.reset({
        supplier_id: preselectedSupplierId || '', name: '', description: '', sku: '', unit: 'pcs', price: '', category: '',
        origin_country: '', packaging_unit: '', order_unit_id: '', reference_price: '', reference_unit: '',
        selling_price: '', grape_variety: '', flavor_profile: '', food_pairings: '', special_attributes: '',
        description_en: '', grape_variety_en: '', flavor_profile_en: '', food_pairings_en: '', origin_country_en: '',
        description_th: '', grape_variety_th: '', flavor_profile_th: '', food_pairings_th: '', origin_country_th: '',
        description_fr: '', grape_variety_fr: '', flavor_profile_fr: '', food_pairings_fr: '', origin_country_fr: '',
      });
      setCapturedImage(null);
    }
    setImageCleared(false);
    setTranslationsOpen(false);
  }, [editingArticle, preselectedSupplierId, form]);

  // Stable location IDs to prevent infinite loops
  const locationIds = useMemo(() => locations.map(l => l.id), [locations]);
  const articleLocationIds = useMemo(() =>
    articleLocations.filter(al => al.is_active).map(al => al.location_id),
    [articleLocations]
  );

  // Initialize selected locations when editing or for new articles
  useEffect(() => {
    if (!open) return;

    if (editingArticle && articleLocations.length > 0) {
      setSelectedLocationIds(articleLocationIds);
    } else if (!editingArticle && locations.length > 0) {
      setSelectedLocationIds(locationIds);
    }
  }, [open, editingArticle, articleLocationIds.join(','), locationIds.join(',')]);

  return {
    // Form
    form,
    watchedCategory,
    isWineCategory,
    
    // State
    isAnalyzing,
    setIsAnalyzing,
    capturedImage,
    setCapturedImage,
    imageCleared,
    setImageCleared,
    advancedSettingsEnabled,
    organizationId,
    translationsOpen,
    setTranslationsOpen,
    selectedLocationIds,
    setSelectedLocationIds,
    
    // Data
    orderUnits,
    createOrderUnit,
    locations,
    updateArticleLocations,
    
    // Refs
    descriptionRef,
    grapeVarietyRef,
    flavorProfileRef,
    foodPairingsRef,
  };
}
