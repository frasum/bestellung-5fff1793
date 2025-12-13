# Design Tokens Documentation

Diese Dokumentation beschreibt alle verfügbaren Design-Tokens und Komponenten-Varianten für konsistente UI-Entwicklung.

---

## 🎨 Farb-Tokens

Alle Farben sind in HSL-Format definiert und unterstützen Light/Dark Mode automatisch.

### Semantische Farben

| Token | Verwendung | Tailwind-Klasse |
|-------|------------|-----------------|
| `--background` | Haupthintergrund | `bg-background` |
| `--foreground` | Haupttext auf Background | `text-foreground` |
| `--primary` | Primäre Aktionen, Buttons, Links | `bg-primary`, `text-primary` |
| `--primary-foreground` | Text auf Primary-Flächen | `text-primary-foreground` |
| `--secondary` | Sekundäre UI-Elemente | `bg-secondary`, `text-secondary` |
| `--secondary-foreground` | Text auf Secondary-Flächen | `text-secondary-foreground` |
| `--muted` | Gedämpfte Hintergründe | `bg-muted` |
| `--muted-foreground` | Gedämpfter Text, Platzhalter | `text-muted-foreground` |
| `--accent` | Hover-States, Highlights | `bg-accent` |
| `--accent-foreground` | Text auf Accent-Flächen | `text-accent-foreground` |
| `--destructive` | Fehler, Löschen-Aktionen | `bg-destructive`, `text-destructive` |
| `--destructive-foreground` | Text auf Destructive-Flächen | `text-destructive-foreground` |
| `--success` | Erfolg, Bestätigungen | `bg-success`, `text-success` |
| `--success-foreground` | Text auf Success-Flächen | `text-success-foreground` |

### UI-Element Farben

| Token | Verwendung | Tailwind-Klasse |
|-------|------------|-----------------|
| `--card` | Card-Hintergrund | `bg-card` |
| `--card-foreground` | Text in Cards | `text-card-foreground` |
| `--popover` | Popover/Dropdown-Hintergrund | `bg-popover` |
| `--popover-foreground` | Text in Popovers | `text-popover-foreground` |
| `--border` | Rahmen, Trennlinien | `border-border` |
| `--input` | Input-Rahmen | `border-input` |
| `--ring` | Focus-Ring | `ring-ring` |

### Sidebar-spezifische Farben

| Token | Verwendung |
|-------|------------|
| `--sidebar-background` | Sidebar-Hintergrund |
| `--sidebar-foreground` | Sidebar-Text |
| `--sidebar-primary` | Aktive Navigation |
| `--sidebar-accent` | Hover-State in Sidebar |
| `--sidebar-border` | Sidebar-Rahmen |

### Verwendungsbeispiele

```tsx
// ✅ RICHTIG - Semantische Tokens verwenden
<div className="bg-background text-foreground">
<Button className="bg-primary text-primary-foreground">
<p className="text-muted-foreground">

// ❌ FALSCH - Direkte Farben vermeiden
<div className="bg-white text-black">
<Button className="bg-blue-500 text-white">
```

---

## 📐 Spacing-Konventionen

### Standard-Abstände

| Kontext | Mobile | Desktop | Tailwind |
|---------|--------|---------|----------|
| Card Padding | `p-4` | `p-6` | `p-4 md:p-6` |
| Section Gap | `gap-4` | `gap-6` | `gap-4 md:gap-6` |
| Dialog Padding | `p-4` | `p-6` | `p-4 sm:p-6` |
| List Item Gap | `gap-2` | `gap-3` | `gap-2 md:gap-3` |
| Page Padding | `p-4` | `p-6` | `p-4 md:p-6` |

### Touch-Target Größen (Mobile)

| Element | Mindestgröße | Tailwind |
|---------|--------------|----------|
| Primary Button | 44px | `h-11` |
| Icon Button | 44px × 44px | `h-11 w-11` |
| Input Field | 44px | `h-11` |
| List Item | 48px | `min-h-12` |

### Responsive Pattern

```tsx
// Standard responsive Spacing
<div className="p-4 md:p-6 lg:p-8">
<div className="gap-3 md:gap-4 lg:gap-6">
<div className="space-y-4 md:space-y-6">
```

---

## 🔘 Komponenten-Varianten

### Button

| Variante | Verwendung | Beispiel |
|----------|------------|----------|
| `default` | Primäre Aktionen | Speichern, Bestätigen |
| `destructive` | Löschen, Abbrechen | Löschen, Entfernen |
| `outline` | Sekundäre Aktionen | Abbrechen, Zurück |
| `secondary` | Alternative Aktionen | Filter, Optionen |
| `ghost` | Subtile Aktionen | Icon-Buttons, Navigation |
| `link` | Inline-Links | Mehr erfahren |
| `hero` | Hervorgehobene CTAs | Hero-Section Buttons |

```tsx
<Button variant="default">Speichern</Button>
<Button variant="destructive">Löschen</Button>
<Button variant="outline">Abbrechen</Button>
<Button variant="ghost" size="icon"><X /></Button>
```

### Button Sizes

