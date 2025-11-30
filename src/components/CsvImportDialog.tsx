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

  const parseCSV = (text: string): { headers: string[]; rows: Record<string, string>[] } => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) throw new Error('CSV file is empty');

    const firstLine = lines[0];
    const delimiter = firstLine.includes(';') ? ';' : ',';

    const headers = firstLine.split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(delimiter).map(v => v.trim().replace(/^["']|["']$/g, ''));
      if (values.length === headers.length) {
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        rows.push(row);
      }
    }

    return { headers, rows };
  };

  const parseExcel = (buffer: ArrayBuffer): { headers: string[]; rows: Record<string, string>[] } => {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
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
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-import-helper`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'map_columns',
          headers: csvHeaders,
          targetFields: fields,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'AI mapping failed');
      }

      const data = await response.json();
      if (data.result?.mappings) {
        setAiMapping(data.result.mappings);
        toast.success('KI hat Spalten automatisch zugeordnet');
      }
    } catch (err) {
      console.error('AI mapping error:', err);
      toast.error('KI-Zuordnung fehlgeschlagen, verwende Standard-Zuordnung');
    } finally {
      setIsAIProcessing(false);
      setAiStatus(null);
    }
  };

  const runAIDataCleaning = async (data: Record<string, string>[]): Promise<Record<string, string>[]> => {
    setAiStatus('KI bereinigt Daten...');
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-import-helper`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'clean_data',
          data: data.slice(0, 20), // Limit to prevent timeout
        }),
      });

      if (!response.ok) {
        throw new Error('AI cleaning failed');
      }

      const result = await response.json();
      if (Array.isArray(result.result)) {
        // Merge cleaned data with original
        const cleanedMap = new Map<number, Record<string, string>>(
          result.result.map((item: Record<string, string>, i: number) => [i, item])
        );
        return data.map((row, i) => {
          const cleaned = cleanedMap.get(i);
          return cleaned ? { ...row, ...cleaned } : row;
        });
      }
    } catch (err) {
      console.error('AI cleaning error:', err);
    }
    
    return data;
  };

  const runAICategorization = async (data: Record<string, string>[]): Promise<Record<string, string>[]> => {
    setAiStatus('KI kategorisiert Artikel...');
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-import-helper`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'categorize',
          data: data.slice(0, 50),
        }),
      });

      if (!response.ok) {
        throw new Error('AI categorization failed');
      }

      const result = await response.json();
      if (Array.isArray(result.result)) {
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
    } catch (err) {
      console.error('AI categorization error:', err);
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
      } catch (err) {
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
      
      console.log('Import START - parsedData sample:', JSON.stringify(parsedData.slice(0, 2)));
      console.log('Import START - parsedData keys:', Object.keys(parsedData[0] || {}));

      // Run AI data cleaning if enabled
      if (useAI && enableAI) {
        console.log('Before AI cleaning:', JSON.stringify(dataToImport.slice(0, 2)));
        dataToImport = await runAIDataCleaning(dataToImport);
        console.log('After AI cleaning:', JSON.stringify(dataToImport.slice(0, 2)));
        
        // Run AI categorization for articles (if category field exists)
        const hasCategory = fields.some(f => f.name === 'category');
        if (hasCategory) {
          dataToImport = await runAICategorization(dataToImport);
          console.log('After AI categorization:', JSON.stringify(dataToImport.slice(0, 2)));
        }
      }

      setAiStatus(null);

      // Extract headers directly from data (in case state headers are empty)
      const effectiveHeaders = headers.length > 0 ? headers : Object.keys(dataToImport[0] || {});
      
      console.log('Import - Effective headers:', effectiveHeaders);
      console.log('Import - Raw data sample:', dataToImport.slice(0, 2));

      // Common column name aliases (German -> English field names)
      const columnAliases: Record<string, string[]> = {
        name: ['name', 'artikelname', 'artikel', 'produkt', 'bezeichnung', 'produktname', 'article', 'product', 'deutsche bezeichnung', 'deutschebezeichnung'],
        price: ['price', 'preis', 'vk', 'ek', 'einzelpreis', 'verkaufspreis', 'einkaufspreis', 'betrag'],
        unit: ['unit', 'einheit', 'me', 'mengeneinheit'],
        sku: ['sku', 'artikelnummer', 'artnr', 'art.nr.', 'artikelnr', 'nummer', 'produktnummer'],
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

      console.log('Import - Mapped data sample:', mappedData.slice(0, 3));

      await onImport(mappedData, selectedSupplierId || undefined);
      setImportSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        resetState();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
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
