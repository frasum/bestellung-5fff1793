
# Echtzeit-Transkription mit ElevenLabs Scribe

## Übersicht

Diese Implementierung ersetzt die bisherige "Aufnehmen → Warten → Ergebnis"-Lösung durch **Live-Transkription während des Sprechens**. Der gesprochene Text erscheint sofort auf dem Bildschirm, ähnlich wie bei Sprachassistenten.

## Aktueller vs. Neuer Ablauf

```text
AKTUELL (Batch-Transkription):
┌────────────────────────────────────────────────────────────┐
│  [Mikrofon drücken] → [Sprechen] → [Loslassen] → [Warten]  │
│                                      (3-5 Sek.)            │
│  → [Ergebnis anzeigen]                                     │
└────────────────────────────────────────────────────────────┘

NEU (Echtzeit-Transkription):
┌────────────────────────────────────────────────────────────┐
│  [Mikrofon drücken] → [Sprechen] → [Text erscheint live!]  │
│                        ↓                                   │
│       "Drei Ananas und..." → Artikel werden erkannt        │
│  → [Fertig] → [Artikel-Matching] → [Bestätigen]            │
└────────────────────────────────────────────────────────────┘
```

## Technische Komponenten

### 1. Neue Edge Function: `elevenlabs-scribe-token`

Generiert ein Einmal-Token für die ElevenLabs Realtime Scribe API (WebSocket-basiert).

**API-Endpunkt**: `POST https://api.elevenlabs.io/v1/single-use-token/realtime_scribe`

**Besonderheiten**:
- Token ist 15 Minuten gültig
- Unterstützt Deutsch als Sprache
- Automatische Voice Activity Detection (VAD)

### 2. Neuer React Hook: `useRealtimeScribe`

Ersetzt `useVoiceRecorder` für den Live-Modus. Nutzt das `@elevenlabs/react` SDK mit dem `useScribe`-Hook.

**Features**:
- `partialTranscript`: Interim-Text während des Sprechens
- `committedTranscripts`: Finalisierte Textsegmente
- `isConnected`: Verbindungsstatus
- VAD-basierte automatische Segment-Commits

### 3. Überarbeitete UI: `VoiceOrderMode.tsx`

Erweitert um Live-Transkriptionsanzeige:
- **Live-Text-Bereich**: Zeigt den aktuellen Partial-Text an
- **Committed-Text**: Finalisierte Segmente werden darunter gestapelt
- **Visuelles Feedback**: Pulsierender Indikator bei aktivem Sprechen
- **Übergang zu Ergebnissen**: Nach Beenden wird das AI-Matching ausgelöst

## Implementierungsschritte

### Schritt 1: Edge Function für Scribe-Token

```
supabase/functions/elevenlabs-scribe-token/index.ts
```

- Validiert den `simple_order_token` (wie bei `transcribe-order`)
- Ruft die ElevenLabs API für ein Realtime-Scribe-Token auf
- Gibt das Token an den Client zurück

### Schritt 2: React Hook für Echtzeit-Transkription

```
src/hooks/useRealtimeScribe.ts
```

Wrapper um `@elevenlabs/react`'s `useScribe`:
- Holt automatisch das Token von der Edge Function
- Managed Mikrofon-Permissions
- Sammelt alle Transcript-Segmente
- Callback für finalen Text

### Schritt 3: UI-Erweiterung

```
src/components/simple-order/VoiceOrderMode.tsx
```

Änderungen:
- Import des neuen Hooks statt `useVoiceRecorder`
- Neuer Status: `'transcribing'` (zwischen recording und processing)
- Live-Text-Display mit Animation
- "Fertig"-Button um die Transkription zu beenden und das Matching zu starten

### Schritt 4: Artikel-Matching beibehalten

Das bestehende AI-Matching (Gemini) bleibt erhalten:
- Wird nach Beenden der Live-Transkription aufgerufen
- Nutzt den gesammelten Text aus allen Segmenten
- Zeigt Ergebnisse in `VoiceOrderResults.tsx`

## UI-Mockup

```
┌─────────────────────────────────────┐
│ ← Sprachbestellung        Prototyp  │
├─────────────────────────────────────┤
│                                     │
│         ┌─────────────────┐         │
│         │                 │         │
│         │    🎤 (pulsiert)│         │
│         │                 │         │
│         └─────────────────┘         │
│                                     │
│    ┌─────────────────────────┐      │
│    │ "Drei Ananas und zwei   │ ←    │
│    │ Kisten Mangos..."       │ Live │
│    └─────────────────────────┘      │
│                                     │
│    ════════════════════════════     │
│    Drei Ananas                      │ ← Bereits
│    Zwei Kisten Mangos               │   erkannt
│    ════════════════════════════     │
│                                     │
│    ┌──────────────────────────┐     │
│    │      ✓ Fertig            │     │
│    └──────────────────────────┘     │
│                                     │
│    ┌──────────────────────────┐     │
│    │ ← Zurück zur Artikelliste│     │
│    └──────────────────────────┘     │
└─────────────────────────────────────┘
```

## Fallback-Strategie

Falls die WebSocket-Verbindung fehlschlägt:
- Automatischer Rückfall auf die bestehende Batch-Transkription
- Benutzer wird über den Wechsel informiert
- Keine Unterbrechung des Bestellvorgangs

## Benötigte Konfiguration

- `ELEVENLABS_API_KEY`: ✅ Bereits vorhanden
- `@elevenlabs/react`: ✅ Bereits installiert (Version ^0.12.1)
- Keine neuen Secrets erforderlich

## Dateien die erstellt/geändert werden

| Datei | Aktion |
|-------|--------|
| `supabase/functions/elevenlabs-scribe-token/index.ts` | Neu |
| `supabase/config.toml` | Erweitern |
| `src/hooks/useRealtimeScribe.ts` | Neu |
| `src/components/simple-order/VoiceOrderMode.tsx` | Ändern |
| `src/components/simple-order/LiveTranscriptDisplay.tsx` | Neu |
