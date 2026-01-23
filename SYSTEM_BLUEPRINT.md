# 🏗️ SYSTEM BLUEPRINT: B2B-Bestellsystem "Bestellung.pro"

> **Vollständiger System-Prompt zum Nachbauen eines Enterprise-B2B-Bestellsystems**
> 
> Dieses Dokument enthält alle Informationen, um ein identisches System wie "Bestellung.pro" zu erstellen.

---

## 📋 Inhaltsverzeichnis

0. [Wie du diesen Blueprint nutzt (Dev + KI)](#0-wie-du-diesen-blueprint-nutzt-dev--ki)
1. [Projektübersicht](#1-projektübersicht)
2. [Technologie-Stack](#2-technologie-stack)
3. [Datenmodell (89 Tabellen)](#3-datenmodell-89-tabellen)
4. [Edge Functions (57 Funktionen)](#4-edge-functions-57-funktionen)
5. [Module & Features](#5-module--features)
6. [Authentifizierung & Rollen](#6-authentifizierung--rollen)
7. [Sicherheitsarchitektur](#7-sicherheitsarchitektur)
8. [UI/UX-Spezifikationen](#8-uiux-spezifikationen)
9. [Internationalisierung](#9-internationalisierung)
10. [Integrationen](#10-integrationen)
11. [Demo-Modus](#11-demo-modus)
12. [Entwicklungs-Roadmap](#12-entwicklungs-roadmap)

---

## 0. Wie du diesen Blueprint nutzt (Dev + KI)

Dieser Blueprint ist **zweigleisig** gedacht:

### 0.1 Dev-Blueprint (Implementierung)
Nutze die Kapitel **2–10** als technische Spezifikation:
- **Datenmodell** (Tabellen, Beziehungen, RLS-Idee)
- **Backend-Funktionen** (Automatisierungen, Mail, Parsing)
- **Frontend** (Module, Routen, Portale)
- **Integrationen** (E-Mail, KI, Voice, Export)

**Empfehlung für Entwickler:**
1) Starte mit Kapitel **1 (Ziel/Scope)**
2) Implementiere zuerst **Auth + Multi-Tenant-Grundlage** (Organization/Profile/Rollen)
3) Danach **Katalog → Warenkorb → Checkout/Orders → E-Mail → Status**
4) Erst dann die Erweiterungen (EasyOrder, Supplier Portal, B2B, Invoice, Inventur)

### 0.2 KI-Blueprint (Prompt/Context)
Wenn du das System in eine KI-App einspeisen willst:
- Verwende dieses Dokument als **vollständigen Referenz-Context**.
- Für eine **strukturierte, kopierfertige Mermaid-Mindmap** nutze zusätzlich die Mindmap-Quelle (siehe 0.3).

**Empfehlung für KI:**
1) Zuerst „Purpose / Personas / Kernprozesse“ extrahieren
2) Dann „Portale & Routen“
3) Dann „Datenmodell“
4) Abschließend „Integrationen & Automationen“

### 0.3 Single Source of Truth (Artefakte im Repo)
Neben diesem Blueprint existieren im Projekt mehrere „lebende“ Architektur-Artefakte, die sich gut zum Navigieren/Kopieren eignen:

- **System Mindmap (Mermaid + Prompt)**
  - Quelle: `src/data/systemMindmap.ts`
  - UI: Route **`/system-mindmap`** (Advanced Settings)
- **Systembeschreibung (produktnah, lesbar)**
  - UI: Route **`/system-description`**
- **Frontend/Routen-Architektur (Module & Routes)**
  - UI: Route **`/system-architecture`**
- **Datenbank-Architektur (Tabellen & Beziehungen)**
  - UI: Route **`/database-architecture`**
- **Infrastructure / Functions Overviews**
  - UI: Routes **`/infrastructure`** und **`/functions-overview`**

> Hinweis: Dieses Dokument ist bewusst „lang & vollständig“. Für Workshops/Brainstorming ist die Mindmap oft die schnellere Einstiegsebene.

---

## 1. Projektübersicht

### 1.1 System-Name
**Bestellung.pro** - Ein B2B-Bestellsystem für die Gastronomie

### 1.2 Zweck
Digitalisierung des Bestellprozesses zwischen Gastronomiebetrieben und deren Lieferanten. Das System ermöglicht:
- Zentrale Verwaltung von Lieferanten und Artikeln
- Automatisierte Bestellungen per E-Mail
- Mitarbeiter-Bestellungen ohne Login (EasyOrder)
- B2B-Lieferantenportal für Großhändler
- KI-gestützte Rechnungsverarbeitung
- Sprachgesteuerte Bestellungen und Inventur

### 1.3 Zielgruppen
| Rolle | Beschreibung |
|-------|--------------|
| **Gastronomiebetriebe** | Restaurants, Hotels, Kantinen |
| **Lieferanten** | Großhändler, Getränkelieferanten, Spezialisten |
| **Mitarbeiter** | Küchenpersonal, Barpersonal |
| **B2B-Lieferanten** | Großhändler mit eigenem Kundenstamm |

### 1.4 Kernfunktionen auf einen Blick
```
┌─────────────────────────────────────────────────────────────────┐
│                    BESTELLUNG.PRO SYSTEM                        │
├─────────────────────────────────────────────────────────────────┤
│  📦 Katalog          │  🛒 Warenkorb      │  📧 Kommunikation   │
│  - Lieferanten       │  - Multi-Supplier  │  - E-Mail-Templates │
│  - Artikel           │  - Entwürfe        │  - Bestätigungen    │
│  - Kategorien        │  - Checkout        │  - Protokolle       │
├─────────────────────────────────────────────────────────────────┤
│  👨‍🍳 EasyOrder        │  🏪 Lieferanten-   │  📊 Berichte        │
│  - PIN-Login         │    portal          │  - Preishistorie    │
│  - Favoriten         │  - Bestellansicht  │  - Inventur         │
│  - Sprachsteuerung   │  - Artikelvorschlag│  - Rechnungen       │
├─────────────────────────────────────────────────────────────────┤
│  🏢 B2B-Supplier     │  🍷 Wein-Modul     │  🤖 KI-Features     │
│  - Kundenverwaltung  │  - Katalog         │  - Rechnungs-OCR    │
│  - Angebote          │  - Quiz            │  - Voice-to-Order   │
│  - Eigene Bestellung │  - Recherche       │  - Preisüberwachung │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Technologie-Stack

### 2.1 Frontend
```json
{
  "framework": "React 18.3.1",
  "language": "TypeScript 5.x",
  "buildTool": "Vite 5.x",
  "styling": {
    "framework": "TailwindCSS 3.x",
    "components": "shadcn/ui",
    "animations": "tailwindcss-animate"
  },
  "stateManagement": {
    "server": "@tanstack/react-query 5.x",
    "client": "React Context API"
  },
  "routing": "react-router-dom 6.x",
  "forms": "react-hook-form + zod",
  "i18n": "i18next + react-i18next"
}
```

### 2.2 Backend
```json
{
  "platform": "Supabase / Lovable Cloud",
  "database": "PostgreSQL 15",
  "auth": "Supabase Auth",
  "storage": "Supabase Storage",
  "functions": "Deno Edge Functions",
  "realtime": "Supabase Realtime"
}
```

### 2.3 Externe Dienste
| Dienst | Zweck |
|--------|-------|
| **OpenAI GPT-4** | Rechnungs-OCR, Artikelerkennung |
| **ElevenLabs** | Voice-to-Text für Bestellungen |
| **Resend** | E-Mail-Versand |
| **SMTP/IMAP** | E-Mail-Empfang (Rechnungen) |

### 2.4 Projekt-Struktur
```
├── src/
│   ├── components/
│   │   ├── ui/                    # shadcn/ui Komponenten
│   │   ├── layout/                # Layout-Komponenten
│   │   ├── suppliers/             # Lieferanten-Komponenten
│   │   ├── cart/                  # Warenkorb-Komponenten
│   │   ├── orders/                # Bestellungs-Komponenten
│   │   ├── reports/               # Berichte-Komponenten
│   │   ├── settings/              # Einstellungen-Komponenten
│   │   ├── simple-order/          # EasyOrder-Komponenten
│   │   ├── b2b/                   # B2B-Lieferanten-Komponenten
│   │   ├── b2b-customer/          # B2B-Kunden-Komponenten
│   │   ├── onboarding/            # Onboarding-Wizard
│   │   └── demo/                  # Demo-Modus-Komponenten
│   ├── pages/                     # Seiten-Komponenten
│   ├── hooks/                     # Custom React Hooks
│   ├── contexts/                  # React Context Provider
│   ├── lib/                       # Utility-Funktionen
│   ├── i18n/                      # Übersetzungen
│   ├── data/                      # Mock-Daten & Konstanten
│   └── integrations/supabase/     # Supabase Client & Types
├── supabase/
│   ├── functions/                 # Edge Functions
│   └── migrations/                # Datenbank-Migrationen
└── public/                        # Statische Assets
```

---

## 3. Datenmodell (89 Tabellen)

### 3.1 Kern-Tabellen (Multi-Tenant Basis)

#### `organizations`
```sql
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  is_demo BOOLEAN DEFAULT false,
  demo_expires_at TIMESTAMP WITH TIME ZONE,
  subscription_tier TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'active',
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  customer_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `profiles`
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  organization_id UUID REFERENCES organizations(id),
  language TEXT DEFAULT 'de',
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `user_roles`
```sql
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TYPE app_role AS ENUM ('admin', 'manager', 'purchaser', 'viewer');
```

#### `locations`
```sql
CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  short_code TEXT,
  address TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### 3.2 Lieferanten & Artikel

#### `suppliers`
```sql
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  customer_number TEXT,
  contact_person TEXT,
  notes TEXT,
  delivery_days TEXT[],
  order_deadline TIME,
  min_order_value NUMERIC,
  logo_url TEXT,
  website TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  portal_token TEXT,
  portal_enabled BOOLEAN DEFAULT false,
  can_suggest_articles BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `articles`
```sql
CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  name TEXT NOT NULL,
  sku TEXT,
  description TEXT,
  category TEXT,
  top_category TEXT,
  unit TEXT DEFAULT 'Stk',
  price NUMERIC NOT NULL,
  reference_price NUMERIC,
  reference_unit TEXT,
  packaging_unit INTEGER,
  selling_price NUMERIC,
  annual_order_value NUMERIC,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  order_unit_id UUID REFERENCES order_units(id),
  -- Wine-specific fields
  origin_country TEXT,
  grape_variety TEXT,
  flavor_profile TEXT,
  food_pairings TEXT,
  -- Translations
  description_en TEXT,
  description_fr TEXT,
  description_th TEXT,
  origin_country_en TEXT,
  -- ... weitere Übersetzungsfelder
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `categories`
```sql
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `order_units`
```sql
CREATE TABLE public.order_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `article_locations`
```sql
CREATE TABLE public.article_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  custom_price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(article_id, location_id)
);
```

#### `article_price_history`
```sql
CREATE TABLE public.article_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  old_price NUMERIC NOT NULL,
  new_price NUMERIC NOT NULL,
  change_source TEXT DEFAULT 'manual',
  changed_by UUID REFERENCES auth.users(id),
  order_id UUID REFERENCES orders(id),
  invoice_id UUID REFERENCES invoices(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### 3.3 Warenkorb & Bestellungen

#### `active_carts`
```sql
CREATE TABLE public.active_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  location_id UUID REFERENCES locations(id),
  employee_id UUID REFERENCES employees(id),
  delivery_date DATE,
  time_window TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `active_cart_items`
```sql
CREATE TABLE public.active_cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES active_carts(id) ON DELETE CASCADE,
  article_id UUID REFERENCES articles(id),
  supplier_id UUID REFERENCES suppliers(id),
  quantity INTEGER DEFAULT 1,
  is_free_text_item BOOLEAN DEFAULT false,
  free_text_name TEXT,
  free_text_unit TEXT DEFAULT 'Stk',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `cart_drafts`
```sql
CREATE TABLE public.cart_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT DEFAULT 'Entwurf',
  location_id UUID REFERENCES locations(id),
  employee_id UUID REFERENCES employees(id),
  delivery_address TEXT,
  desired_delivery_date DATE,
  desired_time_window TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `cart_draft_items`
```sql
CREATE TABLE public.cart_draft_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id UUID NOT NULL REFERENCES cart_drafts(id) ON DELETE CASCADE,
  article_id UUID REFERENCES articles(id),
  supplier_id UUID REFERENCES suppliers(id),
  quantity INTEGER DEFAULT 1,
  is_free_text_item BOOLEAN DEFAULT false,
  free_text_name TEXT,
  free_text_unit TEXT DEFAULT 'Stk',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `orders`
```sql
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  location_id UUID REFERENCES locations(id),
  employee_id UUID REFERENCES employees(id),
  order_number TEXT NOT NULL DEFAULT generate_order_number(),
  status TEXT DEFAULT 'pending',
  total_amount NUMERIC,
  delivery_date DATE,
  time_window TEXT,
  delivery_address TEXT,
  notes TEXT,
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  confirmation_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `order_items`
```sql
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  article_id UUID REFERENCES articles(id),
  article_name TEXT NOT NULL,
  sku TEXT,
  quantity INTEGER NOT NULL,
  unit TEXT DEFAULT 'Stk',
  unit_price NUMERIC,
  total_price NUMERIC,
  is_free_text_item BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### 3.4 Mitarbeiter & EasyOrder

#### `employees`
```sql
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  pin_code TEXT, -- Hashed via Edge Function
  language TEXT DEFAULT 'de',
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  auto_approve_orders BOOLEAN DEFAULT false,
  voice_input_enabled BOOLEAN DEFAULT false,
  can_add_free_items BOOLEAN DEFAULT false,
  can_capture_photos BOOLEAN DEFAULT false,
  wine_catalog_access TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `employee_locations`
```sql
CREATE TABLE public.employee_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(employee_id, location_id)
);
```

#### `employee_location_suppliers`
```sql
CREATE TABLE public.employee_location_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(employee_id, location_id, supplier_id)
);
```

#### `employee_article_favorites`
```sql
CREATE TABLE public.employee_article_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(employee_id, article_id)
);
```

#### `employee_sessions`
```sql
CREATE TABLE public.employee_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT now() + INTERVAL '8 hours',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `employee_notifications`
```sql
CREATE TABLE public.employee_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  type TEXT DEFAULT 'order_confirmed',
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `simple_order_tokens`
```sql
CREATE TABLE public.simple_order_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  employee_id UUID REFERENCES employees(id),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT now() + INTERVAL '1 year',
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### 3.5 Lieferantenportal

#### `supplier_portal_settings`
```sql
CREATE TABLE public.supplier_portal_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  can_view_prices BOOLEAN DEFAULT true,
  can_confirm_orders BOOLEAN DEFAULT true,
  can_suggest_articles BOOLEAN DEFAULT true,
  primary_color TEXT DEFAULT '#3B82F6',
  logo_url TEXT,
  welcome_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(supplier_id)
);
```

#### `supplier_portal_tokens`
```sql
CREATE TABLE public.supplier_portal_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  name TEXT DEFAULT 'Portal Zugang',
  is_active BOOLEAN DEFAULT true,
  can_view_prices BOOLEAN DEFAULT true,
  can_confirm_orders BOOLEAN DEFAULT true,
  can_suggest_articles BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `suggested_articles`
```sql
CREATE TABLE public.suggested_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  name TEXT NOT NULL,
  sku TEXT,
  description TEXT,
  unit TEXT DEFAULT 'Stk',
  price NUMERIC,
  category TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  suggested_by TEXT, -- 'supplier' or 'system'
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `supplier_changes`
```sql
CREATE TABLE public.supplier_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  change_type TEXT NOT NULL, -- 'article_added', 'price_changed', etc.
  entity_type TEXT NOT NULL, -- 'article', 'supplier'
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  status TEXT DEFAULT 'pending',
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### 3.6 Lieferanten-eigene Inventur (Supplier Portal)

#### `supplier_own_inventory_sessions`
```sql
CREATE TABLE public.supplier_own_inventory_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID REFERENCES auth.users(id),
  name TEXT DEFAULT 'Inventur',
  status TEXT DEFAULT 'in_progress',
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `supplier_own_inventory_items`
```sql
CREATE TABLE public.supplier_own_inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES supplier_own_inventory_sessions(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES articles(id),
  storage_1 NUMERIC DEFAULT 0,
  storage_2 NUMERIC DEFAULT 0,
  total NUMERIC GENERATED ALWAYS AS (storage_1 + storage_2) STORED,
  unit_price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### 3.7 B2B-Lieferanten-System

#### `supplier_b2b_accounts`
```sql
CREATE TABLE public.supplier_b2b_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  owner_user_id UUID REFERENCES auth.users(id),
  linked_supplier_id UUID REFERENCES suppliers(id),
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  subscription_tier TEXT DEFAULT 'basic', -- basic, premium
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `b2b_suppliers`
```sql
CREATE TABLE public.b2b_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES supplier_b2b_accounts(id),
  name TEXT NOT NULL,
  description TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  logo_url TEXT,
  order_delivery_method TEXT DEFAULT 'email',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `supplier_b2b_articles`
```sql
CREATE TABLE public.supplier_b2b_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES b2b_suppliers(id),
  account_id UUID NOT NULL REFERENCES supplier_b2b_accounts(id),
  name TEXT NOT NULL,
  sku TEXT,
  description TEXT,
  category TEXT,
  unit TEXT DEFAULT 'Stk',
  base_price NUMERIC NOT NULL,
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `supplier_b2b_customers`
```sql
CREATE TABLE public.supplier_b2b_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_account_id UUID NOT NULL REFERENCES supplier_b2b_accounts(id),
  user_id UUID REFERENCES auth.users(id),
  company_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  customer_number TEXT,
  discount_percent NUMERIC DEFAULT 0,
  payment_terms TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  can_view_all_articles BOOLEAN DEFAULT true,
  own_purchasing_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `customer_article_prices`
```sql
CREATE TABLE public.customer_article_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES supplier_b2b_customers(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES supplier_b2b_articles(id) ON DELETE CASCADE,
  custom_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(customer_id, article_id)
);
```

#### `b2b_customer_supplier_access`
```sql
CREATE TABLE public.b2b_customer_supplier_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES supplier_b2b_customers(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES b2b_suppliers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(customer_id, supplier_id)
);
```

#### `b2b_customer_invitations`
```sql
CREATE TABLE public.b2b_customer_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_account_id UUID NOT NULL REFERENCES supplier_b2b_accounts(id),
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT now() + INTERVAL '7 days',
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `supplier_b2b_orders`
```sql
CREATE TABLE public.supplier_b2b_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES b2b_suppliers(id),
  customer_id UUID NOT NULL REFERENCES supplier_b2b_customers(id),
  order_number TEXT NOT NULL DEFAULT generate_b2b_order_number(),
  status TEXT DEFAULT 'pending',
  total_amount NUMERIC,
  delivery_date DATE,
  delivery_address TEXT,
  notes TEXT,
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `supplier_b2b_order_items`
```sql
CREATE TABLE public.supplier_b2b_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES supplier_b2b_orders(id) ON DELETE CASCADE,
  article_id UUID REFERENCES supplier_b2b_articles(id),
  article_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT DEFAULT 'Stk',
  unit_price NUMERIC,
  total_price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `supplier_b2b_offers`
```sql
CREATE TABLE public.supplier_b2b_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES b2b_suppliers(id),
  account_id UUID NOT NULL REFERENCES supplier_b2b_accounts(id),
  customer_id UUID REFERENCES supplier_b2b_customers(id),
  offer_number TEXT NOT NULL DEFAULT generate_b2b_offer_number(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft',
  valid_until DATE,
  total_amount NUMERIC,
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `supplier_b2b_offer_items`
```sql
CREATE TABLE public.supplier_b2b_offer_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES supplier_b2b_offers(id) ON DELETE CASCADE,
  article_id UUID REFERENCES supplier_b2b_articles(id),
  article_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT DEFAULT 'Stk',
  unit_price NUMERIC,
  total_price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### 3.8 B2B-Lieferanten: Eigener Einkauf (Vendors)

#### `b2b_supplier_vendors`
```sql
CREATE TABLE public.b2b_supplier_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_account_id UUID NOT NULL REFERENCES supplier_b2b_accounts(id),
  supplier_id UUID REFERENCES b2b_suppliers(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `b2b_supplier_vendor_articles`
```sql
CREATE TABLE public.b2b_supplier_vendor_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES b2b_supplier_vendors(id) ON DELETE CASCADE,
  supplier_account_id UUID NOT NULL REFERENCES supplier_b2b_accounts(id),
  name TEXT NOT NULL,
  sku TEXT,
  description TEXT,
  category TEXT,
  unit TEXT DEFAULT 'Stk',
  price NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `b2b_supplier_purchase_orders`
```sql
CREATE TABLE public.b2b_supplier_purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_account_id UUID NOT NULL REFERENCES supplier_b2b_accounts(id),
  vendor_id UUID NOT NULL REFERENCES b2b_supplier_vendors(id),
  order_number TEXT NOT NULL DEFAULT generate_b2b_purchase_order_number(),
  status TEXT DEFAULT 'pending',
  total_amount NUMERIC DEFAULT 0,
  delivery_date DATE,
  delivery_address TEXT,
  notes TEXT,
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `b2b_supplier_purchase_order_items`
```sql
CREATE TABLE public.b2b_supplier_purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES b2b_supplier_purchase_orders(id) ON DELETE CASCADE,
  article_id UUID REFERENCES b2b_supplier_vendor_articles(id),
  article_name TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit TEXT DEFAULT 'Stk',
  unit_price NUMERIC DEFAULT 0,
  total_price NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### 3.9 B2B-Lieferanten: Eigene Inventur

#### `b2b_inventory_sessions`
```sql
CREATE TABLE public.b2b_inventory_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_account_id UUID NOT NULL REFERENCES supplier_b2b_accounts(id),
  supplier_id UUID REFERENCES b2b_suppliers(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT DEFAULT 'Inventur',
  status TEXT DEFAULT 'in_progress',
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `b2b_inventory_items`
```sql
CREATE TABLE public.b2b_inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES b2b_inventory_sessions(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES b2b_supplier_vendor_articles(id),
  storage_1 NUMERIC DEFAULT 0,
  storage_2 NUMERIC DEFAULT 0,
  total NUMERIC GENERATED ALWAYS AS (storage_1 + storage_2) STORED,
  unit_price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### 3.10 B2B-Lieferanten: Mobile Tokens

#### `b2b_mobile_tokens`
```sql
CREATE TABLE public.b2b_mobile_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES supplier_b2b_accounts(id),
  supplier_id UUID REFERENCES b2b_suppliers(id),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT now() + INTERVAL '7 days',
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### 3.11 B2B-Kunden: Eigener Einkauf

#### `b2b_customer_vendors`
```sql
CREATE TABLE public.b2b_customer_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES supplier_b2b_customers(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `b2b_customer_vendor_articles`
```sql
CREATE TABLE public.b2b_customer_vendor_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES b2b_customer_vendors(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES supplier_b2b_customers(id),
  name TEXT NOT NULL,
  sku TEXT,
  description TEXT,
  category TEXT,
  unit TEXT DEFAULT 'Stk',
  price NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `b2b_customer_purchase_orders`
```sql
CREATE TABLE public.b2b_customer_purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES supplier_b2b_customers(id),
  vendor_id UUID NOT NULL REFERENCES b2b_customer_vendors(id),
  order_number TEXT NOT NULL DEFAULT generate_b2b_purchase_order_number(),
  status TEXT DEFAULT 'pending',
  total_amount NUMERIC DEFAULT 0,
  delivery_date DATE,
  delivery_address TEXT,
  notes TEXT,
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `b2b_customer_purchase_order_items`
```sql
CREATE TABLE public.b2b_customer_purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES b2b_customer_purchase_orders(id) ON DELETE CASCADE,
  article_id UUID REFERENCES b2b_customer_vendor_articles(id),
  article_name TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit TEXT DEFAULT 'Stk',
  unit_price NUMERIC DEFAULT 0,
  total_price NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### 3.12 B2B-Lieferanten: Team-Verwaltung

#### `b2b_supplier_users`
```sql
CREATE TABLE public.b2b_supplier_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES supplier_b2b_accounts(id),
  supplier_id UUID NOT NULL REFERENCES b2b_suppliers(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  email TEXT NOT NULL,
  name TEXT,
  role b2b_supplier_role DEFAULT 'manager',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TYPE b2b_supplier_role AS ENUM ('owner', 'manager', 'viewer');
```

### 3.13 Rechnungs-Management

#### `invoices`
```sql
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  supplier_id UUID REFERENCES suppliers(id),
  invoice_number TEXT,
  invoice_date DATE,
  due_date DATE,
  total_amount NUMERIC,
  tax_amount NUMERIC,
  net_amount NUMERIC,
  currency TEXT DEFAULT 'EUR',
  status TEXT DEFAULT 'pending', -- pending, verified, disputed
  pdf_url TEXT,
  raw_text TEXT,
  parsed_data JSONB,
  source TEXT DEFAULT 'manual', -- manual, email, upload
  email_subject TEXT,
  email_received_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `invoice_items`
```sql
CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  article_id UUID REFERENCES articles(id),
  matched_article_id UUID REFERENCES articles(id),
  description TEXT,
  quantity NUMERIC,
  unit TEXT,
  unit_price NUMERIC,
  total_price NUMERIC,
  confidence_score NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `invoice_discrepancies`
```sql
CREATE TABLE public.invoice_discrepancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  invoice_item_id UUID REFERENCES invoice_items(id),
  order_id UUID REFERENCES orders(id),
  order_item_id UUID REFERENCES order_items(id),
  discrepancy_type TEXT NOT NULL, -- price, quantity, missing_item
  expected_value TEXT,
  actual_value TEXT,
  difference_amount NUMERIC,
  status TEXT DEFAULT 'pending', -- pending, resolved, accepted
  notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### 3.14 Inventur (Restaurant)

#### `inventory_sessions`
```sql
CREATE TABLE public.inventory_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  location_id UUID REFERENCES locations(id),
  user_id UUID REFERENCES auth.users(id),
  employee_id UUID REFERENCES employees(id),
  name TEXT DEFAULT 'Inventur',
  status TEXT DEFAULT 'in_progress',
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `inventory_items`
```sql
CREATE TABLE public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES inventory_sessions(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES articles(id),
  storage_1 NUMERIC DEFAULT 0,
  storage_2 NUMERIC DEFAULT 0,
  total NUMERIC GENERATED ALWAYS AS (storage_1 + storage_2) STORED,
  unit_price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### 3.15 Kommunikation

#### `email_templates`
```sql
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  template_type TEXT DEFAULT 'order',
  subject_template TEXT DEFAULT 'Neue Bestellung von {restaurant_name}',
  greeting TEXT DEFAULT 'Guten Tag,',
  introduction TEXT DEFAULT 'hiermit senden wir Ihnen unsere Bestellung:',
  closing TEXT DEFAULT 'Vielen Dank für Ihre Zusammenarbeit.',
  signature TEXT DEFAULT 'Mit freundlichen Grüßen,\n{restaurant_name}',
  article_list_format TEXT DEFAULT '- {article_name}: {quantity} {unit}',
  design_style TEXT DEFAULT 'modern',
  footer_text TEXT,
  footer_logo_url TEXT,
  show_powered_by BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `communication_logs`
```sql
CREATE TABLE public.communication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  order_id UUID REFERENCES orders(id),
  supplier_id UUID REFERENCES suppliers(id),
  employee_id UUID REFERENCES employees(id),
  email_type TEXT NOT NULL, -- order, confirmation, reminder
  direction TEXT DEFAULT 'outgoing',
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  body_html TEXT,
  status TEXT DEFAULT 'sent', -- sent, failed, opened, confirmed
  error_message TEXT,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### 3.16 Lieferadressen

#### `delivery_addresses`
```sql
CREATE TABLE public.delivery_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  location_id UUID REFERENCES locations(id),
  label TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  postal_code TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT DEFAULT 'Germany',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### 3.17 System-Tabellen

#### `organization_settings`
```sql
CREATE TABLE public.organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) UNIQUE,
  default_delivery_time_window TEXT,
  auto_send_orders BOOLEAN DEFAULT false,
  require_order_approval BOOLEAN DEFAULT false,
  notification_email TEXT,
  invoice_email TEXT,
  default_language TEXT DEFAULT 'de',
  timezone TEXT DEFAULT 'Europe/Berlin',
  currency TEXT DEFAULT 'EUR',
  price_display_mode TEXT DEFAULT 'net', -- net, gross
  invoice_processing_enabled BOOLEAN DEFAULT false,
  voice_ordering_enabled BOOLEAN DEFAULT false,
  price_watch_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `edge_function_registry`
```sql
CREATE TABLE public.edge_function_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL UNIQUE,
  label_de TEXT NOT NULL,
  label_en TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `translation_overrides`
```sql
CREATE TABLE public.translation_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  language TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(organization_id, language, key)
);
```

#### `system_feature_priorities`
```sql
CREATE TABLE public.system_feature_priorities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  feature_key TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  is_enabled BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(organization_id, feature_key)
);
```

### 3.18 Rate Limiting

#### `demo_account_rate_limits`
```sql
CREATE TABLE public.demo_account_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `simple_order_rate_limits`
```sql
CREATE TABLE public.simple_order_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `pin_verification_rate_limits`
```sql
CREATE TABLE public.pin_verification_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  employee_id UUID REFERENCES employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `magic_link_rate_limits`
```sql
CREATE TABLE public.magic_link_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### 3.19 Preisüberwachung

#### `price_watch_items`
```sql
CREATE TABLE public.price_watch_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  article_id UUID REFERENCES articles(id),
  search_term TEXT NOT NULL,
  current_best_price NUMERIC,
  current_best_supplier TEXT,
  last_checked_at TIMESTAMP WITH TIME ZONE,
  alert_threshold_percent NUMERIC DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `price_watch_results`
```sql
CREATE TABLE public.price_watch_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watch_item_id UUID NOT NULL REFERENCES price_watch_items(id) ON DELETE CASCADE,
  supplier_name TEXT NOT NULL,
  product_name TEXT,
  price NUMERIC NOT NULL,
  unit TEXT,
  source_url TEXT,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `price_alerts`
```sql
CREATE TABLE public.price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  watch_item_id UUID REFERENCES price_watch_items(id),
  article_id UUID REFERENCES articles(id),
  alert_type TEXT NOT NULL, -- price_drop, price_increase, new_supplier
  old_price NUMERIC,
  new_price NUMERIC,
  difference_percent NUMERIC,
  supplier_name TEXT,
  is_read BOOLEAN DEFAULT false,
  email_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### 3.20 Wein-spezifische Tabellen

#### `wine_quiz_scores`
```sql
CREATE TABLE public.wine_quiz_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id),
  user_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id),
  player_name TEXT,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  time_taken_seconds INTEGER,
  difficulty TEXT DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### 3.21 Team & Einladungen

#### `team_invitations`
```sql
CREATE TABLE public.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  email TEXT NOT NULL,
  role app_role DEFAULT 'viewer',
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT now() + INTERVAL '7 days',
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `sponsored_accounts`
```sql
CREATE TABLE public.sponsored_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_organization_id UUID NOT NULL REFERENCES organizations(id),
  sponsored_organization_id UUID REFERENCES organizations(id),
  email TEXT NOT NULL,
  company_name TEXT,
  status TEXT DEFAULT 'pending', -- pending, active, expired
  invitation_token TEXT UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  activated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### 3.22 Foto-Capture

#### `photo_capture_tokens`
```sql
CREATE TABLE public.photo_capture_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT now() + INTERVAL '24 hours',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `photo_suggestions`
```sql
CREATE TABLE public.photo_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  supplier_id UUID REFERENCES suppliers(id),
  image_url TEXT NOT NULL,
  suggested_name TEXT,
  suggested_sku TEXT,
  suggested_category TEXT,
  suggested_price NUMERIC,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  article_id UUID REFERENCES articles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

---

## 4. Edge Functions (57 Funktionen)

### 4.1 Authentifizierung & Benutzer

| Funktion | Beschreibung |
|----------|--------------|
| `verify-employee-login` | Mitarbeiter-Login mit Name-Matching |
| `verify-employee-pin` | PIN-Verifizierung für EasyOrder |
| `hash-employee-pin` | PIN sicher hashen |
| `verify-simple-order-token` | Token für EasyOrder validieren |
| `verify-photo-capture-token` | Token für Foto-Upload validieren |
| `verify-supplier-token` | Lieferantenportal-Token prüfen |
| `verify-b2b-mobile-token` | B2B Mobile Token validieren |

### 4.2 Bestellungen

| Funktion | Beschreibung |
|----------|--------------|
| `send-order-email` | Bestellung per E-Mail senden |
| `confirm-order` | Bestellung vom Lieferanten bestätigen |
| `get-order-details` | Bestelldetails für Portal abrufen |
| `submit-simple-order` | EasyOrder-Bestellung einreichen |
| `submit-b2b-order` | B2B-Bestellung einreichen |
| `notify-preorder-received` | Vorbestellung-Benachrichtigung |

### 4.3 Demo-Modus

| Funktion | Beschreibung |
|----------|--------------|
| `create-demo-account` | Demo-Account erstellen |
| `populate-demo-data` | Demo-Daten generieren |
| `convert-demo-account` | Demo zu vollem Account konvertieren |
| `delete-demo-organization` | Demo-Organisation löschen |

### 4.4 B2B-Lieferanten

| Funktion | Beschreibung |
|----------|--------------|
| `create-b2b-account-user` | B2B-Benutzer erstellen |
| `update-b2b-account-email` | B2B E-Mail aktualisieren |
| `reset-b2b-customer-password` | Kundenpasswort zurücksetzen |
| `send-b2b-customer-invitation` | Kundeneinladung senden |
| `accept-b2b-customer-invitation` | Einladung annehmen |
| `send-b2b-offer` | Angebot per E-Mail senden |
| `send-b2b-purchase-order` | Einkaufsbestellung senden |
| `send-b2b-customer-purchase-order` | Kundenbestellung senden |
| `create-b2b-mobile-token` | Mobile Token erstellen |
| `manage-b2b-mobile-inventory` | Mobile Inventur verwalten |
| `upgrade-b2b-customer` | Kunde upgraden |

### 4.5 Lieferantenportal

| Funktion | Beschreibung |
|----------|--------------|
| `create-supplier-portal-token` | Portal-Token erstellen |
| `supplier-portal-articles` | Artikel für Portal abrufen |
| `create-article-from-mobile` | Artikel via Mobile erstellen |
| `create-articles-batch` | Mehrere Artikel erstellen |
| `create-photo-suggestion` | Foto-Vorschlag erstellen |
| `update-article-image` | Artikelbild aktualisieren |

### 4.6 Team & Einladungen

| Funktion | Beschreibung |
|----------|--------------|
| `send-invitation-email` | Team-Einladung senden |
| `accept-invitation` | Team-Einladung annehmen |
| `invite-sponsored-account` | Gesponserten Account einladen |
| `send-supplier-magic-link` | Magic Link für Lieferanten |
| `request-new-magic-link` | Neuen Magic Link anfordern |

### 4.7 KI & Automatisierung

| Funktion | Beschreibung |
|----------|--------------|
| `transcribe-order` | Sprachbestellung transkribieren |
| `transcribe-inventory` | Sprach-Inventur transkribieren |
| `parse-invoice` | Rechnung mit KI parsen |
| `check-invoice-emails` | Rechnungs-E-Mails abrufen |
| `identify-article` | Artikel per Foto identifizieren |
| `ai-import-helper` | KI-gestützter CSV-Import |
| `scan-order-list` | Bestellliste scannen |

### 4.8 ElevenLabs Integration

| Funktion | Beschreibung |
|----------|--------------|
| `elevenlabs-conversation-token` | Voice-Token für Bestellung |
| `elevenlabs-industry-token` | Voice-Token für Onboarding |

### 4.9 Preisüberwachung

| Funktion | Beschreibung |
|----------|--------------|
| `search-kroeswang-catalog` | Kröswang-Katalog durchsuchen |
| `search-price-alternatives` | Preisalternativen finden |
| `send-price-alerts` | Preisalarme senden |

### 4.10 Wein-Modul

| Funktion | Beschreibung |
|----------|--------------|
| `import-wine-data` | Weindaten importieren |
| `research-wine` | Wein recherchieren |
| `search-wine-image` | Weinbild suchen |
| `translate-wine-content` | Weinbeschreibung übersetzen |

### 4.11 Mitarbeiter & Favoriten

| Funktion | Beschreibung |
|----------|--------------|
| `manage-simple-order-favorites` | Favoriten verwalten |
| `get-employee-drafts` | Mitarbeiter-Entwürfe abrufen |
| `update-employee-draft` | Entwurf aktualisieren |
| `delete-employee-draft` | Entwurf löschen |

### 4.12 Sonstiges

| Funktion | Beschreibung |
|----------|--------------|
| `send-trial-reminders` | Trial-Erinnerungen senden |

---

## 5. Module & Features

### 5.1 Katalog-Modul

#### Lieferanten-Verwaltung
```typescript
// Features:
- CRUD für Lieferanten
- Logo-Upload
- Liefertage & Bestellfristen
- Mindestbestellwert
- Kundennummer
- Mehrere Standorte zuweisen
- QR-Code für Portal
- Token-Management
```

#### Artikel-Verwaltung
```typescript
// Features:
- CRUD für Artikel
- Bild-Upload
- Kategorien & Top-Kategorien
- Preishistorie
- Verpackungseinheiten
- Bestelleinheiten
- Referenzpreise (z.B. €/kg)
- Standort-spezifische Preise
- CSV-Import mit KI-Unterstützung
- Batch-Foto-Upload
```

### 5.2 Warenkorb & Checkout

```typescript
// Features:
- Multi-Lieferanten-Warenkorb
- Entwürfe speichern/laden
- Lieferdatum & Zeitfenster
- Lieferadresse wählen
- Freitext-Artikel
- Mengenänderung
- E-Mail-Vorschau
- Parallel-Bestellung an mehrere Lieferanten
```

### 5.3 Bestellungen

```typescript
// Features:
- Bestellübersicht mit Filtern
- Status-Tracking (pending, sent, confirmed)
- Bestätigungs-Link für Lieferanten
- E-Mail-Protokoll
- PDF-Export
- Bestellung erneut senden
```

### 5.4 EasyOrder (SimpleOrder)

```typescript
// Features:
- Login via Name + PIN
- Standort-Auswahl
- Lieferanten-Filter pro Standort
- Artikel-Favoriten
- Spracheingabe für Bestellung
- Freitext-Artikel (optional)
- Foto-Capture für neue Artikel
- Benachrichtigungen bei Bestätigung
- Kein Supabase-Auth nötig
```

### 5.5 Lieferantenportal

```typescript
// Features:
- Token-basierter Zugang
- Bestellungsansicht
- Bestellung bestätigen
- Artikel vorschlagen
- Eigene Artikel verwalten
- Eigene Inventur durchführen
- PDF-Export
- Mobile-optimiert
```

### 5.6 B2B-Lieferanten-Dashboard

```typescript
// Features:
- Eigenes Kunden-CRM
- Artikel-Katalog verwalten
- Kundenspezifische Preise
- Angebote erstellen & versenden
- Bestellungen empfangen
- Eigener Einkauf (Vendors)
- Eigene Inventur
- Mobile QR-Code Zugang
- Team-Verwaltung
- Premium-Upgrade für Kunden
```

### 5.7 B2B-Kunden-Portal

```typescript
// Features:
- Login via Einladung
- Katalog durchsuchen
- Bestellung aufgeben
- Bestellhistorie
- Eigene Lieferanten (Vendors)
- Eigener Einkauf
- Mobile-optimiert
```

### 5.8 Berichte

```typescript
// Features:
- Preishistorie-Diagramme
- Preisentwicklung pro Artikel
- Inventur-Vergleich
- Rechnungsverarbeitung
- Preisüberwachung (Kröswang)
- PDF/Excel Export
```

### 5.9 KI-Rechnungsverarbeitung

```typescript
// Features:
- PDF-Upload
- E-Mail-Import (IMAP)
- OCR mit GPT-4 Vision
- Automatisches Matching
- Preisabweichungen erkennen
- Mengenabweichungen erkennen
- Preise automatisch aktualisieren
```

### 5.10 Sprachsteuerung

```typescript
// Features:
- Voice-to-Order
- Voice-to-Inventory
- ElevenLabs Integration
- Mehrsprachig
```

### 5.11 Wein-Modul

```typescript
// Features:
- Wein-Katalog
- Automatische Beschreibungen
- Rebsorte, Herkunft, Geschmack
- Speise-Empfehlungen
- Wein-Quiz für Mitarbeiter
- Mehrsprachige Übersetzung
- PDF-Weinkarte
```

### 5.12 Inventur

```typescript
// Features:
- Mehrere Lagerorte
- Artikel-Wert berechnen
- Vergleich mit Vorperiode
- PDF/Excel Export
- Voice-Eingabe
```

### 5.13 Einstellungen

```typescript
// Features:
- Organisationsprofil
- Team-Verwaltung
- Standorte & Adressen
- Mitarbeiter-Verwaltung
- E-Mail-Templates
- Bestelleinheiten
- Kategorien
- Übersetzungen anpassen
- System-Features priorisieren
- Datenexport/-import
```

---

## 6. Authentifizierung & Rollen

### 6.1 Benutzerrollen

```typescript
type AppRole = 'admin' | 'manager' | 'purchaser' | 'viewer';

const rolePermissions = {
  admin: {
    // Volle Kontrolle
    canManageTeam: true,
    canManageSettings: true,
    canManageSuppliers: true,
    canManageArticles: true,
    canCreateOrders: true,
    canViewReports: true,
    canDeleteData: true,
  },
  manager: {
    // Verwaltung ohne Team
    canManageTeam: false,
    canManageSettings: true,
    canManageSuppliers: true,
    canManageArticles: true,
    canCreateOrders: true,
    canViewReports: true,
    canDeleteData: false,
  },
  purchaser: {
    // Nur Bestellungen
    canManageTeam: false,
    canManageSettings: false,
    canManageSuppliers: false,
    canManageArticles: false,
    canCreateOrders: true,
    canViewReports: false,
    canDeleteData: false,
  },
  viewer: {
    // Nur lesen
    canManageTeam: false,
    canManageSettings: false,
    canManageSuppliers: false,
    canManageArticles: false,
    canCreateOrders: false,
    canViewReports: true,
    canDeleteData: false,
  },
};
```

### 6.2 Datenbank-Funktionen für Rollen

```sql
-- Rolle prüfen
CREATE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Organisation des Users abrufen
CREATE FUNCTION get_user_organization_id(user_id UUID)
RETURNS UUID AS $$
  SELECT organization_id FROM profiles WHERE id = user_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Super-Admin prüfen (für System-Wartung)
CREATE FUNCTION is_super_admin(_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = _user_id AND email = 'admin@example.com'
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

### 6.3 B2B-spezifische Funktionen

```sql
-- B2B-Lieferanten-Inhaber prüfen
CREATE FUNCTION is_b2b_supplier_owner(p_user_id UUID, p_account_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM supplier_b2b_accounts
    WHERE id = p_account_id AND owner_user_id = p_user_id
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- B2B-Kunde prüfen
CREATE FUNCTION is_b2b_customer(p_user_id UUID, p_account_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM supplier_b2b_customers
    WHERE user_id = p_user_id AND supplier_account_id = p_account_id AND is_active = true
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

---

## 7. Sicherheitsarchitektur

### 7.1 Row Level Security (RLS)

Alle Tabellen verwenden RLS. Grundprinzip:

```sql
-- Beispiel: Artikel nur für eigene Organisation sichtbar
CREATE POLICY "Users can view articles in their organization"
ON articles FOR SELECT
USING (organization_id = get_user_organization_id(auth.uid()));

-- Nur Admins und Manager können Artikel erstellen
CREATE POLICY "Admins and managers can insert articles"
ON articles FOR INSERT
WITH CHECK (
  organization_id = get_user_organization_id(auth.uid())
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
);

-- Nur Admins können Artikel löschen
CREATE POLICY "Admins can delete articles"
ON articles FOR DELETE
USING (
  organization_id = get_user_organization_id(auth.uid())
  AND has_role(auth.uid(), 'admin')
);
```

### 7.2 Service Role Policies

Für Edge Functions, die ohne Benutzer-Kontext arbeiten:

```sql
CREATE POLICY "Service role can insert communication logs"
ON communication_logs FOR INSERT
WITH CHECK (true);
```

### 7.3 Token-basierter Zugang

Für Portal-Zugang ohne Supabase-Auth:

```sql
-- Token wird in Edge Function validiert
-- Dann mit Service Role auf Daten zugegriffen
```

### 7.4 Rate Limiting

```sql
-- Beispiel: Max 5 Demo-Accounts pro IP in 24h
SELECT COUNT(*) FROM demo_account_rate_limits
WHERE ip_address = $1
AND created_at > now() - INTERVAL '24 hours';
```

### 7.5 PIN-Hashing

```typescript
// In Edge Function mit bcrypt
const hashedPin = await bcrypt.hash(pin, 10);
const isValid = await bcrypt.compare(inputPin, hashedPin);
```

---

## 8. UI/UX-Spezifikationen

### 8.1 Design System

```css
/* Farben (HSL) */
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --primary: 142.1 76.2% 36.3%;
  --primary-foreground: 355.7 100% 97.3%;
  --secondary: 0 0% 96.1%;
  --muted: 0 0% 96.1%;
  --accent: 0 0% 96.1%;
  --destructive: 0 84.2% 60.2%;
  --border: 0 0% 89.8%;
  --ring: 142.1 76.2% 36.3%;
}

.dark {
  --background: 0 0% 3.9%;
  --foreground: 0 0% 98%;
  /* ... */
}
```

### 8.2 Responsive Breakpoints

```typescript
const breakpoints = {
  sm: '640px',   // Mobile
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large Desktop
  '2xl': '1536px', // Extra Large
};
```

### 8.3 Komponenten-Bibliothek

Basierend auf shadcn/ui:
- Button, Input, Select, Checkbox
- Dialog, Sheet, Popover
- Table, Card, Tabs
- Form mit react-hook-form + zod
- Toast (Sonner)
- Calendar (react-day-picker)

### 8.4 Navigation

```typescript
// Sidebar-Navigation
const navigation = [
  { name: 'suppliers', icon: Package, path: '/suppliers' },
  { name: 'cart', icon: ShoppingCart, path: '/cart' },
  { name: 'orders', icon: FileText, path: '/orders' },
  { name: 'reports', icon: BarChart, path: '/reports' },
  { name: 'settings', icon: Settings, path: '/settings' },
];

// Mobile: Bottom Navigation
```

### 8.5 Keyboard Shortcuts

```typescript
const shortcuts = {
  'Ctrl+K': 'Globale Suche',
  'Ctrl+B': 'Warenkorb',
  'Ctrl+N': 'Neue Bestellung',
  'Ctrl+S': 'Speichern',
  'Escape': 'Dialog schließen',
};
```

---

## 9. Internationalisierung

### 9.1 Unterstützte Sprachen

| Code | Sprache |
|------|---------|
| `de` | Deutsch |
| `en` | English |
| `fr` | Français |
| `it` | Italiano |
| `th` | ไทย |
| `vi` | Tiếng Việt |

### 9.2 i18n-Konfiguration

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'de',
    supportedLngs: ['de', 'en', 'fr', 'it', 'th', 'vi'],
    interpolation: { escapeValue: false },
    resources: {
      de: { translation: deTranslations },
      en: { translation: enTranslations },
      // ...
    },
  });
```

### 9.3 Übersetzungs-Struktur

```json
{
  "common": {
    "save": "Speichern",
    "cancel": "Abbrechen",
    "delete": "Löschen"
  },
  "suppliers": {
    "title": "Lieferanten",
    "addNew": "Neuer Lieferant"
  },
  "articles": {
    "title": "Artikel",
    "price": "Preis"
  }
}
```

---

## 10. Integrationen

### 10.1 E-Mail (SMTP/IMAP)

```typescript
// Secrets:
- SMTP_HOST
- SMTP_PORT
- SMTP_USERNAME
- SMTP_PASSWORD
- SMTP_FROM

// Für Rechnungs-Import:
- INVOICE_IMAP_HOST
- INVOICE_IMAP_PORT
- INVOICE_IMAP_USER
- INVOICE_IMAP_PASSWORD
```

### 10.2 OpenAI

```typescript
// Secrets:
- OPENAI_API_KEY

// Verwendung:
- Rechnungs-OCR (GPT-4 Vision)
- Artikelerkennung
- CSV-Import-Hilfe
```

### 10.3 ElevenLabs

```typescript
// Secrets:
- ELEVENLABS_API_KEY
- ELEVENLABS_AGENT_ID

// Verwendung:
- Voice-to-Order
- Voice-to-Inventory
- Onboarding-Assistent
```

### 10.4 Resend

```typescript
// Secrets:
- RESEND_API_KEY

// Verwendung:
- E-Mail-Versand als Alternative zu SMTP
```

### 10.5 Perplexity (Optional)

```typescript
// Secrets:
- PERPLEXITY_API_KEY

// Verwendung:
- Wein-Recherche
- Marktanalyse
```

### 10.6 Firecrawl (Optional)

```typescript
// Secrets:
- FIRECRAWL_API_KEY

// Verwendung:
- Web-Scraping für Preisvergleich
```

---

## 11. Demo-Modus

### 11.1 Funktionsweise

```typescript
// 1. Demo-Account erstellen
const { email, password } = await createDemoAccount();

// 2. Demo-Daten generieren
await populateDemoData(organizationId);

// 3. 7-Tage Trial
organization.demo_expires_at = new Date() + 7 days;

// 4. Nach Ablauf: Konvertierung oder Löschung
if (isDemoExpired && !isConverted) {
  await deleteDemoOrganization(organizationId);
}
```

### 11.2 Demo-Daten

```typescript
const demoData = {
  suppliers: [
    { name: 'Kröswang', category: 'Lebensmittel' },
    { name: 'Metro', category: 'Großhandel' },
    { name: 'Getränke Hoffmann', category: 'Getränke' },
  ],
  articles: [
    // ~50 Artikel pro Lieferant
  ],
  employees: [
    { name: 'Max Koch', pin: '1234' },
    { name: 'Anna Barkeeper', pin: '5678' },
  ],
};
```

---

## 12. Entwicklungs-Roadmap

### Phase 1: Kern-Module (4-6 Wochen)

```
✅ Woche 1-2:
- Projekt-Setup (Vite, React, TypeScript)
- Supabase-Integration
- Auth-System (Login, Registrierung)
- Basis-Layouts

✅ Woche 3-4:
- Lieferanten-CRUD
- Artikel-CRUD
- Kategorien
- Standorte

✅ Woche 5-6:
- Warenkorb-Logik
- Checkout-Flow
- E-Mail-Versand
- Bestellübersicht
```

### Phase 2: Erweiterte Features (4-6 Wochen)

```
✅ Woche 7-8:
- EasyOrder (SimpleOrder)
- Mitarbeiter-Verwaltung
- PIN-Authentifizierung

✅ Woche 9-10:
- Lieferantenportal
- Token-Management
- Bestellbestätigung

✅ Woche 11-12:
- B2B-Lieferanten-Dashboard
- Kundenverwaltung
- Angebote
```

### Phase 3: KI & Automatisierung (4-6 Wochen)

```
✅ Woche 13-14:
- Rechnungs-Upload
- OCR-Integration
- Preisvergleich

✅ Woche 15-16:
- Voice-to-Order
- Voice-to-Inventory
- Sprachsteuerung

✅ Woche 17-18:
- Preisüberwachung
- Alerts
- Automatisierungen
```

### Phase 4: Polish & Launch (2-4 Wochen)

```
✅ Woche 19-20:
- Performance-Optimierung
- Internationalisierung
- Dokumentation

✅ Woche 21-22:
- Testing
- Bug-Fixing
- Soft-Launch
```

---

## 📊 System-Metriken

| Metrik | Wert |
|--------|------|
| Seiten/Routes | 41 |
| Edge Functions | 57 |
| Datenbank-Tabellen | 89 |
| React-Komponenten | ~200 |
| i18n-Sprachen | 6 |
| shadcn/ui Komponenten | 45+ |

---

## 🚀 Quick-Start Prompt

Wenn du dieses System nachbauen möchtest, verwende folgenden kompakten Prompt:

```
Erstelle ein B2B-Bestellsystem für die Gastronomie mit:

Tech-Stack:
- React 18 + TypeScript + Vite
- TailwindCSS + shadcn/ui
- Supabase (Auth, DB, Storage, Edge Functions)
- React Query + React Router + i18next

Kernfunktionen:
1. Multi-Tenant mit Organisationen
2. Lieferanten & Artikel-Katalog
3. Warenkorb & E-Mail-Checkout
4. Mitarbeiter-Bestellungen (PIN-Login)
5. Lieferantenportal (Token-Zugang)
6. B2B-Lieferanten-Dashboard
7. KI-Rechnungsverarbeitung
8. Sprachsteuerung (ElevenLabs)
9. Inventur-Modul
10. Demo-Modus (7-Tage Trial)

Rollen: Admin, Manager, Einkäufer, Betrachter
Sprachen: DE, EN, FR, IT, TH, VI

Sicherheit: RLS für alle Tabellen, PIN-Hashing, Rate-Limiting
```

---

## 📝 Lizenz & Credits

Dieses Dokument beschreibt die Architektur von **Bestellung.pro**.

Erstellt mit ❤️ für die Gastronomie.

---

*Dokumentversion: 1.0.0 | Stand: Dezember 2024*
