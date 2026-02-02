
# Problem: E-Mail wird als Roh-HTML/MIME-Code angezeigt

## Diagnose

Die E-Mail-Vorschau in Apple Mail (iCloud) zeigt den rohen MIME-Inhalt statt gerendertem HTML:
- Betreff zeigt encoded Text: `=?utf-8?Q?=e2=9c=85` (sollte ✅ sein)
- Die MIME-Struktur (`multipart/mixed`, `boundary=attachment100`) wird angezeigt
- Der HTML-Code ist sichtbar statt gerendert

**Ursache**: Die `denomailer`-Bibliothek (Version 1.6.0) verwendet intern `quoted-printable` Encoding, welches bei langen Zeilen oder Sonderzeichen (wie Emojis) problematisch sein kann. Manche Mail-Clients (besonders Apple Mail) interpretieren die MIME-Struktur dann nicht korrekt.

## Lösungsansatz

### 1. E-Mail-Betreff ohne Sonderzeichen

Entferne das ✅ Emoji aus dem Betreff, da dies zu Q-Encoding führt:
- **Vorher**: `✅ Bestellung ${orderNumber} wurde von ${supplierName} bestätigt`
- **Nachher**: `Bestellung ${orderNumber} wurde von ${supplierName} bestätigt`

**Betroffene Dateien**:
- `supabase/functions/confirm-order/index.ts` (Zeile 118-119, 244)
- `supabase/functions/send-order-email/index.ts` (bei Emojis im Header)

### 2. HTML optimieren für besseres Encoding

- Alle HTML-Emojis (📦, 🛒, etc.) aus dem Body entfernen oder durch Text ersetzen
- Whitespace zwischen HTML-Tags minimieren, um `=20` Encoding zu vermeiden
- Die `cleanHtmlContent()`-Funktion verbessern

### 3. Plain-Text-Alternative hinzufügen

Wo fehlt, eine Plain-Text-Alternative (`content`) hinzufügen, damit der Mail-Client eine Fallback-Option hat.

---

## Technische Details

### Änderungen in `confirm-order/index.ts`:

```typescript
// Zeile 118-119: Betreff ohne Emoji
subject: `Bestellung ${orderNumber} wurde von ${supplierName} bestätigt`,

// Zeile 244: Kommunikationslog ohne Emoji  
subject: `Bestellung ${orderNumber} wurde von ${supplierName} bestätigt`,
```

### Änderungen im HTML-Generator:

Ersetze Emojis durch Unicode-Text oder entferne sie:
- `✅` → `[OK]` oder entfernen
- `📦` → entfernen
- `🛒` → entfernen  
- `📝` → entfernen
- `📍` → entfernen

### Optional: Wechsel zu `base64` Encoding

Falls das Problem weiterhin besteht, könnte ein Wechsel zu einer anderen SMTP-Bibliothek oder manuelles Base64-Encoding des HTML-Bodys helfen. Dies ist jedoch aufwändiger.

---

## Erwartetes Ergebnis

Nach den Änderungen:
- Betreff wird korrekt angezeigt: "Bestellung ORD-2026-02-0133 wurde von Top Service GmbH bestätigt"
- E-Mail-Body wird als formatiertes HTML gerendert
- Keine sichtbaren MIME-Headers mehr
