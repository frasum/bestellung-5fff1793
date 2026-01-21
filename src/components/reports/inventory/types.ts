import { Article } from '@/hooks/useArticles';

export interface LocalInventoryItem {
  article_id: string;
  storage_1: number;
  storage_2: number;
  unit_price?: number;
}

export interface SupplierGroup {
  supplier: { id: string; name: string };
  articles: Article[];
  capturedCount: number;
  totalValue: number;
}

export interface SessionStats {
  totalArticles: number;
  capturedArticles: number;
  totalValue: number;
  progressPercent: number;
}

export const DEFAULT_UNITS = ['kg', 'g', 'Stück', 'Stk', 'Liter', 'l', '0,75l', '1,0l', 'ml', 'Pg.', 'Ka.', 'Kt.', 'Fl.', 'Dose', 'Bund', 'Beutel', 'Pack'];
