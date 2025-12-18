import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import { useTranslation } from 'react-i18next';

const diagramDefinition = `
flowchart TB
    subgraph Frontend["🖥️ Frontend Layer"]
        direction TB
        React["React 18 + TypeScript"]
        Vite["Vite (Build Tool)"]
        TanStack["TanStack Query"]
        Tailwind["Tailwind CSS"]
        i18n["i18next (6 Sprachen)"]
        Router["React Router v6"]
    end

    subgraph Cloud["☁️ Lovable Cloud"]
        direction TB
        subgraph Auth["🔐 Authentication"]
            AuthEmail["Email/Password"]
            AuthMagic["Magic Links"]
            AuthPin["Employee PIN"]
        end
        
        subgraph Database["🗄️ PostgreSQL"]
            RLS["Row Level Security"]
            Tables["50+ Tabellen"]
            Functions["DB Functions"]
        end
        
        subgraph Storage["📁 Storage"]
            ArticleImages["article-images"]
            PortalLogos["portal-logos"]
            B2BLogos["b2b-portal-logos"]
        end
        
        Realtime["⚡ Realtime WebSocket"]
    end

    subgraph EdgeFunctions["⚙️ Edge Functions (35+)"]
        direction TB
        subgraph OrderFuncs["Bestellungen"]
            SendOrder["send-order-email"]
            ConfirmOrder["confirm-order"]
            SubmitSimple["submit-simple-order"]
        end
        
        subgraph AIFuncs["AI-Funktionen"]
            AIImport["ai-import-helper"]
            Transcribe["transcribe-order"]
            Identify["identify-article"]
            ResearchWine["research-wine"]
        end
        
        subgraph B2BFuncs["B2B Portal"]
            B2BOffer["send-b2b-offer"]
            B2BOrder["submit-b2b-order"]
            B2BInvite["send-b2b-customer-invitation"]
        end
        
        subgraph AuthFuncs["Authentifizierung"]
            VerifyPin["verify-employee-pin"]
            VerifyToken["verify-supplier-token"]
            HashPin["hash-employee-pin"]
        end
    end

    subgraph External["🌐 Externe Dienste"]
        direction TB
        Resend["📧 Resend (E-Mail)"]
        OpenAI["🤖 OpenAI GPT-4o"]
        ElevenLabs["🎤 ElevenLabs Voice"]
        Perplexity["🔍 Perplexity AI"]
    end

    %% Connections
    Frontend --> Cloud
    Frontend --> EdgeFunctions
    Cloud --> EdgeFunctions
    EdgeFunctions --> External
    
    React --> TanStack
    TanStack --> Database
    
    AuthFuncs --> Auth
    OrderFuncs --> Database
    OrderFuncs --> Resend
    AIFuncs --> OpenAI
    AIFuncs --> ElevenLabs
    AIFuncs --> Perplexity
    B2BFuncs --> Database
    B2BFuncs --> Resend

    %% Layer Styling
    style Frontend fill:#dbeafe,stroke:#3b82f6,stroke-width:2px,color:#1e40af
    style Cloud fill:#d1fae5,stroke:#10b981,stroke-width:2px,color:#065f46
    style EdgeFunctions fill:#fef3c7,stroke:#f59e0b,stroke-width:2px,color:#92400e
    style External fill:#ede9fe,stroke:#8b5cf6,stroke-width:2px,color:#5b21b6

    %% Inner Subgraph Styling
    style Auth fill:#a7f3d0,stroke:#059669,stroke-width:1px
    style Database fill:#a7f3d0,stroke:#059669,stroke-width:1px
    style Storage fill:#a7f3d0,stroke:#059669,stroke-width:1px
    style OrderFuncs fill:#fde68a,stroke:#d97706,stroke-width:1px
    style AIFuncs fill:#fde68a,stroke:#d97706,stroke-width:1px
    style B2BFuncs fill:#fde68a,stroke:#d97706,stroke-width:1px
    style AuthFuncs fill:#fde68a,stroke:#d97706,stroke-width:1px
`;

mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'basis',
    padding: 20,
    nodeSpacing: 50,
    rankSpacing: 50,
  },
  themeVariables: {
    primaryColor: '#3b82f6',
    primaryTextColor: '#1e293b',
    primaryBorderColor: '#2563eb',
    lineColor: '#64748b',
    secondaryColor: '#f1f5f9',
    tertiaryColor: '#e2e8f0',
    background: '#ffffff',
    mainBkg: '#ffffff',
    nodeBorder: '#cbd5e1',
    clusterBkg: '#f8fafc',
    clusterBorder: '#e2e8f0',
    titleColor: '#0f172a',
    edgeLabelBackground: '#ffffff',
  },
  securityLevel: 'loose',
});

export function InfrastructureDiagram() {
  const { t } = useTranslation();
  const [isRendered, setIsRendered] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const diagramRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderDiagram = async () => {
      if (diagramRef.current) {
        try {
          diagramRef.current.innerHTML = '';
          const { svg } = await mermaid.render('infrastructure-diagram', diagramDefinition);
          diagramRef.current.innerHTML = svg;
          setIsRendered(true);
        } catch (error) {
          console.error('Failed to render infrastructure diagram:', error);
          diagramRef.current.innerHTML = '<p class="text-destructive">Fehler beim Rendern des Diagramms</p>';
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
      if (!svgElement) {
        throw new Error('SVG element not found');
      }

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
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.scale(scale, scale);
          ctx.drawImage(img, 0, 0);

          const imgData = canvas.toDataURL('image/png');

          const pdf = new jsPDF({
            orientation: img.width > img.height ? 'landscape' : 'portrait',
            unit: 'mm',
          });

          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          const margin = 10;

          pdf.setFontSize(16);
          pdf.text('Infrastruktur-Übersicht', margin, margin + 5);

          pdf.setFontSize(10);
          pdf.setTextColor(128);
          pdf.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, margin, margin + 12);

          const availableWidth = pageWidth - 2 * margin;
          const availableHeight = pageHeight - margin - 25;

          const imgAspect = img.width / img.height;
          const pageAspect = availableWidth / availableHeight;

          let imgWidth, imgHeight;
          if (imgAspect > pageAspect) {
            imgWidth = availableWidth;
            imgHeight = availableWidth / imgAspect;
          } else {
            imgHeight = availableHeight;
            imgWidth = availableHeight * imgAspect;
          }

          const x = (pageWidth - imgWidth) / 2;
          const y = margin + 18;

          pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);

          pdf.save('infrastruktur-uebersicht.pdf');
        }

        URL.revokeObjectURL(url);
        setIsExporting(false);
      };

      img.onerror = () => {
        console.error('Failed to load SVG as image');
        URL.revokeObjectURL(url);
        setIsExporting(false);
      };

      img.src = url;
    } catch (error) {
      console.error('Failed to export to PDF:', error);
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Infrastruktur-Übersicht</h2>
          <p className="text-muted-foreground">
            Technische Architektur und externe Dienste
          </p>
        </div>
        <Button onClick={exportToPDF} disabled={!isRendered || isExporting}>
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Als PDF exportieren
        </Button>
      </div>

      <div className="rounded-lg border bg-card p-6 overflow-auto">
        <div ref={diagramRef} className="min-w-[800px]">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="font-semibold mb-3">Legende</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500" />
            <span>Frontend Layer</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-emerald-500" />
            <span>Lovable Cloud</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-500" />
            <span>Edge Functions</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-purple-500" />
            <span>Externe Dienste</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-4 text-center">
          <div className="text-3xl font-bold text-primary">35+</div>
          <div className="text-sm text-muted-foreground">Edge Functions</div>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <div className="text-3xl font-bold text-primary">50+</div>
          <div className="text-sm text-muted-foreground">Datenbanktabellen</div>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <div className="text-3xl font-bold text-primary">6</div>
          <div className="text-sm text-muted-foreground">Sprachen</div>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <div className="text-3xl font-bold text-primary">4</div>
          <div className="text-sm text-muted-foreground">AI-Integrationen</div>
        </div>
      </div>
    </div>
  );
}
