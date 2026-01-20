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
  special_attributes?: string | null;
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
  wineRed: [114, 47, 55] as [number, number, number],
  darkWine: [74, 28, 38] as [number, number, number],
  gold: [184, 134, 11] as [number, number, number],
  lightGold: [218, 165, 32] as [number, number, number],
  textDark: [33, 33, 33] as [number, number, number],
  textMuted: [117, 117, 117] as [number, number, number],
  bgLight: [250, 248, 245] as [number, number, number],
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

// Remove citation markers like [1], [2][3], etc. from AI-generated text
const cleanCitations = (text: string): string => {
  return text.replace(/\[\d+\]/g, '').replace(/\s{2,}/g, ' ').trim();
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
  } catch (error: unknown) {
    // Failed to load image as base64 - returning null
    console.warn('[Wine PDF] Image load failed:', error instanceof Error ? error.message : error);
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
  } catch (error: unknown) {
    // Custom font loading failed - using helvetica fallback
    console.warn('[Wine PDF] Font loading failed, using helvetica:', error instanceof Error ? error.message : error);
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

  // Calculate ToC structure and page numbers
  // Page 1: Cover, Page 2+: ToC, then wine pages (1 wine per page)
  const tocEntries: { supplierName: string; wines: { name: string; pageNum: number }[] }[] = [];
  
  // Calculate how many ToC pages we need (estimate ~25 entries per page)
  const totalTocEntries = supplierIds.length + wines.length;
  const entriesPerTocPage = 25;
  const tocPages = Math.ceil(totalTocEntries / entriesPerTocPage);
  
  let winePageNum = 1 + tocPages + 1; // After cover + ToC pages
  
  for (const supplierId of supplierIds) {
    const supplierWines = winesBySupplier[supplierId];
    const supplier = supplierMap.get(supplierId);
    const supplierName = supplier?.name || 'Unbekannter Lieferant';
    
    const wineEntries = supplierWines.map((wine) => {
      const entry = { name: wine.name, pageNum: winePageNum };
      winePageNum++;
      return entry;
    });
    
    tocEntries.push({ supplierName, wines: wineEntries });
  }

  // ============ COVER PAGE ============
  doc.setFillColor(...COLORS.darkWine);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Decorative border
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.5);
  doc.rect(margin - 5, margin - 5, contentWidth + 10, pageHeight - margin * 2 + 10);
  
  // Wine glass icon
  const centerX = pageWidth / 2;
  doc.setFillColor(...COLORS.gold);
  doc.circle(centerX, 60, 15, 'F');
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
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.white);
  doc.text(`Stand: ${dateStr}`, centerX, 150, { align: 'center' });
  
  // Stats
  doc.setFontSize(16);
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

  // ============ TABLE OF CONTENTS ============
  let tocCurrentY = margin;
  let tocPageCount = 0;
  
  const addTocPage = () => {
    doc.addPage();
    tocPageCount++;
    tocCurrentY = margin;
    
    // ToC header
    doc.setFillColor(...COLORS.wineRed);
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(24);
    doc.text('INHALTSVERZEICHNIS', centerX, 25, { align: 'center' });
    tocCurrentY = 50;
  };
  
  addTocPage();
  
  for (const entry of tocEntries) {
    // Check if we need a new ToC page
    if (tocCurrentY + 15 + entry.wines.length * 8 > pageHeight - margin) {
      addTocPage();
    }
    
    // Supplier name in ToC
    doc.setTextColor(...COLORS.darkWine);
    doc.setFontSize(14);
    doc.text(`🍷 ${entry.supplierName}`, margin, tocCurrentY);
    
    // Page number dots
    const firstWinePage = entry.wines[0]?.pageNum || 0;
    const dotsWidth = pageWidth - margin * 2 - doc.getTextWidth(`🍷 ${entry.supplierName}`) - 20;
    doc.setTextColor(...COLORS.textMuted);
    doc.setFontSize(12);
    doc.text(String(firstWinePage), pageWidth - margin, tocCurrentY, { align: 'right' });
    
    tocCurrentY += 10;
    
    // Wine entries under each supplier
    for (const wine of entry.wines) {
      if (tocCurrentY > pageHeight - margin - 10) {
        addTocPage();
      }
      
      doc.setTextColor(...COLORS.textMuted);
      doc.setFontSize(11);
      const truncatedName = wine.name.length > 50 ? wine.name.substring(0, 47) + '...' : wine.name;
      doc.text(`    • ${truncatedName}`, margin + 5, tocCurrentY);
      doc.text(String(wine.pageNum), pageWidth - margin, tocCurrentY, { align: 'right' });
      tocCurrentY += 8;
    }
    
    tocCurrentY += 5; // Space between suppliers
  }

  // ============ WINE PAGES (1 WINE PER PAGE) ============
  let wineIndex = 0;
  const totalWines = wines.length;

  for (const supplierId of supplierIds) {
    const supplierWines = winesBySupplier[supplierId];
    const supplier = supplierMap.get(supplierId);
    const supplierName = supplier?.name || 'Unbekannter Lieferant';

    for (const wine of supplierWines) {
      wineIndex++;
      onProgress?.(wineIndex, totalWines);

      // New page for each wine
      doc.addPage();
      
      // Supplier header bar
      doc.setFillColor(...COLORS.wineRed);
      doc.rect(0, 0, pageWidth, 18, 'F');
      doc.setTextColor(...COLORS.white);
      doc.setFontSize(12);
      doc.text(`🍷 ${supplierName.toUpperCase()}`, margin, 12);

      let currentY = 30;
      
      // Layout: Image on left, info on right
      // Wine bottles have ~1:3 aspect ratio - use proportional sizing
      const maxImageWidth = 45;
      const maxImageHeight = 120;
      const bottleAspectRatio = 0.35; // width/height for typical wine bottle
      const imageWidth = maxImageHeight * bottleAspectRatio;
      const imageHeight = maxImageHeight;
      const textStartX = margin + imageWidth + 15;
      const textWidth = contentWidth - imageWidth - 20;

      // Wine image with preserved proportions
      if (wine.image_url) {
        try {
          const imgData = await loadImageAsBase64(wine.image_url);
          if (imgData) {
            // Use object-fit contain behavior: fit within box preserving aspect ratio
            doc.addImage(imgData, 'JPEG', margin, currentY, imageWidth, imageHeight);
          } else {
            drawImagePlaceholder(doc, margin, currentY, imageWidth, imageHeight);
          }
        } catch (imageError) {
          console.warn('Failed to add wine image to PDF:', imageError);
          drawImagePlaceholder(doc, margin, currentY, imageWidth, imageHeight);
        }
      } else {
        drawImagePlaceholder(doc, margin, currentY, imageWidth, imageHeight);
      }

      // Wine name (large)
      doc.setTextColor(...COLORS.darkWine);
      doc.setFontSize(22);
      const nameLines = doc.splitTextToSize(wine.name, textWidth);
      doc.text(nameLines.slice(0, 2), textStartX, currentY + 8);
      
      let infoY = currentY + 8 + (Math.min(nameLines.length, 2) * 9);
      
      // Decorative line under name
      doc.setDrawColor(...COLORS.gold);
      doc.setLineWidth(0.8);
      doc.line(textStartX, infoY - 2, textStartX + textWidth, infoY - 2);
      infoY += 8;

      // Grape variety
      if (wine.grape_variety) {
        doc.setTextColor(...COLORS.textDark);
        doc.setFontSize(13);
        doc.text('🍇 Rebsorte:', textStartX, infoY);
        doc.setTextColor(...COLORS.textMuted);
        // Reduce width by label offset to prevent overflow
        const grapeTextWidth = textWidth - 30;
        const grapeLines = doc.splitTextToSize(cleanCitations(wine.grape_variety), grapeTextWidth);
        doc.text(grapeLines.slice(0, 2), textStartX + 28, infoY);
        infoY += Math.min(grapeLines.length, 2) * 7 + 6;
      }

      // Origin country
      if (wine.origin_country) {
        doc.setTextColor(...COLORS.textDark);
        doc.setFontSize(13);
        doc.text('🌍 Herkunft:', textStartX, infoY);
        doc.setTextColor(...COLORS.textMuted);
        // Add text wrapping for long origin names
        const originTextWidth = textWidth - 30;
        const originLines = doc.splitTextToSize(cleanCitations(wine.origin_country), originTextWidth);
        doc.text(originLines.slice(0, 1), textStartX + 28, infoY);
        infoY += 10;
      }

      // Special attributes (Bio, Vegan, etc.)
      if (wine.special_attributes) {
        doc.setTextColor(...COLORS.textDark);
        doc.setFontSize(13);
        doc.text('✨ Besonderheiten:', textStartX, infoY);
        doc.setTextColor(...COLORS.gold);
        const attrTextWidth = textWidth - 35;
        const attrLines = doc.splitTextToSize(wine.special_attributes, attrTextWidth);
        doc.text(attrLines.slice(0, 1), textStartX + 35, infoY);
        infoY += 10;
      }

      // Selling price (prominent)
      if (wine.selling_price) {
        doc.setTextColor(...COLORS.wineRed);
        doc.setFontSize(16);
        doc.text(`💰 ${formatPrice(wine.selling_price)}`, textStartX, infoY);
        infoY += 12;
      }

      // ===== Full-width sections below image =====
      const fullTextY = currentY + imageHeight + 15;
      const fullTextWidth = contentWidth;
      let sectionY = fullTextY;
      const footerMargin = 20; // Reserve space for page number
      const maxContentY = pageHeight - footerMargin;

      // Description section
      if (wine.description) {
        // Check if we have enough space, otherwise skip this section on this page
        if (sectionY < maxContentY - 30) {
          doc.setDrawColor(...COLORS.border);
          doc.setLineWidth(0.3);
          doc.line(margin, sectionY, pageWidth - margin, sectionY);
          sectionY += 6;
          
          doc.setTextColor(...COLORS.darkWine);
          doc.setFontSize(14);
          doc.text('📝 Beschreibung', margin, sectionY);
          sectionY += 6;
          
          doc.setTextColor(...COLORS.textDark);
          doc.setFontSize(12);
          const descLines = doc.splitTextToSize(cleanCitations(wine.description), fullTextWidth);
          // Only render lines that fit above footer
          const availableLines = Math.min(descLines.length, 6, Math.floor((maxContentY - sectionY) / 5.5));
          doc.text(descLines.slice(0, availableLines), margin, sectionY);
          sectionY += availableLines * 5.5 + 5;
        }
      }

      // Flavor profile section
      if (wine.flavor_profile && sectionY < maxContentY - 25) {
        doc.setDrawColor(...COLORS.border);
        doc.setLineWidth(0.3);
        doc.line(margin, sectionY, pageWidth - margin, sectionY);
        sectionY += 6;
        
        doc.setTextColor(...COLORS.wineRed);
        doc.setFontSize(14);
        doc.text('🍷 Geschmacksprofil', margin, sectionY);
        sectionY += 6;
        
        doc.setTextColor(...COLORS.textDark);
        doc.setFontSize(12);
        const flavorLines = doc.splitTextToSize(cleanCitations(wine.flavor_profile), fullTextWidth);
        const availableFlavorLines = Math.min(flavorLines.length, 5, Math.floor((maxContentY - sectionY) / 5.5));
        doc.text(flavorLines.slice(0, availableFlavorLines), margin, sectionY);
        sectionY += availableFlavorLines * 5.5 + 5;
      }

      // Food pairings section
      if (wine.food_pairings && sectionY < maxContentY - 20) {
        doc.setDrawColor(...COLORS.border);
        doc.setLineWidth(0.3);
        doc.line(margin, sectionY, pageWidth - margin, sectionY);
        sectionY += 6;
        
        doc.setTextColor(...COLORS.gold);
        doc.setFontSize(14);
        doc.text('🍽️ Passt zu', margin, sectionY);
        sectionY += 6;
        
        doc.setTextColor(...COLORS.textDark);
        doc.setFontSize(12);
        const pairingLines = doc.splitTextToSize(cleanCitations(wine.food_pairings), fullTextWidth);
        const availablePairingLines = Math.min(pairingLines.length, 4, Math.floor((maxContentY - sectionY) / 5.5));
        doc.text(pairingLines.slice(0, availablePairingLines), margin, sectionY);
      }
    }
  }

  // ============ PAGE NUMBERS ============
  const totalPages = doc.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(
      `Seite ${i} von ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Save the PDF
  const fileName = `Weinkatalog_${restaurantName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Restaurant'}_${today.toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

// Helper function to draw image placeholder
function drawImagePlaceholder(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number
) {
  doc.setFillColor(...COLORS.bgLight);
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, width, height, 3, 3, 'FD');
  doc.setTextColor(...COLORS.textMuted);
  doc.setFontSize(12);
  doc.text('🍷', x + width / 2, y + height / 2 - 5, { align: 'center' });
  doc.setFontSize(10);
  doc.text('Kein Bild', x + width / 2, y + height / 2 + 5, { align: 'center' });
}
