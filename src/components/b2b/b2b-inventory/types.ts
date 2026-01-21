export interface LocalInventoryItem {
  article_id: string;
  storage_1: number;
  storage_2: number;
  unit_price?: number;
}

export interface VendorArticle {
  id: string;
  name: string;
  sku?: string | null;
  category?: string | null;
  price?: number | null;
  unit?: string | null;
  vendor_id: string;
  vendor?: {
    id: string;
    name: string;
  } | null;
}

export interface Vendor {
  id: string;
  name: string;
}

export interface VendorGroup {
  vendor: Vendor;
  articles: VendorArticle[];
  capturedCount: number;
  totalValue: number;
}

export interface SessionStats {
  totalArticles: number;
  capturedArticles: number;
  totalValue: number;
  progressPercent: number;
}

export interface B2BInventoryTabProps {
  accountId: string;
  supplierId?: string;
}
