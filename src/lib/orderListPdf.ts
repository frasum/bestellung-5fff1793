import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { loadNotoSansThaiFont } from './fonts/loadNotoSansThai';

interface OrderListArticle {
  name: string;
  unit: string;
  sku?: string | null;
  description?: string | null;
  lastOrderQuantity?: number;
  lastOrderDate?: string;
}

interface OrderListSupplier {
  id: string;
  name: string;
}

// Helper to register Thai-compatible font
const registerThaiFont = async (doc: jsPDF) => {
  try {
    const fontBase64 = await loadNotoSansThaiFont();
    doc.addFileToVFS('NotoSansThai-Regular.ttf', fontBase64);
    doc.addFont('NotoSansThai-Regular.ttf', 'NotoSansThai', 'normal');
    return true;
  } catch (error) {
    console.error('Could not load Thai font, falling back to Helvetica:', error);
    return false;
  }
};

export const generateOrderListPdf = async (
  supplier: OrderListSupplier,
  articles: OrderListArticle[]
) => {
  const doc = new jsPDF();
  const today = format(new Date(), 'dd.MM.yyyy', { locale: de });
  
  // Register Thai font
  const hasThai = await registerThaiFont(doc);
  const fontName = hasThai ? 'NotoSansThai' : 'helvetica';
  
  // Header
  doc.setFontSize(20);
  doc.setFont(fontName, 'normal');
  doc.text(`Bestellliste - ${supplier.name}`, 14, 20);
  
  // Date
  doc.setFontSize(11);
  doc.text(`Datum: ${today}`, 14, 30);
  
  // Supplier info
  doc.text(`Lieferant: ${supplier.name}`, 14, 38);
  
  // Article count
  doc.text(`Artikel: ${articles.length}`, 14, 46);
  
  // Table with articles - empty columns for quantity and notes
  const formatLastOrder = (article: OrderListArticle) => {
    if (article.lastOrderQuantity == null) return '–';
    const qty = String(article.lastOrderQuantity);
    if (article.lastOrderDate) {
      const dateStr = format(new Date(article.lastOrderDate), 'dd.MM.', { locale: de });
      return `${qty} (${dateStr})`;
    }
    return qty;
  };

  const formatArticleName = (article: OrderListArticle) => {
    let name = article.sku ? `${article.name} (${article.sku})` : article.name;
    if (article.description) {
      name += `\n${article.description}`;
    }
    return name;
  };

  const tableData = articles.map((article) => [
    formatArticleName(article),
    article.unit,
    formatLastOrder(article),
    '', // Menge (quantity) - empty for filling in
    '', // Notiz (notes) - empty for filling in
  ]);

  autoTable(doc, {
    head: [['Artikel', 'Einheit', 'Letzte', 'Menge', 'Notiz']],
    body: tableData,
    startY: 54,
    styles: {
      fontSize: 10,
      cellPadding: 4,
      lineColor: [200, 200, 200],
      lineWidth: 0.5,
      font: fontName,
    },
    headStyles: {
      fillColor: [80, 80, 80],
      textColor: 255,
      fontStyle: 'normal',
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 22 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 35 },
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
  });

  // Add page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(
      `Seite ${i} von ${pageCount}`,
      doc.internal.pageSize.width - 30,
      doc.internal.pageSize.height - 10
    );
  }

  // Save the file
  const filename = `Bestellliste_${supplier.name.replace(/[^a-zA-Z0-9]/g, '_')}_${format(new Date(), 'dd-MM-yyyy')}.pdf`;
  doc.save(filename);
};

// Compact combined order list for multiple suppliers
export const generateCombinedOrderListPdf = async (
  suppliers: OrderListSupplier[],
  articlesBySupplier: Record<string, OrderListArticle[]>
) => {
  const doc = new jsPDF();
  const today = format(new Date(), 'dd.MM.yyyy', { locale: de });
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Register Thai font
  const hasThai = await registerThaiFont(doc);
  const fontName = hasThai ? 'NotoSansThai' : 'helvetica';
  
  let currentY = 15;
  
  suppliers.forEach((supplier, supplierIndex) => {
    const articles = articlesBySupplier[supplier.id] || [];
    if (articles.length === 0) return;
    
    // Calculate estimated table height: ~8pt per row + 20pt for header
    const estimatedTableHeight = articles.length * 8 + 20;
    const remainingSpace = pageHeight - currentY - 20; // 20pt bottom margin
    
    // If supplier table won't fit completely on current page, start new page
    if (estimatedTableHeight > remainingSpace && supplierIndex > 0) {
      doc.addPage();
      currentY = 15;
    }
    
    // Compact supplier header
    doc.setFontSize(11);
    doc.setFont(fontName, 'normal');
    doc.setTextColor(0);
    doc.text(supplier.name, 10, currentY);
    
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`${articles.length} Artikel`, pageWidth - 10, currentY, { align: 'right' });
    
    currentY += 3;
    
    // Compact table
    const formatLastOrder = (article: OrderListArticle) => {
      if (article.lastOrderQuantity == null) return '–';
      const qty = String(article.lastOrderQuantity);
      if (article.lastOrderDate) {
        const dateStr = format(new Date(article.lastOrderDate), 'dd.MM.', { locale: de });
        return `${qty} (${dateStr})`;
      }
      return qty;
    };

    const formatArticleName = (article: OrderListArticle) => {
      let name = article.sku ? `${article.name} (${article.sku})` : article.name;
      if (article.description) {
        name += `\n${article.description}`;
      }
      return name;
    };

    const tableData = articles.map((article) => [
      formatArticleName(article),
      article.unit,
      formatLastOrder(article),
      '', // Menge
    ]);

    autoTable(doc, {
      head: [['Artikel', 'Einh.', 'Letzte', 'Menge']],
      body: tableData,
      startY: currentY,
      margin: { left: 10, right: 10 },
      styles: {
        fontSize: 8,
        cellPadding: 2,
        lineColor: [180, 180, 180],
        lineWidth: 0.3,
        overflow: 'linebreak',
        font: fontName,
      },
      headStyles: {
        fillColor: [60, 60, 60],
        textColor: 255,
        fontStyle: 'normal',
        fontSize: 7,
        cellPadding: 1.5,
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 15, halign: 'center' },
        2: { cellWidth: 18, halign: 'center' },
        3: { cellWidth: 20, halign: 'center' },
      },
      alternateRowStyles: {
        fillColor: [248, 248, 248],
      },
      didDrawPage: () => {
        // Reset for next supplier section on new page
      },
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 10;
  });
  
  // Add page numbers and date
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(128);
    doc.text(today, 10, pageHeight - 8);
    doc.text(`Seite ${i}/${pageCount}`, pageWidth - 10, pageHeight - 8, { align: 'right' });
  }

  const filename = `Bestelllisten_${format(new Date(), 'dd-MM-yyyy')}.pdf`;
  doc.save(filename);
};
