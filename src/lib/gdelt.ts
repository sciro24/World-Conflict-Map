import axios from "axios";

const GDELT_API_URL = "https://api.gdeltproject.org/api/v2/events/index.php";

export interface ConflictEvent {
    id: string;
    source: string;
    lat: number;
    lon: number;
    actor1Lat: number;
    actor1Lon: number;
    actor1Code: string; // Country Code
    actor1Name: string;
    actor2Lat: number;
    actor2Lon: number;
    actor2Name: string;
    goldstein: number; // Conflict intensity/type (-10 to 10)
    sourceUrl: string;
    date: string;
    angle: number; // Angle of attack
}

// Helper to calculate angle between two points
function calculateAngle(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;

    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    const rads = Math.atan2(y, x);
    return (rads * 180 / Math.PI + 360) % 360;
}

export async function fetchConflictData(): Promise<ConflictEvent[]> {
    try {
        const response = await axios.get("/api/conflicts");
        return response.data;
    } catch (error) {
        console.error("Error fetching conflict data:", error);
        return [];
    }
}
