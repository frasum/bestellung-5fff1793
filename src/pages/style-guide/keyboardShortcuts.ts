import { Search, Navigation, CircleHelp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface KeyboardShortcut {
  keys: string;
  action: string;
  description: string;
}

export interface KeyboardShortcutCategory {
  category: string;
  icon: LucideIcon;
  shortcuts: KeyboardShortcut[];
}

export const keyboardShortcuts: KeyboardShortcutCategory[] = [
  {
    category: 'Suche & Navigation',
    icon: Search,
    shortcuts: [
      { keys: '⌘/Ctrl + K', action: 'Globale Suche öffnen', description: 'Schnellzugriff auf Suche nach Seiten, Lieferanten, Artikeln und Bestellungen' },
      { keys: '⌘/Ctrl + B', action: 'Sidebar ein-/ausblenden', description: 'Wechselt die Sidebar-Ansicht zwischen erweitert und eingeklappt' },
    ]
  },
  {
    category: 'Seitennavigation',
    icon: Navigation,
    shortcuts: [
      { keys: 'Alt + D', action: 'Dashboard', description: 'Navigiert zum Dashboard (Berichte)' },
      { keys: 'Alt + S', action: 'Lieferanten', description: 'Navigiert zur Lieferanten-Übersicht' },
      { keys: 'Alt + A', action: 'Artikel', description: 'Navigiert zur Artikel-Übersicht' },
      { keys: 'Alt + O', action: 'Bestellungen', description: 'Navigiert zur Bestellungs-Übersicht' },
      { keys: 'Alt + I', action: 'Inventur', description: 'Navigiert zur Inventur' },
      { keys: 'Alt + R', action: 'Berichte', description: 'Navigiert zu den Berichten' },
      { keys: 'Alt + C', action: 'Warenkorb', description: 'Navigiert zum Warenkorb' },
      { keys: 'Ctrl + ,', action: 'Einstellungen', description: 'Navigiert zu den Einstellungen' },
    ]
  },
  {
    category: 'Hilfe',
    icon: CircleHelp,
    shortcuts: [
      { keys: 'Shift + ?', action: 'Shortcuts anzeigen', description: 'Zeigt eine Toast-Benachrichtigung mit allen verfügbaren Shortcuts' },
    ]
  }
];
