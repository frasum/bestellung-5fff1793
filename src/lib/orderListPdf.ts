import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface OrderListArticle {
  name: string;
  unit: string;
  sku?: string | null;
}

interface OrderListSupplier {
  id: string;
  name: string;
}

export const generateOrderListPdf = (
  supplier: OrderListSupplier,
  articles: OrderListArticle[]
) => {
  const doc = new jsPDF();
  const today = format(new Date(), 'dd.MM.yyyy', { locale: de });
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(`Bestellliste - ${supplier.name}`, 14, 20);
  
  // Date
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Datum: ${today}`, 14, 30);
  
  // Supplier info
  doc.text(`Lieferant: ${supplier.name}`, 14, 38);
  
  // Article count
  doc.text(`Artikel: ${articles.length}`, 14, 46);
  
  // Table with articles - empty columns for quantity and notes
  const tableData = articles.map((article) => [
    article.sku ? `${article.name} (${article.sku})` : article.name,
    article.unit,
    '', // Menge (quantity) - empty for filling in
    '', // Notiz (notes) - empty for filling in
  ]);

  autoTable(doc, {
    head: [['Artikel', 'Einheit', 'Menge', 'Notiz']],
    body: tableData,
    startY: 54,
    styles: {
      fontSize: 10,
      cellPadding: 4,
      lineColor: [200, 200, 200],
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: [80, 80, 80],
      textColor: 255,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 25 },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 40 },
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
  });

  // Get the final Y position after the table
  const finalY = (doc as any).lastAutoTable.finalY || 200;
  
  // Footer with signature fields
  const pageHeight = doc.internal.pageSize.height;
  const footerY = Math.min(finalY + 30, pageHeight - 40);
  
  doc.setFontSize(10);
  doc.text('Datum: _______________________', 14, footerY);
  doc.text('Unterschrift: _______________________', 14, footerY + 10);

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
export const generateCombinedOrderListPdf = (
  suppliers: OrderListSupplier[],
  articlesBySupplier: Record<string, OrderListArticle[]>
) => {
  const doc = new jsPDF();
  const today = format(new Date(), 'dd.MM.yyyy', { locale: de });
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  let currentY = 15;
  
  suppliers.forEach((supplier, supplierIndex) => {
    const articles = articlesBySupplier[supplier.id] || [];
    if (articles.length === 0) return;
    
    // Check if we need a new page (minimum 60pt for header + few rows)
    if (currentY > pageHeight - 80 && supplierIndex > 0) {
      doc.addPage();
      currentY = 15;
    }
    
    // Compact supplier header
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text(supplier.name, 10, currentY);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`${articles.length} Artikel`, pageWidth - 10, currentY, { align: 'right' });
    
    currentY += 3;
    
    // Compact table
    const tableData = articles.map((article) => [
      article.sku ? `${article.name} (${article.sku})` : article.name,
      article.unit,
      '', // Menge
    ]);

    autoTable(doc, {
      head: [['Artikel', 'Einh.', 'Menge']],
      body: tableData,
      startY: currentY,
      margin: { left: 10, right: 10 },
      styles: {
        fontSize: 8,
        cellPadding: 2,
        lineColor: [180, 180, 180],
        lineWidth: 0.3,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [60, 60, 60],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 7,
        cellPadding: 1.5,
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 18, halign: 'center' },
        2: { cellWidth: 22, halign: 'center' },
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
