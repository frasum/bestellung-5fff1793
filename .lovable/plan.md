
# Thai Sprachunterstützung für Sprachbestellung

## Übersicht

Die thailändischen Mitarbeiter bei Kao können bereits in Thai bestellen - die grundlegende Infrastruktur ist vorhanden! Es fehlen jedoch einige Anpassungen, damit die gesamte Sprach-Erfahrung (Eingabe + Feedback) auf Thai funktioniert.

## Aktueller Stand

| Komponente | Status | Bemerkung |
|------------|--------|-----------|
| UI-Übersetzungen (Thai) | ✅ Vorhanden | `th.json` mit vollständigen Übersetzungen |
| Mitarbeiter-Sprache | ✅ Konfiguriert | Employees mit `language: 'th'` existieren |
| Echtzeit-Transkription | ⚠️ Teilweise | ElevenLabs Scribe unterstützt Thai, aber Sprachcode muss gemappt werden |
| Sprach-Feedback (TTS) | ❌ Nur Deutsch | Verwendet deutsche Stimme "Laura" und deutschen Text |

## Erforderliche Änderungen

### 1. TTS-Stimme pro Sprache

Die Edge Function `elevenlabs-tts` muss die Stimme basierend auf der Sprache auswählen:

```
Deutsch (de) → Laura (FGY2WhTYpPnrIDTdsKH5) - aktuell
Thai (th)    → Thailändische Stimme (aus ElevenLabs Voice Library)
```

ElevenLabs bietet Thai-Stimmen über die Voice Library. Die beste Option ist, eine passende Thai-Stimme zu finden und deren Voice-ID zu hinterlegen.

### 2. Lokalisierte Readback-Texte

Der `TtsReadbackButton` muss den Bestätigungstext in der richtigen Sprache generieren:

| Sprache | Aktueller Text | Neuer Text |
|---------|----------------|------------|
| Deutsch | "Ich habe erkannt: 5 Äpfel und 2 Mangos" | (unverändert) |
| Thai | - | "ฉันได้รับ: 5 แอปเปิ้ล และ 2 มะม่วง" |

### 3. Sprach-Code Mapping für Scribe

ElevenLabs Scribe verwendet ISO 639-3 Codes. Der Code muss gemappt werden:

```
th → tha (Thai)
de → deu (Deutsch)
```

## Dateien die geändert werden

| Datei | Änderung |
|-------|----------|
| `supabase/functions/elevenlabs-tts/index.ts` | Sprachabhängige Stimmenauswahl hinzufügen |
| `src/components/simple-order/TtsReadbackButton.tsx` | Lokalisierte Readback-Texte (Thai, Deutsch, etc.) |
| `src/hooks/useRealtimeScribe.ts` | Sprach-Code Mapping (th → tha) |
| `src/components/simple-order/VoiceOrderMode.tsx` | Language-Prop an TtsReadbackButton übergeben |

## Technische Details

### Stimmen-Konfiguration (elevenlabs-tts)

```typescript
// Stimmen-Mapping nach Sprache
const VOICE_BY_LANGUAGE: Record<string, string> = {
  de: 'FGY2WhTYpPnrIDTdsKH5', // Laura - Deutsch
  th: 'THAI_VOICE_ID',        // Thai-Stimme (aus Voice Library)
  en: 'EXAVITQu4vr4xnSDxMaL', // Sarah - Englisch
  // weitere Sprachen...
};
```

### Readback-Texte (TtsReadbackButton)

```typescript
const readbackPhrases: Record<string, { prefix: string; and: string; suffix: string }> = {
  de: { prefix: 'Ich habe erkannt:', and: 'und', suffix: '.' },
  th: { prefix: 'ฉันได้รับ:', and: 'และ', suffix: '.' },
  en: { prefix: 'I recognized:', and: 'and', suffix: '.' },
};
```

### Sprach-Code Mapping (useRealtimeScribe)

```typescript
const languageCodeMap: Record<string, string> = {
  th: 'tha',  // Thai → ISO 639-3
  de: 'deu',  // Deutsch → ISO 639-3
  en: 'eng',  // Englisch → ISO 639-3
  vi: 'vie',  // Vietnamesisch → ISO 639-3
  // etc.
};
```

## Nächster Schritt: Thai-Stimme finden

Um die TTS-Funktion für Thai zu vervollständigen, muss eine passende Thai-Stimme aus der [ElevenLabs Voice Library](https://elevenlabs.io/voice-library) ausgewählt werden. Alternativ kann das System so konfiguriert werden, dass bei fehlender sprachspezifischer Stimme auf eine Standard-Mehrsprachenstimme zurückgegriffen wird.

## Zusammenfassung

Die Grundlagen für Thai-Bestellungen sind vorhanden. Mit den beschriebenen Anpassungen können thailändische Mitarbeiter:
1. ✅ In Thai sprechen und werden korrekt transkribiert
2. ✅ Die erkannten Artikel auf Thai vorgelesen bekommen
3. ✅ Die gesamte UI auf Thai nutzen
