import { useEffect, useState, useRef } from 'react';
import mermaid from 'mermaid';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';

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

      <div className="text-xs text-muted-foreground">
        <p><strong>Legende:</strong> Jede Box repräsentiert eine Datenbanktabelle. Linien zeigen Beziehungen zwischen Tabellen (1:n, n:m).</p>
      </div>
    </div>
  );
};
