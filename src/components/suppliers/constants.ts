import { ImportField } from '@/components/CsvImportDialog';

export const TOP_CATEGORIES = ['Küche', 'Getränke', 'Bedarfsartikel'] as const;
export const DEFAULT_UNITS = ['kg', 'g', 'L', 'ml', 'Stk', 'Karton', 'Bund', 'Packung'];

export const SUPPLIER_IMPORT_FIELDS: ImportField[] = [
  { name: 'name', label: 'Name', required: true },
  { name: 'email', label: 'Email', required: true },
  { name: 'phone', label: 'Phone', required: false },
  { name: 'address', label: 'Address', required: false },
  { name: 'contact_person', label: 'Contact Person', required: false },
  { name: 'customer_number', label: 'Customer Number', required: false },
  { name: 'minimum_order_value', label: 'Minimum Order Value', required: false },
];

export const ARTICLE_IMPORT_FIELDS: ImportField[] = [
  { name: 'name', label: 'Name', required: true },
  { name: 'supplier', label: 'Supplier', required: true },
  { name: 'price', label: 'Price', required: true },
  { name: 'unit', label: 'Unit', required: false },
  { name: 'sku', label: 'SKU', required: false },
  { name: 'category', label: 'Category', required: false },
  { name: 'description', label: 'Description', required: false },
  { name: 'reference_price', label: 'Reference Price', required: false },
  { name: 'reference_unit', label: 'Reference Unit', required: false },
];
