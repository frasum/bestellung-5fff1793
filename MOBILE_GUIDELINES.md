# Mobile-Optimierungs-Richtlinien

Diese Dokumentation beschreibt alle implementierten Mobile-Optimierungen und dient als Leitfaden für zukünftige Entwickler.

## Inhaltsverzeichnis

1. [Übersicht](#übersicht)
2. [Design-Prinzipien](#design-prinzipien)
3. [Implementierte Patterns](#implementierte-patterns)
4. [Optimierte Dateien](#optimierte-dateien)
5. [Utility Hook](#utility-hook)
6. [Checkliste für neue Komponenten](#checkliste-für-neue-komponenten)
7. [CSS Utility-Klassen](#css-utility-klassen)

---

## Übersicht

Die Anwendung ist vollständig für mobile Geräte optimiert mit:
- Touch-freundlichen Interaktionselementen (min. 44x44px Touch-Targets)
- Responsiven Layouts mit Breakpoint-basiertem Design
- Mobile-first Card-Views statt Desktop-Tabellen
- Optimierten Dialogen und Formularen

---

## Design-Prinzipien

### Touch-Target-Größen

| Element | Mobile | Desktop |
|---------|--------|---------|
| Primäre Buttons | `h-11` (44px) | `h-10` oder `h-9` |
| Sekundäre Buttons | `h-10` (40px) | `h-9` oder `h-8` |
| Icon Buttons | `h-10 w-10` | `h-8 w-8` oder `h-9 w-9` |
| Input-Felder | `h-11` (44px) | `h-9` oder `h-10` |
| Select Trigger | `h-11` | `h-10` |

### Responsive Breakpoints

```
sm: 640px   - Smartphones (landscape) / kleine Tablets
md: 768px   - Tablets
lg: 1024px  - Desktop
xl: 1280px  - Große Displays
```

---

## Implementierte Patterns

### 1. Responsive Button Pattern

```tsx
// Standard Action Button
<Button className="w-full sm:w-auto h-10 sm:h-9">
  Action
</Button>

// Icon-only auf Mobile, mit Text auf Desktop
<Button className="h-10 w-10 sm:h-9 sm:w-auto sm:px-3">
  <Icon className="h-4 w-4" />
  <span className="hidden sm:inline ml-2">Label</span>
</Button>

// Destructive Button mit voller Breite auf Mobile
<Button 
  variant="destructive" 
  className="w-full sm:w-auto h-10 sm:h-9"
>
  Löschen
</Button>
```

### 2. Dialog/AlertDialog Pattern

```tsx
// Responsive DialogContent
<DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
  {/* Content */}
</DialogContent>

// Responsive DialogFooter mit gestapelten Buttons auf Mobile
<DialogFooter className="flex-col sm:flex-row gap-2">
  <Button variant="outline" className="w-full sm:w-auto h-10 sm:h-9">
    Abbrechen
  </Button>
  <Button className="w-full sm:w-auto h-10 sm:h-9">
    Speichern
  </Button>
</DialogFooter>

// AlertDialog mit responsiven Buttons
<AlertDialogFooter className="flex-col sm:flex-row gap-2">
  <AlertDialogCancel className="w-full sm:w-auto h-10 sm:h-9">
    Abbrechen
  </AlertDialogCancel>
  <AlertDialogAction className="w-full sm:w-auto h-10 sm:h-9 bg-destructive hover:bg-destructive/90">
    Löschen
  </AlertDialogAction>
</AlertDialogFooter>
```

### 3. Input-Feld Pattern

```tsx
// Touch-optimiertes Input
<Input className="h-11 sm:h-9" />

// Touch-optimierter Select
<SelectTrigger className="h-11 sm:h-10">
  <SelectValue />
</SelectTrigger>

// Textarea mit iOS-Zoom-Prävention
<Textarea className="text-base min-h-[100px]" />
```

### 4. Mobile Card-View vs Desktop-Tabelle

```tsx
{/* Mobile Card View */}
<div className="sm:hidden space-y-3">
  {items.map((item) => (
    <div key={item.id} className="p-3 border rounded-lg space-y-2">
      <div className="flex justify-between items-start">
        <p className="font-medium">{item.name}</p>
        <span className="text-primary font-semibold">{item.value}</span>
      </div>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{item.detail}</span>
        <Badge>{item.status}</Badge>
      </div>
    </div>
  ))}
</div>

{/* Desktop Table */}
<div className="hidden sm:block">
  <Table>
    {/* Table content */}
  </Table>
</div>
```

### 5. Touch Manipulation

```tsx
// Verhindert 300ms Tap-Delay auf Touch-Geräten
<div className="touch-manipulation">
  {/* Interactive content */}
</div>
```

---

## Optimierte Dateien

### Pages

| Datei | Optimierungen |
|-------|---------------|
| `src/pages/Auth.tsx` | Responsive Card, touch-optimierte Inputs |
| `src/pages/Cart.tsx` | Mobile Card-View, responsive Buttons |
| `src/pages/Checkout.tsx` | Responsive Steps, touch-optimierte Formulare |
| `src/pages/Orders.tsx` | Mobile Tabs, responsive Filter |
| `src/pages/Reports.tsx` | Responsive Charts, Mobile Card-View für Tabellen |
| `src/pages/Settings.tsx` | Mobile Tabs, responsive Formulare |
| `src/pages/SimpleOrder.tsx` | Touch-optimierte Artikel-Karten |
| `src/pages/Suppliers.tsx` | Mobile Filter Sheet, Card-Views |
| `src/pages/SupplierPortal.tsx` | Touch-optimierte Artikel-Bearbeitung |

### Components

| Datei | Optimierungen |
|-------|---------------|
| `src/components/layout/DashboardLayout.tsx` | Mobile Navigation, Sidebar |
| `src/components/layout/MobileBottomNav.tsx` | Touch-optimierte Bottom-Navigation |
| `src/components/filters/MobileFilterSheet.tsx` | Responsive Filter-Dialoge |
| `src/components/GlobalSearch.tsx` | Responsive Suche mit Command-Palette |
| `src/components/suppliers/ArticleFormDialog.tsx` | Responsive Dialog, touch-optimierte Inputs |
| `src/components/suppliers/SupplierFormDialog.tsx` | Responsive Dialog, touch-optimierte Inputs |
| `src/components/checkout/EmailPreviewDialog.tsx` | Scrollbarer Content, responsive Footer |
| `src/components/reports/InventoryTab.tsx` | Responsive Dialoge, Mobile Session-Cards |
| `src/components/reports/InventoryComparisonDialog.tsx` | Mobile Card-Layout für Vergleiche |
| `src/components/settings/TeamTab.tsx` | Mobile Card-View für Team-Mitglieder |
| `src/components/settings/EmployeesTab.tsx` | Responsive Mitarbeiter-Dialoge |
| `src/components/simple-order/*.tsx` | Touch-optimierte EasyOrder-Komponenten |

---

## Utility Hook

### `src/hooks/use-mobile.tsx`

```tsx
import { useIsMobile } from "@/hooks/use-mobile";

function MyComponent() {
  const isMobile = useIsMobile();
  
  return isMobile ? <MobileView /> : <DesktopView />;
}
```

**Verwendung:**
- Bedingte Komponenten-Rendering
- Unterschiedliche Layouts basierend auf Viewport
- Touch vs. Hover-Interaktionen

---

## Checkliste für neue Komponenten

### ✅ Buttons
- [ ] Mindestens 44x44px Touch-Target auf Mobile (`h-10` oder `h-11`)
- [ ] `w-full sm:w-auto` für volle Breite auf Mobile
- [ ] Icon-Buttons: `h-10 w-10 sm:h-8 sm:w-8`

### ✅ Dialoge
- [ ] `max-w-[calc(100vw-1rem)] sm:max-w-{size}`
- [ ] `max-h-[90vh] overflow-y-auto` für lange Inhalte
- [ ] Footer: `flex-col sm:flex-row gap-2`

### ✅ Formulare
- [ ] Input-Felder: `h-11 sm:h-9`
- [ ] Select-Trigger: `h-11 sm:h-10`
- [ ] Textarea: `text-base` (verhindert iOS-Zoom)

### ✅ Tabellen
- [ ] Mobile Card-View mit `sm:hidden`
- [ ] Desktop-Tabelle mit `hidden sm:block`

### ✅ Filter & Navigation
- [ ] Touch-optimierte Filter-Chips
- [ ] Horizontal scrollbare Tabs auf Mobile
- [ ] MobileFilterSheet für komplexe Filter

---

## CSS Utility-Klassen

### Responsive Visibility

```css
sm:hidden        /* Versteckt ab 640px */
hidden sm:block  /* Sichtbar ab 640px */
md:hidden        /* Versteckt ab 768px */
hidden md:block  /* Sichtbar ab 768px */
```

### Responsive Spacing

```css
p-3 sm:p-4      /* Padding */
gap-2 sm:gap-4  /* Gap */
space-y-2 sm:space-y-4  /* Vertical spacing */
```

### Responsive Typography

```css
text-sm sm:text-base   /* Font size */
text-xs sm:text-sm     /* Smaller text */
```

### Touch Optimization

```css
touch-manipulation  /* Prevents 300ms tap delay */
active:scale-95     /* Touch feedback */
```

---

## Best Practices

1. **Mobile-First denken**: Beginne mit dem Mobile-Layout und erweitere für Desktop
2. **Touch-Targets prüfen**: Mindestens 44x44px für alle interaktiven Elemente
3. **Scroll-Verhalten testen**: Dialoge und lange Listen auf echten Geräten testen
4. **iOS-spezifische Fixes**: `text-base` für Inputs um Auto-Zoom zu verhindern
5. **Responsive Images**: `object-cover` und responsive Größen verwenden

---

*Letzte Aktualisierung: Dezember 2024*
