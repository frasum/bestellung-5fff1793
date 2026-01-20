export interface Unit {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface SupplierSession {
  supplierId: string;
  supplierName: string;
  organizationId: string;
  sessionToken: string;
  expiresAt: string;
  priceEditExpiresAt?: string;
  canEditPrices?: boolean;
}

export interface Article {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  unit: string;
  price: number;
  category: string | null;
  is_active: boolean;
  annual_order_value: number | null;
  packaging_unit: number | null;
  reference_price: number | null;
  reference_unit: string | null;
  image_url?: string | null;
  order_unit_id?: string | null;
}

export interface OrderUnit {
  id: string;
  name: string;
  quantity: number;
}

export interface PendingChange {
  id: string;
  article_id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  status: string;
  created_at: string;
}

export interface PortalSettings {
  portal_title: string;
  welcome_message: string | null;
  card_title: string;
  card_description: string;
  info_text: string | null;
  footer_text: string | null;
  logo_url: string | null;
  visible_columns: string[] | null;
}

export interface DraftData {
  editedArticles: Record<string, Partial<Article>>;
  priceInputs: Record<string, string>;
  annualOrderValueInputs: Record<string, string>;
  orderUnitInputs: Record<string, string>;
  referencePriceInputs: Record<string, string>;
  descriptionInputs?: Record<string, string>;
}

export const defaultPortalSettings: PortalSettings = {
  portal_title: 'Lieferantenportal',
  welcome_message: null,
  card_title: 'Meine Artikel',
  card_description: 'Änderungen werden zur Genehmigung eingereicht.',
  info_text: null,
  footer_text: null,
  logo_url: null,
  visible_columns: null,
};

export const defaultVisibleColumns = ['sku', 'description', 'unit', 'packaging_unit', 'price', 'annual_order_value'];

export const lightModeStyles: React.CSSProperties = {
  '--background': '0 0% 98%',
  '--foreground': '224 71% 4%',
  '--card': '0 0% 100%',
  '--card-foreground': '224 71% 4%',
  '--popover': '0 0% 100%',
  '--popover-foreground': '224 71% 4%',
  '--primary': '174 100% 29%',
  '--primary-foreground': '0 0% 100%',
  '--secondary': '220 14% 96%',
  '--secondary-foreground': '220 9% 46%',
  '--muted': '220 14% 96%',
  '--muted-foreground': '220 9% 46%',
  '--accent': '220 14% 96%',
  '--accent-foreground': '224 71% 4%',
  '--destructive': '0 84% 60%',
  '--destructive-foreground': '0 0% 100%',
  '--border': '220 13% 91%',
  '--input': '220 13% 91%',
  '--ring': '174 100% 29%',
  colorScheme: 'light',
} as React.CSSProperties;
