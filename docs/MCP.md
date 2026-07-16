# Bestellung.pro MCP-Server

Externer Zugriff auf die App via **Model Context Protocol** (MCP). Jeder externe
Client (Claude Desktop, ChatGPT, Cursor, Codex, eigene Agents) verbindet sich
als ein realer Nutzer der App und ruft die Daten dieses Nutzers gescoped
über Row-Level-Security ab. Es gibt **keinen** Service-Role- oder Admin-Zugang
über diesen Server.

## Server-Endpunkte

| Feld | Wert |
| --- | --- |
| Name | `bestellung-pro-mcp` |
| Titel | Bestellung.pro MCP |
| Version | 0.1.0 |
| MCP-URL | `https://lclhwmxpbpmqtiwmgmgm.supabase.co/functions/v1/mcp` |
| Transport | MCP Streamable HTTP |
| Auth | OAuth 2.1 (Authorization Code + PKCE, Dynamic Client Registration) |
| OAuth-Issuer | `https://lclhwmxpbpmqtiwmgmgm.supabase.co/auth/v1` |
| Accepted audience | `authenticated` |
| Consent-Seite | `https://bestellung.pro/.lovable/oauth/consent` |

Discovery-Dokumente:
- `https://lclhwmxpbpmqtiwmgmgm.supabase.co/auth/v1/.well-known/openid-configuration`
- `https://lclhwmxpbpmqtiwmgmgm.supabase.co/auth/v1/.well-known/oauth-authorization-server`
- `https://lclhwmxpbpmqtiwmgmgm.supabase.co/functions/v1/mcp/.well-known/oauth-protected-resource`

## Verbinden

### Claude Desktop / ChatGPT / Cursor
Im Connector-Dialog des Clients diese URL eintragen:

```
https://lclhwmxpbpmqtiwmgmgm.supabase.co/functions/v1/mcp
```

Der Client führt DCR und OAuth automatisch aus. Beim ersten Verbinden öffnet
sich die Consent-Seite dieser App; nach Login und „Zugriff erlauben" ist die
Verbindung dauerhaft.

### Eigene Clients
1. OAuth-Metadaten vom Issuer holen (siehe oben).
2. Bei `registration_endpoint` einen OAuth-Client per DCR anlegen (oder
   manuell in Cloud-Auth einen Client konfigurieren).
3. Authorization-Code-Flow mit PKCE durchlaufen; als Redirect-URI die eigene
   Callback-URL angeben.
4. Access-Token als `Authorization: Bearer <token>` an die MCP-URL senden.

## Request-Format

Alle Tool-Aufrufe folgen dem MCP-Streamable-HTTP-Spec. POST an die MCP-URL
mit JSON-RPC 2.0:

```http
POST /functions/v1/mcp HTTP/1.1
Host: lclhwmxpbpmqtiwmgmgm.supabase.co
Authorization: Bearer <access_token>
Content-Type: application/json
Accept: application/json, text/event-stream
```

**Wichtig:** Der `Accept`-Header **muss** sowohl `application/json` als auch
`text/event-stream` enthalten, sonst antwortet der Server mit `406 Not
Acceptable`.

### Tool-Liste abrufen

```json
{ "jsonrpc": "2.0", "id": 1, "method": "tools/list" }
```

