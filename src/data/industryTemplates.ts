export interface IndustryTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  terminology: {
    supplier: string;
    supplierPlural: string;
    article: string;
    articlePlural: string;
    order: string;
  };
  categories: string[];
  units: string[];
  exampleSuppliers: {
    name: string;
    articles: { name: string; unit: string; price: number; category: string }[];
  }[];
}

export const industryTemplates: IndustryTemplate[] = [
  {
    id: 'gastronomy',
    name: 'Gastronomie',
    icon: 'UtensilsCrossed',
    description: 'Restaurants, Cafés, Hotels, Catering',
    terminology: {
      supplier: 'Lieferant',
      supplierPlural: 'Lieferanten',
      article: 'Artikel',
      articlePlural: 'Artikel',
      order: 'Bestellung',
    },
    categories: ['Obst', 'Gemüse', 'Fleisch', 'Fisch', 'Getränke', 'Milchprodukte', 'Gewürze', 'Backwaren', 'Reinigung', 'Verpackung'],
    units: ['kg', 'g', 'L', 'ml', 'Stück', 'Kiste', 'Karton', 'Pkg', 'Bund', 'Palette'],
    exampleSuppliers: [
      {
        name: 'Frischemarkt GmbH',
        articles: [
          { name: 'Tomaten', unit: 'kg', price: 2.50, category: 'Gemüse' },
          { name: 'Salat Kopf', unit: 'Stück', price: 1.20, category: 'Gemüse' },
          { name: 'Äpfel Elstar', unit: 'kg', price: 2.80, category: 'Obst' },
          { name: 'Zwiebeln', unit: 'kg', price: 1.80, category: 'Gemüse' },
          { name: 'Kartoffeln', unit: 'kg', price: 1.50, category: 'Gemüse' },
          { name: 'Paprika rot', unit: 'kg', price: 3.90, category: 'Gemüse' },
          { name: 'Gurken', unit: 'Stück', price: 0.90, category: 'Gemüse' },
          { name: 'Bananen', unit: 'kg', price: 1.99, category: 'Obst' },
          { name: 'Orangen', unit: 'kg', price: 2.50, category: 'Obst' },
          { name: 'Champignons', unit: 'kg', price: 4.50, category: 'Gemüse' },
        ],
      },
      {
        name: 'Metzgerei Schmidt',
        articles: [
          { name: 'Rinderhüfte', unit: 'kg', price: 24.90, category: 'Fleisch' },
          { name: 'Hähnchenbrust', unit: 'kg', price: 12.50, category: 'Fleisch' },
          { name: 'Schweinefilet', unit: 'kg', price: 15.90, category: 'Fleisch' },
          { name: 'Hackfleisch gemischt', unit: 'kg', price: 9.90, category: 'Fleisch' },
          { name: 'Bratwurst', unit: 'kg', price: 8.50, category: 'Fleisch' },
          { name: 'Putenschnitzel', unit: 'kg', price: 14.90, category: 'Fleisch' },
          { name: 'Rindergulasch', unit: 'kg', price: 18.50, category: 'Fleisch' },
          { name: 'Speck', unit: 'kg', price: 12.00, category: 'Fleisch' },
        ],
      },
      {
        name: 'Getränke-Express',
        articles: [
          { name: 'Mineralwasser', unit: 'Kiste', price: 8.90, category: 'Getränke' },
          { name: 'Cola 1L', unit: 'Kiste', price: 15.90, category: 'Getränke' },
          { name: 'Apfelsaft', unit: 'Kiste', price: 12.50, category: 'Getränke' },
          { name: 'Orangensaft', unit: 'Kiste', price: 14.90, category: 'Getränke' },
          { name: 'Bier Pils', unit: 'Kiste', price: 16.90, category: 'Getränke' },
          { name: 'Weißwein trocken', unit: 'Kiste', price: 48.00, category: 'Getränke' },
          { name: 'Rotwein', unit: 'Kiste', price: 54.00, category: 'Getränke' },
          { name: 'Espresso Bohnen', unit: 'kg', price: 22.00, category: 'Getränke' },
        ],
      },
    ],
  },
  {
    id: 'healthcare',
    name: 'Gesundheitswesen',
    icon: 'Heart',
    description: 'Arztpraxen, Kliniken, Pflegeeinrichtungen',
    terminology: {
      supplier: 'Lieferant',
      supplierPlural: 'Lieferanten',
      article: 'Produkt',
      articlePlural: 'Produkte',
      order: 'Bestellung',
    },
    categories: ['Medizinbedarf', 'Hygiene', 'Pflegeprodukte', 'Büromaterial', 'Reinigung', 'Schutzausrüstung', 'Desinfektion', 'Verbandsmaterial'],
    units: ['Stück', 'Pkg', 'Karton', 'Flasche', 'Tube', 'Box', 'Rolle', 'Set'],
    exampleSuppliers: [
      {
        name: 'Medizinprodukte GmbH',
        articles: [
          { name: 'Einmalhandschuhe M', unit: 'Box', price: 12.90, category: 'Schutzausrüstung' },
          { name: 'Mundschutz OP', unit: 'Pkg', price: 8.50, category: 'Schutzausrüstung' },
          { name: 'Desinfektionsmittel 1L', unit: 'Flasche', price: 7.20, category: 'Desinfektion' },
          { name: 'Pflaster Sortiment', unit: 'Box', price: 15.90, category: 'Verbandsmaterial' },
          { name: 'Mullbinden 10cm', unit: 'Pkg', price: 6.50, category: 'Verbandsmaterial' },
          { name: 'Spritzen 5ml', unit: 'Box', price: 18.00, category: 'Medizinbedarf' },
          { name: 'Kanülen', unit: 'Box', price: 14.50, category: 'Medizinbedarf' },
          { name: 'Fieberthermometer', unit: 'Stück', price: 8.90, category: 'Medizinbedarf' },
          { name: 'Blutdruckmessgerät', unit: 'Stück', price: 45.00, category: 'Medizinbedarf' },
          { name: 'Stethoskop', unit: 'Stück', price: 28.00, category: 'Medizinbedarf' },
        ],
      },
      {
        name: 'Hygiene-Fachhandel',
        articles: [
          { name: 'Händedesinfektion 500ml', unit: 'Flasche', price: 4.90, category: 'Hygiene' },
          { name: 'Papierhandtücher', unit: 'Karton', price: 28.00, category: 'Hygiene' },
          { name: 'Toilettenpapier', unit: 'Karton', price: 32.00, category: 'Hygiene' },
          { name: 'Flüssigseife 1L', unit: 'Flasche', price: 5.50, category: 'Hygiene' },
          { name: 'Abfallbeutel 60L', unit: 'Pkg', price: 8.90, category: 'Hygiene' },
          { name: 'Reinigungstücher', unit: 'Karton', price: 18.00, category: 'Reinigung' },
          { name: 'Flächendesinfektion 5L', unit: 'Stück', price: 24.00, category: 'Desinfektion' },
          { name: 'Handcreme 200ml', unit: 'Tube', price: 6.90, category: 'Pflegeprodukte' },
        ],
      },
    ],
  },
  {
    id: 'retail',
    name: 'Einzelhandel',
    icon: 'ShoppingCart',
    description: 'Geschäfte, Supermärkte, Kioske',
    terminology: {
      supplier: 'Großhändler',
      supplierPlural: 'Großhändler',
      article: 'Ware',
      articlePlural: 'Waren',
      order: 'Bestellung',
    },
    categories: ['Lebensmittel', 'Haushalt', 'Elektronik', 'Textil', 'Drogeriewaren', 'Getränke', 'Tiefkühl', 'Süßwaren'],
    units: ['Stück', 'Pkg', 'Karton', 'Palette', 'Kiste', 'Tray', 'Display'],
    exampleSuppliers: [
      {
        name: 'Großhandel Central',
        articles: [
          { name: 'Chips Sortiment', unit: 'Karton', price: 24.00, category: 'Süßwaren' },
          { name: 'Softdrinks Mix', unit: 'Palette', price: 180.00, category: 'Getränke' },
          { name: 'Schokolade Tafeln', unit: 'Karton', price: 36.00, category: 'Süßwaren' },
          { name: 'Gummibärchen', unit: 'Karton', price: 28.00, category: 'Süßwaren' },
          { name: 'Energydrinks', unit: 'Tray', price: 18.00, category: 'Getränke' },
          { name: 'Kekse Sortiment', unit: 'Karton', price: 22.00, category: 'Süßwaren' },
          { name: 'Tiefkühl Pizza', unit: 'Karton', price: 45.00, category: 'Tiefkühl' },
          { name: 'Eiscreme', unit: 'Karton', price: 38.00, category: 'Tiefkühl' },
        ],
      },
      {
        name: 'Haushaltwaren Meyer',
        articles: [
          { name: 'Spülmittel 1L', unit: 'Karton', price: 18.00, category: 'Haushalt' },
          { name: 'Müllbeutel 60L', unit: 'Pkg', price: 3.50, category: 'Haushalt' },
          { name: 'Waschmittel 3kg', unit: 'Karton', price: 42.00, category: 'Haushalt' },
          { name: 'Küchentücher', unit: 'Karton', price: 24.00, category: 'Haushalt' },
          { name: 'Schwämme Set', unit: 'Pkg', price: 4.90, category: 'Haushalt' },
          { name: 'Glasreiniger 1L', unit: 'Karton', price: 21.00, category: 'Haushalt' },
          { name: 'WC-Reiniger', unit: 'Karton', price: 16.00, category: 'Haushalt' },
          { name: 'Alufolie Rolle', unit: 'Karton', price: 28.00, category: 'Haushalt' },
        ],
      },
    ],
  },
  {
    id: 'craft',
    name: 'Handwerk',
    icon: 'Wrench',
    description: 'Bau, Elektro, Sanitär, Maler',
    terminology: {
      supplier: 'Lieferant',
      supplierPlural: 'Lieferanten',
      article: 'Material',
      articlePlural: 'Materialien',
      order: 'Bestellung',
    },
    categories: ['Werkzeuge', 'Baumaterial', 'Elektro', 'Sanitär', 'Schutzausrüstung', 'Farben & Lacke', 'Befestigung', 'Verbrauchsmaterial'],
    units: ['Stück', 'm', 'm²', 'm³', 'kg', 'L', 'Pkg', 'Sack', 'Rolle', 'Karton'],
    exampleSuppliers: [
      {
        name: 'Baustoffhandel Müller',
        articles: [
          { name: 'Zement 25kg', unit: 'Sack', price: 4.50, category: 'Baumaterial' },
          { name: 'Estrich Mörtel', unit: 'Sack', price: 6.80, category: 'Baumaterial' },
          { name: 'Gipskarton 2m', unit: 'Stück', price: 8.90, category: 'Baumaterial' },
          { name: 'Dämmwolle 100mm', unit: 'm²', price: 12.50, category: 'Baumaterial' },
          { name: 'Sand gewaschen', unit: 'Sack', price: 3.20, category: 'Baumaterial' },
          { name: 'Kies 16-32mm', unit: 'Sack', price: 4.90, category: 'Baumaterial' },
          { name: 'Wandfarbe weiß 10L', unit: 'Stück', price: 38.00, category: 'Farben & Lacke' },
          { name: 'Holzschrauben Set', unit: 'Pkg', price: 8.90, category: 'Befestigung' },
          { name: 'Dübel Sortiment', unit: 'Pkg', price: 12.50, category: 'Befestigung' },
          { name: 'Klebeband Malerkrepp', unit: 'Rolle', price: 4.50, category: 'Verbrauchsmaterial' },
        ],
      },
      {
        name: 'Elektro-Großhandel',
        articles: [
          { name: 'NYM-J 3x1.5', unit: 'm', price: 0.85, category: 'Elektro' },
          { name: 'Steckdose UP', unit: 'Stück', price: 3.20, category: 'Elektro' },
          { name: 'Lichtschalter UP', unit: 'Stück', price: 4.50, category: 'Elektro' },
          { name: 'Verteilerdose', unit: 'Stück', price: 2.80, category: 'Elektro' },
          { name: 'LED Leuchtmittel E27', unit: 'Stück', price: 5.90, category: 'Elektro' },
          { name: 'Sicherung 16A', unit: 'Pkg', price: 8.90, category: 'Elektro' },
          { name: 'Kabelbinder Set', unit: 'Pkg', price: 6.50, category: 'Elektro' },
          { name: 'Isolierband', unit: 'Rolle', price: 2.50, category: 'Elektro' },
        ],
      },
    ],
  },
  {
    id: 'office',
    name: 'Büro & Dienstleistung',
    icon: 'Briefcase',
    description: 'Büros, Agenturen, Kanzleien',
    terminology: {
      supplier: 'Lieferant',
      supplierPlural: 'Lieferanten',
      article: 'Artikel',
      articlePlural: 'Artikel',
      order: 'Bestellung',
    },
    categories: ['Büromaterial', 'IT-Zubehör', 'Reinigung', 'Getränke', 'Druckerzubehör', 'Möbel', 'Catering'],
    units: ['Stück', 'Pkg', 'Karton', 'Box', 'Set', 'Rolle', 'Flasche'],
    exampleSuppliers: [
      {
        name: 'Bürobedarf GmbH',
        articles: [
          { name: 'Kopierpapier A4', unit: 'Karton', price: 32.00, category: 'Büromaterial' },
          { name: 'Kugelschreiber', unit: 'Pkg', price: 4.50, category: 'Büromaterial' },
          { name: 'Aktenordner A4', unit: 'Pkg', price: 12.90, category: 'Büromaterial' },
          { name: 'Haftnotizen Block', unit: 'Pkg', price: 5.90, category: 'Büromaterial' },
          { name: 'Locher', unit: 'Stück', price: 8.90, category: 'Büromaterial' },
          { name: 'Tacker', unit: 'Stück', price: 12.50, category: 'Büromaterial' },
          { name: 'Schere', unit: 'Stück', price: 6.90, category: 'Büromaterial' },
          { name: 'Textmarker Set', unit: 'Pkg', price: 7.50, category: 'Büromaterial' },
          { name: 'Druckerpapier bunt', unit: 'Pkg', price: 9.90, category: 'Büromaterial' },
          { name: 'Klebeband transparent', unit: 'Pkg', price: 4.50, category: 'Büromaterial' },
        ],
      },
      {
        name: 'IT-Service Partner',
        articles: [
          { name: 'Druckerpatrone schwarz', unit: 'Stück', price: 28.00, category: 'Druckerzubehör' },
          { name: 'USB-Kabel', unit: 'Stück', price: 6.90, category: 'IT-Zubehör' },
          { name: 'Maus kabellos', unit: 'Stück', price: 18.00, category: 'IT-Zubehör' },
          { name: 'Tastatur USB', unit: 'Stück', price: 24.00, category: 'IT-Zubehör' },
          { name: 'Monitor-Kabel HDMI', unit: 'Stück', price: 12.50, category: 'IT-Zubehör' },
          { name: 'Druckerpatrone farbig', unit: 'Stück', price: 38.00, category: 'Druckerzubehör' },
          { name: 'USB-Stick 32GB', unit: 'Stück', price: 9.90, category: 'IT-Zubehör' },
          { name: 'Webcam HD', unit: 'Stück', price: 45.00, category: 'IT-Zubehör' },
        ],
      },
    ],
  },
  {
    id: 'production',
    name: 'Produktion',
    icon: 'Factory',
    description: 'Fertigung, Werkstätten, Industrie',
    terminology: {
      supplier: 'Zulieferer',
      supplierPlural: 'Zulieferer',
      article: 'Material',
      articlePlural: 'Materialien',
      order: 'Bestellung',
    },
    categories: ['Rohmaterial', 'Ersatzteile', 'Verpackung', 'Schmierstoffe', 'Werkzeuge', 'Schutzausrüstung', 'Reinigung', 'Maschinenteile'],
    units: ['kg', 'L', 'Stück', 'm', 'm²', 'Palette', 'Karton', 'Fass', 'Container'],
    exampleSuppliers: [
      {
        name: 'Industriebedarf AG',
        articles: [
          { name: 'Maschinenöl 5L', unit: 'Stück', price: 35.00, category: 'Schmierstoffe' },
          { name: 'Arbeitshandschuhe', unit: 'Pkg', price: 18.50, category: 'Schutzausrüstung' },
          { name: 'Schutzbrillen', unit: 'Pkg', price: 24.90, category: 'Schutzausrüstung' },
          { name: 'Gehörschutz', unit: 'Pkg', price: 15.00, category: 'Schutzausrüstung' },
          { name: 'Sicherheitsschuhe', unit: 'Stück', price: 89.00, category: 'Schutzausrüstung' },
          { name: 'Schmierfett 1kg', unit: 'Stück', price: 12.50, category: 'Schmierstoffe' },
          { name: 'Reinigungstücher Industrie', unit: 'Karton', price: 28.00, category: 'Reinigung' },
          { name: 'Kabelbinder Set', unit: 'Pkg', price: 8.90, category: 'Werkzeuge' },
          { name: 'Warnwesten', unit: 'Pkg', price: 22.00, category: 'Schutzausrüstung' },
          { name: 'Erste-Hilfe-Kasten', unit: 'Stück', price: 45.00, category: 'Schutzausrüstung' },
        ],
      },
      {
        name: 'Rohmaterial-Handel',
        articles: [
          { name: 'Stahlblech 1mm', unit: 'm²', price: 12.50, category: 'Rohmaterial' },
          { name: 'Aluprofil 20x20', unit: 'm', price: 4.80, category: 'Rohmaterial' },
          { name: 'Edelstahlblech 2mm', unit: 'm²', price: 28.00, category: 'Rohmaterial' },
          { name: 'Kupferrohr 15mm', unit: 'm', price: 8.50, category: 'Rohmaterial' },
          { name: 'Kunststoffplatten', unit: 'm²', price: 18.00, category: 'Rohmaterial' },
          { name: 'Schrauben-Set M8', unit: 'Pkg', price: 12.90, category: 'Ersatzteile' },
          { name: 'Nieten Sortiment', unit: 'Pkg', price: 9.50, category: 'Ersatzteile' },
          { name: 'Schweißdraht 1kg', unit: 'Stück', price: 15.00, category: 'Rohmaterial' },
        ],
      },
    ],
  },
  {
    id: 'other',
    name: 'Andere Branche',
    icon: 'Settings',
    description: 'Individuelle Einrichtung',
    terminology: {
      supplier: 'Lieferant',
      supplierPlural: 'Lieferanten',
      article: 'Artikel',
      articlePlural: 'Artikel',
      order: 'Bestellung',
    },
    categories: [],
    units: ['Stück', 'kg', 'L', 'm', 'Pkg', 'Karton'],
    exampleSuppliers: [],
  },
];

export const getIndustryById = (id: string): IndustryTemplate | undefined => {
  return industryTemplates.find((t) => t.id === id);
};
