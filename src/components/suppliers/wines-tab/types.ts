import { Article } from '@/hooks/useArticles';
import { Supplier } from '@/hooks/useSuppliers';

export interface WineResearchResult {
  description: string;
  grape_variety: string;
  region: string;
  origin_country: string;
  flavor_profile: string;
  food_pairings: string;
  producer_info: string;
  citations: string[];
  image_url?: string;
  image_source?: string;
}

export interface WinesTabProps {
  articles: Article[];
  suppliers: Supplier[];
  onEditArticle: (article: Article) => void;
}

export type FilterMode = 'all' | 'incomplete' | 'missing-description' | 'missing-grape' | 'missing-origin' | 'missing-price';

export interface BatchProgress {
  current: number;
  total: number;
  wineName: string;
}

export interface WineCardProps {
  wine: Article;
  onEdit: () => void;
}
