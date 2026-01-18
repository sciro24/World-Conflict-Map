<div align="center">

# 🎯 RISIKO IRL

### Real-Time Global Conflict Monitor

[![Next.js](https://img.shields.io/badge/Next.js-16.1.3-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.3-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

*Transform real-time geopolitical data into a Risk-style board game visualization*

[Live Demo](#-Overview) • [Features](#-features) • [Installation](#-installation) • [Tech Stack](#-tech-stack) • [API](#-api)

</div>

---

## 📸 Screenshots

<div align="center">

### Main Dashboard (Desktop)
<img src="./img/screenshot_main.png" alt="Risiko IRL Dashboard" width="800" />

*Interactive world map with Risk-style colored continents and real-time conflict feed*

### Conflict Details
<img src="./img/screenshot_popup.png" alt="Conflict Details Popup" width="600" />

*Interactive markers with details on aggressor, target, intensity, and casualty estimates*

### Mobile Experience
<img src="./img/screenshot_mobile.png" alt="Mobile Responsive View" width="300" />

*Fully responsive layout with collapsible drawer navigation and touch-optimized controls*

</div>

---

## 🌟 Overview

🔴 **LIVE DEMO:** [risiko-irl.vercel.app](https://risiko-irl.vercel.app)

**RISIKO IRL** is a modern web application that visualizes global conflicts in real-time on an interactive map inspired by the classic board game *Risk*. The app leverages [GDELT Project](https://www.gdeltproject.org/) data to monitor armed conflicts, civil wars, and cyber attacks worldwide, presenting them with a "gamified" yet professional aesthetic.


| Continent | Color |
|------------|--------|
| 🔵 Europe | Blue |
| 🟢 Asia | Green |
| 🟠 North America | Orange |
| 🔷 South America | Light Blue |
| 🟤 Africa | Brown |
| 🟣 Oceania | Purple |

---

## ✨ Features

### 🗺️ Interactive Map
- **Risk-Style Visualization**: Continents colored authentically to the board game.
- **Smart Touch Zoom**: Touch-friendly zoom controls (+/-) and fluid panning for mobile and desktop.
- **Infinite Scroll**: Continuous horizontal panning across the globe.
- **Dynamic Highlighting**: Countries involved in conflicts glow with intensity.

### 📱 Mobile-First Experience
- **Responsive Drawer**: Collapsible sidebar that works as a drawer on mobile (maximizing map space).
- **Touch Optimization**: Large touch targets and specialized mobile UI layouts.
- **Adaptive Layout**: Different viewing modes for Desktop vs Smartphone.

### 🎖️ Conflict Markers
- **Custom Event Icons**: Different markers for Wars (Swords), Civil Wars (Flame), Terrorism (Skull), Cyber (Zap).
- **Smart Casualty Estimates**: Displays total estimated casualties (e.g., "500k*") for major known conflicts.
- **Directional Rotation**: Markers point towards the conflict direction when applicable.
- **Detailed Popups**: Click to see aggressor, target, intensity, and source links.

### 📊 Intelligence Feed (Sidebar)
- **Live Conflict Feed**: Scrollable list of active events ordered by relevance.
- **Resilient Data Fetching**: Handles API rate limits (GDELT 429) gracefully to ensure stability.
- **Smart Filtering**: Auto-tagging of estimates vs real-time reports.
- **Source Links**: Direct access to original GDELT source articles.

---

## 🚀 Installation

### Prerequisites

- **Node.js** 18.0 or higher
- **npm**, **yarn**, **pnpm** or **bun**

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/Risiko-IRL.git

# 2. Enter directory
cd Risiko-IRL

# 3. Install dependencies (Legacy peer deps recommended for React 19 compatibility)
npm install --legacy-peer-deps

# 4. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Tech Stack

### Core Framework
- **[Next.js 16](https://nextjs.org/)** - React Framework with App Router & Turbopack
- **[React 19](https://react.dev/)** - UI Library
- **[TypeScript 5](https://www.typescriptlang.org/)** - Type Safety

### Styling & UI
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-First CSS
- **[Framer Motion](https://www.framer.com/motion/)** - Fluid Animations
- **[Lucide React](https://lucide.dev/)** - Modern Iconography

### Mapping & Data Visualization
- **[React Simple Maps](https://www.react-simple-maps.io/)** - Interactive SVG Maps
- **[D3 Scale](https://d3js.org/)** - Data Scaling

### Data & Networking
- **[Axios](https://axios-http.com/)** - HTTP Client
- **[GDELT API](https://www.gdeltproject.org/)** - Global Events Database

---

## 📡 API Architecture

### GDELT Integration

The app consumes two primary GDELT v2 endpoints:

#### Document API
```
GET https://api.gdeltproject.org/api/v2/doc/doc
```
Queries for articles related to armed conflict, military strikes, and civil unrest.

#### Internal API Route
```
GET /api/conflicts
```

Server-side endpoint that acts as a proxy and data processor:
1. **Fetches** raw data from GDELT.
2. **Injects** known conflict data (Casualty estimates, Start dates).
3. **Smart Parsing**: Extracts actor names and casualty counts from article titles using Regex and heuristic maps (`CASUALTY_ESTIMATES`).
4. **Handles Errors**: Gracefully manages GDELT rate limits (429) by skipping throttled categories without crashing.

**Response Example:**
```json
[
  {
    "id": "evt-1-1705600000000",
    "source": "GDELT",
    "eventType": "conflict",
    "lat": 48.3794,
    "lon": 31.1656,
    "actor1Name": "Russia",
    "actor2Name": "Ukraine",
    "casualties": "500k*",
    "intensity": "High Intensity",
    "date": "2025-01-18T10:30:00Z"
  }
]
```

---

## 📁 Project Structure

```
Risiko-IRL/
├── 📂 public/
│   └── 📂 img/            # Screenshots
├── 📂 src/
│   ├── 📂 app/
│   │   ├── 📂 api/
│   │   │   └── 📂 conflicts/
│   │   │       └── route.ts    # Main API logic & Data Processing
│   │   ├── icon.tsx            # Dynamic Favicon Generation
│   │   ├── globals.css         # Global Styles
│   │   ├── layout.tsx          # Root Layout
│   │   └── page.tsx            # Main Dashboard (Responsive)
│   ├── 📂 components/
│   │   └── 📂 map/
│   │       ├── RiskMap.tsx     # Interactive Map Component
│   │       └── EventMarker.tsx # Custom Markers
│   └── 📂 lib/
│       ├── gdelt.ts            # Data Types
│       └── utils.ts            # Helpers
├── package.json
├── next.config.ts
└── README.md
```

---

<div align="center">

**⚔️ RISIKO IRL - The World in Real-Time ⚔️**

*Developed by Diego Scirocco*

</div>
