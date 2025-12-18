import { useEffect, useState, useRef } from 'react';
import mermaid from 'mermaid';
import { Button } from '@/components/ui/button';
import { Download, Loader2, Database, Shield, Info, Table2, Key, Link } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import jsPDF from 'jspdf';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

// Table category colors
const categoryColors = {
  core: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
  catalog: { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
  orders: { bg: '#ede9fe', border: '#8b5cf6', text: '#5b21b6' },
  easyorder: { bg: '#ffedd5', border: '#f97316', text: '#9a3412' },
  b2b: { bg: '#cffafe', border: '#06b6d4', text: '#0e7490' }
};

// Table category mapping
const tableCategories: Record<string, keyof typeof categoryColors> = {
  // Core
  organizations: 'core',
  profiles: 'core',
  user_roles: 'core',
  locations: 'core',
  delivery_addresses: 'core',
  notification_preferences: 'core',
  // Catalog
  suppliers: 'catalog',
  articles: 'catalog',
  categories: 'catalog',
  units: 'catalog',
  order_units: 'catalog',
  supplier_locations: 'catalog',
  supplier_portal_tokens: 'catalog',
  article_price_history: 'catalog',
  // Orders
  orders: 'orders',
  order_items: 'orders',
  order_confirmation_tokens: 'orders',
  cart_drafts: 'orders',
  cart_draft_items: 'orders',
  supplier_order_views: 'orders',
  communication_logs: 'orders',
  email_templates: 'orders',
  // EasyOrder
  employees: 'easyorder',
  employee_locations: 'easyorder',
  employee_location_suppliers: 'easyorder',
  employee_article_favorites: 'easyorder',
  simple_order_tokens: 'easyorder',
  simple_order_token_suppliers: 'easyorder',
  inventory_sessions: 'easyorder',
  inventory_items: 'easyorder',
  // B2B
  supplier_b2b_accounts: 'b2b',
  supplier_b2b_customers: 'b2b',
  supplier_b2b_orders: 'b2b',
  supplier_b2b_order_items: 'b2b',
  supplier_b2b_articles: 'b2b',
  supplier_b2b_offers: 'b2b',
  supplier_b2b_offer_items: 'b2b',
  b2b_suppliers: 'b2b',
  b2b_supplier_users: 'b2b',
  b2b_supplier_vendors: 'b2b',
  b2b_supplier_purchase_orders: 'b2b',
  b2b_supplier_purchase_order_items: 'b2b',
  b2b_customer_supplier_access: 'b2b',
  b2b_customer_vendors: 'b2b',
  b2b_customer_vendor_articles: 'b2b',
  b2b_customer_purchase_orders: 'b2b',
  b2b_customer_purchase_order_items: 'b2b',
  b2b_customer_invitations: 'b2b',
  customer_article_prices: 'b2b'
};

// Table details for the info sheet
interface TableDetail {
  title: string;
  description: string;
  category: keyof typeof categoryColors;
  columns: string[];
  primaryKey: string;
  foreignKeys?: string[];
  rlsPolicy: string;
}

const tableDetails: Record<string, TableDetail> = {
  organizations: {
    title: 'Organizations',
    description: 'Haupttabelle für Mandantentrennung. Jede Organisation hat eigene Daten.',
    category: 'core',
    columns: ['id', 'name', 'subscription_tier', 'trial_ends_at', 'test_mode_enabled', 'is_demo', 'contact_email'],
    primaryKey: 'id (UUID)',
    rlsPolicy: 'Nutzer sehen nur eigene Organisation'
  },
  profiles: {
    title: 'Profiles',
    description: 'Benutzerprofile mit Verknüpfung zu auth.users.',
    category: 'core',
    columns: ['id', 'email', 'full_name', 'organization_id', 'color_scheme', 'created_at'],
    primaryKey: 'id (UUID, = auth.user.id)',
    foreignKeys: ['organization_id → organizations'],
    rlsPolicy: 'Eigenes Profil lesbar, Admin kann Team sehen'
  },
  locations: {
    title: 'Locations',
    description: 'Standorte innerhalb einer Organisation (z.B. Filialen, Küchen).',
    category: 'core',
    columns: ['id', 'name', 'short_code', 'email', 'is_default', 'organization_id'],
    primaryKey: 'id (UUID)',
    foreignKeys: ['organization_id → organizations'],
    rlsPolicy: 'Nur eigene Organisation'
  },
  suppliers: {
    title: 'Suppliers (Lieferanten)',
    description: 'Lieferanten-Stammdaten mit Kontaktinformationen.',
    category: 'catalog',
    columns: ['id', 'name', 'email', 'phone', 'address', 'contact_person', 'customer_number', 'minimum_order_value'],
    primaryKey: 'id (UUID)',
    foreignKeys: ['organization_id → organizations'],
    rlsPolicy: 'Admin/Manager können bearbeiten, alle können lesen'
  },
  articles: {
    title: 'Articles (Artikel)',
    description: 'Artikel-Stammdaten mit Preisen, Einheiten und Kategorien.',
    category: 'catalog',
    columns: ['id', 'name', 'price', 'unit', 'category', 'sku', 'supplier_id', 'image_url', 'description'],
    primaryKey: 'id (UUID)',
    foreignKeys: ['supplier_id → suppliers', 'organization_id → organizations', 'order_unit_id → order_units'],
    rlsPolicy: 'Admin/Manager können bearbeiten, alle können lesen'
  },
  orders: {
    title: 'Orders (Bestellungen)',
    description: 'Bestellungen mit Status, Lieferadresse und Notizen.',
    category: 'orders',
    columns: ['id', 'order_number', 'status', 'total_amount', 'delivery_address', 'notes', 'email_sent'],
    primaryKey: 'id (UUID)',
    foreignKeys: ['supplier_id → suppliers', 'location_id → locations', 'employee_id → employees'],
    rlsPolicy: 'Nur eigene Organisation'
  },
  order_items: {
    title: 'Order Items',
    description: 'Einzelne Positionen einer Bestellung.',
    category: 'orders',
    columns: ['id', 'order_id', 'article_id', 'article_name', 'quantity', 'unit_price', 'total_price'],
    primaryKey: 'id (UUID)',
    foreignKeys: ['order_id → orders', 'article_id → articles'],
    rlsPolicy: 'Via Order-Zugehörigkeit'
  },
  employees: {
    title: 'Employees (Mitarbeiter)',
    description: 'Mitarbeiter für EasyOrder mit PIN-Code und Berechtigungen.',
    category: 'easyorder',
    columns: ['id', 'name', 'phone', 'email', 'pin_code', 'auto_approve_orders', 'voice_input_enabled', 'language'],
    primaryKey: 'id (UUID)',
    foreignKeys: ['organization_id → organizations'],
    rlsPolicy: 'Admin kann verwalten, alle können lesen'
  },
  employee_locations: {
    title: 'Employee Locations',
    description: 'Zuordnung von Mitarbeitern zu Standorten.',
    category: 'easyorder',
    columns: ['id', 'employee_id', 'location_id', 'created_at'],
    primaryKey: 'id (UUID)',
    foreignKeys: ['employee_id → employees', 'location_id → locations'],
    rlsPolicy: 'Via Employee-Zugehörigkeit'
  },
  simple_order_tokens: {
    title: 'Simple Order Tokens',
    description: 'Tokens für den EasyOrder-Zugang (QR-Code basiert).',
    category: 'easyorder',
    columns: ['id', 'token', 'label', 'language', 'is_multi_supplier', 'supplier_id', 'location_id', 'expires_at'],
    primaryKey: 'id (UUID)',
    foreignKeys: ['organization_id → organizations', 'supplier_id → suppliers', 'location_id → locations'],
    rlsPolicy: 'Admin kann verwalten'
  },
  cart_drafts: {
    title: 'Cart Drafts (Warenkorb-Entwürfe)',
    description: 'Gespeicherte Warenkörbe für spätere Bestellung.',
    category: 'orders',
    columns: ['id', 'name', 'notes', 'delivery_address', 'desired_delivery_date', 'location_id'],
    primaryKey: 'id (UUID)',
    foreignKeys: ['organization_id → organizations', 'user_id → profiles', 'location_id → locations'],
    rlsPolicy: 'Eigene Entwürfe, Admin/Manager sehen alle'
  },
  supplier_b2b_accounts: {
    title: 'Supplier B2B Accounts',
    description: 'B2B-Konten für Lieferanten mit eigenem Portal.',
    category: 'b2b',
    columns: ['id', 'linked_supplier_id', 'company_name', 'logo_url', 'contact_email', 'created_at'],
    primaryKey: 'id (UUID)',
    foreignKeys: ['linked_supplier_id → suppliers'],
    rlsPolicy: 'Eigentümer und Kunden des Accounts'
  },
  supplier_b2b_customers: {
    title: 'Supplier B2B Customers',
    description: 'Kunden eines B2B-Lieferanten mit Login-Daten.',
    category: 'b2b',
    columns: ['id', 'supplier_account_id', 'user_id', 'company_name', 'email', 'is_active'],
    primaryKey: 'id (UUID)',
    foreignKeys: ['supplier_account_id → supplier_b2b_accounts', 'user_id → auth.users'],
    rlsPolicy: 'Eigene Daten + Account-Owner'
  },
  supplier_b2b_orders: {
    title: 'Supplier B2B Orders',
    description: 'Bestellungen von B2B-Kunden.',
    category: 'b2b',
    columns: ['id', 'order_number', 'customer_id', 'supplier_id', 'total_amount', 'status', 'delivery_date'],
    primaryKey: 'id (UUID)',
    foreignKeys: ['customer_id → supplier_b2b_customers', 'supplier_id → b2b_suppliers'],
    rlsPolicy: 'Kunde und Account-Owner'
  },
  b2b_suppliers: {
    title: 'B2B Suppliers',
    description: 'Lieferanten innerhalb eines B2B-Accounts.',
    category: 'b2b',
    columns: ['id', 'account_id', 'name', 'contact_email', 'contact_phone', 'logo_url', 'order_delivery_method'],
    primaryKey: 'id (UUID)',
    foreignKeys: ['account_id → supplier_b2b_accounts'],
    rlsPolicy: 'Account-Owner und zugelassene Kunden'
  },
  communication_logs: {
    title: 'Communication Logs',
    description: 'Protokoll aller gesendeten E-Mails und Benachrichtigungen.',
    category: 'orders',
    columns: ['id', 'email_type', 'recipient_email', 'subject', 'status', 'body_html', 'order_id'],
    primaryKey: 'id (UUID)',
    foreignKeys: ['organization_id → organizations', 'order_id → orders', 'supplier_id → suppliers'],
    rlsPolicy: 'Nur eigene Organisation'
  },
  inventory_sessions: {
    title: 'Inventory Sessions',
    description: 'Inventursitzungen zur Bestandsaufnahme.',
    category: 'easyorder',
    columns: ['id', 'name', 'status', 'notes', 'completed_at', 'user_id'],
    primaryKey: 'id (UUID)',
    foreignKeys: ['organization_id → organizations'],
    rlsPolicy: 'Eigene Sessions'
  },
  inventory_items: {
    title: 'Inventory Items',
    description: 'Einzelne Artikel einer Inventursitzung.',
    category: 'easyorder',
    columns: ['id', 'session_id', 'article_id', 'storage_1', 'storage_2', 'total', 'unit_price'],
    primaryKey: 'id (UUID)',
    foreignKeys: ['session_id → inventory_sessions', 'article_id → articles'],
    rlsPolicy: 'Via Session-Zugehörigkeit'
  }
};

// Define the ER diagram for database architecture
const diagramDefinition = `
erDiagram
    %% Core
    organizations ||--o{ profiles : "has users"
    organizations ||--o{ locations : "has"
    organizations ||--o{ suppliers : "has"
    organizations ||--o{ articles : "has"
    organizations ||--o{ orders : "has"
    organizations ||--o{ employees : "has"
    organizations ||--o{ categories : "has"
    organizations ||--o{ order_units : "has"
    organizations ||--o{ units : "has"
    organizations ||--o{ cart_drafts : "has"
    organizations ||--o{ inventory_sessions : "has"
    organizations ||--o{ communication_logs : "has"
    organizations ||--o{ email_templates : "has"
    organizations ||--o{ delivery_addresses : "has"

    %% User Management
    profiles ||--o{ user_roles : "has"
    profiles ||--o{ cart_drafts : "creates"
    profiles ||--o{ notification_preferences : "has"

    %% Locations & Addresses
    locations ||--o{ delivery_addresses : "has"
    locations ||--o{ orders : "originates"
    locations ||--o{ employee_locations : "assigned"
    locations ||--o{ supplier_locations : "linked"

    %% Suppliers & Articles
    suppliers ||--o{ articles : "provides"
    suppliers ||--o{ orders : "receives"
    suppliers ||--o{ supplier_locations : "at"
    suppliers ||--o{ supplier_portal_tokens : "has"
    articles ||--o{ order_items : "in"
    articles ||--o{ cart_draft_items : "in"
    articles ||--o{ inventory_items : "tracked"
    articles ||--o{ article_price_history : "has"
    order_units ||--o{ articles : "used by"

    %% Orders
    orders ||--o{ order_items : "contains"
    orders ||--o{ order_confirmation_tokens : "has"
    orders ||--o{ supplier_order_views : "viewed"
    orders ||--o{ communication_logs : "logged"

    %% Cart & Drafts
    cart_drafts ||--o{ cart_draft_items : "contains"

    %% Employees & EasyOrder
    employees ||--o{ employee_locations : "assigned"
    employees ||--o{ employee_location_suppliers : "can order from"
    employees ||--o{ employee_article_favorites : "has"
    employees ||--o{ orders : "submitted by"
    simple_order_tokens ||--o{ simple_order_token_suppliers : "linked"
    employees ||--o{ simple_order_tokens : "personalized"

    %% Inventory
    inventory_sessions ||--o{ inventory_items : "contains"

    %% B2B Supplier Portal
    supplier_b2b_accounts ||--o{ b2b_suppliers : "manages"
    supplier_b2b_accounts ||--o{ supplier_b2b_customers : "has"
    supplier_b2b_accounts ||--o{ b2b_supplier_users : "has users"
    supplier_b2b_accounts ||--o{ b2b_supplier_vendors : "purchases from"
    supplier_b2b_accounts ||--o{ b2b_supplier_purchase_orders : "places"
    b2b_suppliers ||--o{ supplier_b2b_articles : "sells"
    b2b_suppliers ||--o{ b2b_customer_supplier_access : "accessed by"
    supplier_b2b_customers ||--o{ supplier_b2b_orders : "places"
    supplier_b2b_customers ||--o{ b2b_customer_supplier_access : "has access"
    supplier_b2b_customers ||--o{ customer_article_prices : "has custom"
    supplier_b2b_customers ||--o{ b2b_customer_vendors : "has own"
    supplier_b2b_customers ||--o{ b2b_customer_invitations : "invited via"

    %% B2B Orders & Offers
    supplier_b2b_orders ||--o{ supplier_b2b_order_items : "contains"
    supplier_b2b_offers ||--o{ supplier_b2b_offer_items : "contains"
    b2b_supplier_purchase_orders ||--o{ b2b_supplier_purchase_order_items : "contains"
    b2b_customer_purchase_orders ||--o{ b2b_customer_purchase_order_items : "contains"

    %% B2B Customer's Own Vendors
    b2b_customer_vendors ||--o{ b2b_customer_vendor_articles : "sells"
    b2b_customer_vendors ||--o{ b2b_customer_purchase_orders : "receives"
`;

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  securityLevel: 'loose',
  er: {
    diagramPadding: 20,
    layoutDirection: 'TB',
    minEntityWidth: 100,
    minEntityHeight: 75,
    entityPadding: 15,
    useMaxWidth: false
  },
  themeVariables: {
    primaryColor: '#3b82f6',
    primaryTextColor: '#1e293b',
    primaryBorderColor: '#64748b',
    lineColor: '#64748b',
    secondaryColor: '#f1f5f9',
    tertiaryColor: '#e2e8f0'
  }
});

