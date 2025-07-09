export interface PlaneInfo {
    id: number;
    model: string;
    tailNumber: string;
    altitude: number;
    speed_kmh: number;
    status: string;
    pilot: {
        fullName: string;
        callSign: string;
    };
    imageUrl?: string;
} 