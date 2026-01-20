export const LANGUAGES = [
  { code: 'th', name: 'ไทย (Thai)' },
  { code: 'de', name: 'Deutsch' },
  { code: 'en', name: 'English' },
  { code: 'vi', name: 'Tiếng Việt' },
];

export interface LocationAssignment {
  locationId: string;
  enabled: boolean;
  supplierIds: string[];
}

export interface EmployeeFormData {
  name: string;
  phone: string;
  email: string;
  notes: string;
  language: string;
  autoApprove: boolean;
  pinCode: string;
  voiceInputEnabled: boolean;
  canAddFreeItems: boolean;
  canCapturePhotos: boolean;
  wineCatalogAccess: 'none' | 'view' | 'edit';
}

export const initialFormData: EmployeeFormData = {
  name: '',
  phone: '',
  email: '',
  notes: '',
  language: 'th',
  autoApprove: false,
  pinCode: '',
  voiceInputEnabled: false,
  canAddFreeItems: false,
  canCapturePhotos: false,
  wineCatalogAccess: 'none',
};
