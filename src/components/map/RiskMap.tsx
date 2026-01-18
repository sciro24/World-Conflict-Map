"use client"

import React, { useState, useMemo } from "react"
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps"
import { EventMarker } from "./EventMarker"
import { motion, AnimatePresence } from "framer-motion"

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json"

// Risiko colors per continent
const RISIKO_COLORS = {
    EUROPE: "#3b82f6",
    ASIA: "#22c55e",
    NORTH_AMERICA: "#f97316",
    SOUTH_AMERICA: "#0ea5e9",
    AFRICA: "#a16207",
    OCEANIA: "#a855f7",
} as const;

// Map countries to their Risiko continent
const COUNTRY_TO_CONTINENT: Record<string, keyof typeof RISIKO_COLORS> = {
    // EUROPE
    "Germany": "EUROPE", "France": "EUROPE", "United Kingdom": "EUROPE",
    "Italy": "EUROPE", "Spain": "EUROPE", "Ukraine": "EUROPE", "Poland": "EUROPE",
    "Romania": "EUROPE", "Netherlands": "EUROPE", "Belgium": "EUROPE", "Sweden": "EUROPE",
    "Czech Republic": "EUROPE", "Czechia": "EUROPE", "Greece": "EUROPE", "Portugal": "EUROPE",
    "Hungary": "EUROPE", "Austria": "EUROPE", "Switzerland": "EUROPE", "Bulgaria": "EUROPE",
    "Denmark": "EUROPE", "Finland": "EUROPE", "Slovakia": "EUROPE", "Norway": "EUROPE",
    "Ireland": "EUROPE", "Croatia": "EUROPE", "Bosnia and Herzegovina": "EUROPE",
    "Albania": "EUROPE", "Lithuania": "EUROPE", "Slovenia": "EUROPE", "Latvia": "EUROPE",
    "Estonia": "EUROPE", "Serbia": "EUROPE", "Belarus": "EUROPE", "Moldova": "EUROPE",
    // ASIA
    "Russia": "ASIA", "China": "ASIA", "India": "ASIA", "Indonesia": "ASIA", "Pakistan": "ASIA",
    "Japan": "ASIA", "Philippines": "ASIA", "Vietnam": "ASIA", "Turkey": "ASIA", "Iran": "ASIA",
    "Thailand": "ASIA", "Myanmar": "ASIA", "South Korea": "ASIA", "Iraq": "ASIA",
    "Saudi Arabia": "ASIA", "Yemen": "ASIA", "Syria": "ASIA", "Israel": "ASIA", "Lebanon": "ASIA",
    // NORTH AMERICA
    "United States": "NORTH_AMERICA", "United States of America": "NORTH_AMERICA",
    "Mexico": "NORTH_AMERICA", "Canada": "NORTH_AMERICA", "Cuba": "NORTH_AMERICA",
    // SOUTH AMERICA
    "Brazil": "SOUTH_AMERICA", "Colombia": "SOUTH_AMERICA", "Argentina": "SOUTH_AMERICA",
    "Peru": "SOUTH_AMERICA", "Venezuela": "SOUTH_AMERICA", "Chile": "SOUTH_AMERICA",
    // AFRICA
    "Nigeria": "AFRICA", "Ethiopia": "AFRICA", "Egypt": "AFRICA", "South Africa": "AFRICA",
    "Kenya": "AFRICA", "Algeria": "AFRICA", "Sudan": "AFRICA", "Morocco": "AFRICA",
    "Somalia": "AFRICA", "Libya": "AFRICA", "Tunisia": "AFRICA",
    // OCEANIA
    "Australia": "OCEANIA", "New Zealand": "OCEANIA", "Papua New Guinea": "OCEANIA",
};

interface ConflictEvent {
    id: string;
    source: string;
    eventType: "conflict" | "protest" | "cyber" | "terrorism";
    lat: number;
    lon: number;
    actor1Name: string;
    actor1Code: string;
    actor2Name: string;
    goldstein: number;
    sourceUrl: string;
    date: string;
    angle: number;
    title: string;
    casualties: number | null;
    color: string;
    label: string;
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
    events: ConflictEvent[];
    continent?: string;
}

interface EventPopupData {
    event: ConflictEvent;
    x: number;
    y: number;
}

