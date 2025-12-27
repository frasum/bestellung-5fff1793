import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2, Download, Sparkles, Building2, Package } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';

export interface SupplierSection {
  supplierName: string;
  startLine: number;
  endLine: number;
  articles: Record<string, string>[];
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  customerNumber?: string;
  isSelected: boolean;
  isNew: boolean; // true if supplier needs to be created
  existingSupplierId?: string;
}

interface ExistingSupplier {
  id: string;
  name: string;
}

interface MultiSupplierCsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
  existingSuppliers: ExistingSupplier[];
  organizationId: string;
}

// Known supplier patterns to detect section starts
const SUPPLIER_PATTERNS = [
  { name: 'Hamberger', patterns: ['hamberger', 'intergast'] },
  { name: 'Mehdi Food', patterns: ['mehdi', 'mehdi food'] },
  { name: 'Papazof Seven Seas', patterns: ['papazof', 'seven seas'] },
  { name: 'KAO Handels GmbH', patterns: ['kao', 'kao handels'] },
  { name: 'Sonnberg Biofleisch', patterns: ['sonnberg', 'biofleisch'] },
  { name: 'Früchte Feldbrach', patterns: ['feldbrach', 'früchte feldbrach'] },
  { name: 'Bäckerei Schmidt', patterns: ['bäckerei schmidt', 'schmidt'] },
];

// Clean German price format: "4,99 €" -> "4.99"
const cleanPrice = (value: string): string => {
  if (!value) return value;
  const cleaned = value.replace(/€/g, '').replace(/\s/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? value : num.toString();
};

// Detect if a line is a new supplier section header
const isSupplierHeader = (line: string, lineIndex: number, allLines: string[]): { isHeader: boolean; supplierName: string | null } => {
  const lowerLine = line.toLowerCase();
  
  // Check for "Tabelle X" pattern which often precedes supplier info
  if (/tabelle\s*\d+/i.test(line)) {
    // Look at next few lines for supplier name
    for (let i = 1; i <= 3 && lineIndex + i < allLines.length; i++) {
      const nextLine = allLines[lineIndex + i];
      for (const pattern of SUPPLIER_PATTERNS) {
        if (pattern.patterns.some(p => nextLine.toLowerCase().includes(p))) {
          return { isHeader: true, supplierName: pattern.name };
        }
      }
      // Check if it looks like a company name (not a product)
      if (nextLine && /^[A-ZÄÖÜ]/.test(nextLine) && !/\d{1,2},\d{2}/.test(nextLine) && nextLine.length < 50) {
        return { isHeader: true, supplierName: nextLine.trim() };
      }
    }
  }
  
  // Check for direct supplier name patterns
  for (const pattern of SUPPLIER_PATTERNS) {
    if (pattern.patterns.some(p => lowerLine.includes(p))) {
      // Make sure it's not just a product containing the supplier name
      if (!lowerLine.includes('preis') && !lowerLine.includes('€') && line.length < 60) {
        return { isHeader: true, supplierName: pattern.name };
      }
    }
  }
  
  // Check for new header row pattern (Artikel NR, Bezeichnung, etc.)
  const headerKeywords = ['artikel nr', 'artikelbezeichnung', 'bezeichnung', 'preis'];
  const matchCount = headerKeywords.filter(kw => lowerLine.includes(kw)).length;
  if (matchCount >= 2) {
    // This is likely a new section header - check previous lines for supplier name
    for (let i = 1; i <= 5 && lineIndex - i >= 0; i++) {
      const prevLine = allLines[lineIndex - i].trim();
      if (prevLine && /^[A-ZÄÖÜ]/.test(prevLine) && !/\d{1,2},\d{2}/.test(prevLine) && prevLine.length < 50 && prevLine.length > 3) {
        return { isHeader: true, supplierName: prevLine };
      }
    }
  }
  
  return { isHeader: false, supplierName: null };
};

// Extract contact info from lines
const extractContactInfo = (lines: string[]): { email?: string; phone?: string; address?: string; customerNumber?: string } => {
  const info: { email?: string; phone?: string; address?: string; customerNumber?: string } = {};
  
  for (const line of lines) {
    // Email
    const emailMatch = line.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch) info.email = emailMatch[0];
    
    // Phone
    const phoneMatch = line.match(/(?:Tel|Mobil|WhatsApp)?[:\s]*(\+?[\d\s/-]{8,})/i);
    if (phoneMatch) info.phone = phoneMatch[1].trim();
    
    // Customer number
    const kdMatch = line.match(/(?:Kd\.?-?Nr\.?|Kundennummer)[:\s]*(\S+)/i);
    if (kdMatch) info.customerNumber = kdMatch[1];
  }
  
  return info;
};