### Tool aufrufen

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "search_articles",
    "arguments": { "query": "Merlot", "limit": 10 }
  }
}
```

Antwortformat: JSON-RPC-Result mit `content` (Text-Repräsentation) und
`structuredContent` (typisierte Daten). Bei Fehlern `isError: true` und eine
Textnachricht in `content`.

---

## Tools

Alle Tools sind **read-only**, **idempotent** und **closed-world** (arbeiten
ausschließlich mit App-Daten des angemeldeten Nutzers).

---

### `list_suppliers` — Aktive Lieferanten auflisten

Listet aktive Lieferanten in der Organisation des angemeldeten Nutzers.

**Input**

| Feld | Typ | Pflicht | Default | Beschreibung |
| --- | --- | --- | --- | --- |
| `limit` | integer | nein | 50 | Max. Anzahl (1–200) |

**Output** (`structuredContent.suppliers`)

Array von Objekten:

| Feld | Typ | Beschreibung |
| --- | --- | --- |
| `id` | uuid | Lieferanten-ID |
| `name` | string | Anzeigename |
| `email` | string \| null | Kontakt-E-Mail |
| `phone` | string \| null | Telefonnummer |
| `contact_person` | string \| null | Ansprechpartner |
| `is_active` | boolean | Immer `true` (Filter) |

**Beispiel-Call**

```json
{
  "jsonrpc": "2.0", "id": 1, "method": "tools/call",
  "params": { "name": "list_suppliers", "arguments": { "limit": 5 } }
}
```

**Beispiel-Antwort**

```json
{
  "jsonrpc": "2.0", "id": 1,
  "result": {
    "content": [{ "type": "text", "text": "[{\"id\":\"…\",\"name\":\"Metro\",…}]" }],
    "structuredContent": {
      "suppliers": [
        { "id": "8b1e…", "name": "Metro", "email": "orders@metro.de",
          "phone": "+49 …", "contact_person": "Herr Meier", "is_active": true }
      ]
    }
  }
}
```

---

### `list_orders` — Letzte Bestellungen

Listet Bestellungen der Organisation, neueste zuerst. Optional per Status
filtern.

**Input**

| Feld | Typ | Pflicht | Default | Beschreibung |
| --- | --- | --- | --- | --- |
| `limit` | integer | nein | 20 | Max. Anzahl (1–100) |
| `status` | string | nein | – | z. B. `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled` |

**Output** (`structuredContent.orders`)

| Feld | Typ | Beschreibung |
| --- | --- | --- |
| `id` | uuid | Bestell-ID |
| `order_number` | string | Menschenlesbare Nummer, z. B. `ORD-2026-01-0007` |
| `supplier_id` | uuid | Zugehöriger Lieferant |
| `status` | string | Aktueller Status |
| `total_amount` | number | Gesamtsumme (netto/brutto je nach App-Konfig) |
| `notes` | string \| null | Freitext |
| `created_at` | ISO-8601 timestamp | Erstellzeit |

**Beispiel-Call**

```json
{
  "jsonrpc": "2.0", "id": 2, "method": "tools/call",
  "params": {
    "name": "list_orders",
    "arguments": { "status": "pending", "limit": 10 }
  }
}
```

---

### `search_articles` — Artikel-Suche

Sucht Artikel per Substring im Namen (case-insensitive, LIKE-Suche).

**Input**

| Feld | Typ | Pflicht | Default | Beschreibung |
| --- | --- | --- | --- | --- |
| `query` | string | **ja** | – | Substring für den Artikelnamen |
| `supplier_id` | uuid | nein | – | Nur Artikel dieses Lieferanten |
| `limit` | integer | nein | 25 | Max. Anzahl (1–100) |

**Output** (`structuredContent.articles`)

| Feld | Typ | Beschreibung |
| --- | --- | --- |
| `id` | uuid | Artikel-ID |
| `name` | string | Artikelname |
| `sku` | string \| null | Artikelnummer beim Lieferanten |
| `unit` | string | Basiseinheit (z. B. `kg`, `Stück`) |
| `price` | number | Stückpreis |
| `packaging_unit` | number | Gebindegröße (Rechnung: `price × packaging_unit × Menge`) |
| `category` | string \| null | Kategorie |
| `top_category` | string \| null | Oberkategorie |
| `supplier_id` | uuid | Lieferant |
| `is_active` | boolean | Immer `true` |

**Beispiel-Call**

```json
{
  "jsonrpc": "2.0", "id": 3, "method": "tools/call",
  "params": {
    "name": "search_articles",
    "arguments": { "query": "Olivenöl", "limit": 5 }
  }
}
```

---

### `get_order` — Bestelldetails inkl. Positionen

Liefert eine einzelne Bestellung samt Line-Items. Es muss **entweder**
`order_id` **oder** `order_number` übergeben werden.

**Input**

| Feld | Typ | Pflicht | Beschreibung |
| --- | --- | --- | --- |
| `order_id` | uuid | einer von beiden | Bestell-UUID |
| `order_number` | string | einer von beiden | z. B. `ORD-2026-01-0007` |

**Output** (`structuredContent.order`)

Alle Felder aus `list_orders` **plus** `updated_at` und ein Array
`order_items`:

| Feld | Typ | Beschreibung |
| --- | --- | --- |
| `id` | uuid | Positions-ID |
| `article_id` | uuid \| null | Verknüpfter Artikel (kann bei Freitext `null` sein) |
| `article_name` | string | Snapshot des Artikelnamens zum Bestellzeitpunkt |
| `quantity` | number | Menge |
| `unit_price` | number | Stückpreis zum Bestellzeitpunkt |
| `total_price` | number | Zeilensumme |
| `unit` | string | Einheit |

**Beispiel-Call**

```json
{
  "jsonrpc": "2.0", "id": 4, "method": "tools/call",
  "params": {
    "name": "get_order",
    "arguments": { "order_number": "ORD-2026-01-0007" }
  }
}
```

**Fehler**

- `Provide order_id or order_number.` – keiner der beiden Parameter gesetzt
- `Order not found.` – die Bestellung existiert nicht oder gehört einer
  anderen Organisation (RLS blockiert)

---

## Fehlerverhalten

| HTTP-Status / Payload | Ursache |
| --- | --- |
| `401 Unauthorized` | Token fehlt, abgelaufen oder falscher Issuer |
| `403 Forbidden` | Token gültig, aber nicht vom konfigurierten OAuth-Server |
| `406 Not Acceptable` | `Accept`-Header enthält nicht sowohl `application/json` als auch `text/event-stream` |
| `isError: true` in `content` | Tool-interner Fehler (z. B. RLS-Verletzung, ungültige Parameter) |

`Not authenticated`-Meldungen im `content` bedeuten, dass der Token zwar
transportiert, aber nicht als User-Token verifiziert wurde – meist eine
falsche `client_id`/DCR-Konfiguration.

## Sicherheitsmodell

- Jeder Token wird direkt an Supabase (`Authorization: Bearer …`)
  weitergegeben; RLS-Policies der Tabellen `suppliers`, `orders`,
  `order_items`, `articles` bestimmen die Sichtbarkeit.
- Tokens werden **nicht** geloggt und **nicht** an das Modell zurückgegeben.
- Die App verwendet an keiner Stelle des MCP-Codes den Service-Role-Key.
- Bei Rechtsentzug (User aus Organisation entfernt, Passwort geändert, Token
  revoked) sind laufende Tool-Calls sofort blockiert.

## Manifest

Das maschinenlesbare Manifest (mit JSON-Schemas aller Tools) liegt versioniert
im Repo unter `.lovable/mcp/manifest.json` und wird bei jedem Build
regeneriert.