export function RiskMap({ conflicts, center, zoom, selectedConflictId }: MapProps) {
    const [selectedCountry, setSelectedCountry] = useState<CountryPopupData | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<EventPopupData | null>(null);

    // Set of countries with active events
    const countriesWithEvents = useMemo(() => {
        const set = new Set<string>();
        conflicts.forEach(c => {
            if (c.actor1Name) set.add(c.actor1Name.toLowerCase());
            if (c.actor2Name) set.add(c.actor2Name.toLowerCase());
        });
        return set;
    }, [conflicts]);

    // Get country color based on continent
    const getCountryColor = (countryName: string) => {
        const continent = COUNTRY_TO_CONTINENT[countryName];
        if (continent) {
            return RISIKO_COLORS[continent];
        }
        return "#374151"; // Default gray
    };

    // Check if country is in conflict
    const isCountryInvolved = (countryName: string) => {
        return countriesWithEvents.has(countryName.toLowerCase());
    };

    // Get events for a country
    const getCountryEvents = (countryName: string) => {
        const nameLower = countryName.toLowerCase();
        return conflicts.filter(c =>
            c.actor1Name?.toLowerCase().includes(nameLower) ||
            c.actor2Name?.toLowerCase().includes(nameLower)
        );
    };

    // Handle country click
    const handleCountryClick = (geo: any, evt: React.MouseEvent) => {
        const countryName = geo.properties.name;
        const countryEvents = getCountryEvents(countryName);

        setSelectedEvent(null);
        setSelectedCountry({
            name: countryName,
            x: evt.clientX,
            y: evt.clientY,
            events: countryEvents,
            continent: COUNTRY_TO_CONTINENT[countryName],
        });
    };

    // Handle event marker click
    const handleEventClick = (event: ConflictEvent, e: React.MouseEvent) => {
        setSelectedCountry(null);
        setSelectedEvent({
            event,
            x: e.clientX,
            y: e.clientY,
        });
    };

    // Format date
    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleString('it-IT', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return "Unknown";
        }
    };

    // Get event type emoji
    const getEventEmoji = (type: string) => {
        switch (type) {
            case "conflict": return "⚔️";
            case "protest": return "✊";
            case "cyber": return "💻";
            case "terrorism": return "💀";
            default: return "⚠️";
        }
    };

    return (
        <div className="relative w-full h-full bg-gray-950">
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
                >
                    <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                            geographies.map((geo) => {
                                const countryName = geo.properties.name;
                                const baseColor = getCountryColor(countryName);
                                const isInvolved = isCountryInvolved(countryName);

                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        onClick={(evt) => handleCountryClick(geo, evt)}
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

                    {/* Event markers - small colored dots */}
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

            {/* Country Popup */}
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
                            className="fixed z-50 w-72 max-h-[60vh] overflow-hidden"
                            style={{
                                left: Math.min(selectedCountry.x, window.innerWidth - 300),
                                top: Math.min(selectedCountry.y + 10, window.innerHeight - 350),
                            }}
                        >
                            <div className="bg-gradient-to-br from-gray-900 to-black backdrop-blur-xl border border-white/20 text-white rounded-xl shadow-2xl overflow-hidden">
                                <div className="p-3 border-b border-white/10 bg-black/30">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-bold text-base">{selectedCountry.name}</h3>
                                            <span className="text-xs text-gray-400">{selectedCountry.continent}</span>
                                        </div>
                                        <button
                                            onClick={() => setSelectedCountry(null)}
                                            className="text-gray-400 hover:text-white text-xl p-1"
                                        >×</button>
                                    </div>
                                    {selectedCountry.events.length > 0 ? (
                                        <span className="text-red-400 text-xs">⚠️ {selectedCountry.events.length} active events</span>
                                    ) : (
                                        <span className="text-green-400 text-xs">🕊️ No active events</span>
                                    )}
                                </div>
                                {selectedCountry.events.length > 0 && (
                                    <div className="max-h-48 overflow-y-auto p-2 space-y-2">
                                        {selectedCountry.events.map((event, idx) => (
                                            <div key={idx} className="p-2 bg-white/5 rounded-lg border border-white/10 text-xs">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span>{getEventEmoji(event.eventType)}</span>
                                                    <span className="font-medium" style={{ color: event.color }}>{event.label}</span>
                                                </div>
                                                <div className="text-gray-400">{event.actor1Name} → {event.actor2Name}</div>
                                                <div className="text-gray-500 text-[10px]">{formatDate(event.date)}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

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
                                left: Math.min(selectedEvent.x, window.innerWidth - 300),
                                top: Math.min(selectedEvent.y + 10, window.innerHeight - 250),
                            }}
                        >
                            <div className="bg-gradient-to-br from-gray-900 to-black backdrop-blur-xl border border-white/20 text-white rounded-xl shadow-2xl overflow-hidden">
                                <div className="p-3 border-b border-white/10 bg-black/30">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{getEventEmoji(selectedEvent.event.eventType)}</span>
                                            <div>
                                                <h3 className="font-bold text-sm" style={{ color: selectedEvent.event.color }}>
                                                    {selectedEvent.event.label}
                                                </h3>
                                                <span className="text-xs text-gray-400">
                                                    {selectedEvent.event.actor1Name} → {selectedEvent.event.actor2Name}
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
                                            <span className="text-white">{selectedEvent.event.actor1Name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Target:</span>
                                            <span className="text-white">{selectedEvent.event.actor2Name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Time:</span>
                                            <span className="text-white">{formatDate(selectedEvent.event.date)}</span>
                                        </div>
                                        {selectedEvent.event.casualties !== null && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Casualties:</span>
                                                <span className="text-red-400 font-medium">{selectedEvent.event.casualties}</span>
                                            </div>
                                        )}
                                        {selectedEvent.event.sourceUrl && (
                                            <a
                                                href={selectedEvent.event.sourceUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-2 block text-blue-400 hover:text-blue-300 text-[10px]"
                                            >→ Read source</a>
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
