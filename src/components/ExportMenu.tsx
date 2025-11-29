import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText, File } from 'lucide-react';
import { ExportFormat, exportData } from '@/lib/export';
import { toast } from 'sonner';

interface ExportMenuProps {
  filename: string;
  title: string;
  headers: string[];
  getData: () => (string | number)[][];
  disabled?: boolean;
}

export const ExportMenu = ({ filename, title, headers, getData, disabled }: ExportMenuProps) => {
  const handleExport = (format: ExportFormat) => {
    try {
      const data = getData();
      if (data.length === 0) {
        toast.error('No data to export');
        return;
      }
      exportData(format, { filename, title, headers, data });
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Export failed');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-card border border-border">
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileText className="w-4 h-4 mr-2" />
          CSV (.csv)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('excel')}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          <File className="w-4 h-4 mr-2" />
          PDF (.pdf)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
