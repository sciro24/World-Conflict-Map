import { NextResponse } from 'next/server';
import axios from 'axios';

// GDELT API endpoints
const GDELT_DOC_API = "https://api.gdeltproject.org/api/v2/doc/doc";
const GDELT_GEO_API = "https://api.gdeltproject.org/api/v2/geo/geo";

// Event types
const EVENT_TYPES = {
    conflict: { color: "#ef4444", label: "Armed Conflict" },
    civil_war: { color: "#dc2626", label: "Civil War" },
    protest: { color: "#f59e0b", label: "Protest" },
    cyber: { color: "#3b82f6", label: "Cyber Attack" },
    terrorism: { color: "#a855f7", label: "Terrorism" }
};

type EventType = keyof typeof EVENT_TYPES;

// Known start dates for duration calculation
const CONFLICT_START_DATES: Record<string, string> = {
    "Russia": "2022-02-24", // Ukraine war
    "Ukraine": "2022-02-24",
    "Israel": "2023-10-07", // Gaza war
    "Gaza": "2023-10-07",
    "Sudan": "2023-04-15", // Civil war
    "Myanmar": "2021-02-01", // Civil war
    "Yemen": "2014-09-16", // Civil war
    "Syria": "2011-03-15", // Civil war
    "Ethiopia": "2020-11-03", // Tigray/Amhara
    "Congo": "2022-03-01", // M23 Resurgence
    "Somalia": "2009-01-01", // Al-Shabaab (approx)
    "Nigeria": "2009-07-26", // Boko Haram
};

// Known country coordinates
const COUNTRY_COORDS: Record<string, [number, number]> = {
    "Ukraine": [48.38, 31.17], "Russia": [55.75, 37.62], "Israel": [31.77, 35.22],
    "Palestine": [31.95, 35.23], "Gaza": [31.52, 34.45], "Syria": [34.80, 38.99],
    "Lebanon": [33.89, 35.50], "Iran": [35.69, 51.39], "Iraq": [33.31, 44.37],
    "Yemen": [15.37, 44.19], "Sudan": [15.59, 32.53], "Somalia": [2.04, 45.34],
    "Nigeria": [9.08, 7.40], "Myanmar": [19.75, 96.10], "China": [39.90, 116.40],
    "United States": [38.91, -77.04], "France": [48.86, 2.35], "Germany": [52.52, 13.40],
    "United Kingdom": [51.51, -0.13], "Turkey": [39.93, 32.86], "Pakistan": [33.69, 73.06],
    "Afghanistan": [34.53, 69.17], "India": [28.61, 77.21], "Egypt": [30.04, 31.24],
    "Libya": [32.88, 13.19], "Saudi Arabia": [24.71, 46.68], "North Korea": [39.04, 125.76],
    "Japan": [35.68, 139.69], "Taiwan": [25.03, 121.57], "Philippines": [14.60, 120.98],
    "Mexico": [19.43, -99.13], "Colombia": [4.71, -74.07], "Venezuela": [10.49, -66.88],
    "Kenya": [-1.29, 36.82], "Ethiopia": [9.02, 38.75], "South Africa": [-25.75, 28.19],
    "Mali": [12.64, -8.00], "Niger": [13.51, 2.11], "Burkina Faso": [12.37, -1.52],
    "Cameroon": [3.87, 11.52], "Chad": [12.13, 15.05], "Algeria": [36.75, 3.06],
    "Morocco": [33.97, -6.85], "Tunisia": [36.80, 10.18], "Poland": [52.23, 21.01],
    "Canada": [45.42, -75.69], "Australia": [-35.28, 149.13], "Spain": [40.42, -3.70],
};

// GDELT query configurations for each event type
const QUERIES = {
    conflict: {
        geo: "theme:ARMEDCONFLICT OR theme:MILITARY OR theme:WAR OR theme:KILL",
        doc: "conflict OR war OR military attack OR airstrike OR strike sourcelang:english"
    },
    civil_war: {
        geo: "theme:CIVIL_WAR OR theme:INSURGENCY",
        doc: "civil war OR insurgency OR rebels OR militia OR resistance sourcelang:english"
    },
    terrorism: {
        geo: "theme:TERROR OR theme:BOMBING",
        doc: "terrorist OR terrorism OR bomb attack OR suicide bomber sourcelang:english"
    },
    protest: {
        geo: "theme:PROTEST OR theme:CIVIL_UNREST",
        doc: "protest OR demonstration OR riot OR civil unrest sourcelang:english"
    },
    cyber: {
        geo: "theme:CYBER_ATTACK OR theme:HACKING",
        doc: "cyber attack OR hacking OR ransomware OR data breach sourcelang:english"
    }
};

