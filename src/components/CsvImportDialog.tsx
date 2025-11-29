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
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2, Download } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';

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

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fields: ImportField[];
  onImport: (data: Record<string, string>[]) => Promise<void>;
  templateFileName: string;
}

export const CsvImportDialog = ({
  open,
  onOpenChange,
  title,
  fields,
  onImport,
  templateFileName,
}: CsvImportDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  const resetState = () => {
    setFile(null);
    setParsedData([]);
    setHeaders([]);
    setError(null);
    setImportSuccess(false);
  };

  const parseCSV = (text: string): { headers: string[]; rows: Record<string, string>[] } => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) throw new Error('CSV file is empty');

    // Detect delimiter (comma or semicolon)
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

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError(null);
    setImportSuccess(false);

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const { headers, rows } = parseCSV(text);
        
        // Validate required fields exist in headers
        const missingFields = fields
          .filter(f => f.required)
          .filter(f => !headers.some(h => h.toLowerCase() === f.name.toLowerCase()));

        if (missingFields.length > 0) {
          setError(`Missing required columns: ${missingFields.map(f => f.label).join(', ')}`);
          return;
        }

        setFile(selectedFile);
        setHeaders(headers);
        setParsedData(rows);
      } catch (err) {
        setError('Failed to parse CSV file. Please check the format.');
      }
    };
    reader.readAsText(selectedFile);
  }, [fields]);

  const handleImport = async () => {
    if (parsedData.length === 0) return;

    setIsImporting(true);
    setError(null);

    try {
      // Map CSV data to field names (case-insensitive matching)
      const mappedData = parsedData.map(row => {
        const mapped: Record<string, string> = {};
        fields.forEach(field => {
          const header = headers.find(h => h.toLowerCase() === field.name.toLowerCase());
          if (header) {
            mapped[field.name] = row[header] || '';
          }
        });
        return mapped;
      });

      await onImport(mappedData);
      setImportSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        resetState();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const headers = fields.map(f => f.name).join(',');
    const example = fields.map(f => f.required ? `Example ${f.label}` : '').join(',');
    const csv = `${headers}\n${example}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = templateFileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetState();
    }}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import multiple records at once
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
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
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground">Click to upload CSV</p>
              <p className="text-xs text-muted-foreground mt-1">
                Required columns: {fields.filter(f => f.required).map(f => f.label).join(', ')}
              </p>
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
                          {header}
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
              <Button className="flex-1" onClick={handleImport} disabled={isImporting}>
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  `Import ${parsedData.length} Records`
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