export const DatabaseArchitectureDiagram = () => {
  const [isRendered, setIsRendered] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const diagramRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderDiagram = async () => {
      if (diagramRef.current) {
        try {
          diagramRef.current.innerHTML = '';
          const { svg } = await mermaid.render('db-architecture-diagram', diagramDefinition);
          diagramRef.current.innerHTML = svg;
          setIsRendered(true);
        } catch (error) {
          console.error('Error rendering database diagram:', error);
        }
      }
    };
    renderDiagram();
  }, []);

  // Apply colors and click handlers after rendering
  useEffect(() => {
    if (isRendered && diagramRef.current) {
      const svgElement = diagramRef.current.querySelector('svg');
      if (!svgElement) return;

      // Find all entity labels and apply colors/click handlers
      const entityLabels = svgElement.querySelectorAll('.er.entityLabel');
      
      entityLabels.forEach((label) => {
        const textElement = label.querySelector('tspan') || label.querySelector('text');
        const tableName = textElement?.textContent?.trim();
        
        if (tableName) {
          // Find the parent group that contains the entity box
          const entityGroup = label.closest('g');
          const entityBox = entityGroup?.querySelector('.er.entityBox');
          
          if (entityBox && tableName) {
            const category = tableCategories[tableName];
            
            if (category) {
              const colors = categoryColors[category];
              (entityBox as SVGElement).style.fill = colors.bg;
              (entityBox as SVGElement).style.stroke = colors.border;
              (entityBox as SVGElement).style.strokeWidth = '2px';
            }
            
            // Add interactivity for tables with details
            if (tableDetails[tableName]) {
              if (entityGroup) {
                (entityGroup as SVGElement).style.cursor = 'pointer';
                entityGroup.classList.add('interactive-table');
                
                entityGroup.addEventListener('click', () => {
                  setSelectedTable(tableName);
                });
                
                // Add hover effect
                entityGroup.addEventListener('mouseenter', () => {
                  if (entityBox) {
                    (entityBox as SVGElement).style.filter = 'brightness(0.92)';
                    (entityBox as SVGElement).style.transform = 'scale(1.02)';
                  }
                });
                
                entityGroup.addEventListener('mouseleave', () => {
                  if (entityBox) {
                    (entityBox as SVGElement).style.filter = '';
                    (entityBox as SVGElement).style.transform = '';
                  }
                });
              }
            }
          }
        }
      });
    }
  }, [isRendered]);

  const exportToPDF = async () => {
    if (!diagramRef.current) return;
    setIsExporting(true);

    try {
      const svgElement = diagramRef.current.querySelector('svg');
      if (!svgElement) return;

      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = 2;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.scale(scale, scale);
          ctx.drawImage(img, 0, 0);
        }

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: img.width > img.height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [img.width + 40, img.height + 80]
        });

        pdf.setFontSize(20);
        pdf.text('Datenbankarchitektur - ER-Diagramm', 20, 30);
        pdf.setFontSize(10);
        pdf.text(`Generiert am ${new Date().toLocaleDateString('de-DE')}`, 20, 45);
        pdf.addImage(imgData, 'PNG', 20, 60, img.width, img.height);
        pdf.save('datenbankarchitektur.pdf');

        URL.revokeObjectURL(url);
        setIsExporting(false);
      };
      img.src = url;
    } catch (error) {
      console.error('Error exporting PDF:', error);
      setIsExporting(false);
    }
  };

  const selectedDetails = selectedTable ? tableDetails[selectedTable] : null;
  const categoryLabel = {
    core: 'Core',
    catalog: 'Katalog',
    orders: 'Bestellungen',
    easyorder: 'EasyOrder',
    b2b: 'B2B Portal'
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Core
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Katalog
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            Bestellungen
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            EasyOrder
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
            B2B Portal
          </span>
        </div>
        <Button onClick={exportToPDF} disabled={!isRendered || isExporting} variant="outline" size="sm">
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          PDF Export
        </Button>
      </div>

      <div className="border rounded-lg bg-card overflow-auto max-h-[70vh]">
        {!isRendered && (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        <div 
          ref={diagramRef} 
          className="p-4 min-w-max"
          style={{ display: isRendered ? 'block' : 'none' }}
        />
      </div>

      {isRendered && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4" />
          <span>Klicke auf eine farbige Tabelle für Details zu Spalten und RLS-Policies</span>
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        <p><strong>Legende:</strong> Jede Box repräsentiert eine Datenbanktabelle. Linien zeigen Beziehungen zwischen Tabellen (1:n, n:m).</p>
      </div>

      {/* Table Details Sheet */}
      <Sheet open={!!selectedTable} onOpenChange={() => setSelectedTable(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              {selectedDetails?.title || selectedTable}
            </SheetTitle>
            <SheetDescription>{selectedDetails?.description}</SheetDescription>
          </SheetHeader>
          
          {selectedDetails && (
            <div className="mt-6 space-y-6">
              {/* Category Badge */}
              <div>
                <Badge 
                  variant="secondary" 
                  className="text-xs"
                  style={{ 
                    backgroundColor: categoryColors[selectedDetails.category].bg,
                    color: categoryColors[selectedDetails.category].text,
                    borderColor: categoryColors[selectedDetails.category].border
                  }}
                >
                  {categoryLabel[selectedDetails.category]}
                </Badge>
              </div>

              {/* Primary Key */}
              <div>
                <h4 className="flex items-center gap-2 font-medium mb-2 text-sm">
                  <Key className="h-4 w-4 text-amber-500" />
                  Primary Key
                </h4>
                <Badge variant="outline" className="font-mono text-xs">
                  {selectedDetails.primaryKey}
                </Badge>
              </div>

              {/* Columns */}
              <div>
                <h4 className="flex items-center gap-2 font-medium mb-2 text-sm">
                  <Table2 className="h-4 w-4 text-blue-500" />
                  Spalten
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedDetails.columns.map((col) => (
                    <Badge key={col} variant="secondary" className="font-mono text-xs">
                      {col}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Foreign Keys */}
              {selectedDetails.foreignKeys && selectedDetails.foreignKeys.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-2 font-medium mb-2 text-sm">
                    <Link className="h-4 w-4 text-purple-500" />
                    Foreign Keys
                  </h4>
                  <div className="space-y-1">
                    {selectedDetails.foreignKeys.map((fk) => (
                      <div key={fk} className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                        {fk}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* RLS Policy */}
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="font-medium text-sm text-amber-800 dark:text-amber-300">RLS Policy</span>
                </div>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  {selectedDetails.rlsPolicy}
                </p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
