"use client"

import React, { useState, useMemo } from "react"
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps"
import { TankMarker } from "./TankMarker"
import { motion, AnimatePresence } from "framer-motion"
import { getNationColor } from "@/lib/countryColors"

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json"

// Risiko colors per continent (as requested)
const RISIKO_COLORS = {
    EUROPE: "#3b82f6",        // Blu (Blue)
    ASIA: "#22c55e",          // Verde (Green) - includes Russia
    NORTH_AMERICA: "#f97316", // Arancione (Orange)
    SOUTH_AMERICA: "#0ea5e9", // Azzurro (Light Blue)
    AFRICA: "#a16207",        // Marrone (Brown)
    OCEANIA: "#a855f7",       // Viola (Purple - unchanged)
} as const;

// Map countries to their Risiko continent
const COUNTRY_TO_CONTINENT: Record<string, keyof typeof RISIKO_COLORS> = {
    // EUROPE (Violaceo) - Western and Central Europe
    "Germany": "EUROPE", "France": "EUROPE", "United Kingdom": "EUROPE",
    "Italy": "EUROPE", "Spain": "EUROPE", "Ukraine": "EUROPE", "Poland": "EUROPE",
    "Romania": "EUROPE", "Netherlands": "EUROPE", "Belgium": "EUROPE", "Sweden": "EUROPE",
    "Czech Republic": "EUROPE", "Czechia": "EUROPE", "Greece": "EUROPE", "Portugal": "EUROPE",
    "Hungary": "EUROPE", "Austria": "EUROPE", "Switzerland": "EUROPE", "Bulgaria": "EUROPE",
    "Denmark": "EUROPE", "Finland": "EUROPE", "Slovakia": "EUROPE", "Norway": "EUROPE",
    "Ireland": "EUROPE", "Croatia": "EUROPE", "Bosnia and Herzegovina": "EUROPE", "Bosnia and Herz.": "EUROPE",
    "Albania": "EUROPE", "Lithuania": "EUROPE", "Slovenia": "EUROPE", "Latvia": "EUROPE",
    "Estonia": "EUROPE", "North Macedonia": "EUROPE", "Macedonia": "EUROPE", "Montenegro": "EUROPE",
    "Luxembourg": "EUROPE", "Malta": "EUROPE", "Serbia": "EUROPE", "Belarus": "EUROPE",
    "Moldova": "EUROPE", "Iceland": "EUROPE",

    // ASIA (Verde) - Includes Russia
    "Russia": "ASIA", "China": "ASIA", "India": "ASIA", "Indonesia": "ASIA", "Pakistan": "ASIA",
    "Bangladesh": "ASIA", "Japan": "ASIA", "Philippines": "ASIA", "Vietnam": "ASIA",
    "Turkey": "ASIA", "Iran": "ASIA", "Thailand": "ASIA", "Myanmar": "ASIA",
    "South Korea": "ASIA", "Korea": "ASIA", "Iraq": "ASIA", "Afghanistan": "ASIA",
    "Saudi Arabia": "ASIA", "Uzbekistan": "ASIA", "Malaysia": "ASIA", "Nepal": "ASIA",
    "Yemen": "ASIA", "North Korea": "ASIA", "Taiwan": "ASIA", "Syria": "ASIA",
    "Sri Lanka": "ASIA", "Kazakhstan": "ASIA", "Jordan": "ASIA", "United Arab Emirates": "ASIA",
    "Israel": "ASIA", "Laos": "ASIA", "Kyrgyzstan": "ASIA", "Turkmenistan": "ASIA",
    "Singapore": "ASIA", "Oman": "ASIA", "Palestine": "ASIA", "Kuwait": "ASIA",
    "Georgia": "ASIA", "Mongolia": "ASIA", "Armenia": "ASIA", "Qatar": "ASIA",
    "Bahrain": "ASIA", "Tajikistan": "ASIA", "Azerbaijan": "ASIA", "Lebanon": "ASIA",
    "Cambodia": "ASIA", "Bhutan": "ASIA", "Timor-Leste": "ASIA", "Brunei": "ASIA",

    // NORTH AMERICA (Yellow)
    "United States": "NORTH_AMERICA", "United States of America": "NORTH_AMERICA",
    "Mexico": "NORTH_AMERICA", "Canada": "NORTH_AMERICA",
    "Guatemala": "NORTH_AMERICA", "Cuba": "NORTH_AMERICA", "Haiti": "NORTH_AMERICA",
    "Dominican Republic": "NORTH_AMERICA", "Dominican Rep.": "NORTH_AMERICA",
    "Honduras": "NORTH_AMERICA", "Nicaragua": "NORTH_AMERICA",
    "El Salvador": "NORTH_AMERICA", "Costa Rica": "NORTH_AMERICA", "Panama": "NORTH_AMERICA",
    "Jamaica": "NORTH_AMERICA", "Trinidad and Tobago": "NORTH_AMERICA",
    "Bahamas": "NORTH_AMERICA", "Belize": "NORTH_AMERICA", "Barbados": "NORTH_AMERICA",
    "Puerto Rico": "NORTH_AMERICA", "Greenland": "NORTH_AMERICA",

    // SOUTH AMERICA (Red)
    "Brazil": "SOUTH_AMERICA", "Colombia": "SOUTH_AMERICA", "Argentina": "SOUTH_AMERICA",
    "Peru": "SOUTH_AMERICA", "Venezuela": "SOUTH_AMERICA", "Chile": "SOUTH_AMERICA",
    "Ecuador": "SOUTH_AMERICA", "Bolivia": "SOUTH_AMERICA", "Paraguay": "SOUTH_AMERICA",
    "Uruguay": "SOUTH_AMERICA", "Guyana": "SOUTH_AMERICA", "Suriname": "SOUTH_AMERICA",
    "French Guiana": "SOUTH_AMERICA", "Falkland Islands": "SOUTH_AMERICA", "Falkland Is.": "SOUTH_AMERICA",

    // AFRICA (Orange)
    "Nigeria": "AFRICA", "Ethiopia": "AFRICA", "Egypt": "AFRICA",
    "Dem. Rep. Congo": "AFRICA", "Democratic Republic of the Congo": "AFRICA", "DR Congo": "AFRICA",
    "Tanzania": "AFRICA", "South Africa": "AFRICA", "Kenya": "AFRICA", "Uganda": "AFRICA",
    "Algeria": "AFRICA", "Sudan": "AFRICA", "Morocco": "AFRICA", "Angola": "AFRICA",
    "Ghana": "AFRICA", "Mozambique": "AFRICA", "Madagascar": "AFRICA", "Cameroon": "AFRICA",
    "Ivory Coast": "AFRICA", "Côte d'Ivoire": "AFRICA", "Niger": "AFRICA", "Burkina Faso": "AFRICA",
    "Mali": "AFRICA", "Malawi": "AFRICA", "Zambia": "AFRICA", "Somalia": "AFRICA",
    "Senegal": "AFRICA", "Chad": "AFRICA", "Zimbabwe": "AFRICA", "Guinea": "AFRICA",
    "Rwanda": "AFRICA", "Benin": "AFRICA", "Burundi": "AFRICA", "Tunisia": "AFRICA",
    "South Sudan": "AFRICA", "S. Sudan": "AFRICA", "Togo": "AFRICA", "Sierra Leone": "AFRICA",
    "Libya": "AFRICA", "Liberia": "AFRICA", "Central African Republic": "AFRICA", "Central African Rep.": "AFRICA",
    "Mauritania": "AFRICA", "Eritrea": "AFRICA", "Namibia": "AFRICA", "Gambia": "AFRICA",
    "Botswana": "AFRICA", "Gabon": "AFRICA", "Lesotho": "AFRICA", "Guinea-Bissau": "AFRICA",
    "Equatorial Guinea": "AFRICA", "Eq. Guinea": "AFRICA", "Mauritius": "AFRICA",
    "Eswatini": "AFRICA", "Swaziland": "AFRICA", "Djibouti": "AFRICA",
    "Republic of Congo": "AFRICA", "Congo": "AFRICA", "Cape Verde": "AFRICA",
    "Comoros": "AFRICA", "São Tomé and Príncipe": "AFRICA", "Seychelles": "AFRICA",
    "W. Sahara": "AFRICA", "Western Sahara": "AFRICA",

    // OCEANIA (Purple)
    "Australia": "OCEANIA", "Papua New Guinea": "OCEANIA", "New Zealand": "OCEANIA",
    "Fiji": "OCEANIA", "Solomon Islands": "OCEANIA", "Solomon Is.": "OCEANIA",
    "Vanuatu": "OCEANIA", "Samoa": "OCEANIA", "Tonga": "OCEANIA",
    "New Caledonia": "OCEANIA", "French Polynesia": "OCEANIA",
};

