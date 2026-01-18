"use client"

import React, { useState, useMemo, useEffect, useRef } from "react"
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps"
import { EventMarker } from "./EventMarker"
import { motion, AnimatePresence } from "framer-motion"
import { Swords, Megaphone, Zap, Skull, AlertTriangle, Flame } from "lucide-react"

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json"

// Risiko colors per continent
const RISIKO_COLORS = {
    EUROPE: "#3b82f6",      // Blue
    ASIA: "#22c55e",        // Green  
    NORTH_AMERICA: "#f97316", // Orange
    SOUTH_AMERICA: "#0ea5e9", // Light Blue
    AFRICA: "#a16207",      // Brown
    OCEANIA: "#a855f7",     // Purple
} as const;

// COMPLETE mapping of ALL countries to continents
const COUNTRY_TO_CONTINENT: Record<string, keyof typeof RISIKO_COLORS> = {
    "Albania": "EUROPE", "Andorra": "EUROPE", "Austria": "EUROPE", "Belarus": "EUROPE",
    "Belgium": "EUROPE", "Bosnia and Herzegovina": "EUROPE", "Bosnia and Herz.": "EUROPE",
    "Bulgaria": "EUROPE", "Croatia": "EUROPE", "Cyprus": "EUROPE", "Czech Republic": "EUROPE",
    "Czechia": "EUROPE", "Denmark": "EUROPE", "Estonia": "EUROPE", "Finland": "EUROPE",
    "France": "EUROPE", "Germany": "EUROPE", "Greece": "EUROPE", "Hungary": "EUROPE",
    "Iceland": "EUROPE", "Ireland": "EUROPE", "Italy": "EUROPE", "Kosovo": "EUROPE",
    "Latvia": "EUROPE", "Liechtenstein": "EUROPE", "Lithuania": "EUROPE", "Luxembourg": "EUROPE",
    "Malta": "EUROPE", "Moldova": "EUROPE", "Monaco": "EUROPE", "Montenegro": "EUROPE",
    "Netherlands": "EUROPE", "North Macedonia": "EUROPE", "Macedonia": "EUROPE",
    "Norway": "EUROPE", "Poland": "EUROPE", "Portugal": "EUROPE", "Romania": "EUROPE",
    "San Marino": "EUROPE", "Serbia": "EUROPE", "Slovakia": "EUROPE", "Slovenia": "EUROPE",
    "Spain": "EUROPE", "Sweden": "EUROPE", "Switzerland": "EUROPE", "Ukraine": "EUROPE",
    "United Kingdom": "EUROPE", "Vatican City": "EUROPE",
    "Afghanistan": "ASIA", "Armenia": "ASIA", "Azerbaijan": "ASIA", "Bahrain": "ASIA",
    "Bangladesh": "ASIA", "Bhutan": "ASIA", "Brunei": "ASIA", "Cambodia": "ASIA",
    "China": "ASIA", "Georgia": "ASIA", "India": "ASIA", "Indonesia": "ASIA",
    "Iran": "ASIA", "Iraq": "ASIA", "Israel": "ASIA", "Japan": "ASIA",
    "Jordan": "ASIA", "Kazakhstan": "ASIA", "Kuwait": "ASIA", "Kyrgyzstan": "ASIA",
    "Laos": "ASIA", "Lebanon": "ASIA", "Malaysia": "ASIA", "Maldives": "ASIA",
    "Mongolia": "ASIA", "Myanmar": "ASIA", "Nepal": "ASIA", "North Korea": "ASIA",
    "Oman": "ASIA", "Pakistan": "ASIA", "Palestine": "ASIA", "Philippines": "ASIA",
    "Qatar": "ASIA", "Russia": "ASIA", "Saudi Arabia": "ASIA", "Singapore": "ASIA",
    "South Korea": "ASIA", "Korea": "ASIA", "Sri Lanka": "ASIA", "Syria": "ASIA",
    "Taiwan": "ASIA", "Tajikistan": "ASIA", "Thailand": "ASIA", "Timor-Leste": "ASIA",
    "Turkey": "ASIA", "Turkmenistan": "ASIA", "United Arab Emirates": "ASIA",
    "Uzbekistan": "ASIA", "Vietnam": "ASIA", "Yemen": "ASIA",
    "Antigua and Barbuda": "NORTH_AMERICA", "Bahamas": "NORTH_AMERICA", "Barbados": "NORTH_AMERICA",
    "Belize": "NORTH_AMERICA", "Canada": "NORTH_AMERICA", "Costa Rica": "NORTH_AMERICA",
    "Cuba": "NORTH_AMERICA", "Dominica": "NORTH_AMERICA", "Dominican Republic": "NORTH_AMERICA",
    "Dominican Rep.": "NORTH_AMERICA", "El Salvador": "NORTH_AMERICA", "Greenland": "NORTH_AMERICA",
    "Grenada": "NORTH_AMERICA", "Guatemala": "NORTH_AMERICA", "Haiti": "NORTH_AMERICA",
    "Honduras": "NORTH_AMERICA", "Jamaica": "NORTH_AMERICA", "Mexico": "NORTH_AMERICA",
    "Nicaragua": "NORTH_AMERICA", "Panama": "NORTH_AMERICA", "Puerto Rico": "NORTH_AMERICA",
    "Saint Kitts and Nevis": "NORTH_AMERICA", "Saint Lucia": "NORTH_AMERICA",
    "Saint Vincent and the Grenadines": "NORTH_AMERICA", "Trinidad and Tobago": "NORTH_AMERICA",
    "United States": "NORTH_AMERICA", "United States of America": "NORTH_AMERICA",
    "Argentina": "SOUTH_AMERICA", "Bolivia": "SOUTH_AMERICA", "Brazil": "SOUTH_AMERICA",
    "Chile": "SOUTH_AMERICA", "Colombia": "SOUTH_AMERICA", "Ecuador": "SOUTH_AMERICA",
    "Falkland Islands": "SOUTH_AMERICA", "Falkland Is.": "SOUTH_AMERICA",
    "French Guiana": "SOUTH_AMERICA", "Guyana": "SOUTH_AMERICA", "Paraguay": "SOUTH_AMERICA",
    "Peru": "SOUTH_AMERICA", "Suriname": "SOUTH_AMERICA", "Uruguay": "SOUTH_AMERICA",
    "Venezuela": "SOUTH_AMERICA",
    "Algeria": "AFRICA", "Angola": "AFRICA", "Benin": "AFRICA", "Botswana": "AFRICA",
    "Burkina Faso": "AFRICA", "Burundi": "AFRICA", "Cameroon": "AFRICA", "Cape Verde": "AFRICA",
    "Central African Republic": "AFRICA", "Central African Rep.": "AFRICA", "Chad": "AFRICA",
    "Comoros": "AFRICA", "Congo": "AFRICA", "Republic of Congo": "AFRICA",
    "Democratic Republic of the Congo": "AFRICA", "Dem. Rep. Congo": "AFRICA", "DR Congo": "AFRICA",
    "Djibouti": "AFRICA", "Egypt": "AFRICA", "Equatorial Guinea": "AFRICA", "Eq. Guinea": "AFRICA",
    "Eritrea": "AFRICA", "Eswatini": "AFRICA", "Swaziland": "AFRICA", "Ethiopia": "AFRICA",
    "Gabon": "AFRICA", "Gambia": "AFRICA", "Ghana": "AFRICA", "Guinea": "AFRICA",
    "Guinea-Bissau": "AFRICA", "Ivory Coast": "AFRICA", "Côte d'Ivoire": "AFRICA",
    "Kenya": "AFRICA", "Lesotho": "AFRICA", "Liberia": "AFRICA", "Libya": "AFRICA",
    "Madagascar": "AFRICA", "Malawi": "AFRICA", "Mali": "AFRICA", "Mauritania": "AFRICA",
    "Mauritius": "AFRICA", "Morocco": "AFRICA", "Mozambique": "AFRICA", "Namibia": "AFRICA",
    "Niger": "AFRICA", "Nigeria": "AFRICA", "Rwanda": "AFRICA", "São Tomé and Príncipe": "AFRICA",
    "Senegal": "AFRICA", "Seychelles": "AFRICA", "Sierra Leone": "AFRICA", "Somalia": "AFRICA",
    "Somaliland": "AFRICA", "South Africa": "AFRICA", "South Sudan": "AFRICA", "S. Sudan": "AFRICA",
    "Sudan": "AFRICA", "Tanzania": "AFRICA", "Togo": "AFRICA", "Tunisia": "AFRICA",
    "Uganda": "AFRICA", "W. Sahara": "AFRICA", "Western Sahara": "AFRICA", "Zambia": "AFRICA",
    "Zimbabwe": "AFRICA",
    "Australia": "OCEANIA", "Fiji": "OCEANIA", "Kiribati": "OCEANIA",
    "Marshall Islands": "OCEANIA", "Micronesia": "OCEANIA", "Nauru": "OCEANIA",
    "New Caledonia": "OCEANIA", "New Zealand": "OCEANIA", "Palau": "OCEANIA",
    "Papua New Guinea": "OCEANIA", "Samoa": "OCEANIA", "Solomon Islands": "OCEANIA",
    "Solomon Is.": "OCEANIA", "Tonga": "OCEANIA", "Tuvalu": "OCEANIA", "Vanuatu": "OCEANIA",
    "French Polynesia": "OCEANIA",
};

