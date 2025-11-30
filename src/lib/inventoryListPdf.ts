import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Article {
  id: string;
  name: string;
  unit: string;
  sku?: string | null;
  supplier?: {
    id: string;
    name: string;
  };
}

interface InventoryItem {
  article_id: string;
  storage_1: number;
  storage_2: number;
  total: number;
}

export const generateInventoryListPdf = (
  articles: Article[],
  supplierName?: string,
  existingItems?: Map<string, InventoryItem>
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const today = format(new Date(), 'dd.MM.yyyy', { locale: de });

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Inventur-Liste', pageWidth / 2, 20, { align: 'center' });

  // Date
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(today, pageWidth / 2, 28, { align: 'center' });

  // Filter info
  if (supplierName) {
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Lieferant: ${supplierName}`, 14, 38);
    doc.setTextColor(0);
  }

  // Article count
  doc.setFontSize(10);
  doc.text(`${articles.length} Artikel`, pageWidth - 14, 38, { align: 'right' });

  // Table data
  const tableData = articles.map((article, index) => {
    const existingItem = existingItems?.get(article.id);
    return [
      (index + 1).toString(),
      article.name,
      article.unit,
      existingItem ? existingItem.storage_1.toString() : '',
      existingItem ? existingItem.storage_2.toString() : '',
      existingItem ? existingItem.total.toString() : '',
    ];
  });

  // Generate table
  autoTable(doc, {
    startY: 45,
    head: [['Nr.', 'Artikel', 'Einheit', 'Lager 1', 'Lager 2', 'Gesamt']],
    body: tableData,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [70, 70, 70],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 25 },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 25, halign: 'right' },
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    didDrawPage: (data) => {
      // Footer on each page
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Seite ${data.pageNumber} von ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    },
  });

  // Signature section at the end
  const finalY = (doc as any).lastAutoTable.finalY || 200;
  const remainingSpace = doc.internal.pageSize.height - finalY;

  if (remainingSpace > 50) {
    doc.setDrawColor(200);
    doc.line(14, finalY + 30, 80, finalY + 30);
    doc.line(pageWidth - 80, finalY + 30, pageWidth - 14, finalY + 30);

    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text('Datum', 14, finalY + 36);
    doc.text('Unterschrift', pageWidth - 80, finalY + 36);
  }

  // Download
  const filename = supplierName
    ? `Inventur-Liste_${supplierName}_${format(new Date(), 'dd-MM-yyyy')}.pdf`
    : `Inventur-Liste_${format(new Date(), 'dd-MM-yyyy')}.pdf`;

  doc.save(filename);
};

export const exportInventoryToExcel = async (
  articles: Article[],
  inventoryItems: Map<string, InventoryItem>,
  supplierName?: string
) => {
  const XLSX = await import('xlsx');
  
  const data = articles.map((article, index) => {
    const item = inventoryItems.get(article.id);
    return {
      'Nr.': index + 1,
      'Artikel': article.name,
      'Artikelnummer': article.sku || '',
      'Lieferant': article.supplier?.name || '',
      'Einheit': article.unit,
      'Lager 1': item?.storage_1 || 0,
      'Lager 2': item?.storage_2 || 0,
      'Gesamt': item?.total || 0,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventur');

  const filename = supplierName
    ? `Inventur_${supplierName}_${format(new Date(), 'dd-MM-yyyy')}.xlsx`
    : `Inventur_${format(new Date(), 'dd-MM-yyyy')}.xlsx`;

  XLSX.writeFile(workbook, filename);
};
