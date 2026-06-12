import { Supplier, SupplierInput } from '@/hooks/useSuppliers';
import { ArticleInput } from '@/hooks/useArticles';
import { ExtractedArticle } from '../VoiceInventoryCapture';

export interface IdentificationResult {
  matched_article_id: string | null;
  matched_article_name: string | null;
  confidence: 'high' | 'medium' | 'low';
  suggested_name: string;
  suggested_description: string;
  suggested_category: string;
  suggested_unit: string;
}

export type WizardStep = 'capture' | 'qr' | 'voice-results' | 'article' | 'supplier' | 'confirm';
export type CaptureMode = 'photo' | 'voice' | 'mobile';

export interface QuickCaptureWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suppliers: Supplier[];
  categories: string[];
  units: string[];
  onCreateSupplier: (input: SupplierInput) => Promise<Supplier>;
  onCreateArticle: (input: ArticleInput) => Promise<{ id: string } & Record<string, unknown>>;
  onUploadImage: (base64: string, orgId: string, articleId: string) => Promise<string | null>;
  organizationId: string | null;
}

export interface ArticleFormState {
  articleName: string;
  articleDescription: string;
  articleCategory: string;
  articleUnit: string;
  articlePrice: string;
  articleSku: string;
}

export interface SupplierFormState {
  supplierMode: 'existing' | 'new';
  selectedSupplierId: string;
  supplierSearch: string;
  newSupplierName: string;
  newSupplierEmail: string;
  newSupplierPhone: string;
  newSupplierCustomerNumber: string;
}

export interface VoiceQueueState {
  voiceTranscript: string;
  voiceArticles: ExtractedArticle[];
  voiceArticleQueue: ExtractedArticle[];
  currentQueueIndex: number;
  createdArticlesCount: number;
}

export interface QuickCaptureState {
  step: WizardStep;
  captureMode: CaptureMode;
  isAnalyzing: boolean;
  isSaving: boolean;
  previewImage: string | null;
  identificationResult: IdentificationResult | null;
  article: ArticleFormState;
  supplier: SupplierFormState;
  voice: VoiceQueueState;
}
