import React from 'react';

// We will use the Command type that we will define in HistoryPage here as well
interface Command {
    id: number;
    plane_id: number;
    pilot_id: number;
    message: string;
    target_location: { lat: number; lon: number };
    status: 'pending' | 'accepted' | 'rejected';
    created_at: string;
}

interface Props {
    command: Command | null;
    onClose: () => void;
}

const getStatusBadge = (status: Command['status']) => {
    const baseStyle: React.CSSProperties = {
        padding: '6px 12px',
        borderRadius: '16px',
        fontSize: '12px',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        border: 'none',
        color: 'white',
        display: 'inline-block'
    };

    switch (status) {
        case 'accepted':
            return <span style={{...baseStyle, backgroundColor: '#22c55e'}}>Accepted</span>;
        case 'rejected':
            return <span style={{...baseStyle, backgroundColor: '#ef4444'}}>Rejected</span>;
        default:
            return <span style={{...baseStyle, backgroundColor: '#64748b'}}>Pending</span>;
    }
};

const CommandDetailModal: React.FC<Props> = ({ command, onClose }) => {
    if (!command) return null;

    const detailRowStyle: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: '140px 1fr',
        marginBottom: '16px',
        alignItems: 'center'
    };

    const labelStyle: React.CSSProperties = {
        fontWeight: '600',
        color: '#64748b',
        fontSize: '14px'
    };

    const valueStyle: React.CSSProperties = {
        color: '#1e293b',
        fontSize: '14px',
        fontWeight: '500'
    };

    return (
        <div style={styles.backdrop} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <div style={styles.header}>
                    <h3 style={styles.title}>Command Details</h3>
                    <span style={styles.commandId}>#{command.id}</span>
                </div>
                
                <div style={styles.content}>
                    <div style={detailRowStyle}>
                        <span style={labelStyle}>Status:</span>
                        <div>{getStatusBadge(command.status)}</div>
                    </div>
                    <div style={detailRowStyle}>
                        <span style={labelStyle}>Aircraft ID:</span>
                        <span style={valueStyle}>{command.plane_id}</span>
                    </div>
                    <div style={detailRowStyle}>
                        <span style={labelStyle}>Pilot ID:</span>
                        <span style={valueStyle}>{command.pilot_id}</span>
                    </div>
                    <div style={detailRowStyle}>
                        <span style={labelStyle}>Mission Message:</span>
                        <span style={valueStyle}>{command.message}</span>
                    </div>
                    <div style={detailRowStyle}>
                        <span style={labelStyle}>Target Location:</span>
                        <span style={valueStyle}>
                            {command.target_location?.lat?.toFixed(6)}, {command.target_location?.lon?.toFixed(6)}
                        </span>
                    </div>
                    <div style={detailRowStyle}>
                        <span style={labelStyle}>Created:</span>
                        <span style={valueStyle}>
                            {new Date(command.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </span>
                    </div>
                </div>
                
                <div style={styles.buttonGroup}>
                    <button onClick={onClose} style={styles.button}>Close</button>
                </div>
            </div>
        </div>
    );
};

// Stiller
const styles: { [key: string]: React.CSSProperties } = {
    backdrop: { 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        backgroundColor: 'rgba(15, 23, 42, 0.75)', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        zIndex: 2000,
        backdropFilter: 'blur(4px)'
    },
    modal: { 
        backgroundColor: 'white', 
        borderRadius: '12px', 
        width: '500px',
        maxWidth: '90vw',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        overflow: 'hidden'
    },
    header: { 
        backgroundColor: '#f8fafc',
        padding: '24px 28px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    title: {
        margin: 0,
        fontSize: '20px',
        fontWeight: '700',
        color: '#1e293b'
    },
    commandId: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#3b82f6',
        backgroundColor: '#eff6ff',
        padding: '4px 8px',
        borderRadius: '6px'
    },
    content: {
        padding: '24px 28px'
    },
    buttonGroup: { 
        padding: '20px 28px',
        borderTop: '1px solid #e2e8f0',
        backgroundColor: '#f8fafc',
        display: 'flex', 
        justifyContent: 'flex-end'
    },
    button: { 
        padding: '10px 20px', 
        border: 'none', 
        borderRadius: '8px', 
        cursor: 'pointer', 
        color: 'white', 
        backgroundColor: '#64748b',
        fontSize: '14px',
        fontWeight: '600',
        transition: 'background-color 0.2s'
    }
};

export default CommandDetailModal; 