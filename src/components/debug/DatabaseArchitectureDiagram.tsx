import React, { useState, useMemo } from 'react';
import { 
  Database, 
  Shield, 
  Key, 
  Link2, 
  Building2, 
  Package, 
  ShoppingCart, 
  Users, 
  Briefcase,
  Search,
  Table2,
  Layers,
  Columns,
  ChevronDown,
  Filter
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

// Category definitions with colors and icons
const categories = [
  {
    id: 'core',
    name: 'Core',
    icon: Building2,
    color: 'blue',
    bgClass: 'bg-blue-50 dark:bg-blue-950/30',
    borderClass: 'border-blue-200 dark:border-blue-800',
    badgeClass: 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200',
    dotClass: 'bg-blue-500',
    description: 'Grundlegende Organisationsstrukturen und Benutzer',
    tables: ['organizations', 'profiles', 'locations', 'user_roles', 'delivery_addresses', 'user_delivery_preferences', 'notification_preferences']
  },
  {
    id: 'catalog',
    name: 'Katalog',
    icon: Package,
    color: 'emerald',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderClass: 'border-emerald-200 dark:border-emerald-800',
    badgeClass: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-200',
    dotClass: 'bg-emerald-500',
    description: 'Lieferanten, Artikel und Kategorien',
    tables: ['suppliers', 'articles', 'categories', 'units', 'order_units', 'supplier_locations', 'article_price_history', 'supplier_portal_tokens']
  },
  {
    id: 'orders',
    name: 'Bestellungen',
    icon: ShoppingCart,
    color: 'violet',
    bgClass: 'bg-violet-50 dark:bg-violet-950/30',
    borderClass: 'border-violet-200 dark:border-violet-800',
    badgeClass: 'bg-violet-100 text-violet-800 hover:bg-violet-200 dark:bg-violet-900 dark:text-violet-200',
    dotClass: 'bg-violet-500',
    description: 'Bestellungen, Warenkörbe und Kommunikation',
    tables: ['orders', 'order_items', 'cart_drafts', 'cart_draft_items', 'communication_logs', 'order_confirmation_tokens', 'email_templates', 'supplier_order_views']
  },
  {
    id: 'easyorder',
    name: 'EasyOrder',
    icon: Users,
    color: 'orange',
    bgClass: 'bg-orange-50 dark:bg-orange-950/30',
    borderClass: 'border-orange-200 dark:border-orange-800',
    badgeClass: 'bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-200',
    dotClass: 'bg-orange-500',
    description: 'Mitarbeiter-Bestellsystem und Tokens',
    tables: ['employees', 'employee_locations', 'employee_location_suppliers', 'employee_article_favorites', 'simple_order_tokens', 'simple_order_token_suppliers', 'suggested_articles', 'inventory_sessions', 'inventory_items']
  },
  {
    id: 'b2b',
    name: 'B2B Portal',
    icon: Briefcase,
    color: 'cyan',
    bgClass: 'bg-cyan-50 dark:bg-cyan-950/30',
    borderClass: 'border-cyan-200 dark:border-cyan-800',
    badgeClass: 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200 dark:bg-cyan-900 dark:text-cyan-200',
    dotClass: 'bg-cyan-500',
    description: 'B2B-Kunden, Lieferanten und Bestellungen',
    tables: ['supplier_b2b_accounts', 'supplier_b2b_customers', 'supplier_b2b_articles', 'supplier_b2b_orders', 'supplier_b2b_order_items', 'supplier_b2b_offers', 'supplier_b2b_offer_items', 'b2b_suppliers', 'b2b_supplier_users', 'b2b_supplier_vendors', 'b2b_supplier_purchase_orders', 'b2b_supplier_purchase_order_items', 'b2b_customer_vendors', 'b2b_customer_vendor_articles', 'b2b_customer_purchase_orders', 'b2b_customer_purchase_order_items', 'b2b_customer_supplier_access', 'b2b_customer_invitations', 'customer_article_prices']
  }
];

// Table details for the detail sheet
interface TableDetail {
  title: string;
  description: string;
  columns: string[];
  primaryKey: string;
  foreignKeys: string[];
  rlsPolicy: string;
}

const tableDetails: Record<string, TableDetail> = {
  organizations: {
    title: 'Organizations',
    description: 'Zentrale Mandanten-Tabelle für Multi-Tenancy',
    columns: ['id', 'name', 'subscription_tier', 'trial_ends_at', 'is_demo', 'test_mode_enabled', 'contact_email'],
    primaryKey: 'id',
    foreignKeys: [],
    rlsPolicy: 'Benutzer können nur ihre eigene Organisation sehen und bearbeiten'
  },
  profiles: {
    title: 'Profiles',
    description: 'Benutzerprofile mit Auth-Verknüpfung',
    columns: ['id', 'email', 'full_name', 'organization_id', 'color_scheme', 'created_at'],
    primaryKey: 'id (= auth.users.id)',
    foreignKeys: ['organization_id → organizations'],
    rlsPolicy: 'Benutzer können nur ihr eigenes Profil bearbeiten'
  },
  locations: {
    title: 'Locations',
    description: 'Standorte einer Organisation',
    columns: ['id', 'name', 'short_code', 'email', 'organization_id', 'is_default'],
    primaryKey: 'id',
    foreignKeys: ['organization_id → organizations'],
    rlsPolicy: 'Nur Standorte der eigenen Organisation sichtbar'
  },
  user_roles: {
    title: 'User Roles',
    description: 'Rollen-Zuweisungen (admin, manager, user)',
    columns: ['id', 'user_id', 'organization_id', 'role'],
    primaryKey: 'id',
    foreignKeys: ['organization_id → organizations'],
    rlsPolicy: 'Admins können Rollen verwalten'
  },
  delivery_addresses: {
    title: 'Delivery Addresses',
    description: 'Lieferadressen pro Standort',
    columns: ['id', 'label', 'address_line1', 'city', 'postal_code', 'location_id'],
    primaryKey: 'id',
    foreignKeys: ['organization_id → organizations', 'location_id → locations'],
    rlsPolicy: 'Manager können Adressen verwalten'
  },
  user_delivery_preferences: {
    title: 'User Delivery Preferences',
    description: 'Bevorzugte Lieferadresse pro Benutzer/Standort',
    columns: ['id', 'user_id', 'location_id', 'delivery_address_id'],
    primaryKey: 'id',
    foreignKeys: ['location_id → locations', 'delivery_address_id → delivery_addresses'],
    rlsPolicy: 'Benutzer können nur eigene Präferenzen bearbeiten'
  },
  notification_preferences: {
    title: 'Notification Preferences',
    description: 'E-Mail-Benachrichtigungseinstellungen',
    columns: ['id', 'user_id', 'email_order_confirmation', 'email_preorder_received'],
    primaryKey: 'id',
    foreignKeys: [],
    rlsPolicy: 'Benutzer können nur eigene Einstellungen bearbeiten'
  },
  suppliers: {
    title: 'Suppliers',
    description: 'Lieferanten-Stammdaten',
    columns: ['id', 'name', 'email', 'phone', 'address', 'customer_number', 'organization_id', 'minimum_order_value'],
    primaryKey: 'id',
    foreignKeys: ['organization_id → organizations'],
    rlsPolicy: 'Nur Lieferanten der eigenen Organisation sichtbar'
  },
  articles: {
    title: 'Articles',
    description: 'Artikel-Katalog mit Preisen und Einheiten',
    columns: ['id', 'name', 'sku', 'price', 'unit', 'category', 'supplier_id', 'image_url'],
    primaryKey: 'id',
    foreignKeys: ['supplier_id → suppliers', 'organization_id → organizations', 'order_unit_id → order_units'],
    rlsPolicy: 'Nur Artikel der eigenen Organisation sichtbar'
  },
  categories: {
    title: 'Categories',
    description: 'Artikel-Kategorien',
    columns: ['id', 'name', 'organization_id'],
    primaryKey: 'id',
    foreignKeys: ['organization_id → organizations'],
    rlsPolicy: 'Manager können Kategorien verwalten'
  },
  units: {
    title: 'Units',
    description: 'Maßeinheiten (Stück, kg, Liter, etc.)',
    columns: ['id', 'name', 'abbreviation', 'organization_id'],
    primaryKey: 'id',
    foreignKeys: ['organization_id → organizations'],
    rlsPolicy: 'Manager können Einheiten verwalten'
  },
  order_units: {
    title: 'Order Units',
    description: 'Bestelleinheiten (Karton, Palette)',
    columns: ['id', 'name', 'quantity', 'organization_id'],
    primaryKey: 'id',
    foreignKeys: ['organization_id → organizations'],
    rlsPolicy: 'Manager können Bestelleinheiten verwalten'
  },
  supplier_locations: {
    title: 'Supplier Locations',
    description: 'Zuordnung Lieferant ↔ Standort',
    columns: ['id', 'supplier_id', 'location_id', 'minimum_order_value', 'customer_number'],
    primaryKey: 'id',
    foreignKeys: ['supplier_id → suppliers', 'location_id → locations'],
    rlsPolicy: 'Manager können Zuordnungen verwalten'
  },
  article_price_history: {
    title: 'Article Price History',
    description: 'Preisänderungen protokollieren',
    columns: ['id', 'article_id', 'old_price', 'new_price', 'changed_at', 'change_source'],
    primaryKey: 'id',
    foreignKeys: ['article_id → articles'],
    rlsPolicy: 'Nur eigene Organisation sichtbar'
  },
  supplier_portal_tokens: {
    title: 'Supplier Portal Tokens',
    description: 'Zugangs-Tokens für Lieferantenportal',
    columns: ['id', 'supplier_id', 'token', 'expires_at', 'used_at'],
    primaryKey: 'id',
    foreignKeys: ['supplier_id → suppliers'],
    rlsPolicy: 'Admin kann Tokens verwalten'
  },
  orders: {
    title: 'Orders',
    description: 'Bestellungen an Lieferanten',
    columns: ['id', 'order_number', 'supplier_id', 'status', 'total_amount', 'delivery_address', 'notes', 'email_sent'],
    primaryKey: 'id',
    foreignKeys: ['supplier_id → suppliers', 'organization_id → organizations', 'location_id → locations', 'employee_id → employees'],
    rlsPolicy: 'Nur Bestellungen der eigenen Organisation sichtbar'
  },
  order_items: {
    title: 'Order Items',
    description: 'Einzelpositionen einer Bestellung',
    columns: ['id', 'order_id', 'article_id', 'article_name', 'quantity', 'unit_price', 'total_price'],
    primaryKey: 'id',
    foreignKeys: ['order_id → orders', 'article_id → articles'],
    rlsPolicy: 'Über Order-Zugehörigkeit geprüft'
  },
  cart_drafts: {
    title: 'Cart Drafts',
    description: 'Gespeicherte Warenkörbe/Entwürfe',
    columns: ['id', 'name', 'user_id', 'location_id', 'desired_delivery_date', 'notes'],
    primaryKey: 'id',
    foreignKeys: ['organization_id → organizations', 'location_id → locations'],
    rlsPolicy: 'Benutzer können nur eigene Entwürfe bearbeiten'
  },
  cart_draft_items: {
    title: 'Cart Draft Items',
    description: 'Positionen in Warenkorb-Entwürfen',
    columns: ['id', 'draft_id', 'article_id', 'quantity', 'free_text_name'],
    primaryKey: 'id',
    foreignKeys: ['draft_id → cart_drafts', 'article_id → articles'],
    rlsPolicy: 'Über Draft-Zugehörigkeit geprüft'
  },
  communication_logs: {
    title: 'Communication Logs',
    description: 'E-Mail-Protokoll (Bestellungen, Benachrichtigungen)',
    columns: ['id', 'email_type', 'recipient_email', 'subject', 'status', 'order_id', 'body_html'],
    primaryKey: 'id',
    foreignKeys: ['order_id → orders', 'supplier_id → suppliers', 'organization_id → organizations'],
    rlsPolicy: 'Manager können Logs einsehen'
  },
  order_confirmation_tokens: {
    title: 'Order Confirmation Tokens',
    description: 'Tokens für Lieferanten-Bestätigung',
    columns: ['id', 'order_id', 'token', 'expires_at', 'confirmed_at'],
    primaryKey: 'id',
    foreignKeys: ['order_id → orders'],
    rlsPolicy: 'Service-Role für Insert/Update'
  },
  email_templates: {
    title: 'Email Templates',
    description: 'E-Mail-Vorlagen für Bestellungen',
    columns: ['id', 'template_type', 'subject_template', 'greeting', 'introduction', 'signature'],
    primaryKey: 'id',
    foreignKeys: ['organization_id → organizations'],
    rlsPolicy: 'Admin kann Templates verwalten'
  },
  supplier_order_views: {
    title: 'Supplier Order Views',
    description: 'Tracking wann Lieferant Bestellung gesehen hat',
    columns: ['id', 'supplier_id', 'order_id', 'seen_at', 'confirmed_at'],
    primaryKey: 'id',
    foreignKeys: ['order_id → orders', 'supplier_id → suppliers'],
    rlsPolicy: 'Service-Role Zugriff'
  },
  employees: {
    title: 'Employees',
    description: 'Mitarbeiter für EasyOrder',
    columns: ['id', 'name', 'email', 'phone', 'pin_code', 'auto_approve_orders', 'voice_input_enabled', 'language'],
    primaryKey: 'id',
    foreignKeys: ['organization_id → organizations'],
    rlsPolicy: 'Admins können Mitarbeiter verwalten'
  },
  employee_locations: {
    title: 'Employee Locations',
    description: 'Mitarbeiter-Standort-Zuordnung',
    columns: ['id', 'employee_id', 'location_id'],
    primaryKey: 'id',
    foreignKeys: ['employee_id → employees', 'location_id → locations'],
    rlsPolicy: 'Admins können Zuordnungen verwalten'
  },
  employee_location_suppliers: {
    title: 'Employee Location Suppliers',
    description: 'Welche Lieferanten pro Mitarbeiter/Standort',
    columns: ['id', 'employee_id', 'location_id', 'supplier_id'],
    primaryKey: 'id',
    foreignKeys: ['employee_id → employees', 'location_id → locations', 'supplier_id → suppliers'],
    rlsPolicy: 'Admins können Zuordnungen verwalten'
  },
  employee_article_favorites: {
    title: 'Employee Article Favorites',
    description: 'Favoriten-Artikel pro Mitarbeiter',
    columns: ['id', 'employee_id', 'article_id'],
    primaryKey: 'id',
    foreignKeys: ['employee_id → employees', 'article_id → articles'],
    rlsPolicy: 'Service-Role Zugriff'
  },
  simple_order_tokens: {
    title: 'Simple Order Tokens',
    description: 'QR-Code-Tokens für EasyOrder',
    columns: ['id', 'token', 'label', 'supplier_id', 'location_id', 'employee_id', 'is_active', 'is_multi_supplier'],
    primaryKey: 'id',
    foreignKeys: ['organization_id → organizations', 'supplier_id → suppliers', 'location_id → locations'],
    rlsPolicy: 'Admins können Tokens verwalten'
  },
  simple_order_token_suppliers: {
    title: 'Simple Order Token Suppliers',
    description: 'Multi-Supplier Token Zuordnung',
    columns: ['id', 'token_id', 'supplier_id', 'sort_order'],
    primaryKey: 'id',
    foreignKeys: ['token_id → simple_order_tokens', 'supplier_id → suppliers'],
    rlsPolicy: 'Über Token-Zugehörigkeit geprüft'
  },
  suggested_articles: {
    title: 'Suggested Articles',
    description: 'Artikel-Vorschläge von Mitarbeitern/Lieferanten',
    columns: ['id', 'name', 'price', 'unit', 'status', 'supplier_id', 'source'],
    primaryKey: 'id',
    foreignKeys: ['supplier_id → suppliers', 'organization_id → organizations'],
    rlsPolicy: 'Manager können Vorschläge prüfen'
  },
  inventory_sessions: {
    title: 'Inventory Sessions',
    description: 'Inventursitzungen zur Bestandsaufnahme',
    columns: ['id', 'name', 'status', 'notes', 'completed_at', 'user_id'],
    primaryKey: 'id',
    foreignKeys: ['organization_id → organizations'],
    rlsPolicy: 'Eigene Sessions'
  },
  inventory_items: {
    title: 'Inventory Items',
    description: 'Einzelne Artikel einer Inventursitzung',
    columns: ['id', 'session_id', 'article_id', 'storage_1', 'storage_2', 'total', 'unit_price'],
    primaryKey: 'id',
    foreignKeys: ['session_id → inventory_sessions', 'article_id → articles'],
    rlsPolicy: 'Via Session-Zugehörigkeit'
  },
  supplier_b2b_accounts: {
    title: 'Supplier B2B Accounts',
    description: 'B2B-Lieferanten-Konten',
    columns: ['id', 'company_name', 'email', 'owner_user_id', 'logo_url'],
    primaryKey: 'id',
    foreignKeys: [],
    rlsPolicy: 'Owner und zugeordnete Benutzer haben Zugriff'
  },
  supplier_b2b_customers: {
    title: 'Supplier B2B Customers',
    description: 'B2B-Kunden eines Lieferanten',
    columns: ['id', 'company_name', 'email', 'user_id', 'supplier_account_id'],
    primaryKey: 'id',
    foreignKeys: ['supplier_account_id → supplier_b2b_accounts'],
    rlsPolicy: 'Kunden und Lieferanten-Owner haben Zugriff'
  },
  supplier_b2b_articles: {
    title: 'Supplier B2B Articles',
    description: 'B2B-Artikelkatalog',
    columns: ['id', 'name', 'price', 'unit', 'category', 'supplier_account_id'],
    primaryKey: 'id',
    foreignKeys: ['supplier_account_id → supplier_b2b_accounts'],
    rlsPolicy: 'Lieferanten-Owner und Kunden haben Zugriff'
  },
  supplier_b2b_orders: {
    title: 'Supplier B2B Orders',
    description: 'B2B-Bestellungen',
    columns: ['id', 'order_number', 'customer_id', 'supplier_account_id', 'status', 'total_amount'],
    primaryKey: 'id',
    foreignKeys: ['customer_id → supplier_b2b_customers', 'supplier_account_id → supplier_b2b_accounts'],
    rlsPolicy: 'Kunde kann eigene Bestellungen sehen, Lieferant alle'
  },
  supplier_b2b_order_items: {
    title: 'Supplier B2B Order Items',
    description: 'B2B-Bestellpositionen',
    columns: ['id', 'order_id', 'article_id', 'article_name', 'quantity', 'unit_price'],
    primaryKey: 'id',
    foreignKeys: ['order_id → supplier_b2b_orders', 'article_id → supplier_b2b_articles'],
    rlsPolicy: 'Über Order-Zugehörigkeit geprüft'
  },
  supplier_b2b_offers: {
    title: 'Supplier B2B Offers',
    description: 'Angebote an B2B-Kunden',
    columns: ['id', 'offer_number', 'customer_id', 'supplier_account_id', 'status', 'total_amount'],
    primaryKey: 'id',
    foreignKeys: ['customer_id → supplier_b2b_customers', 'supplier_account_id → supplier_b2b_accounts'],
    rlsPolicy: 'Lieferanten-Owner und Kunden haben Zugriff'
  },
  supplier_b2b_offer_items: {
    title: 'Supplier B2B Offer Items',
    description: 'Angebotsposition',
    columns: ['id', 'offer_id', 'article_id', 'article_name', 'quantity', 'unit_price'],
    primaryKey: 'id',
    foreignKeys: ['offer_id → supplier_b2b_offers'],
    rlsPolicy: 'Über Offer-Zugehörigkeit geprüft'
  },
  b2b_suppliers: {
    title: 'B2B Suppliers',
    description: 'Lieferanten innerhalb eines B2B-Accounts',
    columns: ['id', 'name', 'account_id', 'contact_email', 'logo_url', 'is_active'],
    primaryKey: 'id',
    foreignKeys: ['account_id → supplier_b2b_accounts'],
    rlsPolicy: 'Account-Owner und Kunden haben Zugriff'
  },
  b2b_supplier_users: {
    title: 'B2B Supplier Users',
    description: 'Benutzer eines B2B-Lieferanten',
    columns: ['id', 'user_id', 'supplier_id', 'account_id', 'role', 'email'],
    primaryKey: 'id',
    foreignKeys: ['supplier_id → b2b_suppliers', 'account_id → supplier_b2b_accounts'],
    rlsPolicy: 'Account-Owner kann Benutzer verwalten'
  },
  b2b_supplier_vendors: {
    title: 'B2B Supplier Vendors',
    description: 'Lieferanten eines B2B-Lieferanten (Einkauf)',
    columns: ['id', 'supplier_account_id', 'name', 'email', 'phone', 'is_active'],
    primaryKey: 'id',
    foreignKeys: ['supplier_account_id → supplier_b2b_accounts'],
    rlsPolicy: 'Lieferanten-Owner kann eigene Vendors verwalten'
  },
  b2b_supplier_purchase_orders: {
    title: 'B2B Supplier Purchase Orders',
    description: 'Einkaufsbestellungen eines B2B-Lieferanten',
    columns: ['id', 'order_number', 'vendor_id', 'supplier_account_id', 'status', 'total_amount'],
    primaryKey: 'id',
    foreignKeys: ['vendor_id → b2b_supplier_vendors', 'supplier_account_id → supplier_b2b_accounts'],
    rlsPolicy: 'Lieferanten-Owner kann Bestellungen verwalten'
  },
  b2b_supplier_purchase_order_items: {
    title: 'B2B Supplier Purchase Order Items',
    description: 'Positionen einer Einkaufsbestellung',
    columns: ['id', 'order_id', 'article_id', 'article_name', 'quantity', 'unit_price'],
    primaryKey: 'id',
    foreignKeys: ['order_id → b2b_supplier_purchase_orders'],
    rlsPolicy: 'Über Order-Zugehörigkeit geprüft'
  },
  b2b_customer_vendors: {
    title: 'B2B Customer Vendors',
    description: 'Lieferanten eines B2B-Kunden (Einkauf)',
    columns: ['id', 'customer_id', 'name', 'email', 'phone', 'is_active'],
    primaryKey: 'id',
    foreignKeys: ['customer_id → supplier_b2b_customers'],
    rlsPolicy: 'Kunde kann eigene Lieferanten verwalten'
  },
  b2b_customer_vendor_articles: {
    title: 'B2B Customer Vendor Articles',
    description: 'Artikel eines Kunden-Lieferanten',
    columns: ['id', 'vendor_id', 'customer_id', 'name', 'price', 'unit'],
    primaryKey: 'id',
    foreignKeys: ['vendor_id → b2b_customer_vendors', 'customer_id → supplier_b2b_customers'],
    rlsPolicy: 'Kunde kann eigene Artikel verwalten'
  },
  b2b_customer_purchase_orders: {
    title: 'B2B Customer Purchase Orders',
    description: 'Einkaufsbestellungen eines B2B-Kunden',
    columns: ['id', 'order_number', 'vendor_id', 'customer_id', 'status', 'total_amount'],
    primaryKey: 'id',
    foreignKeys: ['vendor_id → b2b_customer_vendors', 'customer_id → supplier_b2b_customers'],
    rlsPolicy: 'Kunde kann Bestellungen verwalten'
  },
  b2b_customer_purchase_order_items: {
    title: 'B2B Customer Purchase Order Items',
    description: 'Positionen einer Kunden-Einkaufsbestellung',
    columns: ['id', 'order_id', 'article_id', 'article_name', 'quantity', 'unit_price'],
    primaryKey: 'id',
    foreignKeys: ['order_id → b2b_customer_purchase_orders'],
    rlsPolicy: 'Über Order-Zugehörigkeit geprüft'
  },
  b2b_customer_supplier_access: {
    title: 'B2B Customer Supplier Access',
    description: 'Zuordnung Kunde ↔ B2B-Lieferant',
    columns: ['id', 'customer_id', 'supplier_id'],
    primaryKey: 'id',
    foreignKeys: ['customer_id → supplier_b2b_customers', 'supplier_id → b2b_suppliers'],
    rlsPolicy: 'Account-Owner und Kunden haben Zugriff'
  },
  b2b_customer_invitations: {
    title: 'B2B Customer Invitations',
    description: 'Einladungen für B2B-Kunden',
    columns: ['id', 'supplier_account_id', 'email', 'token', 'expires_at', 'accepted_at'],
    primaryKey: 'id',
    foreignKeys: ['supplier_account_id → supplier_b2b_accounts'],
    rlsPolicy: 'Account-Owner kann Einladungen verwalten'
  },
  customer_article_prices: {
    title: 'Customer Article Prices',
    description: 'Kundenspezifische Artikelpreise',
    columns: ['id', 'customer_id', 'article_id', 'custom_price'],
    primaryKey: 'id',
    foreignKeys: ['customer_id → supplier_b2b_customers', 'article_id → supplier_b2b_articles'],
    rlsPolicy: 'Account-Owner und Kunde haben Zugriff'
  }
};

// Statistics card component
const StatCard = ({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; color: string }) => (
  <Card className="border-border/50">
    <CardContent className="p-4 flex items-center gap-3">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </CardContent>
  </Card>
);

export const DatabaseArchitectureDiagram: React.FC = () => {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategories, setActiveCategories] = useState<string[]>(categories.map(c => c.id));

  // Calculate totals
  const totalTables = categories.reduce((sum, cat) => sum + cat.tables.length, 0);
  const totalColumns = Object.values(tableDetails).reduce((sum, t) => sum + t.columns.length, 0);
  const totalRelationships = Object.values(tableDetails).reduce((sum, t) => sum + t.foreignKeys.length, 0);

  // Filter categories and tables based on search and active filters
  const filteredCategories = useMemo(() => {
    return categories
      .filter(cat => activeCategories.includes(cat.id))
      .map(cat => ({
        ...cat,
        tables: cat.tables.filter(table => 
          table.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tableDetails[table]?.title.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }))
      .filter(cat => cat.tables.length > 0 || searchTerm === '');
  }, [searchTerm, activeCategories]);

  const toggleCategory = (categoryId: string) => {
    setActiveCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const selectedTableDetails = selectedTable ? tableDetails[selectedTable] : null;
  const selectedCategory = selectedTable 
    ? categories.find(c => c.tables.includes(selectedTable))
    : null;

  return (
    <div className="space-y-6">
      {/* Statistics Header */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon={Database} label="Tabellen" value={totalTables} color="bg-primary/10 text-primary" />
        <StatCard icon={Layers} label="Module" value={categories.length} color="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" />
        <StatCard icon={Columns} label="Spalten" value={`~${totalColumns}`} color="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" />
        <StatCard icon={Link2} label="Beziehungen" value={totalRelationships} color="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" />
        <StatCard icon={Shield} label="RLS Policies" value="100%" color="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400" />
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tabelle suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Module filtern
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {categories.map(cat => (
              <DropdownMenuCheckboxItem
                key={cat.id}
                checked={activeCategories.includes(cat.id)}
                onCheckedChange={() => toggleCategory(cat.id)}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${cat.dotClass}`} />
                  {cat.name}
                </div>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Category Accordions */}
      <Accordion type="multiple" defaultValue={categories.map(c => c.id)} className="space-y-3">
        {filteredCategories.map(category => {
          const Icon = category.icon;
          return (
            <AccordionItem 
              key={category.id} 
              value={category.id}
              className={`border rounded-lg ${category.borderClass} ${category.bgClass} overflow-hidden`}
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${category.dotClass}`} />
                  <Icon className="h-5 w-5" />
                  <span className="font-semibold">{category.name}</span>
                  <Badge variant="secondary" className="ml-2">
                    {category.tables.length} Tabellen
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm text-muted-foreground mb-4">{category.description}</p>
                <div className="flex flex-wrap gap-2">
                  {category.tables.map(table => (
                    <Badge
                      key={table}
                      variant="outline"
                      className={`cursor-pointer transition-all ${category.badgeClass} border-0`}
                      onClick={() => setSelectedTable(table)}
                    >
                      <Table2 className="h-3 w-3 mr-1" />
                      {table}
                    </Badge>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* No results */}
      {filteredCategories.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Keine Tabellen gefunden für "{searchTerm}"</p>
        </div>
      )}

      {/* Table Detail Sheet */}
      <Sheet open={!!selectedTable} onOpenChange={() => setSelectedTable(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              {selectedTableDetails?.title || selectedTable}
            </SheetTitle>
            <SheetDescription>{selectedTableDetails?.description}</SheetDescription>
          </SheetHeader>

          {selectedTableDetails && (
            <ScrollArea className="h-[calc(100vh-200px)] mt-6">
              <div className="space-y-6 pr-4">
                {/* Category Badge */}
                {selectedCategory && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Modul</h4>
                    <Badge className={`${selectedCategory.badgeClass} border-0`}>
                      {selectedCategory.name}
                    </Badge>
                  </div>
                )}

                {/* Primary Key */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Primary Key
                  </h4>
                  <code className="text-sm bg-muted px-2 py-1 rounded">{selectedTableDetails.primaryKey}</code>
                </div>

                {/* Columns */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <Columns className="h-4 w-4" />
                    Spalten ({selectedTableDetails.columns.length})
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedTableDetails.columns.map(col => (
                      <Badge key={col} variant="secondary" className="text-xs">
                        {col}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Foreign Keys */}
                {selectedTableDetails.foreignKeys.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <Link2 className="h-4 w-4" />
                      Beziehungen ({selectedTableDetails.foreignKeys.length})
                    </h4>
                    <div className="space-y-1">
                      {selectedTableDetails.foreignKeys.map((fk, i) => (
                        <div key={i} className="text-sm font-mono bg-muted/50 px-2 py-1 rounded">
                          {fk}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* RLS Policy */}
                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    RLS Policy
                  </h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    {selectedTableDetails.rlsPolicy}
                  </p>
                </div>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default DatabaseArchitectureDiagram;