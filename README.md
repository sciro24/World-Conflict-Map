<div align="center">

# 🎯 RISIKO IRL

### Real-Time Global Conflict Monitor

[![Next.js](https://img.shields.io/badge/Next.js-16.1.3-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.3-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

*Trasforma i dati geopolitici in tempo reale in una visualizzazione stile gioco da tavolo Risiko*

[Demo Live](#demo) • [Funzionalità](#-funzionalità) • [Installazione](#-installazione) • [Tecnologie](#-tecnologie) • [API](#-api)

</div>

---

## 📸 Screenshot

<div align="center">

### Dashboard Principale
<img src="./img/screenshot_main.png" alt="Risiko IRL Dashboard" width="800" />

*Mappa mondiale interattiva con continenti colorati stile Risiko e feed conflitti in tempo reale*

### Dettagli Conflitti
<img src="./img/screenshot_popup.png" alt="Conflict Details Popup" width="600" />

*Popup interattivi sui marker tank con dettagli su aggressore, target e gravità*

### Vista Mobile
<img src="./img/screenshot_mobile.png" alt="Mobile Responsive View" width="300" />

*Layout completamente responsive per dispositivi mobili*

</div>

---

## 🌟 Panoramica

**RISIKO IRL** è un'applicazione web moderna che visualizza i conflitti mondiali in tempo reale su una mappa interattiva ispirata al classico gioco da tavolo Risiko. L'app utilizza i dati del [GDELT Project](https://www.gdeltproject.org/) per monitorare eventi di conflitto armato in tutto il mondo.

### 🎮 Concetto

Immagina di giocare a Risiko, ma con dati reali provenienti da tutto il mondo. Ogni continente è colorato secondo la tradizione del gioco:

| Continente | Colore |
|------------|--------|
| 🔵 Europa | Blu |
| 🟢 Asia | Verde |
| 🟠 Nord America | Arancione |
| 🔷 Sud America | Azzurro |
| 🟤 Africa | Marrone |
| 🟣 Oceania | Viola |

---

## ✨ Funzionalità

### 🗺️ Mappa Interattiva
- **Visualizzazione Stile Risiko**: Continenti colorati come nel gioco da tavolo
- **Zoom e Pan**: Navigazione fluida della mappa mondiale
- **Scroll Infinito**: Panning orizzontale continuo attraverso il globo
- **Highlighting Dinamico**: Paesi in conflitto evidenziati con bordi luminosi

### 🎖️ Marker Tank
- **Icone Tank Personalizzate**: Ogni conflitto è rappresentato da un tank
- **Colori per Nazione**: Tank colorati in base all'aggressore (Russia = Verde, USA = Arancione, ecc.)
- **Rotazione Direzionale**: I tank puntano nella direzione dell'attacco
- **Popup Dettagliati**: Click sui tank per vedere dettagli completi

### 📊 Sidebar Informativa
- **Feed Conflitti Live**: Lista scrollabile di tutti gli eventi attivi
- **Badge di Severità**: SEVERE (rosso), CONFLICT (arancione), TENSION (giallo)
- **Ordinamento Cronologico**: Eventi più recenti in cima
- **Link alle Fonti**: Accesso diretto agli articoli originali (GDELT)

### 🔄 Dati in Tempo Reale
- **Aggiornamento Automatico**: Refresh ogni 5 minuti
- **API GDELT**: Dati da fonti giornalistiche mondiali
- **Fallback Intelligente**: Conflitti noti come backup

---

## 🚀 Installazione

### Prerequisiti

- **Node.js** 18.0 o superiore
- **npm**, **yarn**, **pnpm** o **bun**

### Quick Start

```bash
# 1. Clona il repository
git clone https://github.com/yourusername/Risiko-IRL.git

# 2. Entra nella directory
cd Risiko-IRL

# 3. Installa le dipendenze
npm install

# 4. Avvia il server di sviluppo
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000) nel browser.

### Comandi Disponibili

| Comando | Descrizione |
|---------|-------------|
| `npm run dev` | Avvia il server di sviluppo con Turbopack |
| `npm run build` | Crea la build di produzione |
| `npm run start` | Avvia il server di produzione |
| `npm run lint` | Esegue il linting del codice |

---

## 🛠️ Tecnologie

### Core Framework
- **[Next.js 16](https://nextjs.org/)** - React Framework con App Router
- **[React 19](https://react.dev/)** - Libreria UI
- **[TypeScript 5](https://www.typescriptlang.org/)** - Type Safety

### Styling & UI
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-First CSS
- **[Framer Motion](https://www.framer.com/motion/)** - Animazioni fluide
- **[Lucide React](https://lucide.dev/)** - Icone moderne

### Mapping & Data Visualization
- **[React Simple Maps](https://www.react-simple-maps.io/)** - Mappe SVG interattive
- **[D3 Scale](https://d3js.org/)** - Scaling per visualizzazioni

### Data & Networking
- **[Axios](https://axios-http.com/)** - HTTP Client
- **[date-fns](https://date-fns.org/)** - Manipolazione date

---

## 📡 API

### GDELT Integration

L'app utilizza due endpoint dell'API GDELT:

#### Document API
```
GET https://api.gdeltproject.org/api/v2/doc/doc
```
Query per articoli su conflitti armati, attacchi militari e guerre.

#### Geo API
```
GET https://api.gdeltproject.org/api/v2/geo/geo
```
Coordinate geografiche degli eventi degli ultimi 24h.

### API Route Interna

```
GET /api/conflicts
```

Endpoint server-side che:
1. Interroga le API GDELT
2. Processa e filtra i dati
3. Estrae aggressori e target
4. Calcola angoli di attacco
5. Restituisce dati formattati

**Response Example:**
```json
[
  {
    "id": "evt-1-1705600000000",
    "source": "GDELT",
    "lat": 48.3794,
    "lon": 31.1656,
    "actor1Name": "Russia",
    "actor1Code": "RUS",
    "actor2Name": "Ukraine",
    "goldstein": -9,
    "angle": 270,
    "date": "2025-01-18T10:30:00Z",
    "sourceUrl": "https://..."
  }
]
```

---

## 📁 Struttura Progetto

```
Risiko-IRL/
├── 📂 public/
│   ├── tank.png           # Icona tank per i marker
│   └── favicon.ico        # Favicon
├── 📂 src/
│   ├── 📂 app/
│   │   ├── 📂 api/
│   │   │   └── 📂 conflicts/
│   │   │       └── route.ts    # API endpoint GDELT
│   │   ├── globals.css         # Stili globali + tema
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Homepage principale
│   ├── 📂 components/
│   │   └── 📂 map/
│   │       ├── RiskMap.tsx     # Componente mappa principale
│   │       └── TankMarker.tsx  # Marker tank interattivo
│   └── 📂 lib/
│       ├── countryColors.ts    # Palette colori nazioni/continenti
│       ├── gdelt.ts            # Client API GDELT
│       └── utils.ts            # Utility functions
├── 📂 img/
│   └── screenshot_*.png    # Screenshot per README
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
└── README.md
```

---

## 🎨 Design System

### Palette Colori

#### Tema Scuro
```css
--background: hsl(240, 10%, 3.9%);
--foreground: hsl(0, 0%, 98%);
--card: hsl(240, 10%, 3.9%);
--border: hsl(240, 3.7%, 15.9%);
```

#### Colori Continenti (Risiko Style)
| Continente | Hex | HSL |
|------------|-----|-----|
| Europa | `#3b82f6` | Blue 500 |
| Asia | `#22c55e` | Green 500 |
| Nord America | `#f97316` | Orange 500 |
| Sud America | `#0ea5e9` | Sky 500 |
| Africa | `#a16207` | Amber 700 |
| Oceania | `#a855f7` | Purple 500 |

#### Badge Severità
| Livello | Colore | Goldstein Range |
|---------|--------|-----------------|
| SEVERE | Rosso `#ef4444` | ≤ -5 |
| CONFLICT | Arancione `#f97316` | -5 to -2 |
| TENSION | Giallo `#eab308` | -2 to 0 |

---

## 🌐 Deployment

### Vercel (Consigliato)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/Risiko-IRL)

```bash
# Installa Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Build Manuale

```bash
# Crea build di produzione
npm run build

# Avvia server
npm run start
```

---


<div align="center">

**⚔️ RISIKO IRL - Il mondo in tempo reale, come non l'hai mai visto ⚔️**

*Diego Scirocco*

</div>
