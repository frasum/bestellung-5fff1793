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
      // Create a temporary container for the SVG
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = svgContent;
      const svgElement = tempDiv.querySelector('svg');
      
      if (!svgElement) {
        throw new Error('SVG element not found');
      }

      // Get SVG dimensions
      const svgWidth = svgElement.viewBox.baseVal.width || 1200;
      const svgHeight = svgElement.viewBox.baseVal.height || 800;

      // Create canvas
      const canvas = document.createElement('canvas');
      const scale = 2; // Higher resolution
      canvas.width = svgWidth * scale;
      canvas.height = svgHeight * scale;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Set white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);

      // Convert SVG to data URL
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      // Load image
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, svgWidth, svgHeight);
        URL.revokeObjectURL(url);

        // Create PDF (landscape for better fit)
        const pdf = new jsPDF({
          orientation: svgWidth > svgHeight ? 'landscape' : 'portrait',
          unit: 'mm',
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        const availableWidth = pageWidth - 2 * margin;
        const availableHeight = pageHeight - 2 * margin - 15; // Space for title

        // Calculate scaling to fit
        const scaleX = availableWidth / svgWidth;
        const scaleY = availableHeight / svgHeight;
        const pdfScale = Math.min(scaleX, scaleY);
        
        const finalWidth = svgWidth * pdfScale;
        const finalHeight = svgHeight * pdfScale;
        const offsetX = margin + (availableWidth - finalWidth) / 2;
        const offsetY = margin + 15;

        // Add title
        pdf.setFontSize(16);
        pdf.text('Bestellung.pro - Systemarchitektur', margin, margin + 8);
        
        // Add date
        pdf.setFontSize(10);
        pdf.setTextColor(128);
        pdf.text(`Stand: ${new Date().toLocaleDateString('de-DE')}`, pageWidth - margin - 30, margin + 8);

        // Add image
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', offsetX, offsetY, finalWidth, finalHeight);

        // Save
        pdf.save('systemarchitektur.pdf');
        setIsExporting(false);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        setIsExporting(false);
        console.error('Failed to load SVG image');
      };

      img.src = url;
    } catch (error) {
      console.error('PDF export failed:', error);
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