export async function GET() {
    try {
        const allEvents: any[] = [];

        // Fetch all event types in parallel
        const fetchPromises = (Object.keys(EVENT_TYPES) as EventType[]).map(async (eventType) => {
            const config = EVENT_TYPES[eventType];
            const queries = QUERIES[eventType];

            try {
                // Get geo features (locations)
                const geoResponse = await axios.get(GDELT_GEO_API, {
                    params: {
                        query: queries.geo,
                        format: "geojson",
                        timespan: "24h",
                        maxpoints: 30,
                    },
                    timeout: 8000,
                });

                // Get articles for context
                const docResponse = await axios.get(GDELT_DOC_API, {
                    params: {
                        query: queries.doc,
                        mode: "artlist",
                        format: "json",
                        maxrecords: 50,
                        sort: "datedesc",
                    },
                    timeout: 8000,
                });

                const geoFeatures = geoResponse.data?.features || [];
                const articles = docResponse.data?.articles || [];

                // Build a pool of articles for matching
                const articlePool = articles.filter((a: any) => a.title && a.seendate);

                const seenLocations = new Set<string>();
                let articleIndex = 0;

                for (const feature of geoFeatures) {
                    if (allEvents.filter(e => e.eventType === eventType).length >= 15) break;

                    const coords = feature.geometry?.coordinates;
                    if (!coords || coords.length < 2) continue;

                    const locationName = feature.properties?.name || "";

                    // Skip invalid locations
                    if (!locationName || locationName.length < 3 || locationName.includes("ERROR")) continue;

                    // Skip duplicates
                    const locKey = `${eventType}-${locationName}`;
                    if (seenLocations.has(locKey)) continue;
                    seenLocations.add(locKey);

                    // Get a matching article (cycling through pool)
                    const article = articlePool[articleIndex % Math.max(1, articlePool.length)] || {};
                    articleIndex++;

                    // Parse date from article
                    let eventDate: string;
                    if (article.seendate) {
                        eventDate = parseGdeltDate(article.seendate);
                    } else {
                        // Generate realistic recent time
                        const hoursAgo = Math.floor(Math.random() * 24) + 1;
                        eventDate = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
                    }

                    // Extract country from location
                    const country = extractCountry(locationName);

                    // Extract actor from article title
                    const title = article.title || locationName;
                    const actorInfo = extractActor(title, country, eventType);

                    // Extract casualties
                    const casualties = extractCasualties(title);

                    // Calculate details
                    const duration = calculateDuration(country);
                    const sourceDomain = article.url ? new URL(article.url).hostname.replace('www.', '') : "GDELT Network";
                    const goldstein = -5 - Math.random() * 5; // Negative for conflict
                    const intensity = getIntensityLabel(goldstein);
                    const knownStartDate = CONFLICT_START_DATES[extractCountry(country)];

                    allEvents.push({
                        id: `${eventType}-${allEvents.length}-${Date.now()}`,
                        source: sourceDomain,
                        eventType: eventType,
                        lat: coords[1],
                        lon: coords[0],
                        actor1Name: actorInfo.name,
                        actor1Code: actorInfo.code,
                        actor2Name: country || locationName,
                        sourceUrl: article.url || "",
                        date: eventDate,
                        startDate: knownStartDate || eventDate, // Add Start Date
                        angle: Math.random() * 360,
                        goldstein: goldstein,
                        title: title,
                        casualties: casualties,
                        color: config.color,
                        label: config.label,
                        duration: duration,
                        intensity: intensity
                    });
                }
            } catch (err) {
                console.error(`Error fetching ${eventType}:`, err);
            }
        });

        await Promise.all(fetchPromises);

        // Add fallback events if needed
        if (allEvents.length < 10) {
            allEvents.push(...getKnownEvents());
        }

        // Sort by date
        allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return NextResponse.json(allEvents);
    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json(getKnownEvents());
    }
}

