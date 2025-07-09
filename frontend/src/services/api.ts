import axios from 'axios';

// NEW BASE URL: Django backend address
export const apiClient = axios.create({
  baseURL: '/api', // Vite proxy will forward this to the backend container
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAuthHeader = (token: string) => {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export const clearAuthHeader = () => {
    delete apiClient.defaults.headers.common['Authorization'];
};

// We remove interceptor because we will move this logic to AuthContext.

export interface LocationSearchResult {
    place_id: number;
    lat: string;
    lon: string;
    display_name: string;
}

/**
 * Performs location search through OpenStreetMap Nominatim service.
      * @param query Location name to search for
 */
export const searchLocation = async (query: string): Promise<LocationSearchResult[]> => {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
            q: query,
            format: 'json',
            addressdetails: 1,
        }
    });
    return response.data;
};

// These functions will now make requests to the real backend
export const getPlanes = () => {
  return apiClient.get('/fleet/planes/');
};

export interface CommandPayload {
    plane: number;
    message: string;
    target_location: {
        type: "Point";
        coordinates: [number, number];
    };
}

export const sendCommand = (commandData: CommandPayload) => {
  // Note: In real backend, this operation will require authorization (token).
  // We may need to temporarily loosen permissions for now.
  return apiClient.post('/fleet/commands/', commandData);
};

export const getCommands = () => {
  return apiClient.get('/fleet/commands/');
};

export const getCommandsForPlane = (planeId: number) => {
  return apiClient.get(`/fleet/commands/?plane_id=${planeId}`);
};

// --- Fleet Management API ---

export interface ManagementPlane {
    id: number;
    model: string;
    tail_number: string;
    status: string;
    pilot: Pilot | null; // Fix type definition as Pilot interface
}

export interface Pilot {
    id: number;
    fullName: string;
    callSign: string;
}

export const getManagementPlanes = () => {
    return apiClient.get<ManagementPlane[]>('/fleet/planes/management-list/');
};

export const getPilots = (for_plane_id?: number) => {
    // Adding parameter to get only assignable pilots
    const params = for_plane_id ? { for_plane_id } : {};
    return apiClient.get<Pilot[]>('/fleet/pilots/', { params });
};

export const assignPilotToPlane = (planeId: number, pilotId: number) => {
    return apiClient.patch(`/fleet/planes/${planeId}/`, { pilot_id: pilotId });
};

export const unassignPilotFromPlane = (planeId: number) => {
    // We send pilot_id as null to unassign the pilot
    return apiClient.patch(`/fleet/planes/${planeId}/`, { pilot_id: null });
};

export const deletePlane = (planeId: number) => {
    return apiClient.delete(`/fleet/planes/${planeId}/`);
};


// --- User Management API ---

// These interfaces should be compatible with UserAdminSerializer in backend
export interface AdminUser {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    is_staff: boolean;
    is_active: boolean;
    date_joined: string;
}

export interface UserPayload {
    username: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    is_staff?: boolean;
    is_active?: boolean;
    password?: string; // Only used when creating
}


export const getUsers = () => {
    return apiClient.get<AdminUser[]>('/fleet/users/');
};

export const createUser = (userData: UserPayload) => {
    return apiClient.post('/fleet/users/', userData);
};

export const updateUser = (userId: number, userData: Partial<UserPayload>) => {
    return apiClient.patch(`/fleet/users/${userId}/`, userData);
};

export const deleteUser = (userId: number) => {
    return apiClient.delete(`/fleet/users/${userId}/`);
};

export const resetPassword = (userId: number, new_password: string) => {
    return apiClient.post(`/fleet/users/${userId}/set-password/`, { new_password });
};