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
  const tableData = articles.map((article, index) => [
    '', // Nr. - leave empty for manual numbering
    article.sku ? `${article.name} (${article.sku})` : article.name,
    article.unit,
    '', // Menge (quantity) - empty for filling in
    '', // Notiz (notes) - empty for filling in
  ]);

  autoTable(doc, {
    head: [['Nr.', 'Artikel', 'Einheit', 'Menge', 'Notiz']],
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
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 25 },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 40 },
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