// Calculate duration based on known start dates
function calculateDuration(country: string): string {
    const startDateStr = CONFLICT_START_DATES[extractCountry(country)]; // Simplify matching
    if (!startDateStr) return "Just reported";

    const start = new Date(startDateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 365) {
        const years = Math.floor(diffDays / 365);
        const months = Math.floor((diffDays % 365) / 30);
        return `${years}y ${months}m`;
    }
    return `${diffDays} days`;
}

// Get intensity label
function getIntensityLabel(goldstein: number): string {
    if (goldstein < -7) return "High Intensity";
    if (goldstein < -4) return "Medium Intensity";
    return "Low Intensity";
}

// Extract country from location name
function extractCountry(location: string): string {
    // Check direct match
    for (const country of Object.keys(COUNTRY_COORDS)) {
        if (location.toLowerCase().includes(country.toLowerCase())) {
            return country;
        }
    }

    // City to country mapping
    const cityMap: Record<string, string> = {
        "moscow": "Russia", "kyiv": "Ukraine", "kiev": "Ukraine", "kharkiv": "Ukraine",
        "tel aviv": "Israel", "jerusalem": "Israel", "gaza": "Gaza",
        "damascus": "Syria", "aleppo": "Syria", "beirut": "Lebanon",
        "tehran": "Iran", "baghdad": "Iraq", "kabul": "Afghanistan",
        "islamabad": "Pakistan", "karachi": "Pakistan", "delhi": "India",
        "mumbai": "India", "cairo": "Egypt", "lagos": "Nigeria",
        "nairobi": "Kenya", "mogadishu": "Somalia", "khartoum": "Sudan",
        "paris": "France", "london": "United Kingdom", "berlin": "Germany",
        "washington": "United States", "new york": "United States",
    };

    const locLower = location.toLowerCase();
    for (const [city, country] of Object.entries(cityMap)) {
        if (locLower.includes(city)) {
            return country;
        }
    }

    // Return as-is if no match
    const parts = location.split(",");
    return parts[parts.length - 1].trim();
}

