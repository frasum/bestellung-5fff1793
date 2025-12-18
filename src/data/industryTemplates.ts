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
        ],
      },
      {
        name: 'Metzgerei Schmidt',
        articles: [
          { name: 'Rinderhüfte', unit: 'kg', price: 24.90, category: 'Fleisch' },
          { name: 'Hähnchenbrust', unit: 'kg', price: 12.50, category: 'Fleisch' },
        ],
      },
      {
        name: 'Getränke-Express',
        articles: [
          { name: 'Mineralwasser', unit: 'Kiste', price: 8.90, category: 'Getränke' },
          { name: 'Cola 1L', unit: 'Kiste', price: 15.90, category: 'Getränke' },
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
        ],
      },
      {
        name: 'Hygiene-Fachhandel',
        articles: [
          { name: 'Händedesinfektion 500ml', unit: 'Flasche', price: 4.90, category: 'Hygiene' },
          { name: 'Papierhandtücher', unit: 'Karton', price: 28.00, category: 'Hygiene' },
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
        ],
      },
      {
        name: 'Haushaltwaren Meyer',
        articles: [
          { name: 'Spülmittel 1L', unit: 'Karton', price: 18.00, category: 'Haushalt' },
          { name: 'Müllbeutel 60L', unit: 'Pkg', price: 3.50, category: 'Haushalt' },
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
        ],
      },
      {
        name: 'Elektro-Großhandel',
        articles: [
          { name: 'NYM-J 3x1.5', unit: 'm', price: 0.85, category: 'Elektro' },
          { name: 'Steckdose UP', unit: 'Stück', price: 3.20, category: 'Elektro' },
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
        ],
      },
      {
        name: 'IT-Service Partner',
        articles: [
          { name: 'Druckerpatrone schwarz', unit: 'Stück', price: 28.00, category: 'Druckerzubehör' },
          { name: 'USB-Kabel', unit: 'Stück', price: 6.90, category: 'IT-Zubehör' },
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
        ],
      },
      {
        name: 'Rohmaterial-Handel',
        articles: [
          { name: 'Stahlblech 1mm', unit: 'm²', price: 12.50, category: 'Rohmaterial' },
          { name: 'Aluprofil 20x20', unit: 'm', price: 4.80, category: 'Rohmaterial' },
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