// Determine continent by coordinates for unmapped countries
function getContinentByCoordinates(lat: number, lon: number): keyof typeof RISIKO_COLORS {
    // Europe
    if (lat > 35 && lat < 72 && lon > -25 && lon < 40) return "EUROPE";
    // Asia (including Russia)
    if (lat > 0 && lon > 40 && lon < 180) return "ASIA";
    if (lat > 0 && lon > -180 && lon < -100 && lat > 50) return "ASIA"; // Eastern Russia
    if (lat > 0 && lat < 55 && lon > 25 && lon < 180) return "ASIA";
    // North America
    if (lat > 7 && lat < 85 && lon > -170 && lon < -50) return "NORTH_AMERICA";
    // South America
    if (lat < 15 && lat > -60 && lon > -85 && lon < -30) return "SOUTH_AMERICA";
    // Africa
    if (lat > -40 && lat < 38 && lon > -20 && lon < 55) return "AFRICA";
    // Oceania
    if (lat < 0 && lon > 100) return "OCEANIA";

    return "EUROPE"; // Default
}

interface ConflictEvent {
    id: string;
    source: string;
    eventType: "conflict" | "protest" | "cyber" | "terrorism" | "civil_war";
    lat: number;
    lon: number;
    actor1Name: string;
    actor1Code: string;
    actor2Name: string;
    goldstein: number;
    sourceUrl: string;
    date: string;
    startDate?: string;
    angle: number;
    title: string;
    casualties: number | null;
    color: string;
    label: string;
    duration?: string;
    intensity?: string;
}