interface ConflictEvent {
    id: string;
    source: string;
    lat: number;
    lon: number;
    actor1Lat: number;
    actor1Lon: number;
    actor1Code: string;
    actor1Name: string;
    actor2Name: string;
    goldstein: number;
    sourceUrl: string;
    date: string;
    angle: number;
}

interface MapProps {
    conflicts: ConflictEvent[];
    center?: [number, number];
    zoom?: number;
    selectedConflictId?: string | null;
}

interface CountryPopupData {
    name: string;
    x: number;
    y: number;
    conflicts: ConflictEvent[];
    continent?: string;
}

// Predefined colors for conflict markers
const CONFLICT_COLORS = [
    "#ef4444", "#3b82f6", "#22c55e", "#eab308", "#f97316",
    "#a855f7", "#ec4899", "#14b8a6", "#f43f5e", "#84cc16"
];

export function RiskMap({ conflicts, center, zoom, selectedConflictId }: MapProps) {
    const [selectedCountry, setSelectedCountry] = useState<CountryPopupData | null>(null);

    // Set of countries with active conflicts
    const countriesInConflict = useMemo(() => {
        const set = new Set<string>();
        conflicts.forEach(c => {
            if (c.actor1Name) set.add(c.actor1Name.toLowerCase());
            if (c.actor2Name) set.add(c.actor2Name.toLowerCase());
        });
        return set;
    }, [conflicts]);

    // Assign consistent colors per actor
    const actorColors = useMemo(() => {
        const colors = new Map<string, string>();
        const seenActors = new Set<string>();

        conflicts.forEach((c, i) => {
            const actor = c.actor1Name || `Actor-${i}`;
            if (!seenActors.has(actor)) {
                seenActors.add(actor);
                colors.set(actor, CONFLICT_COLORS[colors.size % CONFLICT_COLORS.length]);
            }
        });

        return colors;
    }, [conflicts]);

    const getConflictColor = (conflict: ConflictEvent) => {
        // Use the nation-specific color for the aggressor
        return getNationColor(conflict.actor1Name || "Armed Forces");
    };

    // Get conflicts related to a country
    const getCountryConflicts = (countryName: string): ConflictEvent[] => {
        const name = countryName.toLowerCase();
        return conflicts.filter(c =>
            c.actor1Name?.toLowerCase().includes(name) ||
            c.actor2Name?.toLowerCase().includes(name)
        );
    };

    // Check if country is in conflict
    const isCountryInConflict = (countryName: string): boolean => {
        const name = countryName.toLowerCase();
        return Array.from(countriesInConflict).some(c =>
            c.includes(name) || name.includes(c)
        );
    };

    // Get country fill color - Risiko style with conflict highlighting
    const getCountryFill = (countryName: string): string => {
        const continent = COUNTRY_TO_CONTINENT[countryName];
        const baseColor = continent ? RISIKO_COLORS[continent] : "#2a2a2a";

        // If country is in conflict, make it brighter/highlighted
        if (isCountryInConflict(countryName)) {
            // Return a highlighted version (conflict glow)
            return baseColor; // Will add stroke for highlighting
        }

        // Return a dimmed version for non-conflict countries
        if (continent) {
            // Darken the base color
            return adjustColorBrightness(baseColor, -40);
        }

        return "#2a2a2a";
    };

    // Get country stroke for conflict highlighting
    const getCountryStroke = (countryName: string): { stroke: string; strokeWidth: number } => {
        if (isCountryInConflict(countryName)) {
            return { stroke: "#ffffff", strokeWidth: 1.5 };
        }
        return { stroke: "#1a1a1a", strokeWidth: 0.5 };
    };

    // Handle country click
    const handleCountryClick = (geo: any, event: React.MouseEvent) => {
        const countryName = geo.properties?.name || "";
        const countryConflicts = getCountryConflicts(countryName);
        const continent = COUNTRY_TO_CONTINENT[countryName];

        setSelectedCountry({
            name: countryName,
            x: event.clientX,
            y: event.clientY,
            conflicts: countryConflicts,
            continent: continent?.replace(/_/g, " "),
        });
    };

    return (
        <div className="w-full h-full bg-[#0a0a12] overflow-hidden rounded-xl border border-white/10 shadow-2xl relative">
            {/* Header Badge */}
            <div className="absolute top-4 left-4 z-10 bg-black/70 backdrop-blur-md px-3 py-2 rounded-lg text-xs text-white/80 pointer-events-none flex items-center gap-2 border border-white/10">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="font-medium">Live Conflict Data</span>
                <span className="text-gray-500">|</span>
                <span className="text-gray-400">GDELT</span>
            </div>

            {/* Conflict Count Badge */}
            <div className="absolute top-4 right-4 z-10 bg-red-600/20 backdrop-blur-md px-4 py-2 rounded-lg text-white pointer-events-none border border-red-500/30">
                <div className="text-2xl font-bold text-red-400">{conflicts.length}</div>
                <div className="text-[10px] text-gray-400 uppercase tracking-wider">Active Events</div>
            </div>

            {/* Risiko Legend */}
            <div className="absolute bottom-4 left-4 z-10 bg-black/70 backdrop-blur-md p-3 rounded-lg text-[10px] text-white/80 pointer-events-none border border-white/10">
                <div className="font-bold mb-2 text-white uppercase tracking-wider">Risiko Continents</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: RISIKO_COLORS.EUROPE }} />
                        <span>Europe</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: RISIKO_COLORS.ASIA }} />
                        <span>Asia</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: RISIKO_COLORS.NORTH_AMERICA }} />
                        <span>N. America</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: RISIKO_COLORS.SOUTH_AMERICA }} />
                        <span>S. America</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: RISIKO_COLORS.AFRICA }} />
                        <span>Africa</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: RISIKO_COLORS.OCEANIA }} />
                        <span>Oceania</span>
                    </div>
                </div>
                <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-2">
                    <div className="w-3 h-2 rounded-sm bg-white/80 border border-white" />
                    <span>Active Conflict Zone</span>
                </div>
            </div>

            <ComposableMap
                projection="geoNaturalEarth1"
                projectionConfig={{
                    scale: 160,
                }}
                className="w-full h-full"
                style={{ backgroundColor: '#0a0a12' }}
            >
                <ZoomableGroup
                    center={center || [0, 20]}
                    zoom={zoom || 1}
                    minZoom={0.8}
                    maxZoom={8}
                    translateExtent={[[-Infinity, -300], [Infinity, 700]]}
                >
                    <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                            geographies.map((geo) => {
                                const countryName = geo.properties?.name || "";
                                const strokeStyle = getCountryStroke(countryName);

                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        onClick={(e) => handleCountryClick(geo, e)}
                                        style={{
                                            default: {
                                                fill: getCountryFill(countryName),
                                                stroke: strokeStyle.stroke,
                                                strokeWidth: strokeStyle.strokeWidth,
                                                outline: "none",
                                                cursor: "pointer",
                                            },
                                            hover: {
                                                fill: adjustColorBrightness(getCountryFill(countryName), 30),
                                                stroke: "#fff",
                                                strokeWidth: 1,
                                                outline: "none",
                                                cursor: "pointer",
                                            },
                                            pressed: {
                                                fill: adjustColorBrightness(getCountryFill(countryName), -20),
                                                stroke: "#fff",
                                                strokeWidth: 0.5,
                                                outline: "none",
                                            },
                                        }}
                                    />
                                );
                            })
                        }
                    </Geographies>

                    {/* Tank markers */}
                    {conflicts?.map((conflict, i) => (
                        <Marker key={conflict.id || i} coordinates={[conflict.lon, conflict.lat]}>
                            <TankMarker
                                name={conflict.actor2Name || "Unknown Target"}
                                sourceName={conflict.actor1Name}
                                sourceCountry={conflict.actor1Code}
                                angle={conflict.angle}
                                color={getConflictColor(conflict)}
                                intensity={conflict.goldstein}
                                date={conflict.date}
                                sourceUrl={conflict.sourceUrl}
                            />
                        </Marker>
                    ))}
                </ZoomableGroup>
            </ComposableMap>

            {/* Country Popup with Conflict Details */}
            <AnimatePresence>
                {selectedCountry && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setSelectedCountry(null)}
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="fixed z-50 w-80 max-h-[70vh] overflow-hidden"
                            style={{
                                left: Math.min(selectedCountry.x, window.innerWidth - 340),
                                top: Math.min(selectedCountry.y + 10, window.innerHeight - 400),
                            }}
                        >
                            <div className="bg-gradient-to-br from-gray-900 to-black backdrop-blur-xl border border-white/20 text-white rounded-xl shadow-2xl overflow-hidden">
                                {/* Header */}
                                <div className="p-4 border-b border-white/10 bg-black/30">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-bold text-lg">{selectedCountry.name}</h3>
                                            {selectedCountry.continent && (
                                                <span className="text-xs text-gray-400">{selectedCountry.continent}</span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => setSelectedCountry(null)}
                                            className="text-gray-400 hover:text-white transition-colors text-xl leading-none p-1"
                                        >
                                            ×
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        {selectedCountry.conflicts.length === 0 ? (
                                            <span className="text-green-400 text-sm">🕊️ No active conflicts</span>
                                        ) : (
                                            <span className="text-red-400 text-sm">
                                                ⚔️ {selectedCountry.conflicts.length} active conflict{selectedCountry.conflicts.length > 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Conflict List */}
                                {selectedCountry.conflicts.length > 0 && (
                                    <div className="max-h-64 overflow-y-auto p-2 space-y-2">
                                        {selectedCountry.conflicts.map((conflict, idx) => (
                                            <div
                                                key={conflict.id || idx}
                                                className="p-3 bg-white/5 rounded-lg border border-white/10 text-xs"
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div
                                                        className="font-bold text-sm"
                                                        style={{ color: getConflictColor(conflict) }}
                                                    >
                                                        {conflict.actor1Name || "Unknown Force"}
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] ${conflict.goldstein <= -5 ? 'bg-red-500/30 text-red-300' :
                                                        conflict.goldstein < 0 ? 'bg-orange-500/30 text-orange-300' :
                                                            'bg-gray-500/30 text-gray-300'
                                                        }`}>
                                                        {conflict.goldstein <= -5 ? 'SEVERE' :
                                                            conflict.goldstein < 0 ? 'CONFLICT' : 'TENSION'}
                                                    </span>
                                                </div>

                                                <div className="space-y-1 text-gray-400">
                                                    <div className="flex justify-between">
                                                        <span>Target:</span>
                                                        <span className="text-white">{conflict.actor2Name}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Time:</span>
                                                        <span className="text-white">
                                                            {new Date(conflict.date).toLocaleString('it-IT', {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                                day: '2-digit',
                                                                month: '2-digit'
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>

                                                {conflict.sourceUrl && (
                                                    <a
                                                        href={conflict.sourceUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="mt-2 block text-blue-400 hover:text-blue-300 text-[10px]"
                                                    >
                                                        → Read source
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}

// Helper function to adjust color brightness
function adjustColorBrightness(hex: string, percent: number): string {
    // Handle rgba format
    if (hex.startsWith('rgba')) {
        return hex;
    }

    // Remove # if present
    hex = hex.replace('#', '');

    // Parse hex
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    // Adjust brightness
    r = Math.min(255, Math.max(0, r + Math.round(r * percent / 100)));
    g = Math.min(255, Math.max(0, g + Math.round(g * percent / 100)));
    b = Math.min(255, Math.max(0, b + Math.round(b * percent / 100)));

    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
