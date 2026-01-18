import axios from "axios";

export interface ConflictEvent {
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

export async function fetchConflictData(): Promise<ConflictEvent[]> {
    try {
        const response = await axios.get("/api/conflicts");
        return response.data;
    } catch (error) {
        console.error("Error fetching conflict data:", error);
        return [];
    }
}
