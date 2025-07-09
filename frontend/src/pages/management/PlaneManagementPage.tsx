import React, { useState, useEffect } from 'react';
import { 
    getManagementPlanes, 
    getPilots, 
    assignPilotToPlane, 
    unassignPilotFromPlane,
    deletePlane, // Import the new function
    type ManagementPlane, 
    type Pilot 
} from '../../services/api';
import { toast } from 'react-hot-toast';

const PilotAssignModal: React.FC<{
    pilots: Pilot[];
    currentPilotId: number | undefined;
    onClose: () => void;
    onAssign: (pilotId: number) => void;
}> = ({ pilots, currentPilotId, onClose, onAssign }) => {
    // Ensure current pilot is selected when modal opens
    const [selectedPilot, setSelectedPilot] = useState<string>(currentPilotId?.toString() || '');

    const handleAssign = () => {
        if (selectedPilot) {
            onAssign(parseInt(selectedPilot, 10));
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1050 }}>
            <div style={{ background: 'white', padding: '24px', borderRadius: '8px', width: '400px' }}>
                <h2 style={{ marginTop: 0 }}>Select Pilot</h2>
                <select 
                    value={selectedPilot} 
                    onChange={e => setSelectedPilot(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', marginBottom: '20px' }}
                >
                    <option value="">-- Select Pilot --</option>
                    {pilots.map(p => (
                        <option key={p.id} value={p.id}>{p.fullName} ({p.callSign})</option>
                    ))}
                </select>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: '6px' }}>Cancel</button>
                    <button onClick={handleAssign} disabled={!selectedPilot} style={{ padding: '8px 16px', borderRadius: '6px', background: '#3b82f6', color: 'white', border: 'none' }}>Assign</button>
                </div>
            </div>
        </div>
    );
};


const PlaneManagementPage: React.FC = () => {
    const [planes, setPlanes] = useState<ManagementPlane[]>([]);
    const [availablePilots, setAvailablePilots] = useState<Pilot[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPlane, setSelectedPlane] = useState<ManagementPlane | null>(null);

    const fetchPlanes = async () => {
        setIsLoading(true);
        try {
            const planesRes = await getManagementPlanes();
            setPlanes(planesRes.data);
        } catch (error) {
                            toast.error("An error occurred while fetching aircraft data.");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPlanes();
    }, []);
    
    const handleOpenModal = async (plane: ManagementPlane) => {
        try {
            // Fetch only assignable pilots and current pilot
            const pilotsRes = await getPilots(plane.id);
            setAvailablePilots(pilotsRes.data);
            setSelectedPlane(plane);
            setIsModalOpen(true);
        } catch (error) {
            toast.error("Could not fetch assignable pilots.");
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedPlane(null);
        setAvailablePilots([]);
    }

    const handleAssignPilot = async (pilotId: number) => {
        if (!selectedPlane) return;
        
        try {
            await assignPilotToPlane(selectedPlane.id, pilotId);
            toast.success('Pilot successfully assigned.');
                            fetchPlanes(); // Refresh the table by fetching data again
        } catch (error) {
                            toast.error('An error occurred while assigning the pilot.');
        } finally {
            handleCloseModal();
        }
    };

    const handleUnassignPilot = async (plane: ManagementPlane) => {
        if (window.confirm(`Are you sure you want to remove the pilot from aircraft with tail number '${plane.tail_number}'?`)) {
            try {
                await unassignPilotFromPlane(plane.id);
                toast.success('Pilot assignment successfully removed.');
                fetchPlanes();
            } catch (error) {
                toast.error('An error occurred while removing the pilot assignment.');
            }
        }
    };

    const handleDeletePlane = async (plane: ManagementPlane) => {
                    if (window.confirm(`Are you sure you want to PERMANENTLY delete the aircraft with tail number '${plane.tail_number}'? This action cannot be undone.`)) {
            try {
                await deletePlane(plane.id);
                toast.success('Aircraft successfully deleted.');
                fetchPlanes();
            } catch (error) {
                toast.error('An error occurred while deleting the aircraft.');
            }
        }
    };

    const pageHeaderStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
    };

    const titleStyle: React.CSSProperties = {
        fontSize: '24px',
        fontWeight: '700',
        color: '#1e293b',
    };

    const tableContainerStyle: React.CSSProperties = {
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
        overflow: 'hidden',
    };

    const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' };
    const thStyle: React.CSSProperties = { padding: '12px 16px', textAlign: 'left', backgroundColor: '#f8fafc', color: '#64748b', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' };
    const tdStyle: React.CSSProperties = { padding: '12px 16px', borderBottom: '1px solid #f1f5f9', color: '#334155', fontSize: '14px' };
    const actionButtonStyle: React.CSSProperties = { padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', backgroundColor: '#3b82f6', color: 'white', marginRight: '8px' };
    const unassignButtonStyle: React.CSSProperties = { ...actionButtonStyle, backgroundColor: '#f43f5e' };
    const deleteButtonStyle: React.CSSProperties = { ...actionButtonStyle, backgroundColor: '#b91c1c', marginRight: 0 };
    const noPilotStyle: React.CSSProperties = { color: '#94a3b8', fontStyle: 'italic' };
    
    if (isLoading) return <div>Loading...</div>;

    return (
        <div>
            <div style={pageHeaderStyle}>
                <h1 style={titleStyle}>Fleet Management</h1>
            </div>

            <div style={tableContainerStyle}>
                <table style={tableStyle}>
                    <thead>
                        <tr>
                            <th style={thStyle}>ID</th>
                            <th style={thStyle}>Kuyruk No</th>
                            <th style={thStyle}>Model</th>
                            <th style={thStyle}>Status</th>
                            <th style={thStyle}>Current Pilot</th>
                            <th style={thStyle}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {planes.map(plane => (
                            <tr key={plane.id}>
                                <td style={tdStyle}>{plane.id}</td>
                                <td style={tdStyle}>{plane.tail_number}</td>
                                <td style={tdStyle}>{plane.model}</td>
                                <td style={tdStyle}>{plane.status}</td>
                                <td style={tdStyle}>
                                    {plane.pilot ? `${plane.pilot.fullName} (${plane.pilot.callSign})` : <span style={noPilotStyle}>Unassigned</span>}
                                </td>
                                <td style={tdStyle}>
                                    <button style={actionButtonStyle} onClick={() => handleOpenModal(plane)}>
                                        Change Pilot
                                    </button>
                                    {plane.pilot && (
                                        <button style={unassignButtonStyle} onClick={() => handleUnassignPilot(plane)}>
                                            Remove Assignment
                                        </button>
                                    )}
                                    <button style={deleteButtonStyle} onClick={() => handleDeletePlane(plane)}>
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && selectedPlane && (
                <PilotAssignModal 
                    pilots={availablePilots}
                    currentPilotId={selectedPlane.pilot?.id}
                    onClose={handleCloseModal}
                    onAssign={handleAssignPilot}
                />
            )}
        </div>
    );
};

export default PlaneManagementPage; 