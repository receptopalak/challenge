import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import type { PlaneInfo } from '../types';
import { sendCommand, getCommandsForPlane, searchLocation } from '../services/api';
import type { CommandPayload, LocationSearchResult } from '../services/api';
import { debounce } from 'lodash';
import { fromLonLat } from 'ol/proj';
import { Map } from 'ol';
import { useAuth } from '../contexts/AuthContext'; // useAuth hook'unu import et
import { usePlaneSocket } from '../hooks/usePlaneSocket'; // WebSocket hook'unu import et

interface VehicleDetailPanelProps {
    planeDetails: PlaneInfo;
    onClose: () => void;
    onToggleMapSelect: (active: boolean) => void;
    onSetCoords: (coords: [number, number] | null) => void;
    selectedCoords?: [number, number] | null;
    mapRef: Map | null;
}

interface Command {
    id: number;
    plane_id: number;
    pilot_id: number;
    message: string;
    target_location: {
        lat: number;
        lon: number;
    };
    status: 'pending' | 'accepted' | 'rejected';
    created_at: string;
    timestamp?: string; // Backward compatibility
}

const VehicleDetailPanel: React.FC<VehicleDetailPanelProps> = ({
    planeDetails, onClose, onToggleMapSelect, onSetCoords, selectedCoords, mapRef
}) => {
    const { user } = useAuth(); // Get user information
    const { sendJsonMessage } = usePlaneSocket(); // Get WebSocket sending function
    const [lat, setLat] = useState('');
    const [lon, setLon] = useState('');
    const [message, setMessage] = useState('');
    const [commandHistory, setCommandHistory] = useState<Command[]>([]);
    const [inputMode, setInputMode] = useState<'none' | 'manual' | 'map' | 'search'>('none');

    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const debouncedSetMapMarker = useCallback(
        debounce((latitude: string, longitude: string) => {
            const numLat = parseFloat(latitude);
            const numLon = parseFloat(longitude);
            if (!isNaN(numLat) && !isNaN(numLon)) {
                onSetCoords([numLon, numLat]);
            }
        }, 500),
        [onSetCoords]
    );

    useEffect(() => {
        debouncedSetMapMarker(lat, lon);
        return () => debouncedSetMapMarker.cancel();
    }, [lat, lon, debouncedSetMapMarker]);

    useEffect(() => {
        if (selectedCoords) {
            setLat(selectedCoords[1].toFixed(6));
            setLon(selectedCoords[0].toFixed(6));
            setInputMode('manual');
            onToggleMapSelect(false);
        } else {
            setLat('');
            setLon('');
        }
    }, [selectedCoords, onToggleMapSelect]);

    const debouncedSearch = useCallback(
        debounce(async (query: string) => {
            if (!query) {
                setSearchResults([]);
                return;
            }
            setIsSearching(true);
            try {
                const results = await searchLocation(query);
                setSearchResults(results);
            } catch (error) {
                console.error("Error during search:", error);
                toast.error("Location not found or a problem occurred with the search service.");
            } finally {
                setIsSearching(false);
            }
        }, 500),
        []
    );

    useEffect(() => {
        debouncedSearch(searchTerm);
        return () => {
            debouncedSearch.cancel();
        };
    }, [searchTerm, debouncedSearch]);


    useEffect(() => {
        const fetchCommands = async () => {
            if (!planeDetails) return;
            try {
                const response = await getCommandsForPlane(planeDetails.id);
                setCommandHistory(response.data);
            } catch (err) {
                console.error("Failed to fetch command history:", err);
            }
        };

        fetchCommands();
    }, [planeDetails]);

    const handleClearCoords = () => {
        onSetCoords(null);
    };

    const handleFlyTo = () => {
        if (!selectedCoords || !mapRef) return;
        mapRef.getView().animate({
            center: fromLonLat(selectedCoords),
            zoom: 14,
            duration: 1500 // 1.5 second animation
        });
    };

    const handleModeButtonClick = (mode: 'manual' | 'map' | 'search') => {
        setInputMode(mode);
        handleClearCoords();
        if (mode === 'map') {
            onToggleMapSelect(true);
        } else {
            onToggleMapSelect(false);
        }
    };

    const handleSelectSearchResult = (location: LocationSearchResult) => {
        setLat(location.lat);
        setLon(location.lon);
        setInputMode('manual');
        setSearchResults([]);
        setSearchTerm('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!lat || !lon || !message) {
            toast.error('All fields are required.');
            return;
        }

        const payload: CommandPayload = {
            plane: planeDetails.id,
            message,
            target_location: {
                type: "Point",
                coordinates: [parseFloat(lon), parseFloat(lat)],
            },
        };

        try {
            console.log("Sending command via API...", payload);
            const response = await sendCommand(payload);
            const newCommand = response.data; // New command data returned from API
            console.log("API response received, new command:", newCommand);


            toast.success('Command sent successfully!');

            // Send notification via WebSocket
            if (sendJsonMessage) {
                const wsPayload = {
                    type: 'command_notification',
                    command: newCommand,
                };
                console.log("Sending command via WebSocket...", wsPayload);
                sendJsonMessage(wsPayload);
            } else {
                console.error("sendJsonMessage function is not available.");
            }

            const commandsResponse = await getCommandsForPlane(planeDetails.id);
            setCommandHistory(commandsResponse.data);
            handleClearCoords();
            setMessage('');
            setInputMode('none');
        } catch (err) {
            console.error('Command could not be sent:', err);
            toast.error('An error occurred while sending the command.');
        }
    };

    // --- STYLES (Redesigned) ---
    const panelStyle: React.CSSProperties = {
        position: 'absolute', top: 0, left: 0, // Changed from right: 0 to left: 0
        width: '400px', height: '100%',
        backgroundColor: 'rgba(20, 20, 22, 0.9)',
        backdropFilter: 'blur(12px)',
        boxShadow: '8px 0 25px rgba(0,0,0,0.35)', // Shadow direction changed
        zIndex: 1000, display: 'flex', flexDirection: 'column',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        color: '#EAEAEB',
        transition: 'transform 0.3s ease-in-out',
    };
    const headerStyle: React.CSSProperties = {
        padding: '24px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        flexShrink: 0,
        position: 'relative',
    };
    const planeNameStyle: React.CSSProperties = {
        margin: 0, fontSize: '24px', fontWeight: '700', color: '#FFFFFF',
    };
    const planeSubheadingStyle: React.CSSProperties = {
        margin: '4px 0 0 0', fontSize: '15px', fontWeight: '400', color: '#A0A0A5',
    };
    const closeButtonStyle: React.CSSProperties = {
        position: 'absolute',
        top: '20px',
        right: '24px',
        border: 'none',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '10%',
        width: '32px',
        height: '32px',
        fontSize: '10px',
        lineHeight: '5px',
        textAlign: 'center',
        cursor: 'pointer',
        color: '#EAEAEB',
        transition: 'background-color 0.2s, color 0.2s',
    };

    const headerContentStyle: React.CSSProperties = {
        paddingTop: '40px',
    };

    const contentStyle: React.CSSProperties = {
        padding: '24px', flexGrow: 1, overflowY: 'auto',
    };
    const sectionStyle: React.CSSProperties = {
        marginBottom: '32px',
    };
    const sectionTitleStyle: React.CSSProperties = {
        fontSize: '14px', fontWeight: '600', color: '#A0A0A5',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginTop: 0, marginBottom: '12px',
    };
    const detailGridStyle: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '8px',
    };
    const detailCardStyle: React.CSSProperties = {
        background: 'rgba(255, 255, 255, 0.05)',
        padding: '10px',
        borderRadius: '8px',
    };
    const detailCardLabelStyle: React.CSSProperties = {
        fontSize: '12px',
        color: '#A0A0A5',
        marginBottom: '2px',
    };
    const detailCardValueStyle: React.CSSProperties = {
        fontSize: '15px',
        fontWeight: '600',
        color: '#FFFFFF',
    };
    const formStyle: React.CSSProperties = {
        display: 'flex', flexDirection: 'column', gap: '16px',
    };
    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '12px', boxSizing: 'border-box',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px', color: '#FFF', fontSize: '15px',
        transition: 'border-color 0.2s, box-shadow 0.2s',
    };
    const submitButtonStyle: React.CSSProperties = {
        width: '100%', padding: '14px', border: 'none',
        borderRadius: '8px', backgroundColor: '#0A84FF',
        color: 'white', cursor: 'pointer', fontSize: '16px', fontWeight: '600',
        transition: 'background-color 0.2s',
    };
    const historyListStyle: React.CSSProperties = {
        listStyle: 'none', padding: 0, margin: 0,
        display: 'flex', flexDirection: 'column', gap: '12px',
    };
    const historyItemStyle: React.CSSProperties = {
        background: 'rgba(255, 255, 255, 0.05)',
        padding: '16px',
        borderRadius: '8px',
        borderLeft: '3px solid #0A84FF',
    };
    const historyMessageStyle: React.CSSProperties = {
        margin: 0, fontWeight: '500', fontSize: '15px', color: '#FFFFFF', marginBottom: '8px',
    };
    const historyMetaStyle: React.CSSProperties = {
        margin: '4px 0 0 0', fontSize: '13px', color: '#A0A0A5', display: 'block',
    };
    const segmentedControlStyle: React.CSSProperties = {
        display: 'flex',
        gap: '8px',
        background: 'rgba(255, 255, 255, 0.05)',
        padding: '4px',
        borderRadius: '10px',
    }
    const modeButtonStyle: React.CSSProperties = {
        flex: 1, padding: '8px',
        border: 'none',
        borderRadius: '8px',
        backgroundColor: 'transparent',
        color: '#A0A0A5', cursor: 'pointer', fontSize: '14px',
        fontWeight: '500',
        transition: 'background-color 0.2s, color 0.2s',
    };
    const activeModeButtonStyle: React.CSSProperties = {
        ...modeButtonStyle,
        backgroundColor: '#0A84FF',
        color: '#FFFFFF',
    };
    const searchResultContainerStyle: React.CSSProperties = {
        maxHeight: '150px',
        overflowY: 'auto',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
    };
    const searchResultItemStyle: React.CSSProperties = {
        padding: '12px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        cursor: 'pointer',
        fontSize: '14px',
        transition: 'background-color 0.2s'
    };
    const utilityButtonContainerStyle: React.CSSProperties = {
        display: 'flex',
        gap: '8px',
    };
    const utilityButtonStyle: React.CSSProperties = {
        ...modeButtonStyle,
        background: 'rgba(255, 255, 255, 0.1)',
        color: '#EAEAEB',
    };
    const imageContainerStyle: React.CSSProperties = {
        marginBottom: '24px',
        padding: '0 24px',
    };
    const imageStyle: React.CSSProperties = {
        width: '100%',
        height: '150px',
        objectFit: 'contain',
        borderRadius: '12px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
    };
    const detailRowStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 0',
        borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
    };
    const detailRowLabelStyle: React.CSSProperties = {
        color: '#A0A0A5',
        fontSize: '14px',
    };
    const detailRowValueStyle: React.CSSProperties = {
        color: '#FFFFFF',
        fontSize: '14px',
        fontWeight: '500',
    };
    const statusBadgeStyle: React.CSSProperties = {
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        backgroundColor: planeDetails.status === 'On Mission' ? '#224f34' : '#1e293b',
        color: planeDetails.status === 'On Mission' ? '#4ade80' : '#94a3b8',
    };

    return (
        <div style={panelStyle}>
            <div style={headerStyle}>
                <button
                    onClick={onClose}
                    style={closeButtonStyle}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                >
                    &times;
                </button>
                <div style={headerContentStyle}>
                    <h1 style={planeNameStyle}>{planeDetails.model}</h1>
                            <p style={planeSubheadingStyle}>Tail Number: {planeDetails.tailNumber}</p>
                </div>
            </div>
            <div style={imageContainerStyle}>
                <img
                    src={planeDetails?.imageUrl || '/tb2.png'}
                    alt={`${planeDetails.model} - ${planeDetails.tailNumber}`}
                    style={imageStyle}
                />
            </div>
            <div style={contentStyle}>
                <div style={sectionStyle}>
                    <h3 style={sectionTitleStyle}>Flight Information</h3>
                    <div style={detailRowStyle}>
                        <span style={detailRowLabelStyle}>Status</span>
                        <span style={statusBadgeStyle}>{planeDetails.status}</span>
                    </div>
                    <div style={detailRowStyle}>
                            <span style={detailRowLabelStyle}>Altitude</span>
                        <span style={detailRowValueStyle}>{planeDetails.altitude.toFixed(0)} ft</span>
                    </div>
                    <div style={detailRowStyle}>
                        <span style={detailRowLabelStyle}>Speed</span>
                        <span style={detailRowValueStyle}>{planeDetails.speed_kmh} km/h</span>
                    </div>
                </div>

                <div style={sectionStyle}>
                    <h3 style={sectionTitleStyle}>Pilot Information</h3>
                    <div style={detailRowStyle}>
                        <span style={detailRowLabelStyle}>Name</span>
                        <span style={detailRowValueStyle}>{planeDetails.pilot?.fullName}</span>
                    </div>
                    <div style={detailRowStyle}>
                        <span style={detailRowLabelStyle}>Call Sign</span>
                        <span style={detailRowValueStyle}>{planeDetails.pilot?.callSign}</span>
                    </div>
                </div>

                {/* === Command Sending Section (Admins Only) === */}
                {user?.is_staff && (
                    <div style={sectionStyle}>
                        <h4 style={sectionTitleStyle}>Send New Command</h4>
                        <form onSubmit={handleSubmit} style={formStyle}>
                            <div style={segmentedControlStyle}>
                                <button type="button" onClick={() => handleModeButtonClick('map')} style={inputMode === 'map' ? activeModeButtonStyle : modeButtonStyle}>Map</button>
                                <button type="button" onClick={() => handleModeButtonClick('search')} style={inputMode === 'search' ? activeModeButtonStyle : modeButtonStyle}>Search</button>
                                <button type="button" onClick={() => handleModeButtonClick('manual')} style={inputMode === 'manual' ? activeModeButtonStyle : modeButtonStyle}>Manual</button>
                            </div>

                            {inputMode === 'map' && <p style={{ color: '#999', textAlign: 'center', margin: '10px 0' }}>Please select a point from the map...</p>}

                            {inputMode === 'search' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <input type="text" placeholder="Search location..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={inputStyle} />
                                    {isSearching && <p style={{ color: '#999', margin: 0, textAlign: 'center' }}>Searching...</p>}
                                    {searchResults.length > 0 && (
                                        <div style={searchResultContainerStyle}>
                                            {searchResults.map(result => (
                                                <div key={result.place_id} onClick={() => handleSelectSearchResult(result)} style={searchResultItemStyle}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                                    {result.display_name}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {inputMode === 'manual' && (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                        <input type="number" step="any" placeholder="Target Latitude" value={lat} onChange={e => setLat(e.target.value)} style={inputStyle} />
                                    <input type="number" step="any" placeholder="Target Longitude" value={lon} onChange={e => setLon(e.target.value)} style={inputStyle} />
                                </div>
                            )}
                            {(lat || lon) && inputMode === 'manual' && (
                                <div style={utilityButtonContainerStyle}>
                                    <button type="button" onClick={handleClearCoords} style={utilityButtonStyle}>Clear</button>
                                    <button type="button" onClick={handleFlyTo} style={utilityButtonStyle}>Go to Location</button>
                                </div>
                            )}

                            <textarea placeholder="Your message..." value={message} onChange={e => setMessage(e.target.value)} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
                            <button type="submit" style={submitButtonStyle}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0070E0'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0A84FF'}>
                                SEND
                            </button>
                        </form>
                    </div>
                )}

                {/* Command History */}
                <div style={sectionStyle}>
                    <h4 style={sectionTitleStyle}>Command History</h4>
                    {commandHistory.length > 0 ? (
                        <ul style={historyListStyle}>
                            {commandHistory.map(cmd => (
                                <li key={cmd.id} style={historyItemStyle}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                        <p style={historyMessageStyle}>{cmd.message}</p>
                                        <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '12px',
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            textTransform: 'uppercase',
                                            backgroundColor: cmd.status === 'accepted' ? '#10B981' : cmd.status === 'rejected' ? '#EF4444' : '#6B7280',
                                            color: 'white'
                                        }}>
                                            {cmd.status === 'accepted' ? 'Accepted' : cmd.status === 'rejected' ? 'Rejected' : 'Pending'}
                                        </span>
                                    </div>
                                    <small style={historyMetaStyle}>Target: {cmd.target_location?.lat?.toFixed(4)}, {cmd.target_location?.lon?.toFixed(4)}</small>
                                    <small style={historyMetaStyle}>Time: {new Date(cmd.created_at).toLocaleString()}</small>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p style={{ color: '#999', fontSize: '14px', textAlign: 'center' }}>No command history found for this aircraft.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VehicleDetailPanel; 