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

// Clean German price format: "4,99 €" -> "4.99"
const cleanPrice = (value: string): string => {
  if (!value) return value;
  const cleaned = value.replace(/€/g, '').replace(/\s/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? value : num.toString();
};

// Supplier name mapping for normalization
const SUPPLIER_NAME_MAPPING: Record<string, string> = {
  'hamberger': 'Hamberger (Intergast)',
  'mehdi food': 'Mehdi Food',
  'medi food': 'Mehdi Food',
  'papazof': 'Papazof Seven Seas',
  'papazof fisch': 'Papazof Seven Seas',
  'papazof seven seas': 'Papazof Seven Seas',
  'kao': 'KAO Handels GmbH',
  'kao handels': 'KAO Handels GmbH',
  'sonnberg': 'Sonnberg Biofleisch',
  'sonnberg biofleisch': 'Sonnberg Biofleisch',
  'früchte feldbrach': 'Früchte Feldbrach',
  'feldbrach': 'Früchte Feldbrach',
  'bäckerei schmidt': 'Bäckerei Schmidt',
  'bäckerei': 'Bäckerei Schmidt',
  'online': 'Online-Bestellungen',
  'fleisch': 'Fleisch-Übersicht',
};

// Blacklist patterns - lines that should NOT be detected as suppliers
const BLACKLIST_PATTERNS = [
  /^anlieferung/i,
  /^artikel\s*nr/i,
  /^artnr/i,
  /bestellmenge/i,
  /bezeichnung\s*1/i,
  /^\d{1,2}\.\d{1,2}\.\d{2,4}/,  // Date patterns
  /^preis$/i,
  /^einheit$/i,
  /^;+$/,  // Only semicolons
  /^,+$/,  // Only commas
];

// Detect if a line is a new supplier section header
// Main pattern: "NAME: Tabelle 1" or "NAME: Online Produkte"
const isSupplierHeader = (line: string, lineIndex: number, allLines: string[]): { isHeader: boolean; supplierName: string | null } => {
  // Skip empty lines
  if (!line || line.trim().length === 0) {
    return { isHeader: false, supplierName: null };
  }

  // Check blacklist first
  for (const pattern of BLACKLIST_PATTERNS) {
    if (pattern.test(line)) {
      return { isHeader: false, supplierName: null };
    }
  }

  // Main pattern 1: "NAME: Tabelle X" (e.g., "HAMBERGER: Tabelle 1")
  const tablePattern = /^([A-ZÄÖÜa-zäöü\s\-]+):\s*Tabelle\s*\d+/i;
  const tableMatch = line.match(tablePattern);
  if (tableMatch) {
    const rawName = tableMatch[1].trim();
    const normalizedName = normalizeSupplierName(rawName);
    return { isHeader: true, supplierName: normalizedName };
  }

  // Main pattern 2: "NAME: XYZ Produkte" (e.g., "Online: Online Produkte")
  const productPattern = /^([A-ZÄÖÜa-zäöü\s\-]+):\s*[A-ZÄÖÜa-zäöü]+\s*Produkte/i;
  const productMatch = line.match(productPattern);
  if (productMatch) {
    const rawName = productMatch[1].trim();
    const normalizedName = normalizeSupplierName(rawName);
    return { isHeader: true, supplierName: normalizedName };
  }

  // Fallback pattern: Just "NAME:" at start followed by text
  const colonPattern = /^([A-ZÄÖÜ][A-ZÄÖÜa-zäöü\s\-]{2,20}):\s*.+/;
  const colonMatch = line.match(colonPattern);
  if (colonMatch) {
    const rawName = colonMatch[1].trim();
    // Only accept if it matches a known supplier
    const lowerName = rawName.toLowerCase();
    if (Object.keys(SUPPLIER_NAME_MAPPING).some(key => lowerName.includes(key) || key.includes(lowerName))) {
      const normalizedName = normalizeSupplierName(rawName);
      return { isHeader: true, supplierName: normalizedName };
    }
  }

  return { isHeader: false, supplierName: null };
};

// Normalize supplier name using the mapping
const normalizeSupplierName = (rawName: string): string => {
  const lowerName = rawName.toLowerCase().trim();
  
  // Check exact match first
  if (SUPPLIER_NAME_MAPPING[lowerName]) {
    return SUPPLIER_NAME_MAPPING[lowerName];
  }
  
  // Check partial matches
  for (const [key, value] of Object.entries(SUPPLIER_NAME_MAPPING)) {
    if (lowerName.includes(key) || key.includes(lowerName)) {
      return value;
    }
  }
  
  // Return original name with proper capitalization
  return rawName.charAt(0).toUpperCase() + rawName.slice(1);
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

    // Debug: Log available suppliers for matching
    console.log('[MultiSupplierImport] Available existing suppliers for org:', organizationId, existingSuppliers.map(s => s.name));
    
    // Helper function to find matching existing supplier with flexible matching
    const findMatchingSupplier = (supplierName: string): ExistingSupplier | undefined => {
      const nameLower = supplierName.toLowerCase().trim();
      
      // 1. Exact match (case-insensitive)
      let match = existingSuppliers.find(s => s.name.toLowerCase() === nameLower);
      if (match) {
        console.log(`[Match] Exact match: "${supplierName}" -> "${match.name}"`);
        return match;
      }
      
      // 2. Partial match (one contains the other)
      match = existingSuppliers.find(s => {
        const existingLower = s.name.toLowerCase();
        return existingLower.includes(nameLower) || nameLower.includes(existingLower);
      });
      if (match) {
        console.log(`[Match] Partial match: "${supplierName}" -> "${match.name}"`);
        return match;
      }
      
      // 3. Check via normalized mapping keys
      for (const [key, normalizedValue] of Object.entries(SUPPLIER_NAME_MAPPING)) {
        if (nameLower.includes(key) || key.includes(nameLower)) {
          const mappedMatch = existingSuppliers.find(s => 
            s.name.toLowerCase().includes(key) || 
            s.name.toLowerCase() === normalizedValue.toLowerCase()
          );
          if (mappedMatch) {
            console.log(`[Match] Mapping match: "${supplierName}" via key "${key}" -> "${mappedMatch.name}"`);
            return mappedMatch;
          }
        }
      }
      
      console.log(`[Match] No match found for: "${supplierName}" - will create NEW supplier`);
      return undefined;
    };
    
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
        
        // Start new section - use flexible matching
        const existingSupplier = findMatchingSupplier(supplierName);
        
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
  }, [existingSuppliers, organizationId]);

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
      // Load all locations for this organization for automatic assignment
      const { data: orgLocations, error: locationsError } = await supabase
        .from('locations')
        .select('id')
        .eq('organization_id', organizationId);

      if (locationsError) {
        console.error('Error loading locations:', locationsError);
      }

      console.log('[MultiSupplierImport] Organization locations:', orgLocations?.length || 0);

      let suppliersCreated = 0;
      let articlesImported = 0;

      for (const section of selectedSections) {
        let supplierId = section.existingSupplierId;

        // Create new supplier if needed
        if (section.isNew && !supplierId) {
          // Generate placeholder email if none provided (email is NOT NULL in DB)
          const emailToUse = section.contactEmail || 
            `import+${section.supplierName.toLowerCase().replace(/[^a-z0-9]/g, '-')}@placeholder.invalid`;

          const { data: newSupplier, error: supplierError } = await supabase
            .from('suppliers')
            .insert({
              name: section.supplierName,
              email: emailToUse,
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
            toast.error(`Fehler beim Anlegen von "${section.supplierName}": ${supplierError.message}`);
            continue;
          }

          supplierId = newSupplier.id;
          suppliersCreated++;

          // Assign new supplier to all organization locations
          if (orgLocations && orgLocations.length > 0) {
            const supplierLocationEntries = orgLocations.map(loc => ({
              supplier_id: supplierId!,
              location_id: loc.id,
              is_active: true,
            }));

            const { error: slError } = await supabase
              .from('supplier_locations')
              .insert(supplierLocationEntries);

            if (slError) {
              console.error('Error creating supplier_locations:', slError);
            } else {
              console.log(`[MultiSupplierImport] Created ${supplierLocationEntries.length} supplier_locations for "${section.supplierName}"`);
            }
          }
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
          // Insert articles and get their IDs for location assignment
          const { data: insertedArticles, error: articlesError } = await supabase
            .from('articles')
            .insert(articlesToInsert)
            .select('id');

          if (articlesError) {
            console.error('Error importing articles:', articlesError);
            toast.error(`Fehler beim Import der Artikel für "${section.supplierName}": ${articlesError.message}`);
          } else {
            articlesImported += articlesToInsert.length;

            // Assign new articles to all organization locations
            if (insertedArticles && orgLocations && orgLocations.length > 0) {
              const articleLocationEntries = insertedArticles.flatMap(article =>
                orgLocations.map(loc => ({
                  article_id: article.id,
                  location_id: loc.id,
                  is_active: true,
                }))
              );

              const { error: alError } = await supabase
                .from('article_locations')
                .insert(articleLocationEntries);

              if (alError) {
                console.error('Error creating article_locations:', alError);
              } else {
                console.log(`[MultiSupplierImport] Created ${articleLocationEntries.length} article_locations for "${section.supplierName}"`);
              }
            }
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
      toast.error('Import fehlgeschlagen: ' + (err instanceof Error ? err.message : 'Unbekannter Fehler'));
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
