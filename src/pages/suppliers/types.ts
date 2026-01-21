import { Supplier } from '@/hooks/useSuppliers';
import { Article } from '@/hooks/useArticles';

export interface SupplierDialogState {
  isOpen: boolean;
  editingSupplier: Supplier | null;
}

export interface ArticleDialogState {
  isOpen: boolean;
  editingArticle: Article | null;
  preselectedSupplierId: string | null;
}

export interface DeleteState {
  deletingSupplier: Supplier | null;
  deletingArticle: Article | null;
}

export interface ChangesDialogState {
  supplier: Supplier | null;
  article: { id: string; name: string } | null;
}

export interface AddArticleSheetState {
  open: boolean;
  supplierId: string;
  supplierName: string;
}

export interface SupplierTabFilters {
  searchQuery: string;
  topCategoryFilter: string;
  categoryFilter: string;
}

export interface ArticleTabFilters {
  searchQuery: string;
  selectedSuppliers: string[];
  selectedCategory: string;
}
