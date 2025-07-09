import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Command } from '../types'; // Will be added

// Match the web app's location data structure
interface LocationData {
    id: number;
    coordinates: [number, number]; // [longitude, latitude]
    bearing: number;
}

// Same WebSocket URL as the web app
// Ensure the path is correct based on your Django Channels setup
const WS_URL = 'ws://192.168.1.28:8000/ws/fleet/';

export const useFleetSocket = () => {
    const { token } = useAuth();
    const [planeLocations, setPlaneLocations] = useState<LocationData[]>([]);
    const [incomingCommand, setIncomingCommand] = useState<Command | null>(null);
    const socketRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!token) {
            // No token, don't connect
            return;
        }

        const connect = () => {
            // Append token for authentication if your backend expects it
            const socket = new WebSocket(`${WS_URL}?token=${token}`);
            socketRef.current = socket;

            socket.onopen = () => {
                console.log('Fleet WebSocket connected');
            };

            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                
                if (data.type === 'plane_locations') {
                    // console.log('[useFleetSocket] Received locations for', data.data.length, 'planes');
                    // console.log('[useFleetSocket] Sample location data:', JSON.stringify(data.data[0], null, 2));
                    setPlaneLocations(data.data);
                } else if (data.type === 'command_notification') {
                    console.log('[useFleetSocket] Received new command:', JSON.stringify(data.command, null, 2));
                    setIncomingCommand(data.command);
                }
            };

            socket.onerror = (error) => {
                console.error('WebSocket Error:', error);
            };

            socket.onclose = () => {
                console.log('Fleet WebSocket disconnected. Reconnecting...');
                // Simple reconnect logic
                setTimeout(connect, 5000);
            };
        };

        connect();

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, [token]);

    return { planeLocations, incomingCommand, setIncomingCommand };
}; 