import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useTranslation } from 'react-i18next';

const diagramDefinition = `
flowchart TB
    subgraph PUBLIC["🌐 Öffentlich"]
        LANDING["/"]
        PRICING["/pricing"]
        AGB["/agb"]
        IMPRESSUM["/impressum"]
        DATENSCHUTZ["/datenschutz"]
    end

    subgraph AUTH["🔐 Authentifizierung"]
        LOGIN["/auth<br/>Login/Signup"]
        SUP_AUTH["/supplier/auth<br/>Lieferanten-Login"]
        B2B_LOGIN["/b2b/login<br/>B2B Supplier Login"]
    end

    subgraph MAIN["📦 Bestellung.pro Hauptapp"]
        KATALOG["/suppliers<br/>Katalog"]
        ORDERS["/orders<br/>Bestellungen"]
        REPORTS["/reports<br/>Berichte"]
        SETTINGS["/settings<br/>Einstellungen"]
        CART["/cart<br/>Warenkorb"]
        CHECKOUT["/checkout<br/>Kasse"]
        
        subgraph KATALOG_TABS["Katalog Tabs"]
            KT1["Lieferanten"]
            KT2["Artikel"]
            KT3["Weine"]
            KT4["Vorschläge"]
        end
        
        subgraph ORDER_TABS["Bestellungen Tabs"]
            OT1["Bestellungen"]
            OT2["Vorbestellungen"]
            OT3["EasyOrder"]
        end
        
        subgraph REPORT_TABS["Berichte Tabs"]
            RT1["Übersicht"]
            RT2["Inventur"]
        end
        
        subgraph SETTINGS_TABS["Einstellungen Tabs"]
            ST1["Profil"]
            ST2["Organisation"]
            ST3["Kommunikation"]
        end
    end

    subgraph SUP_PORTAL["📋 Lieferanten-Portal"]
        SUP_PORTAL_PAGE["/supplier/portal<br/>Artikel bearbeiten"]
    end

    subgraph EASY["📱 EasyOrder Kiosk"]
        SIMPLE_ORDER["/simple-order?token=xxx<br/>Vereinfachte Bestellung"]
        WINE_CAT["/wine-catalog?token=xxx<br/>Weinkarte"]
    end

    subgraph B2B_SUP["🏢 B2B Supplier Portal"]
        B2B_DASH["/b2b/portal<br/>B2B Dashboard"]
        
        subgraph B2B_TABS["B2B Tabs"]
            BT1["Artikel"]
            BT2["Kunden"]
            BT3["Bestellungen"]
            BT4["Angebote"]
            BT5["Mein Einkauf"]
            BT6["Einstellungen"]
        end
    end

    subgraph B2B_CUST["🛒 B2B Kunden-Portal"]
        B2B_CUST_PORTAL["/b2b/customer<br/>Kundenportal"]
        
        subgraph B2B_CUST_TABS["Kunden Tabs"]
            CT1["Katalog"]
            CT2["Warenkorb"]
            CT3["Bestellungen"]
            CT4["Mein Einkauf"]
        end
    end

    subgraph SPECIAL["⚡ Spezialseiten"]
        PHOTO["/photo-capture<br/>QR Foto-Upload"]
        ONBOARD["/onboarding<br/>Onboarding"]
        STYLE["/style-guide<br/>Design System"]
        SYSARCH["/system-architecture<br/>Systemübersicht"]
    end

    %% Navigation flows
    LANDING --> LOGIN
    LOGIN --> REPORTS
    SUP_AUTH --> SUP_PORTAL_PAGE
    B2B_LOGIN --> B2B_DASH
    
    KATALOG --> KATALOG_TABS
    ORDERS --> ORDER_TABS
    REPORTS --> REPORT_TABS
    SETTINGS --> SETTINGS_TABS
    
    CART --> CHECKOUT
    CHECKOUT --> ORDERS
    
    B2B_DASH --> B2B_TABS
    B2B_CUST_PORTAL --> B2B_CUST_TABS

    %% Styling
    classDef public fill:#e0f2fe,stroke:#0284c7,color:#0c4a6e
    classDef auth fill:#fef3c7,stroke:#d97706,color:#78350f
    classDef main fill:#dcfce7,stroke:#16a34a,color:#14532d
    classDef supplier fill:#f3e8ff,stroke:#9333ea,color:#581c87
    classDef easy fill:#ffe4e6,stroke:#e11d48,color:#881337
    classDef b2b fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    classDef b2bcust fill:#fce7f3,stroke:#db2777,color:#831843
    classDef special fill:#f1f5f9,stroke:#64748b,color:#1e293b

    class LANDING,PRICING,AGB,IMPRESSUM,DATENSCHUTZ public
    class LOGIN,SUP_AUTH,B2B_LOGIN auth
    class KATALOG,ORDERS,REPORTS,SETTINGS,CART,CHECKOUT,KT1,KT2,KT3,KT4,OT1,OT2,OT3,RT1,RT2,ST1,ST2,ST3 main
    class SUP_PORTAL_PAGE supplier
    class SIMPLE_ORDER,WINE_CAT easy
    class B2B_DASH,BT1,BT2,BT3,BT4,BT5,BT6 b2b
    class B2B_CUST_PORTAL,CT1,CT2,CT3,CT4 b2bcust
    class PHOTO,ONBOARD,STYLE,SYSARCH special
`;

mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    primaryColor: '#3b82f6',
    primaryTextColor: '#1e293b',
    primaryBorderColor: '#64748b',
    lineColor: '#94a3b8',
    secondaryColor: '#f1f5f9',
    tertiaryColor: '#ffffff',
  },
  flowchart: {
    htmlLabels: true,
    curve: 'basis',
  },
});

export const SystemArchitectureDiagram = () => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const renderDiagram = async () => {
      try {
        setIsLoading(true);
        const { svg } = await mermaid.render('system-architecture-diagram', diagramDefinition);
        setSvgContent(svg);
      } catch (error) {
        console.error('Failed to render mermaid diagram:', error);
      } finally {
        setIsLoading(false);
      }
    };

    renderDiagram();
  }, []);

  const exportToPDF = async () => {
    if (!svgContent) return;

    setIsExporting(true);
    try {
      // Create PDF in landscape for better fit
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;

      // Add title
      pdf.setFontSize(18);
      pdf.setTextColor(30, 41, 59);
      pdf.text('Bestellung.pro - Systemarchitektur', margin, margin + 5);
      
      // Add date
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Stand: ${new Date().toLocaleDateString('de-DE')}`, pageWidth - margin - 35, margin + 5);

      // Add legend section
      const legendY = margin + 15;
      pdf.setFontSize(9);
      const legendItems = [
        { color: '#e0f2fe', label: 'Öffentlich' },
        { color: '#fef3c7', label: 'Auth' },
        { color: '#dcfce7', label: 'Hauptapp' },
        { color: '#f3e8ff', label: 'Lieferanten' },
        { color: '#ffe4e6', label: 'EasyOrder' },
        { color: '#dbeafe', label: 'B2B Supplier' },
        { color: '#fce7f3', label: 'B2B Kunden' },
        { color: '#f1f5f9', label: 'Spezial' },
      ];

      let legendX = margin;
      legendItems.forEach((item) => {
        // Draw colored box
        pdf.setFillColor(item.color);
        pdf.rect(legendX, legendY, 4, 4, 'F');
        // Draw label
        pdf.setTextColor(30, 41, 59);
        pdf.text(item.label, legendX + 6, legendY + 3);
        legendX += 30;
      });

      // Add module overview as structured text
      const contentY = legendY + 15;
      pdf.setFontSize(11);
      pdf.setTextColor(30, 41, 59);

      const modules = [
        { title: '🌐 Öffentliche Seiten', items: ['/ (Landing)', '/pricing', '/agb', '/impressum', '/datenschutz'] },
        { title: '🔐 Authentifizierung', items: ['/auth (Login/Signup)', '/supplier/auth', '/b2b/login'] },
        { title: '📦 Bestellung.pro Hauptapp', items: ['/suppliers (Katalog)', '/orders (Bestellungen)', '/reports (Berichte)', '/settings', '/cart', '/checkout'] },
        { title: '📋 Lieferanten-Portal', items: ['/supplier/portal'] },
        { title: '📱 EasyOrder', items: ['/simple-order/:token', '/wines/:token'] },
        { title: '🏢 B2B Supplier', items: ['/b2b/portal', '/b2b/dashboard'] },
        { title: '🛒 B2B Kunden', items: ['/b2b/customer'] },
      ];

      let yPos = contentY;
      const colWidth = (pageWidth - 2 * margin) / 3;
      let col = 0;

      modules.forEach((module, idx) => {
        const xPos = margin + col * colWidth;
        
        if (yPos > pageHeight - 30) {
          col++;
          yPos = contentY;
          if (col > 2) {
            pdf.addPage();
            col = 0;
            yPos = margin + 10;
          }
        }

        pdf.setFontSize(10);
        pdf.setFont(undefined, 'bold');
        pdf.text(module.title, xPos, yPos);
        yPos += 5;

        pdf.setFontSize(8);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(71, 85, 105);
        module.items.forEach(item => {
          pdf.text(`• ${item}`, xPos + 2, yPos);
          yPos += 4;
        });
        
        pdf.setTextColor(30, 41, 59);
        yPos += 4;
      });

      // Add footer
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text('Generiert von Bestellung.pro', margin, pageHeight - 8);

      // Save
      pdf.save('systemarchitektur.pdf');
    } catch (error) {
      console.error('PDF export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button 
          onClick={exportToPDF} 
          disabled={isExporting || isLoading}
          variant="outline"
          size="sm"
        >
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exportiere...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Als PDF exportieren
            </>
          )}
        </Button>
      </div>

      <div 
        ref={containerRef}
        className="bg-card border rounded-lg p-4 overflow-auto"
        style={{ minHeight: '500px' }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div 
            dangerouslySetInnerHTML={{ __html: svgContent }}
            className="flex justify-center"
          />
        )}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#e0f2fe' }} />
          <span>Öffentlich</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#fef3c7' }} />
          <span>Authentifizierung</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#dcfce7' }} />
          <span>Hauptapp</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f3e8ff' }} />
          <span>Lieferanten-Portal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ffe4e6' }} />
          <span>EasyOrder</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#dbeafe' }} />
          <span>B2B Supplier</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#fce7f3' }} />
          <span>B2B Kunden</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f1f5f9' }} />
          <span>Spezialseiten</span>
        </div>
      </div>
    </div>
  );
};