export const MultiSupplierCsvImportDialog = ({
  open,
  onOpenChange,
  onImportComplete,
  existingSuppliers,
  organizationId,
}: MultiSupplierCsvImportDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [sections, setSections] = useState<SupplierSection[]>([]);
  const [rawLines, setRawLines] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importStats, setImportStats] = useState<{ suppliers: number; articles: number }>({ suppliers: 0, articles: 0 });

  const resetState = () => {
    setFile(null);
    setSections([]);
    setRawLines([]);
    setError(null);
    setImportSuccess(false);
    setImportStats({ suppliers: 0, articles: 0 });
  };

  const detectSupplierSections = useCallback((text: string): SupplierSection[] => {
    const allLines = text.split('\n').map(l => l.trim());
    setRawLines(allLines);
    
    const detectedSections: SupplierSection[] = [];
    let currentSection: SupplierSection | null = null;
    let currentHeaders: string[] = [];
    let currentStartLine = 0;
    
    // Detect delimiter
    const sampleText = allLines.slice(0, 20).join('\n');
    const delimiter = sampleText.includes(';') ? ';' : ',';
    
    for (let i = 0; i < allLines.length; i++) {
      const line = allLines[i];
      if (!line) continue;
      
      const { isHeader, supplierName } = isSupplierHeader(line, i, allLines);
      
      if (isHeader && supplierName) {
        // Save previous section
        if (currentSection && currentSection.articles.length > 0) {
          currentSection.endLine = i - 1;
          detectedSections.push(currentSection);
        }
        
        // Start new section
        const existingSupplier = existingSuppliers.find(
          s => s.name.toLowerCase() === supplierName.toLowerCase()
        );
        
        // Look ahead for contact info
        const contactLines = allLines.slice(i, Math.min(i + 10, allLines.length));
        const contactInfo = extractContactInfo(contactLines);
        
        currentSection = {
          supplierName: supplierName,
          startLine: i,
          endLine: allLines.length - 1,
          articles: [],
          isSelected: true,
          isNew: !existingSupplier,
          existingSupplierId: existingSupplier?.id,
          ...contactInfo,
        };
        currentStartLine = i;
        currentHeaders = [];
        continue;
      }
      
      // Look for column headers
      const lowerLine = line.toLowerCase();
      const headerKeywords = ['artikel', 'bezeichnung', 'preis', 'einheit', 'menge'];
      const matchCount = headerKeywords.filter(kw => lowerLine.includes(kw)).length;
      
      if (matchCount >= 2 && currentSection) {
        currentHeaders = line.split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
        continue;
      }
      
      // Parse article rows
      if (currentSection && currentHeaders.length > 0) {
        const values = line.split(delimiter).map(v => v.trim().replace(/^["']|["']$/g, ''));
        
        // Skip if not enough columns or no meaningful data
        const nonEmptyValues = values.filter(v => v && v.length > 0);
        if (nonEmptyValues.length < 2) continue;
        
        // Build row object
        const row: Record<string, string> = {};
        currentHeaders.forEach((header, index) => {
          let value = values[index] || '';
          // Clean price columns
          if (/preis|€|vk|ek/i.test(header)) {
            value = cleanPrice(value);
          }
          row[header] = value;
        });
        
        // Only add if has a name or SKU
        const hasName = Object.entries(row).some(([k, v]) => 
          /name|bezeichnung|artikel/i.test(k) && v && v.length > 0
        );
        const hasSku = Object.entries(row).some(([k, v]) => 
          /nr|sku|nummer/i.test(k) && v && v.length > 0
        );
        
        if (hasName || hasSku) {
          currentSection.articles.push(row);
        }
      }
    }
    
    // Don't forget last section
    if (currentSection && currentSection.articles.length > 0) {
      currentSection.endLine = allLines.length - 1;
      detectedSections.push(currentSection);
    }
    
    // If no sections detected, treat entire file as single supplier
    if (detectedSections.length === 0) {
      // Parse entire file as single supplier
      const headerKeywords = ['artikel', 'name', 'preis', 'einheit'];
      let headerLine = 0;
      for (let i = 0; i < Math.min(20, allLines.length); i++) {
        const matchCount = headerKeywords.filter(kw => allLines[i].toLowerCase().includes(kw)).length;
        if (matchCount >= 2) {
          headerLine = i;
          break;
        }
      }
      
      const headers = allLines[headerLine].split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
      const articles: Record<string, string>[] = [];
      
      for (let i = headerLine + 1; i < allLines.length; i++) {
        const line = allLines[i];
        if (!line) continue;
        
        const values = line.split(delimiter).map(v => v.trim().replace(/^["']|["']$/g, ''));
        if (values.filter(v => v).length < 2) continue;
        
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          let value = values[index] || '';
          if (/preis|€/i.test(header)) value = cleanPrice(value);
          row[header] = value;
        });
        
        const hasName = Object.entries(row).some(([k, v]) => 
          /name|bezeichnung|artikel/i.test(k) && v && v.length > 0
        );
        if (hasName) articles.push(row);
      }
      
      if (articles.length > 0) {
        detectedSections.push({
          supplierName: 'Unbekannter Lieferant',
          startLine: 0,
          endLine: allLines.length - 1,
          articles,
          isSelected: true,
          isNew: true,
        });
      }
    }
    
    return detectedSections;
  }, [existingSuppliers]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError(null);
    setImportSuccess(false);
    setIsProcessing(true);

    const fileName = selectedFile.name.toLowerCase();
    const isCSV = fileName.endsWith('.csv');
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

    if (!isCSV && !isExcel) {
      setError('Bitte CSV oder Excel Datei auswählen (.csv, .xlsx, .xls)');
      setIsProcessing(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        let text: string;
        
        if (isCSV) {
          text = event.target?.result as string;
        } else {
          const buffer = event.target?.result as ArrayBuffer;
          const workbook = XLSX.read(buffer, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          text = XLSX.utils.sheet_to_csv(firstSheet, { FS: ';' });
        }

        const detectedSections = detectSupplierSections(text);
        
        if (detectedSections.length === 0) {
          setError('Keine Lieferanten-Abschnitte erkannt. Bitte überprüfen Sie das Dateiformat.');
          setIsProcessing(false);
          return;
        }

        setFile(selectedFile);
        setSections(detectedSections);
        
        const totalArticles = detectedSections.reduce((sum, s) => sum + s.articles.length, 0);
        const newSuppliers = detectedSections.filter(s => s.isNew).length;
        
        toast.success(`${detectedSections.length} Lieferanten mit ${totalArticles} Artikeln erkannt${newSuppliers > 0 ? ` (${newSuppliers} neu)` : ''}`);
      } catch (err) {
        setError('Fehler beim Parsen der Datei. Bitte Format überprüfen.');
      } finally {
        setIsProcessing(false);
      }
    };
    
    if (isCSV) {
      reader.readAsText(selectedFile);
    } else {
      reader.readAsArrayBuffer(selectedFile);
    }
  }, [detectSupplierSections]);

  const toggleSection = (index: number) => {
    setSections(prev => prev.map((s, i) => 
      i === index ? { ...s, isSelected: !s.isSelected } : s
    ));
  };

  const handleImport = async () => {
    const selectedSections = sections.filter(s => s.isSelected);
    if (selectedSections.length === 0) {
      setError('Bitte mindestens einen Lieferanten auswählen');
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      let suppliersCreated = 0;
      let articlesImported = 0;

      for (const section of selectedSections) {
        let supplierId = section.existingSupplierId;

        // Create new supplier if needed
        if (section.isNew && !supplierId) {
          const { data: newSupplier, error: supplierError } = await supabase
            .from('suppliers')
            .insert({
              name: section.supplierName,
              email: section.contactEmail || null,
              phone: section.contactPhone || null,
              address: section.address || null,
              customer_number: section.customerNumber || null,
              organization_id: organizationId,
              is_active: true,
            })
            .select('id')
            .single();

          if (supplierError) {
            console.error('Error creating supplier:', supplierError);
            continue;
          }

          supplierId = newSupplier.id;
          suppliersCreated++;
        }

        if (!supplierId) continue;

        // Map articles to database format
        const columnAliases: Record<string, string[]> = {
          name: ['artikelbezeichnung', 'bezeichnung', 'name', 'artikel', 'produkt'],
          price: ['preis', 'vk', 'ek', 'price'],
          unit: ['einheit', 'me', 'inhalt/einheit', 'inhalt', 'gebinde größe', 'gebindegrösse'],
          sku: ['artikel nr', 'artikelnr', 'artnr', 'sku', 'nummer'],
          category: ['kategorie', 'warengruppe', 'category'],
        };

        interface ArticleInsert {
          name: string;
          price: number;
          unit: string;
          supplier_id: string;
          organization_id: string;
          sku?: string;
          category?: string;
        }

        const articlesToInsert: ArticleInsert[] = section.articles.map(article => {
          let name = '';
          let price = 0;
          let unit = 'Stück';
          let sku: string | undefined;
          let category: string | undefined;

          // Map each field
          for (const [field, aliases] of Object.entries(columnAliases)) {
            for (const alias of aliases) {
              const key = Object.keys(article).find(k => 
                k.toLowerCase().replace(/[^a-z0-9äöüß]/g, '') === alias.replace(/[^a-z0-9äöüß]/g, '')
              );
              if (key && article[key]) {
                if (field === 'name') name = article[key];
                else if (field === 'price') {
                  const parsed = parseFloat(article[key]);
                  if (!isNaN(parsed)) price = parsed;
                }
                else if (field === 'unit') unit = article[key];
                else if (field === 'sku') sku = article[key];
                else if (field === 'category') category = article[key];
                break;
              }
            }
          }

          // Ensure required name field
          if (!name) {
            const nameCandidate = Object.values(article).find(v => v && v.length > 2 && !/^\d/.test(v));
            if (nameCandidate) name = nameCandidate;
          }

          return {
            name,
            price,
            unit,
            supplier_id: supplierId!,
            organization_id: organizationId,
            ...(sku && { sku }),
            ...(category && { category }),
          };
        }).filter(a => a.name && a.name.length > 0);

        if (articlesToInsert.length > 0) {
          const { error: articlesError } = await supabase
            .from('articles')
            .insert(articlesToInsert);

          if (articlesError) {
            console.error('Error importing articles:', articlesError);
          } else {
            articlesImported += articlesToInsert.length;
          }
        }
      }

      setImportStats({ suppliers: suppliersCreated, articles: articlesImported });
      setImportSuccess(true);
      toast.success(`${suppliersCreated} Lieferanten und ${articlesImported} Artikel importiert`);
      
      setTimeout(() => {
        onImportComplete();
        onOpenChange(false);
        resetState();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import fehlgeschlagen');
    } finally {
      setIsImporting(false);
    }
  };

  const totalArticles = sections.filter(s => s.isSelected).reduce((sum, s) => sum + s.articles.length, 0);
  const newSuppliers = sections.filter(s => s.isSelected && s.isNew).length;

  return (
    <Dialog open={open} onOpenChange={(o) => {
      onOpenChange(o);
      if (!o) resetState();
    }}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Multi-Lieferanten Import
          </DialogTitle>
          <DialogDescription>
            Importiere Artikel von mehreren Lieferanten aus einer Datei
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* File Upload */}
          {!file && (
            <label className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                disabled={isProcessing}
              />
              {isProcessing ? (
                <>
                  <Loader2 className="w-10 h-10 mx-auto text-primary animate-spin mb-3" />
                  <p className="text-sm font-medium">Analysiere Datei...</p>
                </>
              ) : (
                <>
                  <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm font-medium">CSV oder Excel hochladen</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Unterstützt Dateien mit mehreren Lieferanten-Abschnitten
                  </p>
                </>
              )}
            </label>
          )}

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success */}
          {importSuccess && (
            <Alert className="border-green-500 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-500">
                {importStats.suppliers} Lieferanten und {importStats.articles} Artikel erfolgreich importiert!
              </AlertDescription>
            </Alert>
          )}

          {/* Supplier Sections Preview */}
          {file && sections.length > 0 && !importSuccess && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{file.name}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={resetState}>
                  Datei ändern
                </Button>
              </div>

              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{sections.filter(s => s.isSelected).length} Lieferanten</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{totalArticles} Artikel</span>
                </div>
                {newSuppliers > 0 && (
                  <Badge variant="secondary">{newSuppliers} neue Lieferanten</Badge>
                )}
              </div>

              <ScrollArea className="flex-1">
                <div className="space-y-3 pr-4">
                  {sections.map((section, index) => (
                    <Card key={index} className={`transition-all ${section.isSelected ? 'border-primary/50' : 'opacity-60'}`}>
                      <CardHeader className="p-3 pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={section.isSelected}
                              onCheckedChange={() => toggleSection(index)}
                            />
                            <CardTitle className="text-base flex items-center gap-2">
                              {section.supplierName}
                              {section.isNew ? (
                                <Badge variant="outline" className="text-xs">Neu</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">Existiert</Badge>
                              )}
                            </CardTitle>
                          </div>
                          <Badge variant="secondary">{section.articles.length} Artikel</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {section.contactEmail && (
                            <span>📧 {section.contactEmail}</span>
                          )}
                          {section.contactPhone && (
                            <span>📞 {section.contactPhone}</span>
                          )}
                          {section.customerNumber && (
                            <span>🔢 Kd-Nr: {section.customerNumber}</span>
                          )}
                        </div>
                        {section.articles.length > 0 && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            Beispiel: {Object.values(section.articles[0]).filter(v => v).slice(0, 3).join(' | ')}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                  Abbrechen
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={handleImport} 
                  disabled={isImporting || sections.filter(s => s.isSelected).length === 0}
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importiere...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      {totalArticles} Artikel importieren
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
