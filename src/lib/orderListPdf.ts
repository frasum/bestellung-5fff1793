import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { loadNotoSansFont, loadNotoSansThaiFont } from './fonts/loadNotoSansThai';

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

// Check if text contains Thai characters (Unicode range U+0E00–U+0E7F)
const containsThai = (text: string): boolean => /[\u0E00-\u0E7F]/.test(text);

// Helper to register both fonts (Latin + Thai)
const registerFonts = async (doc: jsPDF) => {
  try {
    const [latinFont, thaiFont] = await Promise.all([
      loadNotoSansFont(),
      loadNotoSansThaiFont()
    ]);
    
    doc.addFileToVFS('NotoSans-Regular.ttf', latinFont);
    doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');
    
    doc.addFileToVFS('NotoSansThai-Regular.ttf', thaiFont);
    doc.addFont('NotoSansThai-Regular.ttf', 'NotoSansThai', 'normal');
    
    return true;
  } catch (error) {
    console.error('Could not load fonts, falling back to Helvetica:', error);
    return false;
  }
};

export const generateOrderListPdf = async (
  supplier: OrderListSupplier,
  articles: OrderListArticle[]
) => {
  const doc = new jsPDF();
  const today = format(new Date(), 'dd.MM.yyyy', { locale: de });
  
  // Register both fonts (Latin + Thai)
  const hasFonts = await registerFonts(doc);
  const defaultFont = hasFonts ? 'NotoSans' : 'helvetica';
  
  // Header
  doc.setFontSize(20);
  doc.setFont(defaultFont, 'normal');
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
    return article.sku ? `${article.name} (${article.sku})` : article.name;
  };

  // Build table data with separate rows for Thai descriptions
  const tableData: (string | { content: string; colSpan?: number; styles?: any })[][] = [];
  
  articles.forEach((article) => {
    // Main row with article name (Latin)
    tableData.push([
      formatArticleName(article),
      article.unit,
      formatLastOrder(article),
      '', // Menge (quantity) - empty for filling in
      '', // Notiz (notes) - empty for filling in
    ]);
    
    // Add description row if it contains Thai characters
    if (article.description && containsThai(article.description)) {
      tableData.push([
        { content: article.description, colSpan: 5, styles: { fontStyle: 'italic', textColor: [100, 100, 100], cellPadding: { top: 0, bottom: 3, left: 8, right: 4 } } },
      ]);
    }
  });

  autoTable(doc, {
    head: [['Artikel', 'Einheit', 'Letzte', 'Menge', 'Notiz']],
    body: tableData,
    startY: 54,
    styles: {
      fontSize: 10,
      cellPadding: 4,
      lineColor: [200, 200, 200],
      lineWidth: 0.5,
      font: defaultFont,
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
    willDrawCell: (data) => {
      if (hasFonts && data.cell.text) {
        const cellText = Array.isArray(data.cell.text) ? data.cell.text.join('') : String(data.cell.text);
        if (containsThai(cellText)) {
          doc.setFont('NotoSansThai', 'normal');
        } else {
          doc.setFont('NotoSans', 'normal');
        }
      }
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
  
  // Register both fonts (Latin + Thai)
  const hasFonts = await registerFonts(doc);
  const defaultFont = hasFonts ? 'NotoSans' : 'helvetica';
  
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
    doc.setFont(defaultFont, 'normal');
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
      return article.sku ? `${article.name} (${article.sku})` : article.name;
    };

    // Build table data with separate rows for Thai descriptions
    const tableData: (string | { content: string; colSpan?: number; styles?: any })[][] = [];
    
    articles.forEach((article) => {
      // Main row with article name (Latin)
      tableData.push([
        formatArticleName(article),
        article.unit,
        formatLastOrder(article),
        '', // Menge
      ]);
      
      // Add description row if it contains Thai characters
      if (article.description && containsThai(article.description)) {
        tableData.push([
          { content: article.description, colSpan: 4, styles: { fontStyle: 'italic', textColor: [100, 100, 100], cellPadding: { top: 0, bottom: 2, left: 6, right: 2 }, fontSize: 7 } },
        ]);
      }
    });

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
        font: defaultFont,
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
      willDrawCell: (data) => {
        if (hasFonts && data.cell.text) {
          const cellText = Array.isArray(data.cell.text) ? data.cell.text.join('') : String(data.cell.text);
          if (containsThai(cellText)) {
            doc.setFont('NotoSansThai', 'normal');
          } else {
            doc.setFont('NotoSans', 'normal');
          }
        }
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