| Size | Höhe | Verwendung |
|------|------|------------|
| `default` | 40px (`h-10`) | Standard |
| `sm` | 36px (`h-9`) | Kompakte Bereiche |
| `lg` | 44px (`h-11`) | Mobile, CTAs |
| `icon` | 40px × 40px | Icon-only Buttons |

### Badge

| Variante | Verwendung |
|----------|------------|
| `default` | Standard-Labels |
| `secondary` | Neutrale Tags |
| `destructive` | Fehler, Warnungen |
| `outline` | Subtile Labels |

### Alert

| Variante | Verwendung |
|----------|------------|
| `default` | Information |
| `destructive` | Fehler, kritische Hinweise |

### Card

Standard-Struktur:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Titel</CardTitle>
    <CardDescription>Beschreibung</CardDescription>
  </CardHeader>
  <CardContent>Inhalt</CardContent>
  <CardFooter>Aktionen</CardFooter>
</Card>
```

---

## ✨ Animation-Tokens

### Verfügbare Animationen

| Animation | Verwendung | Klasse |
|-----------|------------|--------|
| `accordion-down` | Accordion öffnen | `animate-accordion-down` |
| `accordion-up` | Accordion schließen | `animate-accordion-up` |
| `pulse-cart` | Warenkorb-Feedback | `animate-pulse-cart` |
| `wiggle` | Aufmerksamkeit erregen | `animate-wiggle` |
| `fade-in` | Sanftes Einblenden | `animate-fade-in` |
| `scale-in` | Skalierendes Einblenden | `animate-scale-in` |
| `slide-up` | Von unten einschieben | `animate-slide-up` |

### Animation Keyframes

```css
/* fade-in: Opacity 0 → 1 */
/* scale-in: Scale 0.95 → 1, Opacity 0 → 1 */
/* slide-up: TranslateY 10px → 0, Opacity 0 → 1 */
```

### Verwendung

```tsx
// Einblend-Animation für neue Elemente
<div className="animate-fade-in">

// Kombinierte Animation für Dialoge
<div className="animate-scale-in">

// Attention-Animation
<Badge className="animate-wiggle">Neu</Badge>
```

---

## 📝 Typografie

### Schriftgrößen-Empfehlungen

| Kontext | Mobile | Desktop | Tailwind |
|---------|--------|---------|----------|
| Page Title | `text-xl` | `text-2xl` | `text-xl md:text-2xl` |
| Section Title | `text-lg` | `text-xl` | `text-lg md:text-xl` |
| Card Title | `text-base` | `text-lg` | `text-base md:text-lg` |
| Body Text | `text-sm` | `text-base` | `text-sm md:text-base` |
| Small Text | `text-xs` | `text-sm` | `text-xs md:text-sm` |
| Input (iOS) | `text-base` | `text-sm` | `text-base md:text-sm` |

> **Wichtig:** Inputs sollten auf Mobile mindestens `text-base` (16px) haben, um iOS-Zoom zu verhindern.

### Font Weights

| Verwendung | Weight | Tailwind |
|------------|--------|----------|
| Überschriften | 600 | `font-semibold` |
| Labels | 500 | `font-medium` |
| Body | 400 | `font-normal` |
| Muted | 400 | `font-normal text-muted-foreground` |

---

## 📱 Responsive Breakpoints

| Breakpoint | Breite | Verwendung |
|------------|--------|------------|
| `sm` | 640px | Kleine Tablets |
| `md` | 768px | Tablets |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Große Bildschirme |

### Mobile-First Pattern

```tsx
// Mobile zuerst, dann Desktop-Overrides
<div className="flex flex-col md:flex-row">
<div className="hidden md:block">  // Nur Desktop
<div className="md:hidden">        // Nur Mobile
```

---

## 🔧 Erweiterung der Tokens

### Neue Farbe hinzufügen

1. **In `src/index.css`** (HSL-Werte):
```css
:root {
  --warning: 38 92% 50%;
  --warning-foreground: 0 0% 100%;
}
.dark {
  --warning: 38 92% 50%;
  --warning-foreground: 0 0% 100%;
}
```

2. **In `tailwind.config.ts`**:
```typescript
colors: {
  warning: {
    DEFAULT: "hsl(var(--warning))",
    foreground: "hsl(var(--warning-foreground))",
  },
}
```

3. **Verwendung**:
```tsx
<div className="bg-warning text-warning-foreground">
```

### Neue Animation hinzufügen

1. **Keyframe in `tailwind.config.ts`**:
```typescript
keyframes: {
  "bounce-in": {
    "0%": { transform: "scale(0.3)", opacity: "0" },
    "50%": { transform: "scale(1.05)" },
    "100%": { transform: "scale(1)", opacity: "1" },
  },
}
```

2. **Animation definieren**:
```typescript
animation: {
  "bounce-in": "bounce-in 0.5s ease-out",
}
```

---

## ✅ Best Practices Checkliste

- [ ] Verwende semantische Farb-Tokens statt direkter Farben
- [ ] Teste Light und Dark Mode
- [ ] Touch-Targets mindestens 44px auf Mobile
- [ ] Inputs mit `text-base` auf Mobile (iOS-Zoom)
- [ ] Responsive Spacing mit `md:` Breakpoints
- [ ] Animationen sparsam und purposeful einsetzen
- [ ] Konsistente Button-Varianten für gleiche Aktionstypen
