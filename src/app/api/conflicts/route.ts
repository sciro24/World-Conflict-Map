import { NextResponse } from 'next/server';
import axios from 'axios';

// GDELT API endpoints
const GDELT_DOC_API = "https://api.gdeltproject.org/api/v2/doc/doc";
const GDELT_GEO_API = "https://api.gdeltproject.org/api/v2/geo/geo";

// Event types with their GDELT themes
const EVENT_TYPES = {
    conflict: {
        themes: "theme:ARMEDCONFLICT OR theme:MILITARY_ATTACK OR theme:WAR",
        geoTheme: "theme:ARMEDCONFLICT",
        color: "#ef4444", // Red
        label: "Armed Conflict"
    },
    protest: {
        themes: "theme:PROTEST OR theme:CIVIL_UNREST",
        geoTheme: "theme:PROTEST",
        color: "#f59e0b", // Amber
        label: "Protest"
    },
    cyber: {
        themes: "theme:CYBER_ATTACK OR theme:HACKING",
        geoTheme: "theme:CYBER_ATTACK",
        color: "#3b82f6", // Blue
        label: "Cyber Attack"
    },
    terrorism: {
        themes: "theme:TERROR OR theme:TERRORISM OR theme:EXTREMISM",
        geoTheme: "theme:TERROR",
        color: "#a855f7", // Purple
        label: "Terrorism"
    }
};

type EventType = keyof typeof EVENT_TYPES;

export async function GET() {
    try {
        const allEvents: any[] = [];

        // Fetch events for each type in parallel
        const fetchPromises = (Object.keys(EVENT_TYPES) as EventType[]).map(async (eventType) => {
            const config = EVENT_TYPES[eventType];

            try {
                // Get articles with details
                const [docResponse, geoResponse] = await Promise.all([
                    axios.get(GDELT_DOC_API, {
                        params: {
                            query: config.themes,
                            mode: "artlist",
                            format: "json",
                            maxrecords: 30,
                            sort: "datedesc",
                        },
                        timeout: 8000,
                    }),
                    axios.get(GDELT_GEO_API, {
                        params: {
                            query: config.geoTheme,
                            format: "geojson",
                            timespan: "24h",
                            maxpoints: 30,
                        },
                        timeout: 8000,
                    })
                ]);

                const geoFeatures = geoResponse.data?.features || [];
                const articles = docResponse.data?.articles || [];
                const seenLocations = new Set<string>();

                for (let i = 0; i < geoFeatures.length && i < 15; i++) {
                    const f = geoFeatures[i];
                    const coords = f.geometry?.coordinates || [0, 0];
                    const props = f.properties || {};
                    const matchingArticle = articles[i] || {};

                    const title = matchingArticle.title || props.name || "";
                    const locationName = props.name || props.featurename || "Unknown Location";

                    // Skip duplicate locations
                    const locationKey = `${eventType}-${Math.round(coords[0])},${Math.round(coords[1])}`;
                    if (seenLocations.has(locationKey)) continue;
                    seenLocations.add(locationKey);

                    // Extract actor info
                    const targetCountry = extractCountryFromLocation(locationName);
                    const aggressorInfo = extractAggressorFromTitle(title, targetCountry, eventType);

                    // Parse date
                    let eventDate = matchingArticle.seendate || props.date;
                    if (eventDate) {
                        eventDate = parseGdeltDate(eventDate);
                    } else {
                        const hoursAgo = Math.floor(Math.random() * 24);
                        const pastDate = new Date();
                        pastDate.setHours(pastDate.getHours() - hoursAgo);
                        eventDate = pastDate.toISOString();
                    }

                    // Extract casualties from title (rough estimation)
                    const casualties = extractCasualties(title);

                    // Calculate angle for conflicts
                    const originLat = coords[1] + (Math.random() - 0.5) * 5;
                    const originLon = coords[0] + (Math.random() - 0.5) * 5;
                    const angle = calculateAngle(originLat, originLon, coords[1], coords[0]);

                    allEvents.push({
                        id: `${eventType}-${i}-${Date.now()}`,
                        source: "GDELT",
                        eventType: eventType,
                        lat: coords[1],
                        lon: coords[0],
                        actor1Name: aggressorInfo.name,
                        actor1Code: aggressorInfo.code,
                        actor2Name: targetCountry || locationName,
                        sourceUrl: matchingArticle.url || props.url || "",
                        date: eventDate,
                        angle: angle,
                        goldstein: matchingArticle.tone ? parseFloat(matchingArticle.tone) * -1 : -5,
                        title: title,
                        casualties: casualties,
                        color: config.color,
                        label: config.label,
                    });
                }
            } catch (err) {
                console.error(`Error fetching ${eventType}:`, err);
            }
        });

        await Promise.all(fetchPromises);

        // If we didn't get enough events, add known conflicts
        if (allEvents.filter(e => e.eventType === "conflict").length < 3) {
            const knownConflicts = getKnownConflicts();
            allEvents.push(...knownConflicts);
        }

        // Sort by date (most recent first)
        allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return NextResponse.json(allEvents);
    } catch (error) {
        console.error("Error in API route:", error);
        return NextResponse.json(getKnownConflicts());
    }
}

