import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export type ExportFormat = 'csv' | 'excel' | 'pdf';

interface ExportOptions {
  filename: string;
  title?: string;
  headers: string[];
  data: (string | number)[][];
}

export const exportToCSV = ({ filename, headers, data }: ExportOptions) => {
  const csvContent = [
    headers.join(';'),
    ...data.map(row => row.map(cell => `"${cell}"`).join(';'))
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
};

export const exportToExcel = ({ filename, headers, data, title }: ExportOptions) => {
  const worksheetData = [headers, ...data];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // Set column widths
  const colWidths = headers.map((_, i) => ({
    wch: Math.max(
      headers[i].length,
      ...data.map(row => String(row[i] || '').length)
    ) + 2
  }));
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, title || 'Data');
  
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const exportToPDF = ({ filename, title, headers, data }: ExportOptions) => {
  const doc = new jsPDF();
  
  // Add title
  if (title) {
    doc.setFontSize(16);
    doc.text(title, 14, 20);
  }

  // Add table
  autoTable(doc, {
    head: [headers],
    body: data,
    startY: title ? 30 : 20,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
  });

  // Add footer with date
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(
      `Generated on ${new Date().toLocaleDateString('de-DE')} - Page ${i} of ${pageCount}`,
      14,
      doc.internal.pageSize.height - 10
    );
  }

  doc.save(`${filename}.pdf`);
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportData = (format: ExportFormat, options: ExportOptions) => {
  switch (format) {
    case 'csv':
      exportToCSV(options);
      break;
    case 'excel':
      exportToExcel(options);
      break;
    case 'pdf':
      exportToPDF(options);
      break;
  }
};
