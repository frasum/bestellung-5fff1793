import { useState, useCallback } from 'react';
import { IndustryTemplate, getIndustryById } from '@/data/industryTemplates';

export type OnboardingStep = 
  | 'industry'
  | 'welcome'
  | 'supplier'
  | 'articles'
  | 'review'
  | 'completion';

export interface CreatedSupplier {
  id?: string;
  name: string;
  email?: string;
  customerNumber?: string;
}

export interface CreatedArticle {
  id?: string;
  name: string;
  unit: string;
  price?: number;
  category?: string;
  supplierId?: string;
  supplierName: string;
}

interface OnboardingState {
  currentStep: OnboardingStep;
  selectedIndustry: IndustryTemplate | null;
  importCategories: boolean;
  createdSuppliers: CreatedSupplier[];
  createdArticles: CreatedArticle[];
  currentSupplier: CreatedSupplier | null;
}

const STEP_ORDER: OnboardingStep[] = ['industry', 'welcome', 'supplier', 'articles', 'review', 'completion'];

export function useQuestionOnboarding() {
  const [state, setState] = useState<OnboardingState>({
    currentStep: 'industry',
    selectedIndustry: null,
    importCategories: true,
    createdSuppliers: [],
    createdArticles: [],
    currentSupplier: null,
  });

  const selectIndustry = useCallback((industryId: string) => {
    const industry = getIndustryById(industryId);
    if (industry) {
      setState((prev) => ({
        ...prev,
        selectedIndustry: industry,
      }));
    }
  }, []);

  const setImportCategories = useCallback((value: boolean) => {
    setState((prev) => ({ ...prev, importCategories: value }));
  }, []);

  const goToStep = useCallback((step: OnboardingStep) => {
    setState((prev) => ({ ...prev, currentStep: step }));
  }, []);

  const nextStep = useCallback(() => {
    setState((prev) => {
      const currentIndex = STEP_ORDER.indexOf(prev.currentStep);
      if (currentIndex < STEP_ORDER.length - 1) {
        return { ...prev, currentStep: STEP_ORDER[currentIndex + 1] };
      }
      return prev;
    });
  }, []);

  const prevStep = useCallback(() => {
    setState((prev) => {
      const currentIndex = STEP_ORDER.indexOf(prev.currentStep);
      if (currentIndex > 0) {
        return { ...prev, currentStep: STEP_ORDER[currentIndex - 1] };
      }
      return prev;
    });
  }, []);

  const addSupplier = useCallback((supplier: CreatedSupplier) => {
    setState((prev) => ({
      ...prev,
      createdSuppliers: [...prev.createdSuppliers, supplier],
      currentSupplier: supplier,
    }));
  }, []);

  const updateSupplier = useCallback((index: number, supplier: CreatedSupplier) => {
    setState((prev) => {
      const updated = [...prev.createdSuppliers];
      updated[index] = supplier;
      return { ...prev, createdSuppliers: updated };
    });
  }, []);

  const removeSupplier = useCallback((index: number) => {
    setState((prev) => {
      const supplierName = prev.createdSuppliers[index]?.name;
      return {
        ...prev,
        createdSuppliers: prev.createdSuppliers.filter((_, i) => i !== index),
        createdArticles: prev.createdArticles.filter((a) => a.supplierName !== supplierName),
      };
    });
  }, []);

  const setCurrentSupplier = useCallback((supplier: CreatedSupplier | null) => {
    setState((prev) => ({ ...prev, currentSupplier: supplier }));
  }, []);

  const addArticle = useCallback((article: CreatedArticle) => {
    setState((prev) => ({
      ...prev,
      createdArticles: [...prev.createdArticles, article],
    }));
  }, []);

  const updateArticle = useCallback((index: number, article: CreatedArticle) => {
    setState((prev) => {
      const updated = [...prev.createdArticles];
      updated[index] = article;
      return { ...prev, createdArticles: updated };
    });
  }, []);

  const removeArticle = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      createdArticles: prev.createdArticles.filter((_, i) => i !== index),
    }));
  }, []);

  const getArticlesForSupplier = useCallback(
    (supplierName: string) => {
      return state.createdArticles.filter((a) => a.supplierName === supplierName);
    },
    [state.createdArticles]
  );

  const getProgress = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(state.currentStep);
    return ((currentIndex + 1) / STEP_ORDER.length) * 100;
  }, [state.currentStep]);

  const canGoBack = useCallback(() => {
    return STEP_ORDER.indexOf(state.currentStep) > 0;
  }, [state.currentStep]);

  return {
    ...state,
    selectIndustry,
    setImportCategories,
    goToStep,
    nextStep,
    prevStep,
    addSupplier,
    updateSupplier,
    removeSupplier,
    setCurrentSupplier,
    addArticle,
    updateArticle,
    removeArticle,
    getArticlesForSupplier,
    getProgress,
    canGoBack,
  };
}