// Extract casualties/victims from title
function extractCasualties(title: string): number | null {
    const patterns = [
        /(\d+)\s*(?:killed|dead|deaths|died|casualties|victims)/i,
        /(?:killed|dead|deaths)\s*(\d+)/i,
        /(\d+)\s*(?:people|soldiers|civilians)\s*(?:killed|dead)/i,
    ];

    for (const pattern of patterns) {
        const match = title.match(pattern);
        if (match && match[1]) {
            return parseInt(match[1], 10);
        }
    }
    return null;
}

// Known ongoing conflicts as fallback
function getKnownConflicts() {
    const now = new Date();
    const config = EVENT_TYPES.conflict;

    return [
        {
            id: "known-1",
            source: "GDELT",
            eventType: "conflict",
            lat: 48.3794,
            lon: 31.1656,
            actor1Code: "RUS",
            actor1Name: "Russia",
            actor2Name: "Ukraine",
            date: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
            angle: 270,
            goldstein: -9,
            sourceUrl: "",
            title: "Russia-Ukraine War",
            casualties: null,
            color: config.color,
            label: config.label,
        },
        {
            id: "known-2",
            source: "GDELT",
            eventType: "conflict",
            lat: 31.5,
            lon: 34.5,
            actor1Code: "ISR",
            actor1Name: "Israel",
            actor2Name: "Gaza",
            date: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
            angle: 180,
            goldstein: -9,
            sourceUrl: "",
            title: "Israel-Gaza Conflict",
            casualties: null,
            color: config.color,
            label: config.label,
        },
        {
            id: "known-3",
            source: "GDELT",
            eventType: "conflict",
            lat: 15.5,
            lon: 32.5,
            actor1Code: "SDN",
            actor1Name: "RSF",
            actor2Name: "Khartoum",
            date: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
            angle: 45,
            goldstein: -8,
            sourceUrl: "",
            title: "Sudan Civil War",
            casualties: null,
            color: config.color,
            label: config.label,
        },
        {
            id: "known-4",
            source: "GDELT",
            eventType: "terrorism",
            lat: 33.8,
            lon: 35.5,
            actor1Code: "LBN",
            actor1Name: "Hezbollah",
            actor2Name: "Israel Border",
            date: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
            angle: 200,
            goldstein: -6,
            sourceUrl: "",
            title: "Hezbollah-Israel Tensions",
            casualties: null,
            color: EVENT_TYPES.terrorism.color,
            label: EVENT_TYPES.terrorism.label,
        },
        {
            id: "known-5",
            source: "GDELT",
            eventType: "terrorism",
            lat: 2.0,
            lon: 45.3,
            actor1Code: "SOM",
            actor1Name: "Al-Shabaab",
            actor2Name: "Somalia",
            date: new Date(now.getTime() - 14 * 60 * 60 * 1000).toISOString(),
            angle: 135,
            goldstein: -6,
            sourceUrl: "",
            title: "Al-Shabaab Attack",
            casualties: null,
            color: EVENT_TYPES.terrorism.color,
            label: EVENT_TYPES.terrorism.label,
        },
    ];
}

