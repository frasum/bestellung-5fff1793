export interface Supplier {
  id: string;
  name: string;
  email: string;
  customer_number?: string;
}

export interface IdentificationResult {
  matched_article_id: string | null;
  matched_article_name: string | null;
  confidence: 'high' | 'medium' | 'low';
  suggested_name: string;
  suggested_description: string;
  suggested_category: string;
  suggested_unit: string;
}

export type WizardStep = 'loading' | 'error' | 'photo' | 'batch-photos' | 'batch-processing' | 'batch-review' | 'article' | 'supplier' | 'confirm';

export interface BatchResult {
  successCount: number;
  failCount: number;
}

export interface PhotoCaptureState {
  // Token verification
  step: WizardStep;
  errorMessage: string;
  organizationId: string | null;
  organizationName: string;
  suppliers: Supplier[];
  categories: string[];
  units: string[];
  
  // Mode
  batchMode: boolean;
  
  // Processing
  isAnalyzing: boolean;
  isSaving: boolean;
  
  // Single photo
  previewImage: string | null;
  identificationResult: IdentificationResult | null;
  
  // Single article form
  articleName: string;
  articleDescription: string;
  articleCategory: string;
  articleUnit: string;
  articlePrice: string;
  articleSku: string;
  
  // Supplier
  supplierMode: 'existing' | 'new';
  selectedSupplierId: string;
  supplierSearch: string;
  newSupplierName: string;
  newSupplierEmail: string;
  newSupplierPhone: string;
  newSupplierCustomerNumber: string;
  
  // Batch result
  batchResult: BatchResult | null;
}
