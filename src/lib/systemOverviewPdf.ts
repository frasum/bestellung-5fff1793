import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

const PRIMARY_COLOR: [number, number, number] = [37, 99, 235]; // Blue 600
const DARK_COLOR: [number, number, number] = [30, 41, 59]; // Slate 800
const MUTED_COLOR: [number, number, number] = [100, 116, 139]; // Slate 500
const LIGHT_BG: [number, number, number] = [248, 250, 252]; // Slate 50

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

  // ===== PAGE 1: Cover =====
  // Background accent
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 80, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  centerText('Bestellung.pro', 50, 36, [255, 255, 255]);

  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  centerText('Digitale Beschaffung für Gastronomie', 65, 16, [255, 255, 255]);

  // Main content area
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(margin, 100, contentWidth, 80, 5, 5, 'F');

  doc.setTextColor(...DARK_COLOR);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  centerText('Systemübersicht', 130, 24, DARK_COLOR);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  centerText('Die komplette Lösung für Ihre Restaurant-Beschaffung', 145, 14, MUTED_COLOR);

  // Date
  const currentDate = new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long' });
  centerText(`Stand: ${currentDate}`, 170, 12, MUTED_COLOR);

  // Footer
  doc.setFontSize(10);
  centerText('www.bestellung.pro', pageHeight - 20, 10, PRIMARY_COLOR);

  // ===== PAGE 2: Why Bestellung.pro? =====
  doc.addPage();
  let y = addSectionTitle('Warum Bestellung.pro?', 30);

  doc.setFontSize(14);
  doc.setTextColor(...MUTED_COLOR);
  doc.text('Endlich Ordnung in Ihrer Gastronomie-Beschaffung', margin, y);
  y += 15;

  const benefits = [
    { icon: '⏱️', title: 'Zeit sparen', desc: 'Keine Excel-Listen, keine Zettelwirtschaft. Bestellen in Minuten statt Stunden.' },
    { icon: '💰', title: 'Kosten senken', desc: 'Ausgabenübersicht, Preishistorie, keine Doppelbestellungen mehr.' },
    { icon: '🌍', title: 'Überall nutzbar', desc: 'Cloud-basiert, auf jedem Gerät – Desktop, Tablet, Smartphone.' },
    { icon: '👥', title: 'Team einbinden', desc: 'Vom Koch bis zum Manager – jeder kann mitbestellen per QR-Code.' },
    { icon: '📧', title: 'Automatische E-Mails', desc: 'Bestellungen gehen direkt an Lieferanten – mit einem Klick.' },
    { icon: '🔒', title: 'Volle Kontrolle', desc: 'Rollen & Rechte, Freigabeprozesse, Nachverfolgung.' },
  ];

  benefits.forEach((benefit, i) => {
    const boxY = y + (i * 35);
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(margin, boxY, contentWidth, 30, 3, 3, 'F');

    doc.setFontSize(18);
    doc.text(benefit.icon, margin + 8, boxY + 18);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK_COLOR);
    doc.text(benefit.title, margin + 25, boxY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...MUTED_COLOR);
    doc.text(benefit.desc, margin + 25, boxY + 22);
  });

  // ===== PAGE 3: Main Modules =====
  doc.addPage();
  y = addSectionTitle('Die 4 Hauptmodule', 30);

  const modules = [
    { icon: '📦', name: 'KATALOG', features: ['Lieferanten & Artikel verwalten', 'KI-Foto-Import', 'CSV/Excel Import'] },
    { icon: '🛒', name: 'BESTELLUNGEN', features: ['Bestellhistorie', 'Vorbestellungen', 'EasyOrder für Mitarbeiter'] },
    { icon: '📊', name: 'BERICHTE', features: ['Dashboard & KPIs', 'Ausgabenanalyse', 'Inventur'] },
    { icon: '⚙️', name: 'EINSTELLUNGEN', features: ['Team & Rollen', 'Standorte & Adressen', 'E-Mail-Vorlagen'] },
  ];

  modules.forEach((mod, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const boxX = margin + col * (contentWidth / 2 + 5);
    const boxY = y + row * 70;
    const boxWidth = contentWidth / 2 - 5;

    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(boxX, boxY, boxWidth, 60, 4, 4, 'F');

    doc.setFontSize(24);
    doc.text(mod.icon, boxX + 10, boxY + 20);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text(mod.name, boxX + 10, boxY + 35);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...MUTED_COLOR);
    mod.features.forEach((f, fi) => {
      doc.text(`• ${f}`, boxX + 12, boxY + 44 + fi * 5);
    });
  });

  // ===== PAGE 4: User Roles =====
  doc.addPage();
  y = addSectionTitle('Benutzergruppen & Rollen', 30);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK_COLOR);
  doc.text('Interne Benutzer', margin, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    head: [['Rolle', 'Symbol', 'Typische Aufgaben']],
    body: [
      ['Admin', '👑', 'Vollzugriff: Lieferanten, Team, Berichte, Einstellungen'],
      ['Manager', '📋', 'Bestellungen freigeben, Inventur durchführen'],
      ['Einkäufer', '🛒', 'Bestellen, Warenkorb verwalten'],
      ['Betrachter', '👁️', 'Berichte ansehen (nur lesen)'],
    ],
    margin: { left: margin },
    headStyles: { fillColor: PRIMARY_COLOR, textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: LIGHT_BG },
    styles: { fontSize: 11 },
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

  // ===== PAGE 5: Order Process =====
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

  // ===== PAGE 6: Highlight Features =====
  doc.addPage();
  y = addSectionTitle('Highlight-Features', 30);

  const features = [
    { icon: '🏢', name: 'Multi-Standort', desc: 'Mehrere Restaurants zentral verwalten' },
    { icon: '📱', name: 'EasyOrder', desc: 'Mitarbeiter bestellen per QR-Code – ohne Login' },
    { icon: '🔗', name: 'Lieferantenportal', desc: 'Lieferanten pflegen ihre Daten selbst' },
    { icon: '🌍', name: '6 Sprachen', desc: '🇩🇪 🇬🇧 🇫🇷 🇮🇹 🇹🇭 🇻🇳' },
    { icon: '📷', name: 'KI-Foto-Erkennung', desc: 'Artikel per Foto erfassen – KI erkennt Produkt' },
    { icon: '🍷', name: 'Weinkarte', desc: 'Dedizierte Weinverwaltung mit KI-Recherche' },
    { icon: '📄', name: 'Export', desc: 'PDF, Excel, CSV – alles exportierbar' },
    { icon: '🚀', name: 'Demo-Modus', desc: '7 Tage kostenlos testen' },
  ];

  features.forEach((feat, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const boxX = margin + col * (contentWidth / 2 + 5);
    const boxY = y + row * 35;
    const boxWidth = contentWidth / 2 - 5;

    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(boxX, boxY, boxWidth, 30, 3, 3, 'F');

    doc.setFontSize(16);
    doc.text(feat.icon, boxX + 8, boxY + 18);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK_COLOR);
    doc.text(feat.name, boxX + 25, boxY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...MUTED_COLOR);
    doc.text(feat.desc, boxX + 25, boxY + 22);
  });

  // ===== PAGE 7: Pricing =====
  doc.addPage();
  y = addSectionTitle('Transparente Preise', 30);

  const plans = [
    { name: 'FREE', price: '0 €', features: ['1 Benutzer', '1 Standort', '50 Artikel', 'Basis-Funktionen'] },
    { name: 'BASIC', price: '29 €', features: ['3 Benutzer', '2 Standorte', '500 Artikel', 'E-Mail-Support'] },
    { name: 'PRO ⭐', price: '79 €', features: ['10 Benutzer', '5 Standorte', 'Unbegrenzte Artikel', 'EasyOrder & Portal', 'Prioritäts-Support'] },
    { name: 'ENTERPRISE', price: 'Auf Anfrage', features: ['Unbegrenzt', 'Unbegrenzt', 'SSO & API', 'Dedicated Support'] },
  ];

  const planWidth = (contentWidth - 15) / 4;
  plans.forEach((plan, i) => {
    const boxX = margin + i * (planWidth + 5);
    const isHighlighted = plan.name.includes('PRO');

    doc.setFillColor(isHighlighted ? 37 : 248, isHighlighted ? 99 : 250, isHighlighted ? 235 : 252);
    doc.roundedRect(boxX, y, planWidth, 120, 4, 4, 'F');

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(isHighlighted ? 255 : 30, isHighlighted ? 255 : 41, isHighlighted ? 255 : 59);
    const nameWidth = doc.getTextWidth(plan.name);
    doc.text(plan.name, boxX + (planWidth - nameWidth) / 2, y + 15);

    doc.setFontSize(18);
    const priceWidth = doc.getTextWidth(plan.price);
    doc.text(plan.price, boxX + (planWidth - priceWidth) / 2, y + 35);

    doc.setFontSize(8);
    if (!plan.name.includes('ENTERPRISE')) {
      doc.text('/Monat', boxX + (planWidth - priceWidth) / 2 + priceWidth + 2, y + 35);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(isHighlighted ? 220 : 100, isHighlighted ? 220 : 116, isHighlighted ? 255 : 139);
    plan.features.forEach((f, fi) => {
      doc.text(`• ${f}`, boxX + 5, y + 50 + fi * 12);
    });
  });

  doc.setFontSize(10);
  doc.setTextColor(...MUTED_COLOR);
  centerText('Alle Preise zzgl. MwSt. | Jährliche Zahlung günstiger', y + 135, 10, MUTED_COLOR);

  // ===== PAGE 8: Testimonials =====
  doc.addPage();
  y = addSectionTitle('Was unsere Kunden sagen', 30);

  const testimonials = [
    { quote: 'Endlich keine Excel-Listen mehr! Mein Team bestellt jetzt selbstständig per QR-Code.', author: '[Name], Küchenchef' },
    { quote: 'Die Ausgabenübersicht hat uns geholfen, 15% bei Lieferanten einzusparen.', author: '[Name], Inhaber' },
    { quote: 'Meine Lieferanten pflegen ihre Preise jetzt selbst – weniger Telefonate, weniger Fehler.', author: '[Name], F&B Manager' },
  ];

  testimonials.forEach((t, i) => {
    const boxY = y + i * 60;
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(margin, boxY, contentWidth, 50, 4, 4, 'F');

    doc.setFontSize(12);
    doc.setTextColor(245, 158, 11); // Amber for stars
    doc.text('⭐⭐⭐⭐⭐', margin + 10, boxY + 15);

    doc.setFontSize(12);
    doc.setTextColor(...DARK_COLOR);
    doc.setFont('helvetica', 'italic');
    doc.text(`"${t.quote}"`, margin + 10, boxY + 28, { maxWidth: contentWidth - 20 });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...MUTED_COLOR);
    doc.text(`— ${t.author}`, margin + 10, boxY + 42);
  });

  doc.setFontSize(11);
  doc.setTextColor(...PRIMARY_COLOR);
  centerText('[Platzhalter – echte Testimonials einfügen]', y + 200, 11, PRIMARY_COLOR);

  // ===== PAGE 9: Demo CTA =====
  doc.addPage();
  y = 40;

  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  centerText('🚀 Jetzt kostenlos testen', y, 28, PRIMARY_COLOR);
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
    '✓ 7 Tage kostenlos',
    '✓ Vorgefüllte Demo-Daten',
    '✓ Alle Funktionen verfügbar',
    '✓ Später in echtes Konto umwandeln',
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(...DARK_COLOR);
  ctaFeatures.forEach((f, i) => {
    centerText(f, y + i * 15, 14, DARK_COLOR);
  });

  // ===== PAGE 10: Contact =====
  doc.addPage();
  y = addSectionTitle('Kontakt', 30);

  const contact = contactInfo || {
    email: 'info@bestellung.pro',
    website: 'www.bestellung.pro',
    phone: '[Telefonnummer einfügen]',
    companyName: '[Firmenname]',
    address: '[Adresse einfügen]',
  };

  doc.setFontSize(14);
  doc.setTextColor(...DARK_COLOR);
  doc.text(`📧  E-Mail: ${contact.email}`, margin, y + 10);
  doc.text(`🌐  Website: ${contact.website}`, margin, y + 25);
  doc.text(`📱  Telefon: ${contact.phone}`, margin, y + 40);

  y += 70;

  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(margin, y, contentWidth, 60, 4, 4, 'F');

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK_COLOR);
  doc.text('Unternehmen', margin + 10, y + 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(...MUTED_COLOR);
  doc.text(contact.companyName || '[Firmenname]', margin + 10, y + 30);
  doc.text(contact.address || '[Adresse einfügen]', margin + 10, y + 42);

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(...MUTED_COLOR);
  centerText(`© ${new Date().getFullYear()} Bestellung.pro | Alle Rechte vorbehalten`, pageHeight - 20, 10, MUTED_COLOR);

  // Save
  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`Bestellung.pro_Systemuebersicht_${dateStr}.pdf`);
};
