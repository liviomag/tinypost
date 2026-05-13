# AGENTS.md

# Projektvision

Erstelle eine moderne, minimalistische und hochwertige Webplattform mit:

- HTML
- CSS
- JavaScript
- Supabase als Backend
- modularer Architektur
- sauberer Projektstruktur
- konfigurationsbasierter Verwaltung
- Notion-inspiriertem Design
- skalierbarer Erweiterbarkeit

Die Plattform soll professionell, wartbar und leicht ausbaubar aufgebaut werden.

---

# Grundprinzipien

- Saubere Trennung von Verantwortlichkeiten
- Modularer Aufbau
- Wiederverwendbare Komponenten
- Keine Hardcodierung von Konfigurationen
- Konfigurationswerte immer über JSON-Dateien
- Frontend und Backend logisch getrennt
- Erweiterbar für zukünftige Features
- Hohe Lesbarkeit des Codes
- Einheitliche Benennung
- Minimalistische User Experience

---

# Verwendete Technologien

## Frontend

- HTML
- CSS
- JavaScript (Vanilla JS)

## Backend

- Supabase

## Supabase Features

- Authentication
- Database
- Row Level Security (RLS)
- Edge Functions
- Storage
- Realtime (optional)

---

# Design-Richtung

Das Design soll sich visuell stark an Notion orientieren.

## Design-Merkmale

- Minimalistisch
- Sehr viel Whitespace
- Ruhige Oberflächen
- Klare Typografie
- Dezente Schatten
- Leichte Borders
- Abgerundete Elemente
- Klare Hierarchien
- Fokus auf Lesbarkeit
- Keine überladenen Interfaces
- Sanfte Hover-Effekte
- Moderne Sidebar-Struktur
- Cleanes Dashboard-Layout

---

# Farbwelt

```css
:root {
  --bg: #ffffff;
  --surface: #f7f7f5;
  --surface-hover: #efefec;

  --text: #2f3437;
  --text-muted: #787774;

  --border: #e5e5e5;

  --primary: #111111;
  --primary-hover: #222222;

  --radius: 12px;

  --shadow-sm:
    0 1px 2px rgba(0,0,0,0.04);

  --shadow-md:
    0 4px 12px rgba(0,0,0,0.06);

  --transition:
    150ms ease;
}
```

---

# Projektstruktur

```txt
project-root/
│
├── AGENTS.md
├── README.md
│
├── frontend/
│   ├── index.html
│   ├── pages/
│   ├── css/
│   ├── js/
│   └── assets/
│
├── config/
│   ├── supabase.json
│   ├── webhooks.json
│   └── assets.json
│
├── supabase/
│   ├── functions/
│   └── sql/
│
└── docs/
```

---

# Frontend-Struktur

```txt
frontend/
│
├── pages/
│   ├── home.html
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── profile.html
│   └── settings.html
│
├── css/
│   ├── main.css
│   ├── variables.css
│   ├── layout.css
│   ├── typography.css
│   ├── components.css
│   ├── auth.css
│   └── pages/
│
├── js/
│   ├── main.js
│   ├── router.js
│   ├── configLoader.js
│   │
│   ├── services/
│   ├── auth/
│   ├── components/
│   ├── pages/
│   └── utils/
│
└── assets/
    ├── images/
    ├── icons/
    ├── logos/
    ├── illustrations/
    └── documents/
```

---

# Konfigurationen

## Supabase-Konfiguration

Datei:

```txt
config/supabase.json
```

Beispiel:

```json
{
  "supabaseUrl": "https://your-project.supabase.co",
  "supabaseAnonKey": "your-public-anon-key"
}
```

## Webhook-Konfiguration

Datei:

```txt
config/webhooks.json
```

## Asset-Konfiguration

Datei:

```txt
config/assets.json
```

Beispiel:

```json
{
  "logo": "assets/logos/logo.svg",
  "heroImage": "assets/images/hero.jpg",
  "avatarDefault": "assets/images/avatar.png"
}
```

---

# Authentifizierung

Die Plattform verwendet Supabase Auth.

## Unterstützte Funktionen

- Registrierung mit E-Mail + Passwort
- Login mit E-Mail + Passwort
- Logout
- Session-Verwaltung
- Geschützte Seiten
- Session-Prüfung
- Automatische Weiterleitungen

---

# Auth-Struktur

```txt
frontend/js/auth/
├── login.js
├── register.js
├── logout.js
├── session.js
└── guards.js
```

---

# Supabase Edge Functions

```txt
supabase/functions/
```

## Regeln

- Jede Function erhält eigenen Ordner
- Einstiegspunkt immer `index.ts`
- TypeScript verwenden
- Shared Code in `_shared/`
- Keine Secrets hardcodieren
- Environment Variables verwenden

---

# SQL-Struktur

```txt
supabase/sql/
```

## Nummerierung

```txt
001_initial_schema.sql
002_rls_policies.sql
003_storage_buckets.sql
004_seed_data.sql
005_indexes.sql
006_functions.sql
007_triggers.sql
008_views.sql
```

## SQL-Regeln

- Niemals bestehende SQL-Dateien überschreiben
- Änderungen immer als neue Datei
- Immer fortlaufende Nummern
- SQL direkt ausführbar halten
- Möglichst `IF NOT EXISTS` verwenden

---

# CSS-Regeln

- Keine Inline-Styles
- Komponentenbasiertes Styling
- Mobile-first
- Responsive Layouts

---

# JavaScript-Regeln

- Kein Inline-JavaScript
- Saubere Modulstruktur
- Wiederverwendbare Funktionen
- Logik nach Verantwortlichkeit trennen

---

# Sicherheit

- RLS immer aktivieren
- Keine Secrets im Frontend
- Keine Service Role Keys im Browser
- Authentifizierung ausschließlich über Supabase
- Input validieren
- Webhooks absichern
- SQL Injection vermeiden

---

# UX/UI-Ziele

Die Plattform soll:

- hochwertig wirken
- ruhig wirken
- modern wirken
- extrem sauber wirken
- schnell verständlich sein
- einfach navigierbar sein

---

# Zielqualität

Der finale Code soll:

- sauber
- modular
- production-ready
- skalierbar
- wartbar
- performant
- logisch strukturiert
- visuell hochwertig

sein.