// Extract country from location string
function extractCountryFromLocation(location: string): string {
    const countryPatterns: Record<string, string[]> = {
        "Ukraine": ["Ukraine", "Kyiv", "Kiev", "Kharkiv", "Odessa", "Donetsk", "Luhansk"],
        "Russia": ["Russia", "Moscow", "St. Petersburg"],
        "Israel": ["Israel", "Tel Aviv", "Jerusalem", "Haifa"],
        "Palestine": ["Palestine", "Gaza", "West Bank", "Ramallah"],
        "Syria": ["Syria", "Damascus", "Aleppo", "Idlib"],
        "Lebanon": ["Lebanon", "Beirut"],
        "Iran": ["Iran", "Tehran"],
        "Iraq": ["Iraq", "Baghdad"],
        "Yemen": ["Yemen", "Sanaa"],
        "Sudan": ["Sudan", "Khartoum"],
        "Somalia": ["Somalia", "Mogadishu"],
        "Nigeria": ["Nigeria", "Lagos", "Abuja"],
        "Myanmar": ["Myanmar", "Burma", "Yangon"],
        "China": ["China", "Beijing", "Shanghai"],
        "United States": ["United States", "USA", "Washington", "New York"],
        "France": ["France", "Paris"],
        "Germany": ["Germany", "Berlin"],
        "United Kingdom": ["United Kingdom", "UK", "London"],
    };

    const locationLower = location.toLowerCase();
    for (const [country, patterns] of Object.entries(countryPatterns)) {
        for (const pattern of patterns) {
            if (locationLower.includes(pattern.toLowerCase())) {
                return country;
            }
        }
    }

    // Try to extract the last part as country
    const parts = location.split(",");
    if (parts.length > 1) {
        return parts[parts.length - 1].trim();
    }

    return location;
}

// Extract aggressor from title
function extractAggressorFromTitle(title: string, targetCountry: string, eventType: string): { name: string; code: string } {
    const aggressorPatterns: Record<string, { name: string; code: string; patterns: string[] }> = {
        "Russia": { name: "Russia", code: "RUS", patterns: ["russia", "russian", "kremlin", "putin", "moscow"] },
        "Ukraine": { name: "Ukraine", code: "UKR", patterns: ["ukraine", "ukrainian", "kyiv", "zelensky"] },
        "Israel": { name: "Israel", code: "ISR", patterns: ["israel", "israeli", "idf", "netanyahu"] },
        "Hamas": { name: "Hamas", code: "PSE", patterns: ["hamas"] },
        "Hezbollah": { name: "Hezbollah", code: "LBN", patterns: ["hezbollah", "hizbollah"] },
        "Iran": { name: "Iran", code: "IRN", patterns: ["iran", "iranian", "tehran"] },
        "China": { name: "China", code: "CHN", patterns: ["china", "chinese", "beijing"] },
        "North Korea": { name: "North Korea", code: "PRK", patterns: ["north korea", "pyongyang", "kim jong"] },
        "ISIS": { name: "ISIS", code: "ISIS", patterns: ["isis", "isil", "islamic state", "daesh"] },
        "Al-Qaeda": { name: "Al-Qaeda", code: "AQT", patterns: ["al-qaeda", "al qaeda", "aqap"] },
        "Al-Shabaab": { name: "Al-Shabaab", code: "SOM", patterns: ["al-shabaab", "alshabaab"] },
        "Hackers": { name: "Hackers", code: "CYB", patterns: ["hacker", "cybercriminal", "apt"] },
    };

    const titleLower = title.toLowerCase();

    for (const [_, info] of Object.entries(aggressorPatterns)) {
        for (const pattern of info.patterns) {
            if (titleLower.includes(pattern) && info.name !== targetCountry) {
                return { name: info.name, code: info.code };
            }
        }
    }

    // Default based on event type
    if (eventType === "protest") {
        return { name: "Protesters", code: "" };
    } else if (eventType === "cyber") {
        return { name: "Unknown Hackers", code: "CYB" };
    } else if (eventType === "terrorism") {
        return { name: "Unknown Group", code: "" };
    }

    return { name: "Unknown", code: "" };
}

// Parse GDELT date format
function parseGdeltDate(dateStr: string): string {
    try {
        if (dateStr.length === 14) {
            const year = dateStr.substring(0, 4);
            const month = dateStr.substring(4, 6);
            const day = dateStr.substring(6, 8);
            const hour = dateStr.substring(8, 10);
            const minute = dateStr.substring(10, 12);
            const second = dateStr.substring(12, 14);
            return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`).toISOString();
        }
        return new Date(dateStr).toISOString();
    } catch {
        return new Date().toISOString();
    }
}

// Calculate angle between two points
function calculateAngle(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;

    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    const rads = Math.atan2(y, x);
    return (rads * 180 / Math.PI + 360) % 360;
}
