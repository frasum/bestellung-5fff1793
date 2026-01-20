import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2, Download, Sparkles, Wand2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';

export interface ColumnMapping {
  csvHeader: string;
  field: string;
  required: boolean;
}

export interface ImportField {
  name: string;
  label: string;
  required: boolean;
}

interface SupplierOption {
  id: string;
  name: string;
}

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fields: ImportField[];
  onImport: (data: Record<string, string>[], defaultSupplierId?: string) => Promise<void>;
  templateFileName: string;
  enableAI?: boolean;
  suppliers?: SupplierOption[];
  showSupplierSelect?: boolean;
}

export const CsvImportDialog = ({
  open,
  onOpenChange,
  title,
  fields,
  onImport,
  templateFileName,
  enableAI = true,
  suppliers,
  showSupplierSelect = false,
}: CsvImportDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  
  // AI features
  const [useAI, setUseAI] = useState(true);
  const [aiMapping, setAiMapping] = useState<Record<string, string>>({});
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [aiStatus, setAiStatus] = useState<string | null>(null);

  const resetState = () => {
    setFile(null);
    setParsedData([]);
    setHeaders([]);
    setError(null);
    setImportSuccess(false);
    setAiMapping({});
    setAiStatus(null);
    setSelectedSupplierId('');
  };

  // Clean German price format: "4,99 €" -> "4.99"
  const cleanPrice = (value: string): string => {
    if (!value) return value;
    // Remove € symbol and whitespace, replace comma with dot
    const cleaned = value.replace(/€/g, '').replace(/\s/g, '').replace(',', '.');
    // Check if it's a valid number
    const num = parseFloat(cleaned);
    return isNaN(num) ? value : num.toString();
  };

  // Detect header row by looking for typical column names
  const detectHeaderRow = (lines: string[], delimiter: string): number => {
    const headerKeywords = ['artikel', 'name', 'preis', 'einheit', 'menge', 'bezeichnung', 'nr', 'sku', 'price', 'unit'];
    
    for (let i = 0; i < Math.min(20, lines.length); i++) {
      const line = lines[i].toLowerCase();
      const matchCount = headerKeywords.filter(kw => line.includes(kw)).length;
      if (matchCount >= 2) {
        return i;
      }
    }
    return 0; // Default to first line
  };

  const parseCSV = (text: string): { headers: string[]; rows: Record<string, string>[] } => {
    const allLines = text.split('\n');
    const nonEmptyLines = allLines.map((line, idx) => ({ line: line.trim(), originalIdx: idx })).filter(l => l.line);
    
    if (nonEmptyLines.length === 0) throw new Error('CSV file is empty');

    // Detect delimiter from first few lines
    const sampleLines = nonEmptyLines.slice(0, 5).map(l => l.line).join('\n');
    const delimiter = sampleLines.includes(';') ? ';' : ',';

    // Auto-detect header row
    const headerRowIdx = detectHeaderRow(nonEmptyLines.map(l => l.line), delimiter);
    const headerLine = nonEmptyLines[headerRowIdx].line;

    const headers = headerLine.split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
    const rows: Record<string, string>[] = [];

    // Price column detection for cleaning
    const priceColumns = headers.map((h, i) => ({
      index: i,
      isPrice: /preis|price|€|ek|vk/i.test(h)
    }));

    for (let i = headerRowIdx + 1; i < nonEmptyLines.length; i++) {
      const line = nonEmptyLines[i].line;
      const values = line.split(delimiter).map(v => v.trim().replace(/^["']|["']$/g, ''));
      
      // Skip rows that don't have enough data (likely category headers or empty)
      const nonEmptyValues = values.filter(v => v && v.length > 0);
      if (nonEmptyValues.length < 2) continue;
      
      // Skip rows where first few columns are empty (malformed data)
      if (values.length >= headers.length) {
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          let value = values[index] || '';
          
          // Clean price columns
          if (priceColumns[index]?.isPrice) {
            value = cleanPrice(value);
          }
          
          row[header] = value;
        });
        
        // Only add rows that have at least a name or SKU
        const hasName = Object.entries(row).some(([k, v]) => 
          /name|bezeichnung|artikel/i.test(k) && v && v.length > 0
        );
        const hasSku = Object.entries(row).some(([k, v]) => 
          /nr|sku|nummer/i.test(k) && v && v.length > 0
        );
        
        if (hasName || hasSku) {
          rows.push(row);
        }
      }
    }

    return { headers, rows };
  };

  const parseExcel = (buffer: ArrayBuffer): { headers: string[]; rows: Record<string, string>[] } => {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    
    // Try sheet_to_json with default options first (uses first row as headers automatically)
    const jsonDataWithHeaders = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];
    
    
    if (jsonDataWithHeaders.length > 0) {
      // Extract headers from the first object's keys
      const headers = Object.keys(jsonDataWithHeaders[0]);
      
      
      const rows: Record<string, string>[] = jsonDataWithHeaders.map(row => {
        const stringRow: Record<string, string> = {};
        headers.forEach(header => {
          stringRow[header] = String(row[header] ?? '').trim();
        });
        return stringRow;
      });
      
      
      return { headers, rows };
    }
    
    // Fallback to header: 1 approach
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
    
    
    if (jsonData.length === 0) throw new Error('Excel file is empty');

    const headers = (jsonData[0] || []).map(h => String(h || '').trim());
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < jsonData.length; i++) {
      const rowData = jsonData[i] || [];
      if (rowData.length > 0) {
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = String(rowData[index] ?? '').trim();
        });
        rows.push(row);
      }
    }

    return { headers, rows };
  };

  const runAIColumnMapping = async (csvHeaders: string[]) => {
    setIsAIProcessing(true);
    setAiStatus('KI analysiert Spalten...');
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-import-helper', {
        body: {
          type: 'map_columns',
          headers: csvHeaders,
          targetFields: fields,
        },
      });

      if (error) {
        throw new Error(error.message || 'AI mapping failed');
      }

      if (data?.result?.mappings) {
        setAiMapping(data.result.mappings);
        toast.success('KI hat Spalten automatisch zugeordnet');
      }
    } catch {
      // AI column mapping failed - using default mapping
      toast.error('KI-Zuordnung fehlgeschlagen, verwende Standard-Zuordnung');
    } finally {
      setIsAIProcessing(false);
      setAiStatus(null);
    }
  };

  const runAIDataCleaning = async (data: Record<string, string>[]): Promise<Record<string, string>[]> => {
    setAiStatus('KI bereinigt Daten...');
    
    try {
      const { data: result, error } = await supabase.functions.invoke('ai-import-helper', {
        body: {
          type: 'clean_data',
          data: data.slice(0, 20), // Limit to prevent timeout
        },
      });

      if (error) {
        throw new Error('AI cleaning failed');
      }

      if (Array.isArray(result?.result)) {
        // Merge cleaned data with original
        const cleanedMap = new Map<number, Record<string, string>>(
          result.result.map((item: Record<string, string>, i: number) => [i, item])
        );
        return data.map((row, i) => {
          const cleaned = cleanedMap.get(i);
          return cleaned ? { ...row, ...cleaned } : row;
        });
      }
    } catch {
      // AI data cleaning failed - using original data
    }
    
    return data;
  };

  const runAICategorization = async (data: Record<string, string>[]): Promise<Record<string, string>[]> => {
    setAiStatus('KI kategorisiert Artikel...');
    
    try {
      const { data: result, error } = await supabase.functions.invoke('ai-import-helper', {
        body: {
          type: 'categorize',
          data: data.slice(0, 50),
        },
      });

      if (error) {
        throw new Error('AI categorization failed');
      }

      if (Array.isArray(result?.result)) {
        const categoryMap = new Map<number, string>(
          result.result.map((item: { index: number; category: string }) => [item.index, item.category])
        );
        return data.map((row, i) => {
          const category = categoryMap.get(i);
          if (category && !row.category && !row.Category && !row.Kategorie) {
            return { ...row, category: category };
          }
          return row;
        });
      }
    } catch {
      // AI categorization failed - using original data
    }
    
    return data;
  };

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError(null);
    setImportSuccess(false);
    setAiMapping({});

    const fileName = selectedFile.name.toLowerCase();
    const isCSV = fileName.endsWith('.csv');
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

    if (!isCSV && !isExcel) {
      setError('Please select a CSV or Excel file (.csv, .xlsx, .xls)');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        let csvHeaders: string[];
        let rows: Record<string, string>[];

        if (isCSV) {
          const text = event.target?.result as string;
          const parsed = parseCSV(text);
          csvHeaders = parsed.headers;
          rows = parsed.rows;
        } else {
          const buffer = event.target?.result as ArrayBuffer;
          const parsed = parseExcel(buffer);
          csvHeaders = parsed.headers;
          rows = parsed.rows;
        }

        setFile(selectedFile);
        setHeaders(csvHeaders);
        setParsedData(rows);

        // Run AI column mapping if enabled
        if (useAI && enableAI) {
          await runAIColumnMapping(csvHeaders);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('Parse error:', message);
        setError('Failed to parse file. Please check the format.');
      }
    };
    
    if (isCSV) {
      reader.readAsText(selectedFile);
    } else {
      reader.readAsArrayBuffer(selectedFile);
    }
  }, [fields, useAI, enableAI]);

  const handleImport = async () => {
    if (parsedData.length === 0) return;

    setIsImporting(true);
    setError(null);

    try {
      let dataToImport = [...parsedData];
      
      // Run AI data cleaning if enabled
      if (useAI && enableAI) {
        dataToImport = await runAIDataCleaning(dataToImport);
        
        // Run AI categorization for articles (if category field exists)
        const hasCategory = fields.some(f => f.name === 'category');
        if (hasCategory) {
          dataToImport = await runAICategorization(dataToImport);
        }
      }

      setAiStatus(null);

      // Extract headers directly from data (in case state headers are empty)
      const effectiveHeaders = headers.length > 0 ? headers : Object.keys(dataToImport[0] || {});

      // Common column name aliases (German -> English field names)
      const columnAliases: Record<string, string[]> = {
        name: ['name', 'artikelname', 'artikel', 'produkt', 'bezeichnung', 'produktname', 'article', 'product', 'deutsche bezeichnung', 'deutschebezeichnung', 'artikelbezeichnung'],
        price: ['price', 'preis', 'vk', 'ek', 'einzelpreis', 'verkaufspreis', 'einkaufspreis', 'betrag'],
        unit: ['unit', 'einheit', 'me', 'mengeneinheit', 'gebinde', 'gebindegrösse', 'gebinde größe', 'inhalt', 'inhalt/einheit'],
        sku: ['sku', 'artikelnummer', 'artnr', 'art.nr.', 'artikelnr', 'nummer', 'produktnummer', 'artikel nr', 'artikelnr.'],
        category: ['category', 'kategorie', 'warengruppe', 'gruppe', 'productgroup'],
        description: ['description', 'beschreibung', 'beschr.', 'info', 'details', 'thailändische übersetzung', 'thailändischeübersetzung', 'thai', 'übersetzung'],
        supplier: ['supplier', 'lieferant', 'lieferantenname', 'supplier_name', 'anbieter'],
        email: ['email', 'e-mail', 'mail', 'emailadresse', 'email_address'],
        phone: ['phone', 'telefon', 'tel', 'telefonnummer', 'phone_number', 'mobil'],
        address: ['address', 'adresse', 'anschrift', 'strasse', 'straße'],
        contact_person: ['contact_person', 'ansprechpartner', 'kontakt', 'kontaktperson'],
        customer_number: ['customer_number', 'kundennummer', 'kd-nr', 'kdnr', 'kundenummer'],
        minimum_order_value: ['minimum_order_value', 'mindestbestellwert', 'mbw', 'min_order'],
      };

      // Map data to field names using AI mapping, aliases, or case-insensitive matching
      const mappedData = dataToImport.map(row => {
        const mapped: Record<string, string> = {};
        const rowKeys = Object.keys(row);
        
        fields.forEach(field => {
          // First check AI mapping
          const aiMappedHeader = Object.entries(aiMapping).find(([_, target]) => target === field.name)?.[0];
          if (aiMappedHeader && row[aiMappedHeader] !== undefined) {
            mapped[field.name] = row[aiMappedHeader] || '';
            return;
          }
          
          // Check column aliases against actual row keys
          const aliases = columnAliases[field.name] || [field.name];
          for (const alias of aliases) {
            const matchingKey = rowKeys.find(k => k.toLowerCase().replace(/[^a-z0-9äöüß]/g, '') === alias.toLowerCase().replace(/[^a-z0-9äöüß]/g, ''));
            if (matchingKey && row[matchingKey] !== undefined && row[matchingKey] !== '') {
              mapped[field.name] = row[matchingKey] || '';
              return;
            }
          }
          
          // Fall back to exact case-insensitive matching
          const exactMatch = rowKeys.find(k => k.toLowerCase() === field.name.toLowerCase());
          if (exactMatch && row[exactMatch]) {
            mapped[field.name] = row[exactMatch] || '';
          }
          
          // Check for category from AI categorization
          if (field.name === 'category' && !mapped[field.name] && row.category) {
            mapped[field.name] = row.category;
          }
        });
        return mapped;
      });

      await onImport(mappedData, selectedSupplierId || undefined);
      setImportSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        resetState();
      }, 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Import failed';
      setError(message);
    } finally {
      setIsImporting(false);
      setAiStatus(null);
    }
  };

  const downloadTemplate = () => {
    const templateHeaders = fields.map(f => f.name);
    const example = fields.map(f => f.required ? `Example ${f.label}` : '');
    
    const ws = XLSX.utils.aoa_to_sheet([templateHeaders, example]);
    ws['!cols'] = templateHeaders.map(() => ({ wch: 20 }));
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    
    const filename = templateFileName.replace(/\.(csv|xlsx|xls)$/i, '') + '.xlsx';
    XLSX.writeFile(wb, filename);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetState();
    }}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {title}
            {enableAI && <Sparkles className="w-5 h-5 text-primary" />}
          </DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file to import multiple records at once
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* AI Toggle */}
          {enableAI && (
            <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-primary" />
                <div>
                  <Label htmlFor="ai-toggle" className="font-medium">KI-Unterstützung</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatische Spaltenzuordnung, Datenbereinigung & Kategorisierung
                  </p>
                </div>
              </div>
              <Switch
                id="ai-toggle"
                checked={useAI}
                onCheckedChange={setUseAI}
              />
            </div>
          )}

          {/* Supplier Select for Article Import */}
          {showSupplierSelect && suppliers && suppliers.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="default-supplier" className="font-medium">Standard-Lieferant</Label>
              <p className="text-xs text-muted-foreground">
                Wähle einen Lieferanten für alle importierten Artikel (wenn keine Lieferanten-Spalte vorhanden ist)
              </p>
              <select
                id="default-supplier"
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground"
              >
                <option value="">-- Lieferant auswählen --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Template Download */}
          <Button variant="outline" size="sm" onClick={downloadTemplate} className="w-fit">
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>

          {/* File Upload */}
          {!file && (
            <label className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
              <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground">Click to upload CSV or Excel</p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports .csv, .xlsx, .xls files
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Required columns: {fields.filter(f => f.required).map(f => f.label).join(', ')}
              </p>
            </label>
          )}

          {/* AI Processing Status */}
          {isAIProcessing && aiStatus && (
            <Alert className="border-primary/50 bg-primary/5">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              <AlertDescription className="text-primary">
                {aiStatus}
              </AlertDescription>
            </Alert>
          )}

          {/* AI Mapping Info */}
          {Object.keys(aiMapping).length > 0 && (
            <Alert className="border-green-500/50 bg-green-500/5">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-600">
                KI hat {Object.keys(aiMapping).length} Spalten automatisch zugeordnet
              </AlertDescription>
            </Alert>
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
                Successfully imported {parsedData.length} records!
              </AlertDescription>
            </Alert>
          )}

          {/* Preview */}
          {file && parsedData.length > 0 && !importSuccess && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({parsedData.length} records)
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={resetState}>
                  Change file
                </Button>
              </div>

              <ScrollArea className="flex-1 border border-border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {headers.slice(0, 5).map((header) => (
                        <TableHead key={header} className="whitespace-nowrap">
                          <div className="flex flex-col">
                            <span>{header}</span>
                            {aiMapping[header] && (
                              <span className="text-xs text-primary font-normal">
                                → {aiMapping[header]}
                              </span>
                            )}
                          </div>
                        </TableHead>
                      ))}
                      {headers.length > 5 && <TableHead>...</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.slice(0, 5).map((row, index) => (
                      <TableRow key={index}>
                        {headers.slice(0, 5).map((header) => (
                          <TableCell key={header} className="max-w-[150px] truncate">
                            {row[header]}
                          </TableCell>
                        ))}
                        {headers.length > 5 && <TableCell>...</TableCell>}
                      </TableRow>
                    ))}
                    {parsedData.length > 5 && (
                      <TableRow>
                        <TableCell colSpan={Math.min(headers.length, 6)} className="text-center text-muted-foreground">
                          ... and {parsedData.length - 5} more rows
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </>
          )}

          {/* Actions */}
          {file && parsedData.length > 0 && !importSuccess && (
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleImport} disabled={isImporting || isAIProcessing}>
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {aiStatus || 'Importing...'}
                  </>
                ) : (
                  <>
                    {useAI && enableAI && <Sparkles className="w-4 h-4 mr-2" />}
                    Import {parsedData.length} Records
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
