import jsPDF from 'jspdf';
import { loadNotoSansFont } from './fonts/loadNotoSansThai';

interface WineArticle {
  id: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  origin_country?: string | null;
  grape_variety?: string | null;
  flavor_profile?: string | null;
  food_pairings?: string | null;
  selling_price?: number | null;
  category?: string | null;
  supplier?: { name: string } | null;
  supplier_id: string;
}

interface Supplier {
  id: string;
  name: string;
}

// Wine-themed colors
const COLORS = {
  wineRed: [114, 47, 55] as [number, number, number],      // #722F37
  darkWine: [74, 28, 38] as [number, number, number],       // #4A1C26
  gold: [184, 134, 11] as [number, number, number],         // #B8860B
  lightGold: [218, 165, 32] as [number, number, number],    // #DAA520
  textDark: [33, 33, 33] as [number, number, number],       // #212121
  textMuted: [117, 117, 117] as [number, number, number],   // #757575
  bgLight: [250, 248, 245] as [number, number, number],     // #FAF8F5
  white: [255, 255, 255] as [number, number, number],
  border: [224, 224, 224] as [number, number, number],
};

const formatPrice = (price: number | null | undefined): string => {
  if (price == null) return '–';
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
};

const loadImageAsBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

export const generateWineCatalogPdf = async (
  wines: WineArticle[],
  suppliers: Supplier[],
  restaurantName?: string,
  onProgress?: (current: number, total: number) => void
): Promise<void> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Load custom font for better character support
  try {
    const fontBase64 = await loadNotoSansFont();
    doc.addFileToVFS('NotoSans-Regular.ttf', fontBase64);
    doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');
    doc.setFont('NotoSans');
  } catch {
    doc.setFont('helvetica');
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Group wines by supplier
  const winesBySupplier: Record<string, WineArticle[]> = {};
  wines.forEach((wine) => {
    if (!winesBySupplier[wine.supplier_id]) {
      winesBySupplier[wine.supplier_id] = [];
    }
    winesBySupplier[wine.supplier_id].push(wine);
  });

  // Sort wines within each supplier
  Object.keys(winesBySupplier).forEach((supplierId) => {
    winesBySupplier[supplierId].sort((a, b) => a.name.localeCompare(b.name));
  });

  const supplierIds = Object.keys(winesBySupplier);
  const supplierMap = new Map(suppliers.map((s) => [s.id, s]));

  // ============ COVER PAGE ============
  // Background gradient effect (simulated with rectangles)
  doc.setFillColor(...COLORS.darkWine);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Decorative elements
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.5);
  doc.rect(margin - 5, margin - 5, contentWidth + 10, pageHeight - margin * 2 + 10);
  
  // Wine glass icon area (decorative circle)
  const centerX = pageWidth / 2;
  doc.setFillColor(...COLORS.gold);
  doc.circle(centerX, 60, 15, 'F');
  
  // Wine glass text symbol
  doc.setTextColor(...COLORS.darkWine);
  doc.setFontSize(24);
  doc.text('🍷', centerX, 64, { align: 'center' });
  
  // Title
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(36);
  doc.text('WEINKATALOG', centerX, 100, { align: 'center' });
  
  // Decorative line
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(1);
  doc.line(centerX - 40, 110, centerX + 40, 110);
  
  // Restaurant name
  if (restaurantName) {
    doc.setFontSize(18);
    doc.setTextColor(...COLORS.lightGold);
    doc.text(restaurantName, centerX, 130, { align: 'center' });
  }
  
  // Date
  const today = new Date();
  const dateStr = today.toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.white);
  doc.text(`Stand: ${dateStr}`, centerX, 150, { align: 'center' });
  
  // Stats
  doc.setFontSize(14);
  doc.text(
    `${wines.length} Weine · ${supplierIds.length} Lieferanten`,
    centerX,
    170,
    { align: 'center' }
  );

  // Footer on cover
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.textMuted);
  doc.text('Erstellt mit Bestellung.pro', centerX, pageHeight - margin, { align: 'center' });

  // ============ WINE PAGES ============
  let currentY = margin;
  let wineIndex = 0;
  const totalWines = wines.length;
  const wineHeight = 90; // Height per wine card

  for (const supplierId of supplierIds) {
    const supplierWines = winesBySupplier[supplierId];
    const supplier = supplierMap.get(supplierId);
    const supplierName = supplier?.name || 'Unbekannter Lieferant';

    // Start new page for each supplier
    doc.addPage();
    currentY = margin;

    // Supplier header
    doc.setFillColor(...COLORS.wineRed);
    doc.rect(margin, currentY, contentWidth, 12, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(14);
    doc.text(`🍷 ${supplierName.toUpperCase()}`, margin + 5, currentY + 8);
    
    doc.setFontSize(10);
    doc.text(
      `${supplierWines.length} ${supplierWines.length === 1 ? 'Wein' : 'Weine'}`,
      pageWidth - margin - 5,
      currentY + 8,
      { align: 'right' }
    );
    
    currentY += 20;

    // Render wines for this supplier
    for (const wine of supplierWines) {
      wineIndex++;
      onProgress?.(wineIndex, totalWines);

      // Check if we need a new page
      if (currentY + wineHeight > pageHeight - margin - 15) {
        doc.addPage();
        currentY = margin;
        
        // Repeat supplier header on new page
        doc.setFillColor(...COLORS.wineRed);
        doc.rect(margin, currentY, contentWidth, 10, 'F');
        doc.setTextColor(...COLORS.white);
        doc.setFontSize(12);
        doc.text(`🍷 ${supplierName} (Fortsetzung)`, margin + 5, currentY + 7);
        currentY += 18;
      }

      // Wine card background
      doc.setFillColor(...COLORS.bgLight);
      doc.setDrawColor(...COLORS.border);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, currentY, contentWidth, wineHeight - 5, 3, 3, 'FD');

      const imageWidth = 35;
      const textStartX = margin + imageWidth + 8;
      const textWidth = contentWidth - imageWidth - 15;

      // Try to load and embed wine image
      if (wine.image_url) {
        try {
          const imgData = await loadImageAsBase64(wine.image_url);
          if (imgData) {
            doc.addImage(imgData, 'JPEG', margin + 3, currentY + 3, imageWidth - 6, wineHeight - 11);
          } else {
            // Placeholder for missing image
            doc.setFillColor(...COLORS.border);
            doc.rect(margin + 3, currentY + 3, imageWidth - 6, wineHeight - 11, 'F');
            doc.setTextColor(...COLORS.textMuted);
            doc.setFontSize(8);
            doc.text('Kein Bild', margin + imageWidth / 2, currentY + wineHeight / 2, { align: 'center' });
          }
        } catch {
          // Placeholder on error
          doc.setFillColor(...COLORS.border);
          doc.rect(margin + 3, currentY + 3, imageWidth - 6, wineHeight - 11, 'F');
        }
      } else {
        // Placeholder for no image
        doc.setFillColor(...COLORS.border);
        doc.rect(margin + 3, currentY + 3, imageWidth - 6, wineHeight - 11, 'F');
        doc.setTextColor(...COLORS.textMuted);
        doc.setFontSize(8);
        doc.text('Kein Bild', margin + imageWidth / 2, currentY + wineHeight / 2, { align: 'center' });
      }

      // Wine name
      doc.setTextColor(...COLORS.darkWine);
      doc.setFontSize(12);
      const nameLines = doc.splitTextToSize(wine.name, textWidth);
      doc.text(nameLines.slice(0, 2), textStartX, currentY + 8);
      
      let infoY = currentY + 8 + (Math.min(nameLines.length, 2) * 5);

      // Info row: grape, origin, price
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.textMuted);
      
      const infoParts: string[] = [];
      if (wine.grape_variety) infoParts.push(`🍇 ${wine.grape_variety}`);
      if (wine.origin_country) infoParts.push(`📍 ${wine.origin_country}`);
      if (wine.selling_price) infoParts.push(`💰 ${formatPrice(wine.selling_price)}`);
      
      if (infoParts.length > 0) {
        doc.text(infoParts.join('  ·  '), textStartX, infoY + 4);
        infoY += 7;
      }

      // Description
      if (wine.description) {
        doc.setTextColor(...COLORS.textDark);
        doc.setFontSize(8);
        const descLines = doc.splitTextToSize(wine.description, textWidth);
        doc.text(descLines.slice(0, 3), textStartX, infoY + 4);
        infoY += Math.min(descLines.length, 3) * 3.5 + 2;
      }

      // Flavor profile
      if (wine.flavor_profile) {
        doc.setTextColor(...COLORS.wineRed);
        doc.setFontSize(7);
        const flavorText = `🍷 ${wine.flavor_profile}`;
        const flavorLines = doc.splitTextToSize(flavorText, textWidth);
        doc.text(flavorLines.slice(0, 2), textStartX, infoY + 3);
        infoY += Math.min(flavorLines.length, 2) * 3 + 1;
      }

      // Food pairings
      if (wine.food_pairings) {
        doc.setTextColor(...COLORS.textMuted);
        doc.setFontSize(7);
        const pairingText = `🍽️ ${wine.food_pairings}`;
        const pairingLines = doc.splitTextToSize(pairingText, textWidth);
        doc.text(pairingLines.slice(0, 2), textStartX, infoY + 3);
      }

      currentY += wineHeight;
    }
  }

  // ============ PAGE NUMBERS ============
  const totalPages = doc.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(
      `Seite ${i - 1} von ${totalPages - 1}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Save the PDF
  const fileName = `Weinkatalog_${restaurantName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Restaurant'}_${today.toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
