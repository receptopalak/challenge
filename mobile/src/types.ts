export interface User {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
  is_superuser: boolean;
}

export interface Pilot {
  id: number;
  fullName: string; // This will be used instead of `first_name` and `last_name`
  callSign: string;
}

export interface Plane {
    id: number;
    model: string;
    tailNumber: string;
    status: string;
    pilot: Pilot | null;
    coordinates: {
        latitude: number;
        longitude: number;
    };
    bearing?: number; // Added for plane rotation
    speed_kmh: number;
    altitude: number;
}

export interface Command {
    id: number;
    plane: number;
    pilot: number;
    status: 'pending' | 'accepted' | 'rejected' | 'completed';
    message: string;
    target_location: {
        type: 'Point';
        coordinates: [number, number]; // [longitude, latitude]
    };
    created_at: string;
}

export type RootStackParamList = {
  Login: undefined;
  Map: undefined;
}; 