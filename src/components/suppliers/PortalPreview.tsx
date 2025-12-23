import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LogOut, Search, Package, Clock, Monitor, Smartphone, Camera } from 'lucide-react';
import { PORTAL_COLUMN_OPTIONS, PortalColumnKey } from '@/hooks/useSupplierPortalSettings';
import logo from '@/assets/logo.png';

interface PortalPreviewProps {
  logoUrl: string | null;
  portalTitle: string;
  welcomeMessage: string;
  cardTitle: string;
  cardDescription: string;
  infoText: string;
  footerText: string;
  visibleColumns?: PortalColumnKey[];
}

// Sample data for preview
const SAMPLE_ARTICLES = [
  { name: 'Bio Tomaten', sku: 'ART-001', description: 'Frische Bio-Tomaten aus der Region', unit: 'kg', price: 5.00, packaging_unit: 1, reference_price: 5.00, reference_unit: 'kg', annual_order_value: 1200 },
  { name: 'Olivenöl Extra Vergine', sku: 'ART-002', description: 'Kaltgepresstes Olivenöl aus Italien', unit: 'Liter', price: 12.00, packaging_unit: 6, reference_price: 2.00, reference_unit: 'L', annual_order_value: 3600 },
  { name: 'Parmesan DOP', sku: 'ART-003', description: '24 Monate gereifter Parmesan', unit: 'kg', price: 19.00, packaging_unit: 1, reference_price: 19.00, reference_unit: 'kg', annual_order_value: 2400 },
];

const getColumnLabel = (key: PortalColumnKey): string => {
  const option = PORTAL_COLUMN_OPTIONS.find(o => o.key === key);
  return option?.label || key;
};

const getCellValue = (article: typeof SAMPLE_ARTICLES[0], column: PortalColumnKey): React.ReactNode => {
  switch (column) {
    case 'image':
      return (
        <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
          <Camera className="h-3 w-3 text-gray-400" />
        </div>
      );
    case 'sku':
      return <span className="text-gray-500 text-xs">{article.sku}</span>;
    case 'description':
      // Description is now shown under name, so return null here
      return null;
    case 'unit':
      return article.unit;
    case 'price':
      return `€${article.price.toFixed(2)}`;
    case 'packaging_unit':
      return article.packaging_unit;
    case 'reference_price':
      return `€${article.reference_price.toFixed(2)}/${article.reference_unit}`;
    case 'reference_unit':
      return article.reference_unit;
    case 'annual_order_value':
      return `€${article.annual_order_value.toLocaleString('de-DE')}`;
    case 'name':
      return article.name;
    default:
      return '-';
  }
};

