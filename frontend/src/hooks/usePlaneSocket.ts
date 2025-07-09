import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export type LocationPayload = {
    id: number;
    coordinates: [number, number]; // [lon, lat]
    bearing: number;
};

export type CommandPayload = {
    id: number;
    plane: number;
    // ... other command fields
    status: 'pending' | 'accepted' | 'rejected';
};

const WEBSOCKET_URL = 'ws://localhost:8000/ws/fleet/';

export const usePlaneSocket = () => {
    const { tokens } = useAuth();
    const socketRef = useRef<WebSocket | null>(null);
    const [planeLocations, setPlaneLocations] = useState<LocationPayload[]>([]);
    const [updatedCommand, setUpdatedCommand] = useState<CommandPayload | null>(null);

    const connect = useCallback(() => {
        const token = tokens?.access;
        if (!token || (socketRef.current && socketRef.current.readyState === WebSocket.OPEN)) {
            return;
        }

        const socket = new WebSocket(`${WEBSOCKET_URL}?token=${token}`);
        socketRef.current = socket;

        socket.onopen = () => console.log('Fleet WebSocket connected');
        socket.onclose = () => {
            console.log('Fleet WebSocket disconnected. Reconnecting...');
            setTimeout(connect, 5000);
        };
        socket.onerror = (error) => console.error('WebSocket Error:', error);

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'plane_locations') {
                setPlaneLocations(data.data || []);
            } else if (data.type === 'command_update') {
                setUpdatedCommand(data.data);
            }
        };
    }, [tokens]);

    useEffect(() => {
        connect();
        return () => {
            if (socketRef.current) {
                socketRef.current.onclose = null; // Prevent reconnect on component unmount
                socketRef.current.close();
            }
        };
    }, [connect]);

    const sendJsonMessage = useCallback((message: object) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify(message));
        } else {
            console.error('WebSocket is not connected.');
        }
    }, []);

    return { planeLocations, updatedCommand, sendJsonMessage };
};