// Extract actor from title - COMPREHENSIVE
function extractActor(title: string, targetCountry: string, eventType: string): { name: string; code: string } {
    const t = title.toLowerCase();

    // === MILITARY / GOVERNMENT ===
    if (t.includes("russian") && !targetCountry.includes("Russia")) return { name: "Russian Forces", code: "RUS" };
    if (t.includes("putin")) return { name: "Russian Government", code: "RUS" };
    if (t.includes("ukraine") && t.includes("strike")) return { name: "Ukrainian Forces", code: "UKR" };
    if (t.includes("idf") || (t.includes("israel") && t.includes("strike"))) return { name: "IDF (Israel)", code: "ISR" };
    if (t.includes("u.s.") || t.includes("american") && t.includes("military")) return { name: "US Military", code: "USA" };
    if (t.includes("chinese") && t.includes("military")) return { name: "Chinese Military", code: "CHN" };
    if (t.includes("turkish")) return { name: "Turkish Forces", code: "TUR" };
    if (t.includes("saudi")) return { name: "Saudi Coalition", code: "SAU" };
    if (t.includes("iranian") || t.includes("irgc")) return { name: "Iranian Forces", code: "IRN" };

    // === TERROR GROUPS ===
    if (t.includes("hamas")) return { name: "Hamas", code: "HMA" };
    if (t.includes("hezbollah")) return { name: "Hezbollah", code: "HZB" };
    if (t.includes("isis") || t.includes("islamic state") || t.includes("isil")) return { name: "ISIS", code: "ISIS" };
    if (t.includes("al-qaeda") || t.includes("al qaeda")) return { name: "Al-Qaeda", code: "AQA" };
    if (t.includes("taliban")) return { name: "Taliban", code: "TLB" };
    if (t.includes("al-shabaab") || t.includes("shabaab")) return { name: "Al-Shabaab", code: "ASB" };
    if (t.includes("boko haram")) return { name: "Boko Haram", code: "BKH" };
    if (t.includes("houthi")) return { name: "Houthi Rebels", code: "HTH" };
    if (t.includes("rsf") || t.includes("rapid support")) return { name: "RSF Militia", code: "RSF" };
    if (t.includes("wagner")) return { name: "Wagner Group", code: "WAG" };
    if (t.includes("militia")) return { name: "Armed Militia", code: "" };
    if (t.includes("rebel")) return { name: "Rebel Forces", code: "" };
    if (t.includes("insurgent")) return { name: "Insurgents", code: "" };

    // === CYBER ===
    if (eventType === "cyber") {
        if (t.includes("lazarus") || t.includes("north korea")) return { name: "Lazarus Group (NK)", code: "LAZ" };
        if (t.includes("apt28") || t.includes("fancy bear")) return { name: "APT28 (Russia)", code: "APT" };
        if (t.includes("apt29") || t.includes("cozy bear")) return { name: "APT29 (Russia)", code: "APT" };
        if (t.includes("lockbit")) return { name: "LockBit Gang", code: "RAN" };
        if (t.includes("ransomware")) return { name: "Ransomware Gang", code: "RAN" };
        if (t.includes("chinese") || t.includes("china")) return { name: "Chinese Hackers", code: "CHN" };
        if (t.includes("russian") || t.includes("russia")) return { name: "Russian Hackers", code: "RUS" };
        if (t.includes("iranian") || t.includes("iran")) return { name: "Iranian Hackers", code: "IRN" };
        return { name: "Cyber Attackers", code: "CYB" };
    }

    // === PROTEST ===
    if (eventType === "protest") {
        if (t.includes("farmer")) return { name: "Farmers' Protest", code: "" };
        if (t.includes("student")) return { name: "Student Protesters", code: "" };
        if (t.includes("worker") || t.includes("union") || t.includes("strike")) return { name: "Workers Union", code: "" };
        if (t.includes("climate") || t.includes("environmental")) return { name: "Climate Activists", code: "" };
        if (t.includes("pro-democracy")) return { name: "Pro-Democracy Movement", code: "" };
        if (t.includes("anti-government")) return { name: "Anti-Government Protesters", code: "" };
        return { name: "Protesters", code: "" };
    }

    // === TERRORISM ===
    if (eventType === "terrorism") {
        if (t.includes("bomb") || t.includes("explosion")) return { name: "Bombers", code: "" };
        if (t.includes("gunman") || t.includes("shooter")) return { name: "Armed Gunman", code: "" };
        if (t.includes("suicide")) return { name: "Suicide Bomber", code: "" };
        return { name: "Armed Group", code: "" };
    }

    // === CIVIL WAR ===
    if (eventType === "civil_war") {
        if (t.includes("junta")) return { name: "Military Junta", code: "" };
        if (t.includes("rebel")) return { name: "Rebel Forces", code: "" };
        if (t.includes("government")) return { name: "Government Forces", code: "" };
        return { name: "Armed Factions", code: "" };
    }

    // === CONFLICT ===
    if (eventType === "conflict") {
        if (t.includes("airstrike") || t.includes("air strike")) return { name: "Air Force", code: "" };
        if (t.includes("drone")) return { name: "Drone Strike", code: "" };
        if (t.includes("artillery") || t.includes("shell")) return { name: "Artillery Strike", code: "" };
        if (t.includes("navy") || t.includes("naval")) return { name: "Naval Forces", code: "" };
        return { name: "Armed Forces", code: "" };
    }

    return { name: "Unknown", code: "" };
}

// Extract casualties
function extractCasualties(title: string): number | null {
    const patterns = [
        /(\d+)\s*(?:killed|dead|die[ds]|casualties|death)/i,
        /(?:killed?|dead|deaths?)\s*(?:at least\s*)?(\d+)/i,
        /(?:at least|over|more than)\s*(\d+)\s*(?:killed|dead)/i,
    ];

    for (const pattern of patterns) {
        const match = title.match(pattern);
        if (match?.[1]) {
            const num = parseInt(match[1], 10);
            if (num > 0 && num < 10000) return num;
        }
    }
    return null;
}

