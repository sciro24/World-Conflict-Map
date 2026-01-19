// Continent colors
export const CONTINENT_COLORS = {
    EUROPE: "#3b82f6",        // Blu (Blue)
    ASIA: "#22c55e",          // Verde (Green)
    NORTH_AMERICA: "#f97316", // Arancione
    SOUTH_AMERICA: "#0ea5e9", // Azzurro
    AFRICA: "#a16207",        // Marrone
    OCEANIA: "#a855f7",       // Viola (come prima)
} as const;

// Colori distintivi per ogni nazione/attore nel conflitto
export const NATION_COLORS: Record<string, string> = {
    // ===== STATI - Colorati in base al loro continente =====

    // Europa (Blu)
    "Russia": "#22c55e",          // Verde (geograficamente in Asia)
    "Ukraine": "#eab308",         // Giallo (bandiera ucraina)
    "France": "#3b82f6",          // Blu
    "United Kingdom": "#60a5fa",  // Blu chiaro
    "Germany": "#2563eb",         // Blu
    "Poland": "#3b82f6",          // Blu

    // Nord America (Arancione)
    "United States": "#ea580c",   // Arancione intenso
    "Canada": "#f97316",          // Arancione
    "Mexico": "#fb923c",          // Arancione chiaro

    // Sud America (Azzurro)
    "Brazil": "#0ea5e9",          // Azzurro
    "Argentina": "#38bdf8",       // Azzurro chiaro
    "Colombia": "#0284c7",        // Azzurro scuro
    "Venezuela": "#0369a1",       // Azzurro scuro

    // Asia (Verde) - Include Russia geograficamente
    "China": "#16a34a",           // Verde intenso
    "India": "#22c55e",           // Verde
    "Japan": "#4ade80",           // Verde chiaro
    "South Korea": "#86efac",     // Verde chiaro
    "North Korea": "#15803d",     // Verde scuro
    "Iran": "#166534",            // Verde foresta
    "Israel": "#22d3ee",          // Ciano (distinzione)
    "Turkey": "#10b981",          // Verde smeraldo
    "Saudi Arabia": "#059669",    // Verde
    "Pakistan": "#34d399",        // Verde chiaro
    "Syria": "#6ee7b7",           // Verde menta
    "Iraq": "#14b8a6",            // Verde acqua
    "Afghanistan": "#047857",     // Verde scuro
    "Myanmar": "#065f46",         // Verde scuro

    // Africa (Marrone)
    "Egypt": "#a16207",           // Marrone
    "Nigeria": "#92400e",         // Marrone scuro
    "Ethiopia": "#78350f",        // Marrone scuro
    "Sudan": "#ca8a04",           // Marrone dorato
    "South Africa": "#b45309",    // Marrone arancio
    "Libya": "#d97706",           // Marrone chiaro
    "Somalia": "#854d0e",         // Marrone
    "Mali": "#a16207",            // Marrone
    "DR Congo": "#713f12",        // Marrone scuro

    // Oceania (Viola)
    "Australia": "#a855f7",       // Viola
    "New Zealand": "#c084fc",     // Viola chiaro

    // ===== GRUPPI NON-STATALI =====

    // Gruppi Palestinesi
    "Hamas": "#15803d",           // Verde scuro (bandiera)
    "Palestinian Forces": "#166534",
    "Palestine": "#22c55e",

    // Gruppi Libanesi
    "Hezbollah": "#fbbf24",       // Giallo (bandiera)

    // Gruppi Yemeniti
    "Houthis": "#dc2626",         // Rosso (bandiera)
    "Ansar Allah": "#b91c1c",     // Rosso scuro

    // Gruppi Terroristici
    "ISIS": "#1f2937",            // Nero/Grigio scuro
    "Islamic State": "#1f2937",
    "ISIL": "#1f2937",
    "Daesh": "#1f2937",
    "Al-Qaeda": "#374151",        // Grigio
    "Al-Shabaab": "#4b5563",      // Grigio
    "Boko Haram": "#6b7280",      // Grigio
    "Taliban": "#78716c",         // Marrone grigio

    // ===== FORZE MILITARI E ALLEANZE =====

    "NATO Forces": "#1d4ed8",     // Blu NATO
    "NATO": "#1d4ed8",
    "Wagner Group": "#7f1d1d",    // Rosso scuro
    "RSF": "#dc2626",             // Rapid Support Forces - Rosso
    "Sudan Armed Forces": "#ca8a04", // SAF - Marrone dorato
    "Myanmar Military": "#065f46", // Verde scuro
    "IDF": "#22d3ee",             // Israel Defense Forces - Ciano
    "IRGC": "#166534",            // Iran Revolutionary Guard - Verde

    // Default
    "Armed Forces": "#6b7280",    // Grigio
    "Unknown": "#9ca3af",         // Grigio chiaro
};

// Get color for a nation/actor
export function getNationColor(nation: string): string {
    if (!nation) return NATION_COLORS["Unknown"];

    // Direct match
    if (NATION_COLORS[nation]) {
        return NATION_COLORS[nation];
    }

    // Partial match
    const nationLower = nation.toLowerCase();
    for (const [key, color] of Object.entries(NATION_COLORS)) {
        if (nationLower.includes(key.toLowerCase()) || key.toLowerCase().includes(nationLower)) {
            return color;
        }
    }

    // Generate consistent color from hash
    let hash = 0;
    for (let i = 0; i < nation.length; i++) {
        hash = nation.charCodeAt(i) + ((hash << 5) - hash);
    }

    const fallbackColors = [
        "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6",
        "#3b82f6", "#8b5cf6", "#ec4899", "#f43f5e", "#84cc16"
    ];

    return fallbackColors[Math.abs(hash) % fallbackColors.length];
}

// Get aggressor type for display
export function getAggressorType(name: string): string {
    const stateless = ["Hamas", "Hezbollah", "Houthis", "ISIS", "Al-Qaeda", "Al-Shabaab",
        "Boko Haram", "Taliban", "Wagner Group", "Ansar Allah", "Islamic State",
        "ISIL", "Daesh"];

    const military = ["NATO Forces", "NATO", "RSF", "Sudan Armed Forces", "Myanmar Military",
        "IDF", "IRGC", "Armed Forces"];

    const nameLower = name.toLowerCase();

    for (const group of stateless) {
        if (nameLower.includes(group.toLowerCase())) {
            return "Non-State Group";
        }
    }

    for (const force of military) {
        if (nameLower.includes(force.toLowerCase())) {
            return "Military Force";
        }
    }

    return "State";
}
