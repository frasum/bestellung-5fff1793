export const SYSTEM_MINDMAP_MERMAID = `mindmap
  root((Bestellung.pro – System Mindmap))
    Ziel & Nutzen
      Digitale Beschaffung (Gastro/Hotellerie)
      End-to-end Prozess
        Artikelverwaltung -> Warenkorb -> Checkout -> E-Mail Bestellung -> Bestätigung -> Status/History
      Kernnutzen
        Zeit sparen
        Fehler reduzieren
        Transparenz (KPIs, Preishistorie)
        Team einbinden (EasyOrder / QR)
        Lieferanten einbinden (Portal)
    Benutzergruppen & Rollen
      Interne Benutzer (Login)
        Admin
          Vollzugriff
          Organisation & Einstellungen
          Katalog
          Bestellungen
          Berichte
        Manager
          Bestellungen/Inventur steuern
          Berichte
        Einkäufer
          Katalog nutzen
          Bestellen
        Betrachter
          Nur Lesen (Reports)
      Externe Benutzer (ohne klassischen Login)
        Mitarbeiter / Küchenpersonal
          EasyOrder
            Zugriff via Token/QR
            Optional PIN
            Optional Spracheingabe
            Optional Fotoaufnahme
        Lieferanten
          Lieferantenportal
            Zugriff via Magic Link / Session
            Artikel & Preise pflegen
            Änderungen einreichen
        B2B
          Lieferant (B2B Supplier)
            Kunden verwalten
            Angebote / Bestellungen
            Mobile Inventur
          Kunde (B2B Customer)
            Portal pro Subdomain
            Bestellen bei B2B-Lieferant
    Portale & Kanäle (Frontend)
      Haupt-Webapp (intern)
        Bereiche
          Katalog / Lieferanten
            Lieferanten verwalten
            Artikel verwalten
            Import (Excel/CSV)
            Bilder
            Vorschläge
            Wein
          Warenkorb
            Artikel je Lieferant gruppiert
            Mengen/Einheiten
            Freitext-Positionen
            Mindestbestellwert (Lieferant)
            Entwürfe
          Checkout
            Lieferadresse
            Lieferdatum / Zeitfenster
            Notizen
            Send-Order (E-Mail)
          Bestellungen
            Übersicht
            Status-Lifecycle
            Historie
            E-Mail Vorschau / erneutes Senden
            Testbestellungen
            Vorbestellungen / Drafts
          Reports
            Dashboard KPIs
            Ausgabenanalyse
            Inventur
            Rechnungsprüfung
            Price Watch
          Einstellungen
            Profil
            Organisation
            Standorte
            Mitarbeiter / QR-Links
            Rollen & Rechte
            E-Mail Templates
            Integrationen/Keys (falls aktiviert)
      EasyOrder (Employee Order)
        Ziele
          Schnellbestellung am Handy
          Niedrige Hürde
        Features
          Token (QR)
          optional PIN-Flow
          Multi-Lieferant oder Single-Lieferant
          Auto-Approve vs Freigabe
          Spracheingabe
          Foto/Scan Modus
          Weinmodus
      Lieferantenportal
        Ziele
          Self-Service Stammdaten
          Preis-/Sortimentspflege
          Weniger Rückfragen
        Kernabläufe
          Login / Session
          Artikeltabelle (Desktop)
          Kartenansicht (Mobile)
          Draft (Zwischenspeichern)
          Submit Changes (Pending)
          Orders Tab
          Purchasing Tab (eigener Einkauf)
      B2B Supplier Portal
        Ziele
          Lieferant als Plattformbetreiber
        Module
          Kundenverwaltung
            Einladungen
            Rollen
          Artikel
            Vendor Articles
            Preislisten
          Bestellungen
            Purchase Orders
            Status & E-Mail Versand
          Mobile Inventur
            Tokens
            Sessions
            Items
      B2B Customer Portal
        Ziele
          Geschäftskunde bestellt beim Lieferant
        Merkmale
          Portal pro Subdomain
          Kundenspezifische Preise
          Bestellungen + E-Mail
      Foto Capture
        Use Cases
          Artikelbilder erfassen
          Listen scannen (Bestelllisten)
          KI-Zuordnung / Vorschläge
    Kernprozesse (fachlich)
      Standard-Bestellung (intern)
        1 Katalog / Artikel auswählen
        2 Warenkorb je Lieferant
        3 Checkout
          Lieferadresse (Standort)
          Datum/Zeitfenster
          Notizen
        4 Bestellung speichern
          Order
          Order Items
          Bestätigungs-Token
        5 E-Mail Versand an Lieferant
          Template + Artikel-Format
          CC/Signatur
        6 Lieferanten-Bestätigung
          Link öffnet Bestätigung
          Status: confirmed
        7 Laufender Status
          processing -> shipped -> delivered
        8 Audit & Logs
          Communication Logs
          Price History (optional via Invoice)
      EasyOrder (Mitarbeiter)
        Token Verifizierung
        Optional PIN
        Auswahl Lieferant (Multi)
        Artikelliste
        Warenkorb
        Freigabe
          auto_approve_orders = true
            Order direkt
          auto_approve_orders = false
            Draft / pending
      Lieferantenportal – Artikeländerungen
        Artikel bearbeiten
          Name/SKU/Kategorie/Einheit
          Preis (optional zeitlich limitiert)
          Beschreibung
          Bild
        Draft
          Lokaler/Server Draft
        Submit
          Pending Changes
          Interne Prüfung/Übernahme
      Inventur
        Session anlegen
          Standort
          Name/Notizen
        Artikel zählen
          storage_1
          storage_2
          total
          unit_price (optional)
          Autosave
        Auswertung
          Warenwert
          Fortschritt
          Vergleich Sessions
        Export
          PDF
          Excel
      KI-Rechnungsprüfung
        Eingang
          Upload PDF
          IMAP E-Mail Abruf
        Parsing
          KI extrahiert
            Lieferant
            Positionen
            Mengen
            Preise
            Summen
        Matching
          Zuordnung zur Bestellung
          Abweichungen
            Preis
            Menge
            fehlende Position
        Resultate
          Invoice Status
          Discrepancies
          Update Preishistorie
          Optional: Artikel/ Lieferant auto-create
      Price Watch
        Quellen
          Websuche
          Großhandelskatalog (z.B. Kröswang)
        Logik
          Alternativen finden
          Alerts senden
    Datenmodell (Backend/DB)
      Core Tenancy
        Organization
          Subscription Tier
          Trial / Sponsored
        Profile / Users
          Role (admin/manager/purchaser/viewer)
          Zugehörigkeit zu Organization
        Locations
          Lieferadressen
          Mitarbeiter-Zuordnung
      Katalog
        Suppliers
          Active
          Kontaktdaten
          invoice_email (für Matching)
        Articles
          supplier_id
          organization_id
          price
          unit
          category
          sku
          image_url
          sort_order
        Categories (optional)
        Order Units (optional)
        Article Locations
          standortspezifische Aktivierung
          custom_price
      Bestellwesen
        Active Carts
          user_id
          organization_id
          location_id
          delivery_date/time_window
        Active Cart Items
          article_id oder free_text_* 
          quantity
          supplier_id
        Orders
          order_number
          supplier_id
          organization_id
          location_id
          delivery_address
          status
          total_amount
          notes
          employee_id (optional)
          is_test_order (optional)
        Order Items
          article_id / free_text
          quantity
          unit_price
          total_price
        Order Confirmation Tokens
          order_id
          token
          expires_at
      Kommunikation & Audit
        Email Templates
          subject/body blocks
          format article list
          design_style
          cc_emails
        Communication Logs
          order_id
          supplier_id
          status
          error_message
          body_html
      Inventur
        Inventory Sessions
          organization/location
          status
          created_by
        Inventory Items
          session_id
          article_id
          storage_1/storage_2/total
          unit_price
      Rechnungen
        Invoices
          supplier match
          storage reference
          status
        Invoice Items
        Invoice Discrepancies
        Article Price History
          old_price/new_price
          source (invoice/order/manual)
          changed_by
      B2B
        Supplier B2B Accounts
        B2B Suppliers
        B2B Supplier Users
        B2B Customers
          Invitations
          Access to Suppliers
        B2B Vendors
          Customer Vendors
          Supplier Vendors
        B2B Vendor Articles
          customer/vendor context
        B2B Purchase Orders
          customer/supplier side
        B2B Purchase Order Items
        B2B Mobile Tokens
        B2B Inventory Sessions/Items
    Backend-Logik (Funktionen/Automationen)
      Bestellungen
        generate_order_number
        send-order-email
          Template Rendering
          Token Link
          Logging
        order-confirmation
          verify token
          update status
      Tokens / Portale
        verify-simple-order-token
        verify-employee-login
        Supplier Portal actions
          create-unit
          create-category
          suggest-article
      Inventur
        transcribe-inventory (Voice)
        manage inventory sessions/items
      Rechnungen
        check-invoice-emails (IMAP)
        parse-invoice (KI Parsing)
        invoice matching + discrepancies
      Price Watch
        search-price-alternatives
        send-price-alerts
        search-kroeswang-catalog
      B2B
        create-b2b-account-user
        update-b2b-account-email
        send-b2b-offer
        send-b2b-purchase-order
        create/verify-b2b-mobile-token
        manage-b2b-mobile-inventory
      Observability
        Logs
        Rate limits (Demo)
    Integrationen
      E-Mail
        SMTP Versand
        IMAP Empfang (Rechnungen)
        Templates
      KI (Lovable AI)
        Invoice Parsing
        Foto/Scan Erkennung
        Weinrecherche & Übersetzung
        Preisalternativen
      Voice
        Transkription
        Multilingual
      Datei-Storage
        PDFs (Rechnungen)
        Bilder (Artikel/Wein/Logos)
      Export
        PDF
        Excel/XLSX
        CSV
    Sicherheit & Governance
      Auth
        Login
        Sessions
        Token-Flows (EasyOrder/Supplier/B2B)
      Rollen & Rechte
        RBAC pro Organisation
        View-only
      Data Access
        RLS Policies
        Tenant Isolation (organization_id)
      Betriebsmodi
        Demo-Mode
        Sponsored Accounts
        Advanced Settings (Debug/Architektur Seiten)
`;

