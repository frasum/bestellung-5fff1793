import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

const PRIMARY_COLOR: [number, number, number] = [37, 99, 235]; // Blue 600
const DARK_COLOR: [number, number, number] = [30, 41, 59]; // Slate 800
const MUTED_COLOR: [number, number, number] = [100, 116, 139]; // Slate 500
const LIGHT_BG: [number, number, number] = [248, 250, 252]; // Slate 50
const ACCENT_AMBER: [number, number, number] = [245, 158, 11]; // Amber 500
const ACCENT_GREEN: [number, number, number] = [16, 185, 129]; // Emerald 500
const ACCENT_GRAY: [number, number, number] = [148, 163, 184]; // Slate 400

interface ContactInfo {
  email?: string;
  website?: string;
  phone?: string;
  companyName?: string;
  address?: string;
}

export const generateSystemOverviewPdf = async (contactInfo?: ContactInfo) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Helper functions
  const centerText = (text: string, y: number, fontSize: number = 12, color: [number, number, number] = DARK_COLOR) => {
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    const textWidth = doc.getTextWidth(text);
    doc.text(text, (pageWidth - textWidth) / 2, y);
  };

  const addSectionTitle = (text: string, y: number) => {
    doc.setFontSize(20);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.setFont('helvetica', 'bold');
    doc.text(text, margin, y);
    doc.setFont('helvetica', 'normal');
    return y + 10;
  };

  const drawColoredBullet = (x: number, y: number, color: [number, number, number]) => {
    doc.setFillColor(...color);
    doc.circle(x, y - 1.5, 2.5, 'F');
  };

  const addPageNumbers = () => {
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(...MUTED_COLOR);
      doc.text(`Seite ${i} von ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    }
  };

  // ===== PAGE 1: Cover =====
  // Background accent with gradient effect
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 85, 'F');
  
  // Decorative elements
  doc.setFillColor(59, 130, 246); // Lighter blue
  doc.circle(pageWidth - 30, 20, 40, 'F');
  doc.circle(30, 70, 25, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  centerText('Bestellung.pro', 50, 36, [255, 255, 255]);

  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  centerText('Digitale Beschaffung für Gastronomie', 68, 16, [255, 255, 255]);

  // Main content area
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(margin, 105, contentWidth, 85, 5, 5, 'F');

  doc.setTextColor(...DARK_COLOR);
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  centerText('Systemübersicht', 135, 26, DARK_COLOR);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  centerText('Die komplette Lösung für Ihre Restaurant-Beschaffung', 150, 14, MUTED_COLOR);

  // Date
  const currentDate = new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long' });
  centerText(`Stand: ${currentDate}`, 175, 12, MUTED_COLOR);

  // Footer
  doc.setFontSize(10);
  centerText('www.bestellung.pro', pageHeight - 20, 10, PRIMARY_COLOR);

  // ===== PAGE 2: Table of Contents =====
  doc.addPage();
  let y = addSectionTitle('Inhalt', 30);
  y += 10;

  const toc = [
    { title: 'Warum Bestellung.pro?', page: 3 },
    { title: 'Die 4 Hauptmodule', page: 4 },
    { title: 'Benutzergruppen & Rollen', page: 5 },
    { title: 'Der Bestellprozess', page: 6 },
    { title: 'Highlight-Features', page: 7 },
    { title: 'Transparente Preise', page: 8 },
    { title: 'Kundenstimmen', page: 9 },
    { title: 'Jetzt testen', page: 10 },
    { title: 'Kontakt', page: 11 },
  ];

  doc.setFont('helvetica', 'normal');
  toc.forEach((item, i) => {
    const itemY = y + i * 18;
    
    // Number circle
    doc.setFillColor(...PRIMARY_COLOR);
    doc.circle(margin + 6, itemY + 3, 5, 'F');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(`${i + 1}`, margin + 4, itemY + 5.5);
    
    // Title
    doc.setFontSize(13);
    doc.setTextColor(...DARK_COLOR);
    doc.text(item.title, margin + 18, itemY + 5);
    
    // Dotted line
    doc.setDrawColor(...MUTED_COLOR);
    doc.setLineDashPattern([1, 2], 0);
    const titleWidth = doc.getTextWidth(item.title);
    doc.line(margin + 20 + titleWidth, itemY + 5, pageWidth - margin - 15, itemY + 5);
    doc.setLineDashPattern([], 0);
    
    // Page number
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text(`${item.page}`, pageWidth - margin - 5, itemY + 5, { align: 'right' });
  });

  // ===== PAGE 3: Why Bestellung.pro? =====
  doc.addPage();
  y = addSectionTitle('Warum Bestellung.pro?', 30);

  doc.setFontSize(14);
  doc.setTextColor(...MUTED_COLOR);
  doc.text('Endlich Ordnung in Ihrer Gastronomie-Beschaffung', margin, y);
  y += 15;

  const benefits = [
    { color: PRIMARY_COLOR, title: 'Zeit sparen', desc: 'Keine Excel-Listen, keine Zettelwirtschaft. Bestellen in Minuten statt Stunden.' },
    { color: ACCENT_GREEN, title: 'Kosten senken', desc: 'Ausgabenübersicht, Preishistorie, keine Doppelbestellungen mehr.' },
    { color: ACCENT_AMBER, title: 'Überall nutzbar', desc: 'Cloud-basiert, auf jedem Gerät – Desktop, Tablet, Smartphone.' },
    { color: PRIMARY_COLOR, title: 'Team einbinden', desc: 'Vom Koch bis zum Manager – jeder kann mitbestellen per QR-Code.' },
    { color: ACCENT_GREEN, title: 'Automatische E-Mails', desc: 'Bestellungen gehen direkt an Lieferanten – mit einem Klick.' },
    { color: ACCENT_AMBER, title: 'Volle Kontrolle', desc: 'Rollen & Rechte, Freigabeprozesse, Nachverfolgung.' },
  ];

  benefits.forEach((benefit, i) => {
    const boxY = y + (i * 35);
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(margin, boxY, contentWidth, 30, 3, 3, 'F');

    // Colored bullet instead of emoji
    drawColoredBullet(margin + 12, boxY + 12, benefit.color);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK_COLOR);
    doc.text(benefit.title, margin + 22, boxY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...MUTED_COLOR);
    doc.text(benefit.desc, margin + 22, boxY + 22);
  });

  // ===== PAGE 4: Main Modules =====
  doc.addPage();
  y = addSectionTitle('Die 4 Hauptmodule', 30);

  const modules = [
    { label: 'K', name: 'KATALOG', color: PRIMARY_COLOR, features: ['Lieferanten & Artikel verwalten', 'KI-Foto-Import', 'CSV/Excel Import'] },
    { label: 'B', name: 'BESTELLUNGEN', color: ACCENT_GREEN, features: ['Bestellhistorie', 'Vorbestellungen', 'EasyOrder für Mitarbeiter'] },
    { label: 'R', name: 'BERICHTE', color: ACCENT_AMBER, features: ['Dashboard & KPIs', 'Ausgabenanalyse', 'Inventur'] },
    { label: 'E', name: 'EINSTELLUNGEN', color: ACCENT_GRAY, features: ['Team & Rollen', 'Standorte & Adressen', 'E-Mail-Vorlagen'] },
  ];

  modules.forEach((mod, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const boxX = margin + col * (contentWidth / 2 + 5);
    const boxY = y + row * 70;
    const boxWidth = contentWidth / 2 - 5;

    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(boxX, boxY, boxWidth, 60, 4, 4, 'F');

    // Module letter badge instead of emoji
    doc.setFillColor(...mod.color);
    doc.roundedRect(boxX + 8, boxY + 8, 18, 18, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(mod.label, boxX + 13.5, boxY + 20);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text(mod.name, boxX + 32, boxY + 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...MUTED_COLOR);
    mod.features.forEach((f, fi) => {
      doc.text(`• ${f}`, boxX + 12, boxY + 35 + fi * 7);
    });
  });

  // ===== PAGE 5: User Roles =====
  doc.addPage();
  y = addSectionTitle('Benutzergruppen & Rollen', 30);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK_COLOR);
  doc.text('Interne Benutzer', margin, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    head: [['Rolle', 'Typische Aufgaben']],
    body: [
      ['Admin', 'Vollzugriff: Lieferanten, Team, Berichte, Einstellungen'],
      ['Manager', 'Bestellungen freigeben, Inventur durchführen'],
      ['Einkäufer', 'Bestellen, Warenkorb verwalten'],
      ['Betrachter', 'Berichte ansehen (nur lesen)'],
    ],
    margin: { left: margin },
    headStyles: { fillColor: PRIMARY_COLOR, textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: LIGHT_BG },
    styles: { fontSize: 11 },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 0) {
        const roleColors: Record<string, [number, number, number]> = {
          'Admin': ACCENT_AMBER,
          'Manager': PRIMARY_COLOR,
          'Einkäufer': ACCENT_GREEN,
          'Betrachter': ACCENT_GRAY,
        };
        const role = data.cell.text[0];
        const color = roleColors[role];
        if (color) {
          doc.setFillColor(...color);
          doc.circle(data.cell.x + 3, data.cell.y + data.cell.height / 2, 2, 'F');
        }
      }
    },
    columnStyles: {
      0: { cellWidth: 35, cellPadding: { left: 8 } },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 20;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK_COLOR);
  doc.text('Externe Benutzer', margin, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    head: [['Gruppe', 'Zugang', 'Funktion']],
    body: [
      ['Küchenpersonal', 'QR-Code (EasyOrder)', 'Einfache Bestellung per Smartphone'],
      ['Lieferanten', 'Magic Link (Portal)', 'Artikel & Preise selbst pflegen'],
    ],
    margin: { left: margin },
    headStyles: { fillColor: PRIMARY_COLOR, textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: LIGHT_BG },
    styles: { fontSize: 11 },
  });

  // ===== PAGE 6: Order Process =====
  doc.addPage();
  y = addSectionTitle('Der Bestellprozess', 30);

  const steps = [
    { num: '1', title: 'Katalog durchsuchen', desc: 'Artikel nach Lieferant, Kategorie oder Name finden' },
    { num: '2', title: 'Warenkorb füllen', desc: 'Gewünschte Mengen eingeben und sammeln' },
    { num: '3', title: 'Checkout', desc: 'Lieferdatum und Adresse auswählen' },
    { num: '4', title: 'E-Mail senden', desc: 'Bestellungen gehen direkt an Lieferanten' },
    { num: '5', title: 'Bestätigung', desc: 'Lieferant bestätigt per Link in der E-Mail' },
  ];

  steps.forEach((step, i) => {
    const stepY = y + i * 40;

    // Circle with number
    doc.setFillColor(...PRIMARY_COLOR);
    doc.circle(margin + 15, stepY + 10, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(step.num, margin + 12.5, stepY + 14);

    // Arrow (except last)
    if (i < steps.length - 1) {
      doc.setDrawColor(...PRIMARY_COLOR);
      doc.setLineWidth(0.5);
      doc.line(margin + 15, stepY + 22, margin + 15, stepY + 38);
    }

    // Content
    doc.setTextColor(...DARK_COLOR);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(step.title, margin + 35, stepY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...MUTED_COLOR);
    doc.text(step.desc, margin + 35, stepY + 16);
  });

  // ===== PAGE 7: Highlight Features =====
  doc.addPage();
  y = addSectionTitle('Highlight-Features', 30);

  const features = [
    { num: '01', name: 'Multi-Standort', desc: 'Mehrere Restaurants zentral verwalten' },
    { num: '02', name: 'EasyOrder', desc: 'Mitarbeiter bestellen per QR-Code – ohne Login' },
    { num: '03', name: 'Lieferantenportal', desc: 'Lieferanten pflegen ihre Daten selbst' },
    { num: '04', name: '6 Sprachen', desc: 'DE · EN · FR · IT · TH · VI' },
    { num: '05', name: 'KI-Foto-Erkennung', desc: 'Artikel per Foto erfassen – KI erkennt Produkt' },
    { num: '06', name: 'Weinkarte', desc: 'Dedizierte Weinverwaltung mit KI-Recherche' },
    { num: '07', name: 'Export', desc: 'PDF, Excel, CSV – alles exportierbar' },
    { num: '08', name: 'Demo-Modus', desc: '7 Tage kostenlos testen' },
  ];

  features.forEach((feat, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const boxX = margin + col * (contentWidth / 2 + 5);
    const boxY = y + row * 35;
    const boxWidth = contentWidth / 2 - 5;

    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(boxX, boxY, boxWidth, 30, 3, 3, 'F');

    // Numbered badge instead of emoji
    doc.setFillColor(...PRIMARY_COLOR);
    doc.roundedRect(boxX + 6, boxY + 8, 14, 14, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(feat.num, boxX + 9, boxY + 17);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK_COLOR);
    doc.text(feat.name, boxX + 25, boxY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...MUTED_COLOR);
    doc.text(feat.desc, boxX + 25, boxY + 22);
  });

  // ===== PAGE 8: Pricing =====
  doc.addPage();
  y = addSectionTitle('Transparente Preise', 30);

  const plans = [
    { name: 'FREE', price: '0 €', features: ['1 Benutzer', '1 Standort', '50 Artikel', 'Basis-Funktionen'] },
    { name: 'BASIC', price: '29 €', features: ['3 Benutzer', '2 Standorte', '500 Artikel', 'E-Mail-Support'] },
    { name: 'PRO', price: '79 €', features: ['10 Benutzer', '5 Standorte', 'Unbegrenzte Artikel', 'EasyOrder & Portal', 'Prioritäts-Support'], highlighted: true },
    { name: 'ENTERPRISE', price: 'Anfrage', features: ['Unbegrenzt', 'Unbegrenzt', 'SSO & API', 'Dedicated Support'] },
  ];

  const planWidth = (contentWidth - 15) / 4;
  plans.forEach((plan, i) => {
    const boxX = margin + i * (planWidth + 5);
    const isHighlighted = plan.highlighted;

    doc.setFillColor(isHighlighted ? 37 : 248, isHighlighted ? 99 : 250, isHighlighted ? 235 : 252);
    doc.roundedRect(boxX, y, planWidth, 125, 4, 4, 'F');

    // Highlight badge for PRO
    if (isHighlighted) {
      doc.setFillColor(...ACCENT_AMBER);
      doc.roundedRect(boxX + 2, y - 5, planWidth - 4, 12, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      const badgeText = 'EMPFOHLEN';
      const badgeWidth = doc.getTextWidth(badgeText);
      doc.text(badgeText, boxX + (planWidth - badgeWidth) / 2, y + 2);
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(isHighlighted ? 255 : 30, isHighlighted ? 255 : 41, isHighlighted ? 255 : 59);
    const nameWidth = doc.getTextWidth(plan.name);
    doc.text(plan.name, boxX + (planWidth - nameWidth) / 2, y + 20);

    doc.setFontSize(18);
    const priceWidth = doc.getTextWidth(plan.price);
    doc.text(plan.price, boxX + (planWidth - priceWidth) / 2, y + 38);

    doc.setFontSize(8);
    if (plan.name !== 'ENTERPRISE') {
      doc.text('/Monat', boxX + (planWidth - priceWidth) / 2 + priceWidth + 2, y + 38);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(isHighlighted ? 220 : 100, isHighlighted ? 220 : 116, isHighlighted ? 255 : 139);
    plan.features.forEach((f, fi) => {
      doc.text(`• ${f}`, boxX + 5, y + 55 + fi * 12);
    });
  });

  doc.setFontSize(10);
  doc.setTextColor(...MUTED_COLOR);
  centerText('Alle Preise zzgl. MwSt. | Jährliche Zahlung günstiger', y + 140, 10, MUTED_COLOR);

  // ===== PAGE 9: Testimonials =====
  doc.addPage();
  y = addSectionTitle('Was unsere Kunden sagen', 30);

  const testimonials = [
    { quote: 'Endlich keine Excel-Listen mehr! Mein Team bestellt jetzt selbstständig per QR-Code.', author: 'Küchenchef, Restaurant München' },
    { quote: 'Die Ausgabenübersicht hat uns geholfen, 15% bei Lieferanten einzusparen.', author: 'Inhaber, Gasthaus Hamburg' },
    { quote: 'Meine Lieferanten pflegen ihre Preise jetzt selbst – weniger Telefonate, weniger Fehler.', author: 'F&B Manager, Hotel Berlin' },
  ];

  testimonials.forEach((t, i) => {
    const boxY = y + i * 60;
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(margin, boxY, contentWidth, 50, 4, 4, 'F');

    // Stars as ASCII
    doc.setFontSize(12);
    doc.setTextColor(...ACCENT_AMBER);
    doc.text('★ ★ ★ ★ ★', margin + 10, boxY + 15);

    doc.setFontSize(12);
    doc.setTextColor(...DARK_COLOR);
    doc.setFont('helvetica', 'italic');
    doc.text(`"${t.quote}"`, margin + 10, boxY + 28, { maxWidth: contentWidth - 20 });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...MUTED_COLOR);
    doc.text(`— ${t.author}`, margin + 10, boxY + 42);
  });

  // ===== PAGE 10: Demo CTA =====
  doc.addPage();
  y = 40;

  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  centerText('Jetzt kostenlos testen', y, 28, PRIMARY_COLOR);
  y += 30;

  // Generate QR code
  try {
    const qrDataUrl = await QRCode.toDataURL('https://bestellung.pro/auth', {
      width: 150,
      margin: 2,
      color: { dark: '#1e293b', light: '#ffffff' },
    });
    doc.addImage(qrDataUrl, 'PNG', (pageWidth - 50) / 2, y, 50, 50);
  } catch (e) {
    // Fallback if QR generation fails
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect((pageWidth - 50) / 2, y, 50, 50, 4, 4, 'F');
    doc.setTextColor(...MUTED_COLOR);
    doc.setFontSize(10);
    centerText('[QR Code]', y + 28, 10, MUTED_COLOR);
  }

  y += 65;

  doc.setFontSize(14);
  doc.setTextColor(...DARK_COLOR);
  centerText('Scannen oder besuchen Sie:', y, 14, DARK_COLOR);
  y += 12;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  centerText('bestellung.pro/auth', y, 16, PRIMARY_COLOR);
  y += 30;

  const ctaFeatures = [
    '7 Tage kostenlos',
    'Vorgefüllte Demo-Daten',
    'Alle Funktionen verfügbar',
    'Später in echtes Konto umwandeln',
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(...DARK_COLOR);
  ctaFeatures.forEach((f, i) => {
    // Green checkmark
    doc.setFillColor(...ACCENT_GREEN);
    doc.circle((pageWidth / 2) - 55, y + i * 15 - 1.5, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text('✓', (pageWidth / 2) - 56.5, y + i * 15);
    
    doc.setFontSize(14);
    doc.setTextColor(...DARK_COLOR);
    doc.text(f, (pageWidth / 2) - 45, y + i * 15);
  });

  // ===== PAGE 11: Contact =====
  doc.addPage();
  y = addSectionTitle('Kontakt', 30);

  const contact = contactInfo || {
    email: 'info@bestellung.pro',
    website: 'www.bestellung.pro',
    phone: '+49 89 123 456 789',
    companyName: 'Bestellung.pro GmbH',
    address: 'München, Deutschland',
  };

  doc.setFontSize(14);
  doc.setTextColor(...DARK_COLOR);
  
  // Contact items with text labels instead of emojis
  const contactItems = [
    { label: 'E-Mail:', value: contact.email || '' },
    { label: 'Website:', value: contact.website || '' },
    { label: 'Telefon:', value: contact.phone || '' },
  ];
  
  contactItems.forEach((item, i) => {
    doc.setFont('helvetica', 'bold');
    doc.text(item.label, margin, y + 10 + i * 15);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text(item.value, margin + 25, y + 10 + i * 15);
    doc.setTextColor(...DARK_COLOR);
  });

  y += 60;

  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(margin, y, contentWidth, 60, 4, 4, 'F');

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK_COLOR);
  doc.text('Unternehmen', margin + 10, y + 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(...MUTED_COLOR);
  doc.text(contact.companyName || 'Bestellung.pro GmbH', margin + 10, y + 30);
  doc.text(contact.address || 'München, Deutschland', margin + 10, y + 42);

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(...MUTED_COLOR);
  centerText(`© ${new Date().getFullYear()} Bestellung.pro | Alle Rechte vorbehalten`, pageHeight - 20, 10, MUTED_COLOR);

  // Add page numbers to all pages
  addPageNumbers();

  // Save
  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`Bestellung.pro_Systemuebersicht_${dateStr}.pdf`);
};
