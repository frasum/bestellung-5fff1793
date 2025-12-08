import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { LogOut, Search, Package, Clock, Monitor, Smartphone } from 'lucide-react';
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
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  const markdownComponents = {
    a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
        {children}
      </a>
    ),
  };

  const isDesktop = viewMode === 'desktop';
  const scale = isDesktop ? 0.5 : 0.55;
  const containerWidth = isDesktop ? '200%' : '181.8%';
  const previewWidth = isDesktop ? '100%' : '375px';
  const previewHeight = isDesktop ? '350px' : '420px';

  return (
    <div className="border rounded-lg overflow-hidden bg-background shadow-sm">
      {/* Header with toggle */}
      <div className="bg-muted/50 px-3 py-2 text-xs text-muted-foreground border-b flex items-center justify-between">
        <span className="font-medium">Live-Vorschau</span>
        <div className="flex items-center gap-3">
          <ToggleGroup 
            type="single" 
            value={viewMode} 
            onValueChange={(v) => v && setViewMode(v as 'desktop' | 'mobile')}
            className="bg-background rounded-md p-0.5"
          >
            <ToggleGroupItem value="desktop" aria-label="Desktop-Ansicht" className="h-7 px-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
              <Monitor className="h-3.5 w-3.5 mr-1" />
              <span className="text-[11px]">Desktop</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="mobile" aria-label="Mobile-Ansicht" className="h-7 px-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
              <Smartphone className="h-3.5 w-3.5 mr-1" />
              <span className="text-[11px]">Mobile</span>
            </ToggleGroupItem>
          </ToggleGroup>
          <span className="text-[10px]">{Math.round(scale * 100)}%</span>
        </div>
      </div>
      
      {/* Preview container */}
      <div 
        className="flex justify-center bg-muted/20 p-4 overflow-hidden"
        style={{ height: previewHeight }}
      >
        <div 
          className={`origin-top overflow-hidden border rounded-lg shadow-md bg-background ${isDesktop ? 'w-full' : ''}`}
          style={{ 
            transform: `scale(${scale})`,
            width: isDesktop ? containerWidth : previewWidth,
            minHeight: isDesktop ? '700px' : '812px',
          }}
        >
          {/* Header */}
          <header className="border-b bg-card">
            <div className={`mx-auto px-4 py-4 flex items-center justify-between ${isDesktop ? 'container' : ''}`}>
              <div className="flex items-center gap-3">
                <img 
                  src={logoUrl || logo} 
                  alt="Portal Logo" 
                  className={logoUrl ? "h-10 max-w-[120px] object-contain" : "h-10 w-10"} 
                />
                <div>
                  <h1 className={`font-semibold ${isDesktop ? '' : 'text-sm'}`}>{portalTitle || 'Lieferantenportal'}</h1>
                  <p className={`text-muted-foreground ${isDesktop ? 'text-sm' : 'text-xs'}`}>Beispiel-Lieferant GmbH</p>
                </div>
              </div>
              {isDesktop ? (
                <Button variant="outline" size="sm" disabled>
                  <LogOut className="h-4 w-4 mr-2" />
                  Abmelden
                </Button>
              ) : (
                <Button variant="outline" size="icon" className="h-8 w-8" disabled>
                  <LogOut className="h-4 w-4" />
                </Button>
              )}
            </div>
          </header>

          {/* Main Content */}
          <main className={`px-4 py-6 ${isDesktop ? 'container mx-auto' : ''}`}>
            {/* Welcome Message */}
            {welcomeMessage && (
              <div className={`mb-4 p-4 bg-muted/50 rounded-lg prose dark:prose-invert max-w-none ${isDesktop ? 'prose-sm' : 'prose-xs'}`}>
                <ReactMarkdown components={markdownComponents}>
                  {welcomeMessage}
                </ReactMarkdown>
              </div>
            )}

            {/* Info Text */}
            {infoText && (
              <div className={`mb-4 p-4 bg-primary/10 border border-primary/20 rounded-lg prose dark:prose-invert max-w-none ${isDesktop ? 'prose-sm' : 'prose-xs'}`}>
                <ReactMarkdown components={markdownComponents}>
                  {infoText}
                </ReactMarkdown>
              </div>
            )}

            <Card>
              <CardHeader className={isDesktop ? 'pb-3' : 'pb-2 px-3'}>
                <div className={`flex ${isDesktop ? 'items-center justify-between' : 'flex-col gap-2'}`}>
                  <div>
                    <CardTitle className={`flex items-center gap-2 ${isDesktop ? 'text-base' : 'text-sm'}`}>
                      <Package className={isDesktop ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
                      {cardTitle || 'Meine Artikel'}
                    </CardTitle>
                    <CardDescription className={isDesktop ? 'text-xs' : 'text-[10px]'}>
                      {cardDescription || 'Änderungen werden zur Genehmigung eingereicht.'}
                    </CardDescription>
                  </div>
                  <div className={`flex items-center gap-3 ${isDesktop ? '' : 'justify-between'}`}>
                    <Badge variant="secondary" className={`flex items-center gap-1 ${isDesktop ? 'text-[10px]' : 'text-[9px]'}`}>
                      <Clock className={isDesktop ? 'h-2.5 w-2.5' : 'h-2 w-2'} />
                      2 ausstehend
                    </Badge>
                    <span className={`text-muted-foreground ${isDesktop ? 'text-xs' : 'text-[10px]'}`}>12 Artikel</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className={isDesktop ? 'pt-0' : 'pt-0 px-3'}>
                {/* Search */}
                <div className="mb-4">
                  <div className={`relative ${isDesktop ? 'max-w-xs' : 'w-full'}`}>
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Artikel suchen..."
                      className={`pl-8 ${isDesktop ? 'h-8 text-sm' : 'h-9 text-xs'}`}
                      disabled
                    />
                  </div>
                </div>

                {/* Sample articles */}
                {isDesktop ? (
                  <div className="border rounded-md divide-y">
                    {['Bio Tomaten', 'Olivenöl Extra Vergine', 'Parmesan DOP'].map((name, i) => (
                      <div key={i} className="p-3 flex items-center justify-between text-sm">
                        <span className="font-medium">{name}</span>
                        <span className="text-muted-foreground">€{(5 + i * 7).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {['Bio Tomaten', 'Olivenöl Extra Vergine'].map((name, i) => (
                      <div key={i} className="border rounded-md p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-xs">{name}</span>
                          <span className="text-muted-foreground text-xs">€{(5 + i * 7).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Footer */}
            {footerText && (
              <div className={`mt-6 pt-4 border-t text-center prose dark:prose-invert max-w-none ${isDesktop ? 'prose-sm' : 'prose-xs'}`}>
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
