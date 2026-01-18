import axios from "axios";

export interface ConflictEvent {
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

export async function fetchConflictData(): Promise<ConflictEvent[]> {
    try {
        const response = await axios.get("/api/conflicts");
        return response.data;
    } catch (error) {
        console.error("Error fetching conflict data:", error);
        return [];
    }
}
