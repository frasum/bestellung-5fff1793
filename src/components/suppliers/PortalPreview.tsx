import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LogOut, Search, Package, Clock } from 'lucide-react';
import logo from '@/assets/logo.png';

interface PortalPreviewProps {
  logoUrl: string | null;
  portalTitle: string;
  welcomeMessage: string;
  cardTitle: string;
  cardDescription: string;
  infoText: string;
  footerText: string;
}

export const PortalPreview = ({
  logoUrl,
  portalTitle,
  welcomeMessage,
  cardTitle,
  cardDescription,
  infoText,
  footerText,
}: PortalPreviewProps) => {
  const markdownComponents = {
    a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
        {children}
      </a>
    ),
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-background shadow-sm">
      {/* Scale indicator */}
      <div className="bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground border-b flex items-center justify-between">
        <span>Live-Vorschau</span>
        <span className="text-[10px]">Skaliert auf 60%</span>
      </div>
      
      {/* Preview container with scaling */}
      <div className="origin-top-left scale-[0.6] w-[166.67%] h-[400px] overflow-hidden">
        <div className="min-h-[667px] bg-background">
          {/* Header */}
          <header className="border-b bg-card">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src={logoUrl || logo} 
                  alt="Portal Logo" 
                  className={logoUrl ? "h-10 max-w-[120px] object-contain" : "h-10 w-10"} 
                />
                <div>
                  <h1 className="font-semibold">{portalTitle || 'Lieferantenportal'}</h1>
                  <p className="text-sm text-muted-foreground">Beispiel-Lieferant GmbH</p>
                </div>
              </div>
              <Button variant="outline" size="sm" disabled>
                <LogOut className="h-4 w-4 mr-2" />
                Abmelden
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="container mx-auto px-4 py-6">
            {/* Welcome Message */}
            {welcomeMessage && (
              <div className="mb-4 p-4 bg-muted/50 rounded-lg prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown components={markdownComponents}>
                  {welcomeMessage}
                </ReactMarkdown>
              </div>
            )}

            {/* Info Text */}
            {infoText && (
              <div className="mb-4 p-4 bg-primary/10 border border-primary/20 rounded-lg prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown components={markdownComponents}>
                  {infoText}
                </ReactMarkdown>
              </div>
            )}

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Package className="h-4 w-4" />
                      {cardTitle || 'Meine Artikel'}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {cardDescription || 'Änderungen werden zur Genehmigung eingereicht.'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-[10px] flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      2 ausstehend
                    </Badge>
                    <span className="text-xs text-muted-foreground">12 Artikel</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Search */}
                <div className="mb-4">
                  <div className="relative max-w-xs">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Artikel suchen..."
                      className="pl-8 h-8 text-sm"
                      disabled
                    />
                  </div>
                </div>

                {/* Sample articles */}
                <div className="border rounded-md divide-y">
                  {['Bio Tomaten', 'Olivenöl Extra Vergine', 'Parmesan DOP'].map((name, i) => (
                    <div key={i} className="p-3 flex items-center justify-between text-sm">
                      <span className="font-medium">{name}</span>
                      <span className="text-muted-foreground">€{(Math.random() * 20 + 5).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Footer */}
            {footerText && (
              <div className="mt-6 pt-4 border-t text-center prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown components={markdownComponents}>
                  {footerText}
                </ReactMarkdown>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
