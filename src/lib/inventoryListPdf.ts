import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Article {
  id: string;
  name: string;
  unit: string;
  sku?: string | null;
  category?: string | null;
  price?: number;
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
  unit_price?: number | null;
}

interface CategoryGroup {
  category: string;
  articles: Array<{
    article: Article;
    item?: InventoryItem;
  }>;
  totalQuantity: number;
  totalValue: number;
}

const groupByCategory = (
  articles: Article[],
  existingItems?: Map<string, InventoryItem>
): CategoryGroup[] => {
  const groups = new Map<string, CategoryGroup>();
  
  articles.forEach((article) => {
    const category = article.category || 'Ohne Kategorie';
    const item = existingItems?.get(article.id);
    const quantity = item ? item.total : 0;
    const unitPrice = item?.unit_price ?? article.price ?? 0;
    const value = quantity * unitPrice;
    
    if (!groups.has(category)) {
      groups.set(category, {
        category,
        articles: [],
        totalQuantity: 0,
        totalValue: 0,
      });
    }
    
    const group = groups.get(category)!;
    group.articles.push({ article, item });
    group.totalQuantity += quantity;
    group.totalValue += value;
  });
  
  // Sort categories alphabetically, but put "Ohne Kategorie" last
  return Array.from(groups.values()).sort((a, b) => {
    if (a.category === 'Ohne Kategorie') return 1;
    if (b.category === 'Ohne Kategorie') return -1;
    return a.category.localeCompare(b.category, 'de');
  });
};

const formatCurrency = (value: number): string => {
  return `€${value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

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

  // Group articles by category
  const categoryGroups = groupByCategory(articles, existingItems);
  
  let currentY = 45;
  let grandTotalQuantity = 0;
  let grandTotalValue = 0;

  categoryGroups.forEach((group, groupIndex) => {
    // Check if we need a new page
    if (currentY > doc.internal.pageSize.height - 60) {
      doc.addPage();
      currentY = 20;
    }

    // Category header
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(240, 240, 240);
    doc.rect(14, currentY - 5, pageWidth - 28, 8, 'F');
    doc.text(group.category, 16, currentY);
    currentY += 8;

    // Table data for this category
    const tableData = group.articles.map(({ article, item }) => {
      const quantity = item ? item.total : 0;
      const unitPrice = item?.unit_price ?? article.price ?? 0;
      const value = quantity * unitPrice;
      return [
        article.name,
        article.unit,
        item ? item.storage_1.toString() : '',
        item ? item.storage_2.toString() : '',
        item ? item.total.toString() : '',
        item ? formatCurrency(value) : '',
      ];
    });

    // Generate table for this category
    autoTable(doc, {
      startY: currentY,
      head: [['Artikel', 'Einheit', 'Lager 1', 'Lager 2', 'Gesamt', 'Wert']],
      body: tableData,
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [70, 70, 70],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 20 },
        2: { cellWidth: 18, halign: 'right' },
        3: { cellWidth: 18, halign: 'right' },
        4: { cellWidth: 18, halign: 'right' },
        5: { cellWidth: 25, halign: 'right' },
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
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
        doc.setTextColor(0);
      },
    });

    // Get the final Y position after the table
    currentY = doc.lastAutoTable?.finalY + 2 || currentY + 50;

    // Category subtotal
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(245, 245, 245);
    doc.rect(14, currentY - 3, pageWidth - 28, 7, 'F');
    doc.text(
      `Zwischensumme: ${group.articles.length} Artikel · ${formatCurrency(group.totalValue)}`,
      pageWidth - 16,
      currentY + 1,
      { align: 'right' }
    );
    currentY += 12;

    grandTotalQuantity += group.articles.length;
    grandTotalValue += group.totalValue;
  });

  // Grand total at the end
  if (currentY > doc.internal.pageSize.height - 30) {
    doc.addPage();
    currentY = 20;
  }

  doc.setDrawColor(70, 70, 70);
  doc.setLineWidth(0.5);
  doc.line(14, currentY, pageWidth - 14, currentY);
  currentY += 8;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `GESAMTSUMME: ${grandTotalQuantity} Artikel · Inventurwert: ${formatCurrency(grandTotalValue)}`,
    pageWidth / 2,
    currentY,
    { align: 'center' }
  );

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
  
  // Group articles by category
  const categoryGroups = groupByCategory(articles, inventoryItems);
  
  const data: Record<string, string | number>[] = [];
  let grandTotalQuantity = 0;
  let grandTotalValue = 0;

  categoryGroups.forEach((group, groupIndex) => {
    // Add empty row between categories (except first)
    if (groupIndex > 0) {
      data.push({});
    }

    // Category header row
    data.push({
      'Artikel': group.category,
      'Artikelnummer': '',
      'Lieferant': '',
      'Einheit': '',
      'Lager 1': '',
      'Lager 2': '',
      'Gesamt': '',
      'Wert': '',
    });

    // Article rows
    group.articles.forEach(({ article, item }) => {
      const quantity = item?.total || 0;
      const unitPrice = item?.unit_price ?? article.price ?? 0;
      const value = quantity * unitPrice;

      data.push({
        'Artikel': article.name,
        'Artikelnummer': article.sku || '',
        'Lieferant': article.supplier?.name || '',
        'Einheit': article.unit,
        'Lager 1': item?.storage_1 || 0,
        'Lager 2': item?.storage_2 || 0,
        'Gesamt': quantity,
        'Wert': value,
      });
    });

    // Category subtotal row
    data.push({
      'Artikel': 'Zwischensumme',
      'Artikelnummer': '',
      'Lieferant': '',
      'Einheit': '',
      'Lager 1': '',
      'Lager 2': '',
      'Gesamt': group.totalQuantity,
      'Wert': group.totalValue,
    });

    grandTotalQuantity += group.articles.length;
    grandTotalValue += group.totalValue;
  });

  // Grand total row
  data.push({});
  data.push({
    'Artikel': 'GESAMTSUMME',
    'Artikelnummer': '',
    'Lieferant': '',
    'Einheit': '',
    'Lager 1': '',
    'Lager 2': '',
    'Gesamt': grandTotalQuantity + ' Artikel',
    'Wert': grandTotalValue,
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 35 }, // Artikel
    { wch: 15 }, // Artikelnummer
    { wch: 20 }, // Lieferant
    { wch: 10 }, // Einheit
    { wch: 10 }, // Lager 1
    { wch: 10 }, // Lager 2
    { wch: 10 }, // Gesamt
    { wch: 12 }, // Wert
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventur');

  const filename = supplierName
    ? `Inventur_${supplierName}_${format(new Date(), 'dd-MM-yyyy')}.xlsx`
    : `Inventur_${format(new Date(), 'dd-MM-yyyy')}.xlsx`;

  XLSX.writeFile(workbook, filename);
};
