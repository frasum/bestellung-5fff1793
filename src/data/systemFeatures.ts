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
      // Lieferanten
      { key: 'supplier_list_view', labelDe: 'Lieferanten-Listenansicht', labelEn: 'Supplier List View' },
      { key: 'supplier_create', labelDe: 'Lieferant erstellen', labelEn: 'Create Supplier' },
      { key: 'supplier_edit', labelDe: 'Lieferant bearbeiten', labelEn: 'Edit Supplier' },
      { key: 'supplier_delete', labelDe: 'Lieferant löschen', labelEn: 'Delete Supplier' },
      { key: 'supplier_import', labelDe: 'Lieferanten-Import (CSV)', labelEn: 'Supplier Import (CSV)' },
      { key: 'supplier_multi_select', labelDe: 'Lieferanten-Mehrfachauswahl', labelEn: 'Supplier Multi-Select' },
      { key: 'supplier_filter', labelDe: 'Lieferanten-Filter', labelEn: 'Supplier Filter' },
      { key: 'supplier_qr_code', labelDe: 'Lieferanten QR-Code', labelEn: 'Supplier QR Code' },
      { key: 'supplier_tokens', labelDe: 'Lieferanten-Tokens', labelEn: 'Supplier Tokens' },
      { key: 'supplier_locations_dialog', labelDe: 'Lieferanten-Standorte Dialog', labelEn: 'Supplier Locations Dialog' },
      { key: 'supplier_changes_tracking', labelDe: 'Lieferanten-Änderungen verfolgen', labelEn: 'Supplier Changes Tracking' },
      { key: 'minimum_order_value', labelDe: 'Mindestbestellwert', labelEn: 'Minimum Order Value' },
      // Artikel
      { key: 'article_list_view', labelDe: 'Artikel-Listenansicht', labelEn: 'Article List View' },
      { key: 'article_create', labelDe: 'Artikel erstellen', labelEn: 'Create Article' },
      { key: 'article_edit', labelDe: 'Artikel bearbeiten', labelEn: 'Edit Article' },
      { key: 'article_delete', labelDe: 'Artikel löschen', labelEn: 'Delete Article' },
      { key: 'article_import', labelDe: 'Artikel-Import (CSV)', labelEn: 'Article Import (CSV)' },
      { key: 'article_image', labelDe: 'Artikel-Bilder', labelEn: 'Article Images' },
      { key: 'article_bulk_category', labelDe: 'Bulk-Kategorie-Zuweisung', labelEn: 'Bulk Category Assignment' },
      { key: 'article_bulk_order_unit', labelDe: 'Bulk-Bestelleinheit-Zuweisung', labelEn: 'Bulk Order Unit Assignment' },
      { key: 'article_advanced_view', labelDe: 'Erweiterte Artikel-Ansicht', labelEn: 'Advanced Article View' },
      { key: 'article_filter', labelDe: 'Artikel-Filter', labelEn: 'Article Filter' },
      { key: 'article_suggestions_tab', labelDe: 'Artikel-Vorschläge Tab', labelEn: 'Article Suggestions Tab' },
      { key: 'quick_capture_wizard', labelDe: 'Quick-Capture Assistent', labelEn: 'Quick Capture Wizard' },
      // Warenkorb
      { key: 'cart_view', labelDe: 'Warenkorb-Ansicht', labelEn: 'Cart View' },
      { key: 'cart_add_item', labelDe: 'Artikel zum Warenkorb', labelEn: 'Add to Cart' },
      { key: 'cart_quantity_edit', labelDe: 'Menge bearbeiten', labelEn: 'Edit Quantity' },
      { key: 'cart_save_draft', labelDe: 'Als Entwurf speichern', labelEn: 'Save as Draft' },
      { key: 'cart_scan_order_list', labelDe: 'Bestellliste scannen', labelEn: 'Scan Order List' },
      { key: 'cart_free_items', labelDe: 'Freitext-Artikel im Warenkorb', labelEn: 'Free Text Items in Cart' },
      { key: 'cart_convert_to_catalog', labelDe: 'In Katalog übernehmen', labelEn: 'Convert to Catalog' },
      { key: 'cart_delivery_info', labelDe: 'Lieferinfo aus EasyOrder', labelEn: 'Delivery Info from EasyOrder' },
      // Checkout & Bestellungen
      { key: 'checkout_process', labelDe: 'Checkout-Prozess', labelEn: 'Checkout Process' },
      { key: 'order_list_view', labelDe: 'Bestellungs-Listenansicht', labelEn: 'Order List View' },
      { key: 'order_status_change', labelDe: 'Bestellstatus ändern', labelEn: 'Change Order Status' },
      { key: 'order_location_change', labelDe: 'Bestellstandort ändern', labelEn: 'Change Order Location' },
      { key: 'order_resend_email', labelDe: 'Bestellung erneut senden', labelEn: 'Resend Order Email' },
      { key: 'order_email_view', labelDe: 'Bestellungs-E-Mail ansehen', labelEn: 'View Order Email' },
      { key: 'order_filter', labelDe: 'Bestellungen filtern', labelEn: 'Filter Orders' },
      { key: 'order_location_filter', labelDe: 'Nach Standort filtern', labelEn: 'Filter by Location' },
      { key: 'order_group_by_supplier', labelDe: 'Nach Lieferant gruppieren', labelEn: 'Group by Supplier' },
      { key: 'order_drafts_tab', labelDe: 'Entwürfe Tab', labelEn: 'Drafts Tab' },
      { key: 'delete_test_orders', labelDe: 'Testbestellungen löschen', labelEn: 'Delete Test Orders' },
      { key: 'test_mode', labelDe: 'Test-Modus', labelEn: 'Test Mode' },
    ],
  },
  {
    key: 'simple_order',
    labelDe: 'EasyOrder (Mitarbeiter-Bestellsystem)',
    labelEn: 'EasyOrder (Employee Ordering)',
    features: [
      // Zugang & Authentifizierung
      { key: 'token_based_access', labelDe: 'Token-basierter Zugang', labelEn: 'Token-Based Access' },
      { key: 'qr_code_access', labelDe: 'QR-Code Zugang', labelEn: 'QR Code Access' },
      { key: 'pin_authentication', labelDe: 'PIN-Authentifizierung', labelEn: 'PIN Authentication' },
      { key: 'language_selection', labelDe: 'Sprach-Auswahl', labelEn: 'Language Selection' },
      // Mitarbeiter-Verwaltung
      { key: 'employee_management', labelDe: 'Mitarbeiter-Verwaltung', labelEn: 'Employee Management' },
      { key: 'employee_locations', labelDe: 'Mitarbeiter-Standorte', labelEn: 'Employee Locations' },
      { key: 'employee_suppliers', labelDe: 'Mitarbeiter-Lieferanten', labelEn: 'Employee Suppliers' },
      { key: 'employee_tokens', labelDe: 'Mitarbeiter-Tokens', labelEn: 'Employee Tokens' },
      { key: 'employee_name_lock', labelDe: 'Mitarbeiter-Name fixiert', labelEn: 'Employee Name Locked' },
      // Token-Einstellungen
      { key: 'token_label', labelDe: 'Token-Label', labelEn: 'Token Label' },
      { key: 'token_supplier_assignment', labelDe: 'Token-Lieferanten-Zuweisung', labelEn: 'Token Supplier Assignment' },
      { key: 'token_location_assignment', labelDe: 'Token-Standort-Zuweisung', labelEn: 'Token Location Assignment' },
      { key: 'multi_supplier_mode', labelDe: 'Multi-Lieferanten-Modus', labelEn: 'Multi-Supplier Mode' },
      // Bestellprozess
      { key: 'supplier_selection', labelDe: 'Lieferanten-Auswahl', labelEn: 'Supplier Selection' },
      { key: 'article_search', labelDe: 'Artikel-Suche', labelEn: 'Article Search' },
      { key: 'article_favorites', labelDe: 'Artikel-Favoriten', labelEn: 'Article Favorites' },
      { key: 'category_filter', labelDe: 'Kategorie-Filter', labelEn: 'Category Filter' },
      { key: 'quantity_input', labelDe: 'Mengen-Eingabe', labelEn: 'Quantity Input' },
      { key: 'multi_supplier_cart', labelDe: 'Multi-Lieferanten-Warenkorb', labelEn: 'Multi-Supplier Cart' },
      { key: 'order_confirmation_screen', labelDe: 'Bestätigungs-Bildschirm', labelEn: 'Confirmation Screen' },
      // Lieferung
      { key: 'location_selection', labelDe: 'Standort-Auswahl', labelEn: 'Location Selection' },
      { key: 'delivery_date_selection', labelDe: 'Lieferdatum-Auswahl', labelEn: 'Delivery Date Selection' },
      { key: 'time_window_selection', labelDe: 'Zeitfenster-Auswahl', labelEn: 'Time Window Selection' },
      // Erweiterte Features
      { key: 'voice_input', labelDe: 'Spracheingabe', labelEn: 'Voice Input' },
      { key: 'free_text_items', labelDe: 'Freitext-Artikel', labelEn: 'Free Text Items' },
      { key: 'photo_capture', labelDe: 'Foto-Erfassung', labelEn: 'Photo Capture' },
      { key: 'wine_catalog_access', labelDe: 'Wein-Katalog Zugang', labelEn: 'Wine Catalog Access' },
      // Genehmigung
      { key: 'auto_approve_orders', labelDe: 'Auto-Genehmigung', labelEn: 'Auto-Approve Orders' },
      { key: 'preorder_approval', labelDe: 'Vorbestellungs-Genehmigung', labelEn: 'Preorder Approval' },
      { key: 'preorder_notification', labelDe: 'Vorbestellungs-Benachrichtigung', labelEn: 'Preorder Notification' },
      // Verlauf
      { key: 'order_history_view', labelDe: 'Bestellverlauf ansehen', labelEn: 'Order History View' },
      { key: 'draft_edit', labelDe: 'Entwurf bearbeiten', labelEn: 'Edit Draft' },
    ],
  },
  {
    key: 'supplier_portal',
    labelDe: 'Lieferanten-Portal',
    labelEn: 'Supplier Portal',
    features: [
      { key: 'magic_link_login', labelDe: 'Magic-Link Login', labelEn: 'Magic Link Login' },
      { key: 'token_based_access', labelDe: 'Token-basierter Zugang', labelEn: 'Token-Based Access' },
      { key: 'portal_branding', labelDe: 'Portal-Branding', labelEn: 'Portal Branding' },
      { key: 'order_list_view', labelDe: 'Bestellungs-Ansicht', labelEn: 'Order List View' },
      { key: 'order_details_view', labelDe: 'Bestelldetails-Ansicht', labelEn: 'Order Details View' },
      { key: 'order_confirmation', labelDe: 'Bestellbestätigung', labelEn: 'Order Confirmation' },
      { key: 'price_editing', labelDe: 'Preis-Bearbeitung', labelEn: 'Price Editing' },
      { key: 'article_suggestions', labelDe: 'Artikel-Vorschläge', labelEn: 'Article Suggestions' },
      { key: 'column_configuration', labelDe: 'Spalten-Konfiguration', labelEn: 'Column Configuration' },
      { key: 'portal_preview', labelDe: 'Portal-Vorschau', labelEn: 'Portal Preview' },
    ],
  },
  {
    key: 'b2b_platform',
    labelDe: 'B2B Lieferanten-Plattform',
    labelEn: 'B2B Supplier Platform',
    features: [
      // Kunden
      { key: 'b2b_customer_list', labelDe: 'B2B Kunden-Liste', labelEn: 'B2B Customer List' },
      { key: 'b2b_customer_create', labelDe: 'B2B Kunden erstellen', labelEn: 'Create B2B Customer' },
      { key: 'b2b_customer_invitation', labelDe: 'Kunden-Einladung', labelEn: 'Customer Invitation' },
      { key: 'b2b_customer_prices', labelDe: 'Kundenspezifische Preise', labelEn: 'Customer-Specific Prices' },
      { key: 'b2b_customer_portal', labelDe: 'Kunden-Portal', labelEn: 'Customer Portal' },
      // Artikel & Angebote
      { key: 'b2b_article_list', labelDe: 'B2B Artikel-Liste', labelEn: 'B2B Article List' },
      { key: 'b2b_article_create', labelDe: 'B2B Artikel erstellen', labelEn: 'Create B2B Article' },
      { key: 'b2b_article_import', labelDe: 'B2B Artikel-Import', labelEn: 'B2B Article Import' },
      { key: 'b2b_offers_list', labelDe: 'B2B Angebote-Liste', labelEn: 'B2B Offers List' },
      { key: 'b2b_offer_create', labelDe: 'B2B Angebot erstellen', labelEn: 'Create B2B Offer' },
      { key: 'b2b_offer_send', labelDe: 'B2B Angebot senden', labelEn: 'Send B2B Offer' },
      // Bestellungen
      { key: 'b2b_orders_list', labelDe: 'B2B Bestellungen-Liste', labelEn: 'B2B Orders List' },
      { key: 'b2b_order_status', labelDe: 'B2B Bestellstatus', labelEn: 'B2B Order Status' },
      // Einkauf
      { key: 'b2b_vendors_list', labelDe: 'Lieferanten-Liste', labelEn: 'Vendors List' },
      { key: 'b2b_vendor_create', labelDe: 'Lieferant erstellen', labelEn: 'Create Vendor' },
      { key: 'b2b_vendor_articles', labelDe: 'Lieferanten-Artikel', labelEn: 'Vendor Articles' },
      { key: 'b2b_purchase_cart', labelDe: 'Einkaufs-Warenkorb', labelEn: 'Purchase Cart' },
      { key: 'b2b_purchase_checkout', labelDe: 'Einkaufs-Checkout', labelEn: 'Purchase Checkout' },
      { key: 'b2b_purchase_orders', labelDe: 'Einkaufsbestellungen', labelEn: 'Purchase Orders' },
      // Einstellungen
      { key: 'b2b_settings', labelDe: 'B2B Einstellungen', labelEn: 'B2B Settings' },
      { key: 'b2b_supplier_users', labelDe: 'Lieferanten-Benutzer', labelEn: 'Supplier Users' },
    ],
  },
  {
    key: 'reports',
    labelDe: 'Berichte & Analysen',
    labelEn: 'Reports & Analytics',
    features: [
      // Übersicht
      { key: 'quick_overview_kpis', labelDe: 'Schnellübersicht KPIs', labelEn: 'Quick Overview KPIs' },
      { key: 'recent_orders_card', labelDe: 'Letzte Bestellungen', labelEn: 'Recent Orders Card' },
      { key: 'spending_chart', labelDe: 'Ausgaben-Diagramm', labelEn: 'Spending Chart' },
      { key: 'supplier_breakdown', labelDe: 'Lieferanten-Aufschlüsselung', labelEn: 'Supplier Breakdown' },
      { key: 'status_breakdown', labelDe: 'Status-Aufschlüsselung', labelEn: 'Status Breakdown' },
      { key: 'top_articles', labelDe: 'Top-Artikel', labelEn: 'Top Articles' },
      { key: 'time_range_filter', labelDe: 'Zeitraum-Filter', labelEn: 'Time Range Filter' },
      // Inventur
      { key: 'inventory_sessions', labelDe: 'Inventur-Sessions', labelEn: 'Inventory Sessions' },
      { key: 'inventory_create', labelDe: 'Inventur erstellen', labelEn: 'Create Inventory' },
      { key: 'inventory_items', labelDe: 'Inventur-Positionen', labelEn: 'Inventory Items' },
      { key: 'inventory_comparison', labelDe: 'Inventur-Vergleich', labelEn: 'Inventory Comparison' },
      { key: 'inventory_value', labelDe: 'Inventur-Wert', labelEn: 'Inventory Value' },
      { key: 'voice_inventory', labelDe: 'Sprach-Inventur', labelEn: 'Voice Inventory' },
      // Lieferanten-Umsatz
      { key: 'supplier_annual_revenue', labelDe: 'Jahresumsatz pro Lieferant', labelEn: 'Annual Revenue per Supplier' },
      { key: 'price_history', labelDe: 'Preishistorie', labelEn: 'Price History' },
      // Export
      { key: 'csv_export', labelDe: 'CSV-Export', labelEn: 'CSV Export' },
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
      { key: 'wine_catalog_view', labelDe: 'Wein-Katalog Ansicht', labelEn: 'Wine Catalog View' },
      { key: 'wine_list', labelDe: 'Wein-Liste', labelEn: 'Wine List' },
      { key: 'wine_create', labelDe: 'Wein erstellen', labelEn: 'Create Wine' },
      { key: 'wine_edit', labelDe: 'Wein bearbeiten', labelEn: 'Edit Wine' },
      { key: 'wine_research', labelDe: 'Wein-Recherche (AI)', labelEn: 'Wine Research (AI)' },
      { key: 'wine_image_search', labelDe: 'Wein-Bildersuche (AI)', labelEn: 'Wine Image Search (AI)' },
      { key: 'wine_translations', labelDe: 'Wein-Übersetzungen', labelEn: 'Wine Translations' },
      { key: 'wine_pdf_export', labelDe: 'Wein-PDF-Export', labelEn: 'Wine PDF Export' },
      { key: 'wine_quiz', labelDe: 'Wein-Quiz', labelEn: 'Wine Quiz' },
      { key: 'wine_quiz_leaderboard', labelDe: 'Wein-Quiz Rangliste', labelEn: 'Wine Quiz Leaderboard' },
      { key: 'wine_import', labelDe: 'Wein-Import', labelEn: 'Wine Import' },
    ],
  },
  {
    key: 'mobile_features',
    labelDe: 'Mobile Funktionen',
    labelEn: 'Mobile Features',
    features: [
      { key: 'responsive_design', labelDe: 'Responsive Design', labelEn: 'Responsive Design' },
      { key: 'mobile_bottom_nav', labelDe: 'Mobile Bottom-Navigation', labelEn: 'Mobile Bottom Navigation' },
      { key: 'touch_optimized', labelDe: 'Touch-optimierte Buttons', labelEn: 'Touch-Optimized Buttons' },
      { key: 'haptic_feedback', labelDe: 'Haptisches Feedback', labelEn: 'Haptic Feedback' },
      { key: 'photo_capture', labelDe: 'Foto-Erfassung', labelEn: 'Photo Capture' },
      { key: 'qr_scanner', labelDe: 'QR-Scanner', labelEn: 'QR Scanner' },
      { key: 'mobile_article_creation', labelDe: 'Mobile Artikel-Erstellung', labelEn: 'Mobile Article Creation' },
      { key: 'floating_cart_button', labelDe: 'Floating Warenkorb-Button', labelEn: 'Floating Cart Button' },
    ],
  },
  {
    key: 'auth_security',
    labelDe: 'Authentifizierung & Sicherheit',
    labelEn: 'Authentication & Security',
    features: [
      { key: 'user_signup', labelDe: 'Benutzer-Registrierung', labelEn: 'User Signup' },
      { key: 'user_login', labelDe: 'Benutzer-Login', labelEn: 'User Login' },
      { key: 'password_reset', labelDe: 'Passwort-Reset', labelEn: 'Password Reset' },
      { key: 'role_based_access', labelDe: 'Rollen-basierter Zugang', labelEn: 'Role-Based Access' },
      { key: 'team_invitations', labelDe: 'Team-Einladungen', labelEn: 'Team Invitations' },
      { key: 'rls_policies', labelDe: 'RLS-Richtlinien', labelEn: 'RLS Policies' },
      { key: 'demo_mode', labelDe: 'Demo-Modus', labelEn: 'Demo Mode' },
      { key: 'demo_account_creation', labelDe: 'Demo-Account Erstellung', labelEn: 'Demo Account Creation' },
    ],
  },
  {
    key: 'demo_showcase',
    labelDe: 'Live-Demo Showcase',
    labelEn: 'Live Demo Showcase',
    features: [
      { key: 'live_demo_page', labelDe: 'Live-Demo Seite', labelEn: 'Live Demo Page' },
      { key: 'live_demo_gastro_panel', labelDe: 'Gastro-System Panel (Tabs)', labelEn: 'Gastro System Panel (Tabs)' },
      { key: 'live_demo_easyorder_panel', labelDe: 'EasyOrder Panel', labelEn: 'EasyOrder Panel' },
      { key: 'live_demo_supplier_panel', labelDe: 'Lieferanten Panel', labelEn: 'Supplier Panel' },
      { key: 'live_demo_email_panel', labelDe: 'E-Mail Log Panel', labelEn: 'Email Log Panel' },
      { key: 'live_demo_admin_panel', labelDe: 'Admin Panel', labelEn: 'Admin Panel' },
      { key: 'live_demo_draggable_tiles', labelDe: 'Verschiebbare Kacheln', labelEn: 'Draggable Tiles' },
      { key: 'live_demo_connection_arrows', labelDe: 'Verbindungs-Pfeile', labelEn: 'Connection Arrows' },
      { key: 'live_demo_layout_persistence', labelDe: 'Layout-Speicherung (localStorage)', labelEn: 'Layout Persistence (localStorage)' },
      { key: 'live_demo_data_reset', labelDe: 'Demo-Daten zurücksetzen', labelEn: 'Demo Data Reset' },
      { key: 'live_demo_sound_toggle', labelDe: 'Sound an/aus', labelEn: 'Sound Toggle' },
      { key: 'live_demo_fullscreen', labelDe: 'Vollbild-Modus', labelEn: 'Fullscreen Mode' },
      { key: 'live_demo_realtime_sync', labelDe: 'Echtzeit-Synchronisation', labelEn: 'Realtime Sync' },
    ],
  },
  {
    key: 'email_system',
    labelDe: 'E-Mail-System',
    labelEn: 'Email System',
    features: [
      { key: 'order_email_send', labelDe: 'Bestellungs-E-Mail senden', labelEn: 'Send Order Email' },
      { key: 'order_email_preview', labelDe: 'Bestellungs-E-Mail Vorschau', labelEn: 'Order Email Preview' },
      { key: 'confirmation_emails', labelDe: 'Bestätigungs-E-Mails', labelEn: 'Confirmation Emails' },
      { key: 'preorder_notifications', labelDe: 'Vorbestellungs-Benachrichtigungen', labelEn: 'Preorder Notifications' },
      { key: 'magic_link_emails', labelDe: 'Magic-Link E-Mails', labelEn: 'Magic Link Emails' },
      { key: 'invitation_emails', labelDe: 'Einladungs-E-Mails', labelEn: 'Invitation Emails' },
      { key: 'b2b_offer_emails', labelDe: 'B2B Angebots-E-Mails', labelEn: 'B2B Offer Emails' },
      { key: 'communication_logs', labelDe: 'Kommunikations-Protokolle', labelEn: 'Communication Logs' },
      { key: 'email_templates', labelDe: 'E-Mail-Vorlagen', labelEn: 'Email Templates' },
    ],
  },
  {
    key: 'ai_functions',
    labelDe: 'AI-Funktionen',
    labelEn: 'AI Functions',
    features: [
      { key: 'voice_transcription_order', labelDe: 'Sprach-Transkription (Bestellung)', labelEn: 'Voice Transcription (Order)' },
      { key: 'voice_transcription_inventory', labelDe: 'Sprach-Transkription (Inventur)', labelEn: 'Voice Transcription (Inventory)' },
      { key: 'article_identification', labelDe: 'Artikel-Identifikation (Foto)', labelEn: 'Article Identification (Photo)' },
      { key: 'import_helper', labelDe: 'Import-Assistent', labelEn: 'Import Helper' },
      { key: 'order_list_scan', labelDe: 'Bestelllisten-Scan', labelEn: 'Order List Scan' },
      { key: 'wine_image_search', labelDe: 'Wein-Bildersuche', labelEn: 'Wine Image Search' },
      { key: 'wine_research', labelDe: 'Wein-Recherche', labelEn: 'Wine Research' },
      { key: 'wine_translation', labelDe: 'Wein-Übersetzung', labelEn: 'Wine Translation' },
      { key: 'voice_onboarding', labelDe: 'Sprach-Onboarding', labelEn: 'Voice Onboarding' },
      { key: 'industry_detection', labelDe: 'Branchen-Erkennung', labelEn: 'Industry Detection' },
    ],
  },
  {
    key: 'export_import',
    labelDe: 'Export & Import',
    labelEn: 'Export & Import',
    features: [
      { key: 'supplier_csv_import', labelDe: 'Lieferanten CSV-Import', labelEn: 'Supplier CSV Import' },
      { key: 'article_csv_import', labelDe: 'Artikel CSV-Import', labelEn: 'Article CSV Import' },
      { key: 'b2b_article_import', labelDe: 'B2B Artikel-Import', labelEn: 'B2B Article Import' },
      { key: 'wine_import', labelDe: 'Wein-Import', labelEn: 'Wine Import' },
      { key: 'excel_export', labelDe: 'Excel-Export', labelEn: 'Excel Export' },
      { key: 'pdf_order_list', labelDe: 'PDF Bestellliste', labelEn: 'PDF Order List' },
      { key: 'pdf_combined_order_list', labelDe: 'PDF Kombinierte Bestellliste', labelEn: 'PDF Combined Order List' },
      { key: 'pdf_inventory_list', labelDe: 'PDF Inventurliste', labelEn: 'PDF Inventory List' },
      { key: 'pdf_wine_catalog', labelDe: 'PDF Wein-Katalog', labelEn: 'PDF Wine Catalog' },
      { key: 'pdf_system_overview', labelDe: 'PDF System-Übersicht', labelEn: 'PDF System Overview' },
      { key: 'pdf_feature_priorities', labelDe: 'PDF Feature-Prioritäten', labelEn: 'PDF Feature Priorities' },
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
