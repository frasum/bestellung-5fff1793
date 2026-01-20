import { User, Upload, Layers, Camera, Settings, Users, GripVertical, BarChart3 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface AdvancedFeature {
  name: string;
  description: string;
}

export interface AdvancedFeatureCategory {
  category: string;
  icon: LucideIcon;
  features: AdvancedFeature[];
}

export const advancedFeatures: AdvancedFeatureCategory[] = [
  {
    category: 'Auth-Seite',
    icon: User,
    features: [
      { name: 'Leere Demo', description: 'Erstellt Demo-Account ohne Beispieldaten zum Testen des Onboarding-Flows' },
      { name: 'Sprach-Assistent', description: 'Voice-basiertes Katalog-Setup mit ElevenLabs AI für hands-free Onboarding' },
    ]
  },
  {
    category: 'Katalog (Lieferanten)',
    icon: Upload,
    features: [
      { name: 'Export', description: 'Lieferantenliste als CSV, Excel oder PDF exportieren' },
      { name: 'Import', description: 'Massenimport von Lieferanten aus CSV/Excel-Dateien' },
      { name: 'Multi-Select', description: 'Mehrere Lieferanten gleichzeitig auswählen und bearbeiten' },
    ]
  },
  {
    category: 'Katalog (Artikel)',
    icon: Layers,
    features: [
      { name: 'Export', description: 'Artikelliste als CSV, Excel oder PDF exportieren' },
      { name: 'Import', description: 'Massenimport von Artikeln aus CSV/Excel-Dateien' },
      { name: 'Erweiterte Ansicht', description: 'Zusätzliche Spalten in der Artikeltabelle anzeigen' },
    ]
  },
  {
    category: 'Artikel-Formular',
    icon: Camera,
    features: [
      { name: 'KI-Foto-Erkennung', description: 'Automatische Artikelerkennung per Foto mittels AI-Bildanalyse' },
    ]
  },
  {
    category: 'Einstellungen - Profil',
    icon: Settings,
    features: [
      { name: 'Style Guide Link', description: 'Zugang zur Design-System Dokumentation (diese Seite)' },
      { name: 'i18n Check Tool', description: 'Übersetzungs-Vollständigkeit aller Sprachen prüfen' },
      { name: 'Testmodus Karte', description: 'E-Mails an eine Test-Adresse umleiten statt an echte Lieferanten' },
    ]
  },
  {
    category: 'Einstellungen - Organisation',
    icon: Layers,
    features: [
      { name: 'Artikel-Organisation', description: 'Kategorien und Sortierung der Artikel verwalten' },
    ]
  },
  {
    category: 'Einstellungen - Demo-Konten',
    icon: Users,
    features: [
      { name: 'Demo-Konten Tab', description: 'Alle Demo-Accounts der Plattform verwalten (nur Admins)' },
    ]
  },
  {
    category: 'Einstellungen - EasyOrder',
    icon: GripVertical,
    features: [
      { name: 'Reihenfolge Tab', description: 'Artikel-Reihenfolge per Drag & Drop anpassen' },
    ]
  },
  {
    category: 'Einstellungen - Nutzung',
    icon: BarChart3,
    features: [
      { name: 'Tier Dropdown', description: 'Subscription-Tier manuell ändern (für Testzwecke)' },
    ]
  },
];