export const PortalPreview = ({
  logoUrl,
  portalTitle,
  welcomeMessage,
  cardTitle,
  cardDescription,
  infoText,
  footerText,
  visibleColumns = ['price'],
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

  // Columns to display: filter out 'description' as it's now shown under name
  const displayColumns: PortalColumnKey[] = visibleColumns.filter(col => col !== 'description');
  const showDescription = visibleColumns.includes('description');

  // Light mode styles for preview (isolated from global theme)
  const lightModeStyles: React.CSSProperties = {
    '--background': '0 0% 98%',
    '--foreground': '224 71% 4%',
    '--card': '0 0% 100%',
    '--card-foreground': '224 71% 4%',
    '--popover': '0 0% 100%',
    '--popover-foreground': '224 71% 4%',
    '--primary': '174 100% 29%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '220 14% 96%',
    '--secondary-foreground': '220 9% 46%',
    '--muted': '220 14% 96%',
    '--muted-foreground': '220 9% 46%',
    '--accent': '220 14% 96%',
    '--accent-foreground': '224 71% 4%',
    '--destructive': '0 84% 60%',
    '--destructive-foreground': '0 0% 100%',
    '--border': '220 13% 91%',
    '--input': '220 13% 91%',
    '--ring': '174 100% 29%',
    colorScheme: 'light',
  } as React.CSSProperties;

  return (
    <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Header with toggle */}
      <div className="bg-gray-100 px-3 py-2 text-xs text-gray-600 border-b border-gray-200 flex items-center justify-between">
        <span className="font-medium text-gray-700">Live-Vorschau</span>
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
        className="flex justify-center bg-gray-50 p-4 overflow-hidden"
        style={{ height: previewHeight }}
      >
        <div 
          className={`origin-top overflow-hidden border border-gray-200 rounded-lg shadow-md bg-gray-50 ${isDesktop ? 'w-full' : ''}`}
          style={{ 
            ...lightModeStyles,
            transform: `scale(${scale})`,
            width: isDesktop ? containerWidth : previewWidth,
            minHeight: isDesktop ? '700px' : '812px',
          }}
        >
          {/* Header */}
          <header className="border-b border-gray-200 bg-white">
            <div className={`mx-auto px-4 py-4 flex items-center justify-between ${isDesktop ? 'container' : ''}`}>
              <div className="flex items-center gap-3">
                <img 
                  src={logoUrl || logo} 
                  alt="Portal Logo" 
                  className={logoUrl ? "h-10 max-w-[120px] object-contain" : "h-10 w-10"} 
                />
                <div>
                  <h1 className={`font-semibold text-gray-900 ${isDesktop ? '' : 'text-sm'}`}>{portalTitle || 'Lieferantenportal'}</h1>
                  <p className={`text-gray-500 ${isDesktop ? 'text-sm' : 'text-xs'}`}>Beispiel-Lieferant GmbH</p>
                </div>
              </div>
              {isDesktop ? (
                <Button variant="outline" size="sm" disabled className="border-gray-200 text-gray-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Abmelden
                </Button>
              ) : (
                <Button variant="outline" size="icon" className="h-8 w-8 border-gray-200 text-gray-600" disabled>
                  <LogOut className="h-4 w-4" />
                </Button>
              )}
            </div>
          </header>

          {/* Main Content */}
          <main className={`px-4 py-6 ${isDesktop ? 'container mx-auto' : ''}`}>
            {/* Welcome Message */}
            {welcomeMessage && (
              <div className={`mb-4 p-4 bg-white border border-gray-100 rounded-lg prose max-w-none ${isDesktop ? 'prose-sm' : 'prose-xs'}`}>
                <ReactMarkdown components={markdownComponents}>
                  {welcomeMessage}
                </ReactMarkdown>
              </div>
            )}

            {/* Info Text */}
            {infoText && (
              <div className={`mb-4 p-4 bg-teal-50 border border-teal-100 rounded-lg prose max-w-none ${isDesktop ? 'prose-sm' : 'prose-xs'}`}>
                <ReactMarkdown components={markdownComponents}>
                  {infoText}
                </ReactMarkdown>
              </div>
            )}

            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className={isDesktop ? 'pb-3' : 'pb-2 px-3'}>
                <div className={`flex ${isDesktop ? 'items-center justify-between' : 'flex-col gap-2'}`}>
                  <div>
                    <CardTitle className={`flex items-center gap-2 text-gray-900 ${isDesktop ? 'text-base' : 'text-sm'}`}>
                      <Package className={`text-teal-600 ${isDesktop ? 'h-4 w-4' : 'h-3.5 w-3.5'}`} />
                      {cardTitle || 'Meine Artikel'}
                    </CardTitle>
                    <CardDescription className={`text-gray-500 ${isDesktop ? 'text-xs' : 'text-[10px]'}`}>
                      {cardDescription || 'Änderungen werden zur Genehmigung eingereicht.'}
                    </CardDescription>
                  </div>
                  <div className={`flex items-center gap-3 ${isDesktop ? '' : 'justify-between'}`}>
                    <Badge variant="secondary" className={`flex items-center gap-1 bg-gray-100 text-gray-700 ${isDesktop ? 'text-[10px]' : 'text-[9px]'}`}>
                      <Clock className={isDesktop ? 'h-2.5 w-2.5' : 'h-2 w-2'} />
                      2 ausstehend
                    </Badge>
                    <span className={`text-gray-500 ${isDesktop ? 'text-xs' : 'text-[10px]'}`}>12 Artikel</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className={isDesktop ? 'pt-0' : 'pt-0 px-3'}>
                {/* Search */}
                <div className="mb-4">
                  <div className={`relative ${isDesktop ? 'max-w-xs' : 'w-full'}`}>
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <Input
                      placeholder="Artikel suchen..."
                      className={`pl-8 bg-white border-gray-200 text-gray-900 ${isDesktop ? 'h-8 text-sm' : 'h-9 text-xs'}`}
                      disabled
                    />
                  </div>
                </div>

                {/* Sample articles - Dynamic columns */}
                {isDesktop ? (
                  <div className="border border-gray-200 rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 border-b border-gray-200">
                          <TableHead className="text-xs font-medium py-2 text-gray-700">Name</TableHead>
                          {displayColumns.map((col) => (
                            <TableHead key={col} className="text-xs font-medium py-2 text-gray-700">
                              {getColumnLabel(col)}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {SAMPLE_ARTICLES.map((article, i) => (
                          <TableRow key={i} className="bg-white border-b border-gray-100 hover:bg-gray-50">
                            <TableCell className="py-2 max-w-[200px]">
                              <div>
                                <span className="text-sm font-medium text-gray-900">{article.name}</span>
                                {showDescription && article.description && (
                                  <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                                    {article.description}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            {displayColumns.map((col) => (
                              <TableCell key={col} className="text-sm py-2 text-gray-700">
                                {getCellValue(article, col)}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {SAMPLE_ARTICLES.slice(0, 2).map((article, i) => (
                      <div key={i} className="border border-gray-200 rounded-md p-3 bg-white">
                        <div className="flex items-start gap-2">
                          {displayColumns.includes('image') && (
                            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                              <Camera className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-xs text-gray-900">{article.name}</span>
                              {displayColumns.includes('price') && (
                                <span className="text-gray-600 text-xs">€{article.price.toFixed(2)}</span>
                              )}
                            </div>
                            {displayColumns.includes('description') && (
                              <p className="text-[10px] text-gray-500 truncate">{article.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Footer */}
            {footerText && (
              <div className={`mt-6 pt-4 border-t border-gray-200 text-center prose max-w-none text-gray-600 ${isDesktop ? 'prose-sm' : 'prose-xs'}`}>
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