interface MapProps {
    conflicts: ConflictEvent[];
    center?: [number, number];
    zoom?: number;
    selectedConflictId?: string | null;
}

interface EventPopupData {
    event: ConflictEvent;
    x: number;
    y: number;
}

export function RiskMap({ conflicts, center, zoom, selectedConflictId }: MapProps) {
    const [selectedEvent, setSelectedEvent] = useState<EventPopupData | null>(null);
    const mapRef = useRef<HTMLDivElement>(null);

    // Auto-open popup when conflict is selected from sidebar
    useEffect(() => {
        if (selectedConflictId && mapRef.current) {
            const event = conflicts.find(c => c.id === selectedConflictId);
            if (event) {
                // Get center of map container
                const rect = mapRef.current.getBoundingClientRect();
                setSelectedEvent({
                    event,
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2 - 100,
                });
            }
        }
    }, [selectedConflictId, conflicts]);

    // Set of countries with active events
    const countriesWithEvents = useMemo(() => {
        const set = new Set<string>();
        conflicts.forEach(c => {
            if (c.actor1Name) set.add(c.actor1Name.toLowerCase());
            if (c.actor2Name) set.add(c.actor2Name.toLowerCase());
        });
        return set;
    }, [conflicts]);

    // Get country color - NEVER return gray
    const getCountryColor = (countryName: string, geo: any) => {
        // First try direct mapping
        let continent = COUNTRY_TO_CONTINENT[countryName];

        // If not found, try to determine by centroid coordinates
        if (!continent && geo.geometry) {
            try {
                // Get approximate center of the country
                const coords = geo.geometry.coordinates;
                if (coords) {
                    let lat = 0, lon = 0;
                    if (geo.geometry.type === "Polygon") {
                        const ring = coords[0];
                        ring.forEach((c: number[]) => { lon += c[0]; lat += c[1]; });
                        lon /= ring.length; lat /= ring.length;
                    } else if (geo.geometry.type === "MultiPolygon") {
                        const ring = coords[0][0];
                        ring.forEach((c: number[]) => { lon += c[0]; lat += c[1]; });
                        lon /= ring.length; lat /= ring.length;
                    }
                    continent = getContinentByCoordinates(lat, lon);
                }
            } catch { }
        }

        // Fallback mapping based on common country name variations
        if (!continent) {
            const nameLower = countryName.toLowerCase();
            if (nameLower.includes("congo") || nameLower.includes("sudan") || nameLower.includes("guinea")) {
                continent = "AFRICA";
            } else if (nameLower.includes("korea") || nameLower.includes("china") || nameLower.includes("india")) {
                continent = "ASIA";
            } else if (nameLower.includes("america") || nameLower.includes("states")) {
                continent = "NORTH_AMERICA";
            }
        }

        return RISIKO_COLORS[continent || "EUROPE"];
    };

    // Check if country is involved in events
    const isCountryInvolved = (countryName: string) => {
        return countriesWithEvents.has(countryName.toLowerCase());
    };

    // Handle event marker click
    const handleEventClick = (event: ConflictEvent, e: React.MouseEvent) => {
        setSelectedEvent({
            event,
            x: e.clientX,
            y: e.clientY,
        });
    };

    // Format date (only day, no time)
    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('it-IT', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch {
            return "Unknown";
        }
    };

    // Get event icon
    const getEventIcon = (type: string) => {
        switch (type) {
            case "conflict": return Swords;
            case "protest": return Megaphone;
            case "cyber": return Zap;
            case "terrorism": return Skull;
            case "civil_war": return Flame;
            default: return AlertTriangle;
        }
    };

    return (
        <div ref={mapRef} className="relative w-full h-full bg-gray-950">
            <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                    scale: 150,
                    center: center || [0, 20],
                }}
                style={{ width: "100%", height: "100%" }}
            >
                <ZoomableGroup
                    center={center || [0, 20]}
                    zoom={zoom || 1}
                    minZoom={1}
                    maxZoom={8}
                    translateExtent={[[-200, -150], [1000, 600]]} // LIMIT SCROLLING
                >
                    <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                            geographies.map((geo) => {
                                const countryName = geo.properties.name;
                                const baseColor = getCountryColor(countryName, geo);
                                const isInvolved = isCountryInvolved(countryName);

                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        style={{
                                            default: {
                                                fill: isInvolved
                                                    ? adjustColorBrightness(baseColor, 20)
                                                    : baseColor,
                                                stroke: "#1f2937",
                                                strokeWidth: 0.5,
                                                outline: "none",
                                            },
                                            hover: {
                                                fill: adjustColorBrightness(baseColor, 30),
                                                stroke: "#fff",
                                                strokeWidth: 0.5,
                                                outline: "none",
                                            },
                                            pressed: {
                                                fill: adjustColorBrightness(baseColor, 40),
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

                    {/* Event markers */}
                    {conflicts?.map((event) => (
                        <Marker key={event.id} coordinates={[event.lon, event.lat]}>
                            <EventMarker
                                eventType={event.eventType}
                                color={event.color}
                                size={6}
                                onClick={(e) => handleEventClick(event, e)}
                            />
                        </Marker>
                    ))}
                </ZoomableGroup>
            </ComposableMap>

            {/* Event Popup */}
            <AnimatePresence>
                {selectedEvent && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setSelectedEvent(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="fixed z-50 w-72 overflow-hidden"
                            style={{
                                left: Math.min(Math.max(selectedEvent.x - 144, 10), window.innerWidth - 300),
                                top: Math.min(Math.max(selectedEvent.y + 10, 10), window.innerHeight - 250),
                            }}
                        >
                            <div className="bg-gradient-to-br from-gray-900 to-black backdrop-blur-xl border border-white/20 text-white rounded-xl shadow-2xl overflow-hidden">
                                <div className="p-3 border-b border-white/10 bg-black/30">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {(() => {
                                                const Icon = getEventIcon(selectedEvent.event.eventType);
                                                return <Icon className="w-5 h-5" style={{ color: selectedEvent.event.color }} />;
                                            })()}
                                            <div>
                                                <h3 className="font-bold text-sm" style={{ color: selectedEvent.event.color }}>
                                                    {selectedEvent.event.label}
                                                </h3>
                                                <span className="text-xs text-gray-400">
                                                    {selectedEvent.event.actor2Name}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedEvent(null)}
                                            className="text-gray-400 hover:text-white text-xl p-1"
                                        >×</button>
                                    </div>
                                </div>
                                <div className="p-3">
                                    <div className="p-2 bg-white/5 rounded-lg border border-white/10 text-xs space-y-1.5">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Aggressor:</span>
                                            <span className="text-white font-medium">{selectedEvent.event.actor1Name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Target:</span>
                                            <span className="text-white">{selectedEvent.event.actor2Name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Last Update:</span>
                                            <span className="text-white">{formatDate(selectedEvent.event.date)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Started:</span>
                                            <span className="text-white">{formatDate(selectedEvent.event.startDate || selectedEvent.event.date)}</span>
                                        </div>
                                        {selectedEvent.event.duration && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Duration:</span>
                                                <span className="text-yellow-400 font-medium">{selectedEvent.event.duration}</span>
                                            </div>
                                        )}
                                        {selectedEvent.event.intensity && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Intensity:</span>
                                                <span className={`${selectedEvent.event.intensity.includes("High") ? "text-red-500 font-bold animate-pulse" : "text-gray-300"}`}>
                                                    {selectedEvent.event.intensity}
                                                </span>
                                            </div>
                                        )}
                                        {selectedEvent.event.casualties !== null && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Casualties:</span>
                                                <span className="text-red-400 font-bold">{selectedEvent.event.casualties}</span>
                                            </div>
                                        )}
                                        <div className="mt-2 pt-2 border-t border-white/10 text-[10px] text-gray-500">
                                            Source: {selectedEvent.event.source || "GDELT Network"}
                                        </div>
                                        {selectedEvent.event.sourceUrl && (
                                            <a
                                                href={selectedEvent.event.sourceUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block text-blue-400 hover:text-blue-300 text-[10px]"
                                            >→ Read full report</a>
                                        )}
                                    </div>
                                </div>
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
    if (hex.startsWith('rgba')) return hex;

    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, Math.max(0, (num >> 16) + amt));
    const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
    const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
    return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
}
