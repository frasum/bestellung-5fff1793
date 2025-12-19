export interface SystemFeature {
  key: string;
  labelDe: string;
  labelEn: string;
  description?: string;
}

export interface SystemFeatureCategory {
  key: string;
  labelDe: string;
  labelEn: string;
  features: SystemFeature[];
}

export const SYSTEM_FEATURES: SystemFeatureCategory[] = [
  {
    key: 'core_ordering',
    labelDe: 'Kern-Bestellsystem',
    labelEn: 'Core Ordering System',
    features: [
      { key: 'supplier_crud', labelDe: 'Lieferanten CRUD', labelEn: 'Supplier CRUD' },
      { key: 'article_crud', labelDe: 'Artikel CRUD', labelEn: 'Article CRUD' },
      { key: 'category_management', labelDe: 'Kategorie-Verwaltung', labelEn: 'Category Management' },
      { key: 'unit_management', labelDe: 'Einheiten-Verwaltung', labelEn: 'Unit Management' },
      { key: 'order_unit_management', labelDe: 'Bestelleinheiten-Verwaltung', labelEn: 'Order Unit Management' },
      { key: 'multi_location', labelDe: 'Multi-Standort-Unterstützung', labelEn: 'Multi-Location Support' },
      { key: 'delivery_addresses', labelDe: 'Lieferadressen-Verwaltung', labelEn: 'Delivery Address Management' },
      { key: 'cart_system', labelDe: 'Warenkorb-System', labelEn: 'Cart System' },
      { key: 'cart_drafts', labelDe: 'Warenkorb-Entwürfe', labelEn: 'Cart Drafts' },
      { key: 'multi_supplier_cart', labelDe: 'Multi-Lieferanten-Warenkorb', labelEn: 'Multi-Supplier Cart' },
      { key: 'checkout_process', labelDe: 'Checkout-Prozess', labelEn: 'Checkout Process' },
      { key: 'order_management', labelDe: 'Bestellverwaltung', labelEn: 'Order Management' },
      { key: 'order_status_tracking', labelDe: 'Bestellstatus-Tracking', labelEn: 'Order Status Tracking' },
      { key: 'order_history', labelDe: 'Bestellhistorie', labelEn: 'Order History' },
      { key: 'order_notes', labelDe: 'Bestellnotizen', labelEn: 'Order Notes' },
      { key: 'test_mode', labelDe: 'Test-Modus', labelEn: 'Test Mode' },
    ],
  },
  {
    key: 'simple_order',
    labelDe: 'EasyOrder (Mitarbeiter-Bestellsystem)',
    labelEn: 'EasyOrder (Employee Ordering)',
    features: [
      { key: 'qr_code_access', labelDe: 'QR-Code Zugang', labelEn: 'QR Code Access' },
      { key: 'pin_authentication', labelDe: 'PIN-Authentifizierung', labelEn: 'PIN Authentication' },
      { key: 'employee_management', labelDe: 'Mitarbeiter-Verwaltung', labelEn: 'Employee Management' },
      { key: 'employee_locations', labelDe: 'Mitarbeiter-Standorte', labelEn: 'Employee Locations' },
      { key: 'employee_suppliers', labelDe: 'Mitarbeiter-Lieferanten', labelEn: 'Employee Suppliers' },
      { key: 'simple_order_tokens', labelDe: 'EasyOrder Tokens', labelEn: 'EasyOrder Tokens' },
      { key: 'multi_supplier_mode', labelDe: 'Multi-Lieferanten-Modus', labelEn: 'Multi-Supplier Mode' },
      { key: 'voice_input', labelDe: 'Spracheingabe', labelEn: 'Voice Input' },
      { key: 'free_text_items', labelDe: 'Freitext-Artikel', labelEn: 'Free Text Items' },
      { key: 'article_favorites', labelDe: 'Artikel-Favoriten', labelEn: 'Article Favorites' },
      { key: 'delivery_date_selection', labelDe: 'Lieferdatum-Auswahl', labelEn: 'Delivery Date Selection' },
      { key: 'time_window_selection', labelDe: 'Zeitfenster-Auswahl', labelEn: 'Time Window Selection' },
      { key: 'order_confirmation_email', labelDe: 'Bestätigungs-E-Mail', labelEn: 'Confirmation Email' },
      { key: 'preorder_approval', labelDe: 'Vorbestellungs-Genehmigung', labelEn: 'Preorder Approval' },
      { key: 'auto_approve_orders', labelDe: 'Auto-Genehmigung', labelEn: 'Auto-Approve Orders' },
    ],
  },
  {
    key: 'supplier_portal',
    labelDe: 'Lieferanten-Portal',
    labelEn: 'Supplier Portal',
    features: [
      { key: 'magic_link_login', labelDe: 'Magic-Link Login', labelEn: 'Magic Link Login' },
      { key: 'token_based_access', labelDe: 'Token-basierter Zugang', labelEn: 'Token-Based Access' },
      { key: 'order_view', labelDe: 'Bestellansicht', labelEn: 'Order View' },
      { key: 'order_confirmation', labelDe: 'Bestellbestätigung', labelEn: 'Order Confirmation' },
      { key: 'price_editing', labelDe: 'Preis-Bearbeitung', labelEn: 'Price Editing' },
      { key: 'article_suggestions', labelDe: 'Artikel-Vorschläge', labelEn: 'Article Suggestions' },
      { key: 'supplier_branding', labelDe: 'Lieferanten-Branding', labelEn: 'Supplier Branding' },
    ],
  },
  {
    key: 'b2b_platform',
    labelDe: 'B2B Lieferanten-Plattform',
    labelEn: 'B2B Supplier Platform',
    features: [
      { key: 'b2b_supplier_accounts', labelDe: 'B2B Lieferanten-Konten', labelEn: 'B2B Supplier Accounts' },
      { key: 'b2b_customers', labelDe: 'B2B Kunden', labelEn: 'B2B Customers' },
      { key: 'b2b_articles', labelDe: 'B2B Artikel', labelEn: 'B2B Articles' },
      { key: 'b2b_orders', labelDe: 'B2B Bestellungen', labelEn: 'B2B Orders' },
      { key: 'b2b_offers', labelDe: 'B2B Angebote', labelEn: 'B2B Offers' },
      { key: 'b2b_customer_prices', labelDe: 'Kundenspezifische Preise', labelEn: 'Customer-Specific Prices' },
      { key: 'b2b_customer_invitation', labelDe: 'Kunden-Einladung', labelEn: 'Customer Invitation' },
      { key: 'b2b_customer_portal', labelDe: 'Kunden-Portal', labelEn: 'Customer Portal' },
      { key: 'b2b_purchase_orders', labelDe: 'Einkaufsbestellungen', labelEn: 'Purchase Orders' },
      { key: 'b2b_vendors', labelDe: 'Lieferanten-Verwaltung', labelEn: 'Vendor Management' },
      { key: 'b2b_supplier_users', labelDe: 'Lieferanten-Benutzer', labelEn: 'Supplier Users' },
    ],
  },
  {
    key: 'reports',
    labelDe: 'Berichte & Analysen',
    labelEn: 'Reports & Analytics',
    features: [
      { key: 'inventory_sessions', labelDe: 'Inventur-Sessions', labelEn: 'Inventory Sessions' },
      { key: 'inventory_comparison', labelDe: 'Inventur-Vergleich', labelEn: 'Inventory Comparison' },
      { key: 'voice_inventory', labelDe: 'Sprach-Inventur', labelEn: 'Voice Inventory' },
      { key: 'supplier_revenue', labelDe: 'Lieferanten-Umsatz', labelEn: 'Supplier Revenue' },
      { key: 'price_history', labelDe: 'Preishistorie', labelEn: 'Price History' },
      { key: 'order_statistics', labelDe: 'Bestellstatistiken', labelEn: 'Order Statistics' },
    ],
  },
{
    key: 'settings',
    labelDe: 'Einstellungen',
    labelEn: 'Settings',
    features: [
      // Profil
      { key: 'profile_settings', labelDe: 'Profil-Einstellungen', labelEn: 'Profile Settings' },
      { key: 'theme_settings', labelDe: 'Theme-Einstellungen', labelEn: 'Theme Settings' },
      // Organisation - Allgemein
      { key: 'org_profile', labelDe: 'Organisations-Profil', labelEn: 'Organization Profile' },
      { key: 'org_contact_info', labelDe: 'Kontaktinformationen', labelEn: 'Contact Information' },
      { key: 'org_subscription', labelDe: 'Abonnement-Anzeige', labelEn: 'Subscription Display' },
      { key: 'system_overview_pdf', labelDe: 'System-Übersicht PDF', labelEn: 'System Overview PDF' },
      // Organisation - Team
      { key: 'team_management', labelDe: 'Team-Verwaltung', labelEn: 'Team Management' },
      { key: 'team_invitations', labelDe: 'Team-Einladungen', labelEn: 'Team Invitations' },
      { key: 'team_roles', labelDe: 'Team-Rollen', labelEn: 'Team Roles' },
      // Organisation - Standorte
      { key: 'location_management', labelDe: 'Standort-Verwaltung', labelEn: 'Location Management' },
      { key: 'delivery_address_management', labelDe: 'Lieferadressen-Verwaltung', labelEn: 'Delivery Address Management' },
      // Organisation - Einheiten & Kategorien
      { key: 'unit_management', labelDe: 'Einheiten-Verwaltung', labelEn: 'Unit Management' },
      { key: 'category_management', labelDe: 'Kategorie-Verwaltung', labelEn: 'Category Management' },
      { key: 'order_unit_management', labelDe: 'Bestelleinheiten-Verwaltung', labelEn: 'Order Unit Management' },
      { key: 'article_organization', labelDe: 'Artikel-Organisation', labelEn: 'Article Organization' },
      // Kommunikation
      { key: 'notification_preferences', labelDe: 'Benachrichtigungs-Einstellungen', labelEn: 'Notification Preferences' },
      { key: 'email_templates', labelDe: 'E-Mail-Vorlagen', labelEn: 'Email Templates' },
      { key: 'supplier_portal_settings', labelDe: 'Lieferanten-Portal Einstellungen', labelEn: 'Supplier Portal Settings' },
      { key: 'communication_log_view', labelDe: 'Kommunikations-Protokoll Ansicht', labelEn: 'Communication Log View' },
      // Sonstiges
      { key: 'demo_accounts', labelDe: 'Demo-Konten', labelEn: 'Demo Accounts' },
      { key: 'advanced_mode', labelDe: 'Erweiterter Modus', labelEn: 'Advanced Mode' },
    ],
  },
  {
    key: 'wine_features',
    labelDe: 'Wein-Funktionen',
    labelEn: 'Wine Features',
    features: [
      { key: 'wine_catalog', labelDe: 'Wein-Katalog', labelEn: 'Wine Catalog' },
      { key: 'wine_research', labelDe: 'Wein-Recherche (AI)', labelEn: 'Wine Research (AI)' },
      { key: 'wine_quiz', labelDe: 'Wein-Quiz', labelEn: 'Wine Quiz' },
      { key: 'wine_translations', labelDe: 'Wein-Übersetzungen', labelEn: 'Wine Translations' },
      { key: 'wine_pdf_export', labelDe: 'Wein-PDF-Export', labelEn: 'Wine PDF Export' },
    ],
  },
  {
    key: 'mobile_features',
    labelDe: 'Mobile Funktionen',
    labelEn: 'Mobile Features',
    features: [
      { key: 'photo_capture', labelDe: 'Foto-Erfassung', labelEn: 'Photo Capture' },
      { key: 'qr_scanner', labelDe: 'QR-Scanner', labelEn: 'QR Scanner' },
      { key: 'haptic_feedback', labelDe: 'Haptisches Feedback', labelEn: 'Haptic Feedback' },
      { key: 'responsive_design', labelDe: 'Responsive Design', labelEn: 'Responsive Design' },
      { key: 'mobile_bottom_nav', labelDe: 'Mobile Bottom-Navigation', labelEn: 'Mobile Bottom Navigation' },
    ],
  },
  {
    key: 'auth_security',
    labelDe: 'Authentifizierung & Sicherheit',
    labelEn: 'Authentication & Security',
    features: [
      { key: 'user_authentication', labelDe: 'Benutzer-Authentifizierung', labelEn: 'User Authentication' },
      { key: 'role_based_access', labelDe: 'Rollen-basierter Zugang', labelEn: 'Role-Based Access' },
      { key: 'rls_policies', labelDe: 'RLS-Richtlinien', labelEn: 'RLS Policies' },
      { key: 'team_invitations', labelDe: 'Team-Einladungen', labelEn: 'Team Invitations' },
      { key: 'password_management', labelDe: 'Passwort-Verwaltung', labelEn: 'Password Management' },
    ],
  },
  {
    key: 'email_system',
    labelDe: 'E-Mail-System',
    labelEn: 'Email System',
    features: [
      { key: 'order_emails', labelDe: 'Bestellungs-E-Mails', labelEn: 'Order Emails' },
      { key: 'confirmation_emails', labelDe: 'Bestätigungs-E-Mails', labelEn: 'Confirmation Emails' },
      { key: 'preorder_notifications', labelDe: 'Vorbestellungs-Benachrichtigungen', labelEn: 'Preorder Notifications' },
      { key: 'magic_link_emails', labelDe: 'Magic-Link E-Mails', labelEn: 'Magic Link Emails' },
      { key: 'invitation_emails', labelDe: 'Einladungs-E-Mails', labelEn: 'Invitation Emails' },
      { key: 'communication_logs', labelDe: 'Kommunikations-Protokolle', labelEn: 'Communication Logs' },
    ],
  },
  {
    key: 'ai_functions',
    labelDe: 'AI-Funktionen',
    labelEn: 'AI Functions',
    features: [
      { key: 'voice_transcription', labelDe: 'Sprach-Transkription', labelEn: 'Voice Transcription' },
      { key: 'article_identification', labelDe: 'Artikel-Identifikation', labelEn: 'Article Identification' },
      { key: 'import_helper', labelDe: 'Import-Assistent', labelEn: 'Import Helper' },
      { key: 'order_list_scan', labelDe: 'Bestelllisten-Scan', labelEn: 'Order List Scan' },
      { key: 'wine_image_search', labelDe: 'Wein-Bildersuche', labelEn: 'Wine Image Search' },
    ],
  },
  {
    key: 'export_import',
    labelDe: 'Export & Import',
    labelEn: 'Export & Import',
    features: [
      { key: 'csv_import', labelDe: 'CSV-Import', labelEn: 'CSV Import' },
      { key: 'excel_export', labelDe: 'Excel-Export', labelEn: 'Excel Export' },
      { key: 'pdf_export', labelDe: 'PDF-Export', labelEn: 'PDF Export' },
      { key: 'article_import', labelDe: 'Artikel-Import', labelEn: 'Article Import' },
      { key: 'wine_import', labelDe: 'Wein-Import', labelEn: 'Wine Import' },
    ],
  },
];

export const getAllFeatures = (): { category: string; feature: SystemFeature }[] => {
  const all: { category: string; feature: SystemFeature }[] = [];
  SYSTEM_FEATURES.forEach((cat) => {
    cat.features.forEach((feat) => {
      all.push({ category: cat.key, feature: feat });
    });
  });
  return all;
};

export const getTotalFeatureCount = (): number => {
  return SYSTEM_FEATURES.reduce((acc, cat) => acc + cat.features.length, 0);
};
