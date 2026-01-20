import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { designTokens } from './designTokens';
import { advancedFeatures } from './advancedFeatures';
import { keyboardShortcuts } from './keyboardShortcuts';

export const exportAsJSON = () => {
  const dataStr = JSON.stringify(designTokens, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'design-tokens.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  toast.success('Design-Tokens als JSON exportiert');
};

export const exportAsCSS = () => {
  const generateCSSVariables = (colors: Record<string, string>) => {
    return Object.entries(colors)
      .map(([key, value]) => {
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `  --${cssKey}: ${value};`;
      })
      .join('\n');
  };

  const css = `/* Bestellung.pro Design Tokens */
/* Generated: ${new Date().toISOString()} */

:root {
  /* Light Theme Colors */
${generateCSSVariables(designTokens.colors.light)}

  /* Border Radius */
  --radius: 0.375rem;

  /* Spacing Scale */
${Object.entries(designTokens.spacing).map(([key, value]) => `  --spacing-${key}: ${value};`).join('\n')}
}

.dark {
  /* Dark Theme Colors */
${generateCSSVariables(designTokens.colors.dark)}
}

/* Typography */
body {
  font-family: ${designTokens.typography.fontFamily.sans};
}

/* Design Principles */
/*
 * 1. Keine Schatten - nutze border-border für Tiefe
 * 2. Konsistente Radii - nur rounded-md (6px)
 * 3. 1 Primary Button pro Screen
 * 4. Dezente Backgrounds - bg-muted/30
 * 5. Touch-optimiert - min h-11 für Mobile-Buttons
 */
`;

  const blob = new Blob([css], { type: 'text/css' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'design-tokens.css';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  toast.success('Design-Tokens als CSS exportiert');
};

export const exportFullStyleGuidePDF = () => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const marginLeft = 14;
  
  const addFooter = () => {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Generiert am ${new Date().toLocaleDateString('de-DE')} | Seite ${i} von ${pageCount}`,
        marginLeft,
        pageHeight - 10
      );
    }
  };

  // Cover page
  doc.setFontSize(36);
  doc.setTextColor(33, 33, 33);
  doc.text('Style Guide', pageWidth / 2, 80, { align: 'center' });
  
  doc.setFontSize(18);
  doc.setTextColor(100, 100, 100);
  doc.text('Bestellung.pro', pageWidth / 2, 95, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text('Design-System Dokumentation', pageWidth / 2, 110, { align: 'center' });
  
  doc.setFontSize(11);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generiert am ${new Date().toLocaleDateString('de-DE', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`, pageWidth / 2, 130, { align: 'center' });

  // Table of Contents
  doc.addPage();
  doc.setFontSize(20);
  doc.setTextColor(33, 33, 33);
  doc.text('Inhaltsverzeichnis', marginLeft, 25);
  
  const tocItems = [
    '1. Erweiterte Features',
    '2. Tastatur-Shortcuts',
    '3. Design Tokens',
    '4. Design-Prinzipien',
    '5. Farb-Palette',
    '6. Button-Varianten',
    '7. Typografie',
    '8. Spacing-Referenz',
  ];
  
  doc.setFontSize(11);
  doc.setTextColor(66, 66, 66);
  tocItems.forEach((item, idx) => {
    doc.text(item, marginLeft + 5, 45 + (idx * 10));
  });

  // 1. Advanced Features
  doc.addPage();
  doc.setFontSize(18);
  doc.setTextColor(33, 33, 33);
  doc.text('1. Erweiterte Features', marginLeft, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Features hinter dem "Erweiterte Einstellungen" Toggle', marginLeft, 30);
  
  const featuresData: string[][] = [];
  advancedFeatures.forEach(category => {
    category.features.forEach((feature, index) => {
      featuresData.push([
        index === 0 ? category.category : '',
        feature.name,
        feature.description
      ]);
    });
  });
  
  autoTable(doc, {
    startY: 38,
    head: [['Bereich', 'Feature', 'Beschreibung']],
    body: featuresData,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 40, fontStyle: 'bold' },
      1: { cellWidth: 35 },
      2: { cellWidth: 'auto' },
    },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  // 2. Keyboard Shortcuts
  doc.addPage();
  doc.setFontSize(18);
  doc.setTextColor(33, 33, 33);
  doc.text('2. Tastatur-Shortcuts', marginLeft, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Schnelle Navigation mit Tastenkombinationen', marginLeft, 30);
  
  const shortcutsData: string[][] = [];
  keyboardShortcuts.forEach(category => {
    category.shortcuts.forEach((shortcut, index) => {
      shortcutsData.push([
        index === 0 ? category.category : '',
        shortcut.keys,
        shortcut.action,
        shortcut.description
      ]);
    });
  });
  
  autoTable(doc, {
    startY: 38,
    head: [['Kategorie', 'Tasten', 'Aktion', 'Beschreibung']],
    body: shortcutsData,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 35, fontStyle: 'bold' },
      1: { cellWidth: 30 },
      2: { cellWidth: 30 },
      3: { cellWidth: 'auto' },
    },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  // 3. Design Tokens
  doc.addPage();
  doc.setFontSize(18);
  doc.setTextColor(33, 33, 33);
  doc.text('3. Design Tokens', marginLeft, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('CSS-Variablen des ultraminimalistischen B2B SaaS Design-Systems', marginLeft, 30);
  
  const colorTokens = [
    ['--background', '210 20% 98%', '224 71% 4%'],
    ['--foreground', '222 47% 11%', '213 31% 91%'],
    ['--primary', '217 91% 50%', '210 100% 52%'],
    ['--secondary', '210 20% 96%', '223 47% 14%'],
    ['--muted', '210 20% 96%', '223 47% 14%'],
    ['--muted-foreground', '215 16% 47%', '215 16% 65%'],
    ['--border', '220 13% 91%', '222 47% 18%'],
    ['--destructive', '0 84% 60%', '0 63% 45%'],
    ['--warning', '45 93% 47%', '45 93% 47%'],
    ['--success', '142 76% 36%', '142 70% 45%'],
  ];
  
  autoTable(doc, {
    startY: 38,
    head: [['CSS Variable', 'Light (HSL)', 'Dark (HSL)']],
    body: colorTokens,
    styles: { fontSize: 9, cellPadding: 3, font: 'courier' },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold', font: 'helvetica' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  // 4. Design Principles
  doc.addPage();
  doc.setFontSize(18);
  doc.setTextColor(33, 33, 33);
  doc.text('4. Design-Prinzipien', marginLeft, 22);
  
  const principles = [
    ['1', 'Keine Schatten', 'Nutze border-border für Tiefe statt box-shadow'],
    ['2', 'Konsistente Radii', 'Nur rounded-md (6px) für alle Komponenten'],
    ['3', 'Ein Primary Button', 'Maximal ein Primary Button pro Screen'],
    ['4', 'Dezente Backgrounds', 'bg-muted/30 für subtile Hervorhebungen'],
    ['5', 'Touch-optimiert', 'Minimum h-11 (44px) für Mobile-Buttons'],
    ['6', 'Minimaler Kontrast', 'Klare Hierarchie durch Schriftgewichte, nicht Farben'],
  ];
  
  autoTable(doc, {
    startY: 32,
    head: [['#', 'Prinzip', 'Beschreibung']],
    body: principles,
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 40, fontStyle: 'bold' },
      2: { cellWidth: 'auto' },
    },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  // 5. Color Palette
  doc.addPage();
  doc.setFontSize(18);
  doc.setTextColor(33, 33, 33);
  doc.text('5. Farb-Palette', marginLeft, 22);
  
  const colorPalette = [
    ['Primary', 'bg-primary', 'Hauptaktionsfarbe (Blau)', '217 91% 50%'],
    ['Secondary', 'bg-secondary', 'Sekundäre Elemente', '210 20% 96%'],
    ['Muted', 'bg-muted', 'Dezente Hintergründe', '210 20% 96%'],
    ['Accent', 'bg-accent', 'Akzent-Elemente', '210 20% 96%'],
    ['Destructive', 'bg-destructive', 'Fehler und Löschen', '0 84% 60%'],
    ['Warning', 'bg-warning', 'Warnungen', '45 93% 47%'],
    ['Success', 'bg-success', 'Erfolg und Bestätigung', '142 76% 36%'],
  ];
  
  autoTable(doc, {
    startY: 32,
    head: [['Name', 'Klasse', 'Verwendung', 'HSL']],
    body: colorPalette,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 30 },
      1: { font: 'courier', cellWidth: 35 },
      2: { cellWidth: 'auto' },
      3: { font: 'courier', cellWidth: 35 },
    },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  // 6. Button Variants
  doc.addPage();
  doc.setFontSize(18);
  doc.setTextColor(33, 33, 33);
  doc.text('6. Button-Varianten', marginLeft, 22);
  
  const buttonVariants = [
    ['default', 'Primäre Aktionen', 'bg-primary text-primary-foreground'],
    ['secondary', 'Sekundäre Aktionen', 'bg-secondary text-secondary-foreground'],
    ['outline', 'Tertiäre Aktionen', 'border border-input bg-background'],
    ['ghost', 'Dezente Aktionen', 'hover:bg-accent'],
    ['link', 'Text-Links', 'text-primary underline'],
    ['destructive', 'Lösch-Aktionen', 'bg-destructive text-destructive-foreground'],
    ['success', 'Erfolgs-Aktionen', 'bg-success text-success-foreground'],
    ['warning', 'Warn-Aktionen', 'bg-warning text-warning-foreground'],
  ];
  
  autoTable(doc, {
    startY: 32,
    head: [['Variante', 'Verwendung', 'Styling']],
    body: buttonVariants,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 30 },
      1: { cellWidth: 50 },
      2: { font: 'courier', cellWidth: 'auto' },
    },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });
  
  let finalY = (doc as any).lastAutoTable.finalY || 80;
  doc.setFontSize(12);
  doc.setTextColor(33, 33, 33);
  doc.text('Button-Größen:', marginLeft, finalY + 15);
  
  const buttonSizes = [
    ['sm', 'Kleine Buttons', 'h-8 px-3 text-xs'],
    ['default', 'Standard', 'h-10 px-4 py-2'],
    ['lg', 'Große Buttons', 'h-11 px-8'],
    ['icon', 'Icon-Buttons', 'h-10 w-10'],
  ];
  
  autoTable(doc, {
    startY: finalY + 20,
    head: [['Größe', 'Verwendung', 'Klassen']],
    body: buttonSizes,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [100, 116, 139], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 30 },
      1: { cellWidth: 50 },
      2: { font: 'courier', cellWidth: 'auto' },
    },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  // 7. Typography
  doc.addPage();
  doc.setFontSize(18);
  doc.setTextColor(33, 33, 33);
  doc.text('7. Typografie', marginLeft, 22);
  
  doc.setFontSize(12);
  doc.text('Schriftgrößen:', marginLeft, 35);
  
  const fontSizes = [
    ['text-4xl', '2.25rem (36px)', 'Große Überschriften'],
    ['text-3xl', '1.875rem (30px)', 'Seiten-Titel'],
    ['text-2xl', '1.5rem (24px)', 'Abschnitt-Titel'],
    ['text-xl', '1.25rem (20px)', 'Unter-Überschriften'],
    ['text-lg', '1.125rem (18px)', 'Hervorgehobener Text'],
    ['text-base', '1rem (16px)', 'Standard Body Text'],
    ['text-sm', '0.875rem (14px)', 'Labels und Beschreibungen'],
    ['text-xs', '0.75rem (12px)', 'Meta-Informationen'],
  ];
  
  autoTable(doc, {
    startY: 40,
    head: [['Klasse', 'Größe', 'Verwendung']],
    body: fontSizes,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { font: 'courier', cellWidth: 35 },
      1: { cellWidth: 40 },
      2: { cellWidth: 'auto' },
    },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });
  
  finalY = (doc as any).lastAutoTable.finalY || 120;
  doc.setFontSize(12);
  doc.text('Schriftgewichte:', marginLeft, finalY + 15);
  
  const fontWeights = [
    ['font-normal', '400', 'Normaler Fließtext'],
    ['font-medium', '500', 'Labels und betonte Texte'],
    ['font-semibold', '600', 'Subheadings und Card-Titel'],
    ['font-bold', '700', 'Headings und wichtige Elemente'],
  ];
  
  autoTable(doc, {
    startY: finalY + 20,
    head: [['Klasse', 'Gewicht', 'Verwendung']],
    body: fontWeights,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [100, 116, 139], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { font: 'courier', cellWidth: 35 },
      1: { cellWidth: 30 },
      2: { cellWidth: 'auto' },
    },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  // 8. Spacing Reference
  doc.addPage();
  doc.setFontSize(18);
  doc.setTextColor(33, 33, 33);
  doc.text('8. Spacing-Referenz', marginLeft, 22);
  
  const spacingValues = [
    ['1', '0.25rem', '4px', 'Minimaler Abstand'],
    ['2', '0.5rem', '8px', 'Enger Abstand'],
    ['3', '0.75rem', '12px', 'Kompakter Abstand'],
    ['4', '1rem', '16px', 'Standard-Abstand'],
    ['5', '1.25rem', '20px', 'Mittlerer Abstand'],
    ['6', '1.5rem', '24px', 'Großzügiger Abstand'],
    ['8', '2rem', '32px', 'Großer Abstand'],
    ['10', '2.5rem', '40px', 'Sehr großer Abstand'],
    ['12', '3rem', '48px', 'Extra großer Abstand'],
    ['16', '4rem', '64px', 'Maximaler Abstand'],
  ];
  
  autoTable(doc, {
    startY: 32,
    head: [['Stufe', 'rem', 'px', 'Verwendung']],
    body: spacingValues,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 25, halign: 'center' },
      1: { font: 'courier', cellWidth: 30 },
      2: { font: 'courier', cellWidth: 25 },
      3: { cellWidth: 'auto' },
    },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });
  
  finalY = (doc as any).lastAutoTable.finalY || 120;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Verwendung: gap-X, p-X, m-X, space-x-X, space-y-X', marginLeft, finalY + 12);

  addFooter();
  
  doc.save('style-guide-bestellung-pro.pdf');
  toast.success('Style Guide als PDF exportiert');
};
