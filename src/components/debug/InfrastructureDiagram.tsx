import { useEffect, useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';
import { Button } from '@/components/ui/button';
import { Download, Loader2, CheckCircle, Info } from 'lucide-react';
import jsPDF from 'jspdf';
import { useTranslation } from 'react-i18next';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

// Node details for interactive clicks
const nodeDetails: Record<string, { title: string; description: string; items: string[]; icon?: string }> = {
  // Frontend Layer
  React: {
    title: "React 18 + TypeScript",
    description: "Modernes Frontend-Framework für reaktive Benutzeroberflächen",
    items: [
      "Functional Components mit Hooks",
      "TypeScript für Type-Safety",
      "Context API für globalen State",
      "Lazy Loading für Performance"
    ],
    icon: "⚛️"
  },
  Vite: {
    title: "Vite Build Tool",
    description: "Blitzschnelles Build-Tool für moderne Webentwicklung",
    items: [
      "Hot Module Replacement (HMR)",
      "Native ESM-Unterstützung",
      "Optimierter Production Build",
      "Plugin-Ökosystem"
    ],
    icon: "⚡"
  },
  TanStack: {
    title: "TanStack Query",
    description: "Leistungsstarkes Server-State-Management",
    items: [
      "Automatisches Caching",
      "Background Refetching",
      "Optimistic Updates",
      "Infinite Queries für Pagination"
    ],
    icon: "🔄"
  },
  Tailwind: {
    title: "Tailwind CSS",
    description: "Utility-First CSS Framework für schnelles Styling",
    items: [
      "Design System Integration",
      "Responsive Design",
      "Dark Mode Support",
      "Optimierte Bundle-Größe"
    ],
    icon: "🎨"
  },
  i18n: {
    title: "i18next Internationalisierung",
    description: "Vollständige Mehrsprachigkeit mit 6 Sprachen",
    items: [
      "Deutsch (DE)",
      "Englisch (EN)",
      "Französisch (FR)",
      "Italienisch (IT)",
      "Thai (TH)",
      "Vietnamesisch (VI)"
    ],
    icon: "🌍"
  },
  Router: {
    title: "React Router v6",
    description: "Deklaratives Routing für React-Anwendungen",
    items: [
      "Nested Routes",
      "Protected Routes",
      "Dynamic Parameters",
      "Programmatic Navigation"
    ],
    icon: "🧭"
  },
  // Authentication
  AuthEmail: {
    title: "Email/Password Auth",
    description: "Klassische E-Mail-Authentifizierung",
    items: [
      "Sichere Passwort-Hashing",
      "Email-Verifizierung",
      "Passwort-Reset Flow",
      "Session Management"
    ],
    icon: "📧"
  },
  AuthMagic: {
    title: "Magic Links",
    description: "Passwortlose Anmeldung per E-Mail-Link",
    items: [
      "Ein-Klick-Anmeldung",
      "Zeitlich begrenzte Tokens",
      "Sichere Zustellung",
      "Für Lieferanten-Portal"
    ],
    icon: "✨"
  },
  AuthPin: {
    title: "Employee PIN",
    description: "Schnelle PIN-Authentifizierung für Mitarbeiter",
    items: [
      "4-6 stelliger PIN",
      "Rate Limiting",
      "Gehashte Speicherung",
      "Für Simple Order"
    ],
    icon: "🔢"
  },
  // Database
  RLS: {
    title: "Row Level Security",
    description: "Datenbankbasierte Zugriffskontrolle",
    items: [
      "Mandantentrennung",
      "Feingranulare Policies",
      "Automatische Filterung",
      "Audit-fähig"
    ],
    icon: "🛡️"
  },
  Tables: {
    title: "50+ Datenbanktabellen",
    description: "Umfassendes Datenbankschema",
    items: [
      "Organizations & Profiles",
      "Suppliers & Articles",
      "Orders & Cart Drafts",
      "B2B Portal Entities"
    ],
    icon: "📊"
  },
  Functions: {
    title: "Database Functions",
    description: "Serverseitige PostgreSQL-Funktionen",
    items: [
      "Trigger Functions",
      "Computed Columns",
      "RPC-Aufrufe",
      "Datenvalidierung"
    ],
    icon: "⚙️"
  },
  // Storage
  ArticleImages: {
    title: "Article Images Bucket",
    description: "Speicher für Artikelbilder",
    items: [
      "Automatische Komprimierung",
      "WebP-Konvertierung",
      "CDN-Delivery",
      "RLS-geschützt"
    ],
    icon: "🖼️"
  },
  PortalLogos: {
    title: "Portal Logos Bucket",
    description: "Lieferanten-Portal Logos",
    items: [
      "SVG & PNG Support",
      "Automatische Skalierung",
      "Öffentlich zugänglich",
      "Optimiert"
    ],
    icon: "🏢"
  },
  B2BLogos: {
    title: "B2B Portal Logos",
    description: "Logos für B2B-Kundenportale",
    items: [
      "Multi-Tenant Support",
      "Branding-Anpassung",
      "Sichere Speicherung",
      "CDN-Distribution"
    ],
    icon: "🤝"
  },
  Realtime: {
    title: "Realtime WebSocket",
    description: "Echtzeit-Datensynchronisation",
    items: [
      "PostgreSQL Changes",
      "Broadcast Messages",
      "Presence Tracking",
      "Benachrichtigungen"
    ],
    icon: "⚡"
  },
  // Edge Functions - Orders
  SendOrder: {
    title: "send-order-email",
    description: "Versand von Bestellungen per E-Mail",
    items: [
      "HTML-E-Mail-Templates",
      "Artikel-Auflistung",
      "Bestätigungs-Links",
      "Multi-Sprach-Support"
    ],
    icon: "📤"
  },
  ConfirmOrder: {
    title: "confirm-order",
    description: "Bestellbestätigung verarbeiten",
    items: [
      "Token-Validierung",
      "Status-Update",
      "Benachrichtigungen",
      "Logging"
    ],
    icon: "✅"
  },
  SubmitSimple: {
    title: "submit-simple-order",
    description: "Simple Order Bestellungen einreichen",
    items: [
      "PIN-Verifizierung",
      "Multi-Supplier Support",
      "E-Mail-Versand",
      "Rate Limiting"
    ],
    icon: "📝"
  },
  // Edge Functions - AI
  AIImport: {
    title: "ai-import-helper",
    description: "KI-gestützte Datenimporte",
    items: [
      "CSV/Excel Parsing",
      "Spalten-Mapping",
      "Datenvalidierung",
      "OpenAI Integration"
    ],
    icon: "🤖"
  },
  Transcribe: {
    title: "transcribe-order",
    description: "Sprachgesteuerte Bestellungen",
    items: [
      "Whisper Transkription",
      "Artikel-Erkennung",
      "Mengen-Parsing",
      "Multi-Sprach"
    ],
    icon: "🎤"
  },
  Identify: {
    title: "identify-article",
    description: "Artikelerkennung per Foto",
    items: [
      "GPT-4 Vision",
      "Produkterkennung",
      "Preisschätzung",
      "Batch-Processing"
    ],
    icon: "📷"
  },
  ResearchWine: {
    title: "research-wine",
    description: "Automatische Weinrecherche",
    items: [
      "Perplexity AI",
      "Detaillierte Infos",
      "Geschmacksprofil",
      "Food Pairings"
    ],
    icon: "🍷"
  },
  // Edge Functions - B2B
  B2BOffer: {
    title: "send-b2b-offer",
    description: "B2B-Angebote versenden",
    items: [
      "PDF-Generierung",
      "Preiskalkulation",
      "Kundenspezifisch",
      "E-Mail-Versand"
    ],
    icon: "💼"
  },
  B2BOrder: {
    title: "submit-b2b-order",
    description: "B2B-Bestellungen verarbeiten",
    items: [
      "Kundenvalidierung",
      "Bestandsprüfung",
      "Benachrichtigungen",
      "Order Tracking"
    ],
    icon: "📦"
  },
  B2BInvite: {
    title: "send-b2b-customer-invitation",
    description: "B2B-Kundeneinladungen",
    items: [
      "Token-Generierung",
      "E-Mail-Einladung",
      "Ablaufdatum",
      "Registrierungs-Flow"
    ],
    icon: "✉️"
  },
  // Edge Functions - Auth
  VerifyPin: {
    title: "verify-employee-pin",
    description: "Mitarbeiter-PIN verifizieren",
    items: [
      "Sichere Verifikation",
      "Rate Limiting",
      "Logging",
      "Fehlerbehandlung"
    ],
    icon: "🔐"
  },
  VerifyToken: {
    title: "verify-supplier-token",
    description: "Lieferanten-Token prüfen",
    items: [
      "Token-Validierung",
      "Ablaufprüfung",
      "Session-Erstellung",
      "Audit Trail"
    ],
    icon: "🎫"
  },
  HashPin: {
    title: "hash-employee-pin",
    description: "PIN sicher hashen",
    items: [
      "Bcrypt-Hashing",
      "Salt-Generierung",
      "Sichere Speicherung",
      "Keine Klartext-PINs"
    ],
    icon: "🔒"
  },
  // External Services
  SMTP: {
    title: "SMTP E-Mail Service",
    description: "Eigener SMTP-Server für E-Mail-Versand",
    items: [
      "SMTP via denomailer",
      "HTML-Templates",
      "Zustellungskontrolle",
      "Eigener Server (smtps.udag.de)"
    ],
    icon: "📧"
  },
  OpenAI: {
    title: "OpenAI GPT-4o",
    description: "Fortschrittliche KI-Funktionen",
    items: [
      "Text-Generierung",
      "Vision (Bilder)",
      "Datenextraktion",
      "Klassifizierung"
    ],
    icon: "🤖"
  },
  ElevenLabs: {
    title: "ElevenLabs Voice AI",
    description: "Sprachsynthese und -erkennung",
    items: [
      "Natürliche Stimmen",
      "Multi-Sprach",
      "Echtzeit-Streaming",
      "Voice Cloning"
    ],
    icon: "🎤"
  },
  Perplexity: {
    title: "Perplexity AI",
    description: "KI-gestützte Recherche",
    items: [
      "Echtzeit-Suche",
      "Quellenangaben",
      "Strukturierte Daten",
      "Weinrecherche"
    ],
    icon: "🔍"
  },
  // Subgraphs - Main Layers
  Frontend: {
    title: "Frontend Layer",
    description: "Moderne React-basierte Benutzeroberfläche",
    items: [
      "React 18 mit TypeScript",
      "Vite als Build-Tool",
      "TanStack Query für Server-State",
      "Tailwind CSS für Styling",
      "6 Sprachen unterstützt (i18next)",
      "Client-Side Routing (React Router v6)"
    ],
    icon: "🖥️"
  },
  Cloud: {
    title: "Lovable Cloud",
    description: "Backend-Infrastruktur mit Supabase",
    items: [
      "PostgreSQL Datenbank mit 50+ Tabellen",
      "Row Level Security für Datenisolation",
      "Echtzeit WebSocket-Verbindungen",
      "Sichere Dateispeicherung",
      "Multi-Tenant Architektur"
    ],
    icon: "☁️"
  },
  EdgeFunctions: {
    title: "Edge Functions",
    description: "35+ serverlose Funktionen für Business-Logik",
    items: [
      "Deno Runtime",
      "TypeScript",
      "Automatisches Scaling",
      "Globale Verteilung",
      "Bestellungen, AI, B2B, Auth"
    ],
    icon: "⚙️"
  },
  External: {
    title: "Externe Dienste",
    description: "Third-Party Integrationen",
    items: [
      "SMTP E-Mail (smtps.udag.de)",
      "OpenAI GPT-4o für KI",
      "ElevenLabs Voice AI",
      "Perplexity AI Suche"
    ],
    icon: "🌐"
  },
  // Inner Subgraphs
  Auth: {
    title: "Authentifizierung",
    description: "Mehrere Auth-Methoden für verschiedene User-Typen",
    items: [
      "Email/Password für Admins",
      "Magic Links für Lieferanten",
      "PIN-Codes für Mitarbeiter",
      "Session Management"
    ],
    icon: "🔐"
  },
  Database: {
    title: "PostgreSQL Datenbank",
    description: "Relationale Datenbank mit 50+ Tabellen",
    items: [
      "Organizations, Suppliers, Articles",
      "Orders, Cart Drafts, Invoices",
      "B2B Portal Entities",
      "RLS für Datenisolation"
    ],
    icon: "🗄️"
  },
  Storage: {
    title: "File Storage",
    description: "Sichere Dateispeicherung für Medien",
    items: [
      "Artikelbilder",
      "Portal-Logos",
      "B2B-Branding",
      "CDN-Distribution"
    ],
    icon: "📁"
  },
  OrderFuncs: {
    title: "Bestellungs-Funktionen",
    description: "Edge Functions für Bestellworkflows",
    items: [
      "E-Mail-Versand",
      "Bestellbestätigung",
      "Simple Order Submit"
    ],
    icon: "📦"
  },
  AIFuncs: {
    title: "AI-Funktionen",
    description: "KI-gestützte Features",
    items: [
      "Import-Helfer",
      "Sprach-Transkription",
      "Artikel-Erkennung",
      "Wein-Recherche"
    ],
    icon: "🤖"
  },
  B2BFuncs: {
    title: "B2B Portal Funktionen",
    description: "Business-to-Business Features",
    items: [
      "Angebotserstellung",
      "B2B-Bestellungen",
      "Kundeneinladungen"
    ],
    icon: "🤝"
  },
  AuthFuncs: {
    title: "Auth-Funktionen",
    description: "Authentifizierungs-Logik",
    items: [
      "PIN-Verifizierung",
      "Token-Validierung",
      "PIN-Hashing"
    ],
    icon: "🔑"
  }
};

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
        SMTP["📧 SMTP (E-Mail)"]
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
    OrderFuncs --> SMTP
    AIFuncs --> OpenAI
    AIFuncs --> ElevenLabs
    AIFuncs --> Perplexity
    B2BFuncs --> Database
    B2BFuncs --> SMTP

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
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const diagramRef = useRef<HTMLDivElement>(null);

  const handleNodeClick = useCallback((nodeId: string) => {
    if (nodeDetails[nodeId]) {
      setSelectedNode(nodeId);
    }
  }, []);

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

  // Add click handlers to nodes and clusters after rendering
  useEffect(() => {
    if (isRendered && diagramRef.current) {
      // Handle regular nodes
      const nodes = diagramRef.current.querySelectorAll('.node');
      nodes.forEach((node) => {
        const nodeElement = node as HTMLElement;
        const idMatch = nodeElement.id.match(/flowchart-(\w+)-\d+/);
        if (idMatch) {
          const nodeId = idMatch[1];
          if (nodeDetails[nodeId]) {
            nodeElement.style.cursor = 'pointer';
            nodeElement.classList.add('interactive-node');
            
            const clickHandler = (e: Event) => {
              e.stopPropagation();
              handleNodeClick(nodeId);
            };
            nodeElement.addEventListener('click', clickHandler);
            (nodeElement as any)._clickHandler = clickHandler;
          }
        }
      });

      // Handle subgraphs (clusters)
      const clusters = diagramRef.current.querySelectorAll('.cluster');
      clusters.forEach((cluster) => {
        const clusterElement = cluster as HTMLElement;
        // Cluster IDs have format: flowchart-Frontend-123 or similar
        const idMatch = clusterElement.id.match(/flowchart-(\w+)-\d+/);
        if (idMatch) {
          const clusterId = idMatch[1];
          if (nodeDetails[clusterId]) {
            // Make the cluster label clickable
            const labelElement = clusterElement.querySelector('.cluster-label');
            if (labelElement) {
              (labelElement as HTMLElement).style.cursor = 'pointer';
              (labelElement as HTMLElement).style.textDecoration = 'underline';
              (labelElement as HTMLElement).style.textDecorationStyle = 'dotted';
              labelElement.classList.add('interactive-cluster');
              
              const clickHandler = (e: Event) => {
                e.stopPropagation();
                handleNodeClick(clusterId);
              };
              labelElement.addEventListener('click', clickHandler);
              (labelElement as any)._clickHandler = clickHandler;
            }
          }
        }
      });

      // Cleanup function
      return () => {
        const nodes = diagramRef.current?.querySelectorAll('.interactive-node');
        nodes?.forEach((node) => {
          const nodeElement = node as HTMLElement;
          if ((nodeElement as any)._clickHandler) {
            nodeElement.removeEventListener('click', (nodeElement as any)._clickHandler);
          }
        });
        
        const clusters = diagramRef.current?.querySelectorAll('.interactive-cluster');
        clusters?.forEach((cluster) => {
          if ((cluster as any)._clickHandler) {
            cluster.removeEventListener('click', (cluster as any)._clickHandler);
          }
        });
      };
    }
  }, [isRendered, handleNodeClick]);

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

  const selectedDetails = selectedNode ? nodeDetails[selectedNode] : null;

  return (
    <div className="space-y-6">
      <style>{`
        .interactive-node {
          cursor: pointer;
        }
      `}</style>

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

      {/* Hint */}
      {isRendered && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4" />
          <span>Klicke auf einen Node für mehr Details</span>
        </div>
      )}

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

      {/* Detail Sheet */}
      <Sheet open={!!selectedNode} onOpenChange={() => setSelectedNode(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {selectedDetails?.icon && <span className="text-2xl">{selectedDetails.icon}</span>}
              {selectedDetails?.title}
            </SheetTitle>
            <SheetDescription>{selectedDetails?.description}</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-3">
            {selectedDetails?.items.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-muted/50">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
