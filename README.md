# DnD Story Forge 🐉

Eine Web-App für Pen & Paper Rollenspieler. Erstelle Charaktere, generiere Geschichten und spiele mit Freunden am virtuellen Spieltisch.

## Features

### 🏠 Landingpage
- Übersicht über alle Features
- Schnellzugriff auf alle Bereiche

### 🧙‍♂️ Charaktergenerator
- Erstelle PCs (Spielercharaktere) und NPCs
- Wähle Rasse, Klasse und Typ
- DnD-Attribute (STR, DEX, CON, INT, WIS, CHA) mit grafischen Balken
- Attribute würfeln (4W6, niedrigsten weglassen)
- **KI-generierte Hintergrundgeschichten** (via Perplexity)
- **KI-generierte Avatare** (via Gemini)
- Inventar-Verwaltung
- Charakterliste mit Bearbeiten/Löschen

### 📖 Story-Generator
- Wähle Genre (Fantasy, Dark Fantasy, Horror, etc.)
- Wähle Ton (Episch, Düster, Humorvoll, Geheimnisvoll)
- Wähle Länge (One-Shot, Kurzabenteuer, Kampagne)
- **KI-generierte Abenteuer** mit Synopsis und Szenen
- Geschichten speichern und verwalten

### 🎮 Virtueller Spieltisch
- Geschichte und Charaktere für die Session auswählen
- Echtzeit-Chat mit Rollenwahl (Spielleiter oder Charakter)
- **KI-Spielleiter** für dynamische Antworten
- **KI-generierte Szenenbilder** (via Gemini)
- Szenen durchschalten

## Installation

### 1. Backend starten

```bash
cd backend
npm install
```

Erstelle eine `.env` Datei im `backend/` Ordner (siehe `.env.example`):

```env
PERPLEXITY_API_KEY=dein-perplexity-key
GEMINI_API_KEY=dein-gemini-key
PORT=4000
```

Starte den Server:

```bash
npm start
```

### 2. Frontend öffnen

Öffne einfach `index.html` im Browser.

> **Hinweis:** Das Frontend erwartet das Backend auf `http://localhost:4000`

## API Keys

Die API-Keys werden sicher im Backend gespeichert und sind NICHT im Git-Repository enthalten.

- **Perplexity API:** [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
- **Gemini API:** [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

## Technologie

### Frontend
- Pure HTML5, CSS3, JavaScript (ES6+)
- Responsive Design für Desktop und Tablet
- LocalStorage für Charaktere und Geschichten

### Backend
- Node.js + Express
- API-Proxies für Perplexity und Gemini
- dotenv für sichere Konfiguration

## Entwicklung

```bash
# Backend im Dev-Modus
cd backend
npm run dev
```

## Lizenz

MIT License - Frei verwendbar für alle Abenteurer! ⚔️