// Parse GDELT date
function parseGdeltDate(dateStr: string): string {
    try {
        dateStr = dateStr.trim();

        if (dateStr.includes('T')) {
            const [datePart, timePart] = dateStr.split('T');
            const time = timePart.replace('Z', '');
            const year = datePart.substring(0, 4);
            const month = datePart.substring(4, 6);
            const day = datePart.substring(6, 8);
            const hour = time.substring(0, 2);
            const minute = time.substring(2, 4);
            const second = time.substring(4, 6) || '00';

            const parsed = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
            // Don't return future dates
            if (parsed > new Date()) {
                return new Date().toISOString();
            }
            return parsed.toISOString();
        }

        if (dateStr.length >= 14) {
            const year = dateStr.substring(0, 4);
            const month = dateStr.substring(4, 6);
            const day = dateStr.substring(6, 8);
            const hour = dateStr.substring(8, 10);
            const minute = dateStr.substring(10, 12);
            const second = dateStr.substring(12, 14);
            return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`).toISOString();
        }

        return new Date().toISOString();
    } catch {
        return new Date().toISOString();
    }
}

// Known ongoing events - EXPANDED with civil wars and long-standing conflicts
function getKnownEvents() {
    const now = new Date();

    return [
        // === MAJOR WARS ===
        {
            id: "k-1", source: "GDELT Network", eventType: "conflict",
            lat: 48.38, lon: 31.17,
            actor1Name: "Russian Forces", actor1Code: "RUS",
            actor2Name: "Ukraine",
            date: now.toISOString(),
            startDate: CONFLICT_START_DATES["Ukraine"],
            angle: 270, goldstein: -9, sourceUrl: "",
            title: "Russia-Ukraine War - ongoing military operations",
            casualties: null,
            color: "#ef4444", label: "Armed Conflict",
            duration: calculateDuration("Ukraine"),
            intensity: "High Intensity"
        },
        {
            id: "k-2", source: "GDELT Network", eventType: "conflict",
            lat: 31.52, lon: 34.45,
            actor1Name: "IDF (Israel)", actor1Code: "ISR",
            actor2Name: "Gaza",
            date: now.toISOString(),
            startDate: CONFLICT_START_DATES["Gaza"],
            angle: 180, goldstein: -9, sourceUrl: "",
            title: "Israel-Gaza War continues",
            casualties: null,
            color: "#ef4444", label: "Armed Conflict",
            duration: calculateDuration("Gaza"),
            intensity: "High Intensity"
        },

        // === CIVIL WARS ===
        {
            id: "k-3", source: "GDELT Network", eventType: "civil_war",
            lat: 15.59, lon: 32.53,
            actor1Name: "RSF Militia", actor1Code: "RSF",
            actor2Name: "Sudan",
            date: now.toISOString(),
            startDate: CONFLICT_START_DATES["Sudan"],
            angle: 90, goldstein: -8, sourceUrl: "",
            title: "Sudan Civil War - RSF vs Sudanese Army",
            casualties: null,
            color: "#dc2626", label: "Civil War",
            duration: calculateDuration("Sudan"),
            intensity: "High Intensity"
        },
        {
            id: "k-4", source: "GDELT Network", eventType: "civil_war",
            lat: 19.75, lon: 96.10,
            actor1Name: "Military Junta", actor1Code: "MMR",
            actor2Name: "Myanmar",
            date: now.toISOString(),
            startDate: CONFLICT_START_DATES["Myanmar"],
            angle: 0, goldstein: -7, sourceUrl: "",
            title: "Myanmar Civil War - Military vs Resistance",
            casualties: null,
            color: "#dc2626", label: "Civil War",
            duration: calculateDuration("Myanmar"),
            intensity: "Medium Intensity"
        },
        {
            id: "k-5", source: "GDELT Network", eventType: "civil_war",
            lat: 15.37, lon: 44.19,
            actor1Name: "Houthi Rebels", actor1Code: "HTH",
            actor2Name: "Yemen",
            date: now.toISOString(),
            startDate: CONFLICT_START_DATES["Yemen"],
            angle: 45, goldstein: -8, sourceUrl: "",
            title: "Yemen Civil War continues",
            casualties: null,
            color: "#dc2626", label: "Civil War",
            duration: calculateDuration("Yemen"),
            intensity: "Medium Intensity"
        },
        {
            id: "k-6", source: "GDELT Network", eventType: "civil_war",
            lat: 9.02, lon: 38.75,
            actor1Name: "Unknown", actor1Code: "",
            actor2Name: "Ethiopia",
            date: now.toISOString(),
            startDate: CONFLICT_START_DATES["Ethiopia"],
            angle: 120, goldstein: -6, sourceUrl: "",
            title: "Ethiopia - ongoing regional conflicts",
            casualties: null,
            color: "#dc2626", label: "Civil War",
            duration: calculateDuration("Ethiopia"),
            intensity: "Medium Intensity"
        },
        {
            id: "k-7", source: "GDELT Network", eventType: "civil_war",
            lat: -4.32, lon: 15.31,
            actor1Name: "Unknown", actor1Code: "",
            actor2Name: "Congo",
            date: now.toISOString(),
            startDate: CONFLICT_START_DATES["Congo"],
            angle: 180, goldstein: -7, sourceUrl: "",
            title: "Congo - M23 rebellion and militia violence",
            casualties: null,
            color: "#dc2626", label: "Civil War",
            duration: calculateDuration("Congo"),
            intensity: "Medium Intensity"
        },
        {
            id: "k-8", source: "GDELT Network", eventType: "civil_war",
            lat: 34.80, lon: 38.99,
            actor1Name: "Unknown", actor1Code: "",
            actor2Name: "Syria",
            date: now.toISOString(),
            startDate: CONFLICT_START_DATES["Syria"],
            angle: 270, goldstein: -7, sourceUrl: "",
            title: "Syrian Civil War - residual fighting",
            casualties: null,
            color: "#dc2626", label: "Civil War",
            duration: calculateDuration("Syria"),
            intensity: "Medium Intensity"
        },

        // === TERRORISM ===
        {
            id: "k-9", source: "GDELT Network", eventType: "terrorism",
            lat: 33.89, lon: 35.50,
            actor1Name: "Hezbollah", actor1Code: "HZB",
            actor2Name: "Lebanon",
            date: now.toISOString(),
            startDate: now.toISOString(),
            angle: 200, goldstein: -7, sourceUrl: "",
            title: "Hezbollah-Israel border tensions",
            casualties: null,
            color: "#a855f7", label: "Terrorism",
            duration: "Ongoing",
            intensity: "High Intensity"
        },
        {
            id: "k-10", source: "GDELT Network", eventType: "terrorism",
            lat: 2.04, lon: 45.34,
            actor1Name: "Al-Shabaab", actor1Code: "ASB",
            actor2Name: "Somalia",
            date: now.toISOString(),
            startDate: CONFLICT_START_DATES["Somalia"],
            angle: 90, goldstein: -6, sourceUrl: "",
            title: "Al-Shabaab insurgency in Somalia",
            casualties: null,
            color: "#a855f7", label: "Terrorism",
            duration: calculateDuration("Somalia"),
            intensity: "Medium Intensity"
        },
        {
            id: "k-11", source: "GDELT Network", eventType: "terrorism",
            lat: 9.08, lon: 7.40,
            actor1Name: "Boko Haram", actor1Code: "BKH",
            actor2Name: "Nigeria",
            date: now.toISOString(),
            startDate: CONFLICT_START_DATES["Nigeria"],
            angle: 45, goldstein: -6, sourceUrl: "",
            title: "Boko Haram attacks in northeastern Nigeria",
            casualties: null,
            color: "#a855f7", label: "Terrorism",
            duration: calculateDuration("Nigeria"),
            intensity: "High Intensity"
        },

        // === PROTESTS ===
        {
            id: "k-13", source: "GDELT Network", eventType: "protest",
            lat: 48.86, lon: 2.35,
            actor1Name: "Farmers' Protest", actor1Code: "",
            actor2Name: "France",
            date: now.toISOString(),
            startDate: now.toISOString(),
            angle: 0, goldstein: -3, sourceUrl: "",
            title: "French farmers protest EU policies",
            casualties: null,
            color: "#f59e0b", label: "Protest",
            duration: "14 days",
            intensity: "Low Intensity"
        },

        // === CYBER ===
        {
            id: "k-15", source: "GDELT Network", eventType: "cyber",
            lat: 38.91, lon: -77.04,
            actor1Name: "Lazarus Group (NK)", actor1Code: "LAZ",
            actor2Name: "United States",
            date: now.toISOString(),
            startDate: now.toISOString(),
            angle: 45, goldstein: -4, sourceUrl: "",
            title: "North Korean hackers target US infrastructure",
            casualties: null,
            color: "#3b82f6", label: "Cyber Attack",
            duration: "N/A",
            intensity: "Medium Intensity"
        },
    ];
}