export const SYSTEM_MINDMAP_PROMPT = `Du bist ein System-Analyst und Produktarchitekt.

Aufgabe:
1) Interpretiere die folgende Mermaid Mindmap als „Single Source of Truth“ über das System.
2) Erzeuge daraus eine visuell sinnvolle Mindmap (oder ein Mindmap-Canvas), die Verbesserungs-/Ideenarbeit unterstützt.
3) Markiere explizit:
   - Kernprozesse (Flows)
   - Datenobjekte (DB Entities)
   - Portale/Frontends
   - Backend-Funktionen/Automationen
   - Integrationen
4) Finde anschließend Verbesserungspotenziale:
   - UX/Prozess-Reibungen
   - Automatisierungen
   - Datenqualität & Governance
   - Rollen/Rechte/Risiken
   - Performance/Skalierung
5) Gib eine priorisierte Ideenliste (Impact vs Aufwand) aus.

Constraints:
- Antworte auf Deutsch.
- Sei konkret (keine generischen SaaS-Floskeln).
- Wenn du Annahmen machst, kennzeichne sie als Annahme.
`;

export const SYSTEM_MINDMAP_MARKDOWN = `# Bestellung.pro – System Mindmap (Mermaid)

## Mermaid

\`\`\`mermaid
${SYSTEM_MINDMAP_MERMAID}
\`\`\`

## Prompt (für deine KI-App)

\`\`\`text
${SYSTEM_MINDMAP_PROMPT}
\`\`\`
`;
