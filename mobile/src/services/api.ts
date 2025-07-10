import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_URL,
});

export const setAuthToken = (token: string | null) => {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common['Authorization'];
    }
};

// Login logic is now handled in AuthContext, so the login function here is removed.

export const getPlanes = () => {
    return api.get('/fleet/planes/');
};

export const getMyCommands = () => {
    return api.get('/fleet/commands/my-commands/');
};

export const updateCommandStatus = (commandId: number, status: 'accepted' | 'rejected' | 'completed') => {
    return api.post(`/fleet/commands/${commandId}/${status}/`);
}; 