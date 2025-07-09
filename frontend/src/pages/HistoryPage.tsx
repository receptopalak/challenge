import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCommands } from '../services/api';
import { io, Socket } from 'socket.io-client';
import CommandDetailModal from '../components/CommandDetailModal';

  // Let's define the command data type
interface Command {
    id: number;
    plane_id: number;
    pilot_id: number;
    message: string;
    status: 'pending' | 'accepted' | 'rejected';
    target_location: { lat: number; lon: number };
    created_at: string;
}

const HistoryPage: React.FC = () => {
    const navigate = useNavigate();
    const [commands, setCommands] = useState<Command[]>([]);
    const [filteredCommands, setFilteredCommands] = useState<Command[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCommand, setSelectedCommand] = useState<Command | null>(null);
    
    // Filter states
    const [pilotFilter, setPilotFilter] = useState('');
    const [planeFilter, setPlaneFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        // Fetch all commands initially
        const fetchCommands = async () => {
            try {
                const response = await getCommands();
                // Sort commands from newest to oldest
                const sortedCommands = response.data.sort((a: Command, b: Command) => 
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
                setCommands(sortedCommands);
            } catch (error) {
                console.error("Commands could not be fetched:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCommands();

        // Connect to WebSocket for real-time updates
        const socket: Socket = io('http://localhost:4000');
        socket.on('command_update', (updatedCommand: Command) => {
            console.log('Command update received:', updatedCommand);
            setCommands(prevCommands => {
                const updatedCommands = prevCommands.map(cmd =>
                    cmd.id === updatedCommand.id ? updatedCommand : cmd
                );
                // Also sort updated commands
                return updatedCommands.sort((a, b) => 
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
            });
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    // Filter commands based on criteria
    useEffect(() => {
        let filtered = commands;

        if (pilotFilter) {
            filtered = filtered.filter(cmd => 
                cmd.pilot_id.toString().includes(pilotFilter)
            );
        }

        if (planeFilter) {
            filtered = filtered.filter(cmd => 
                cmd.plane_id.toString().includes(planeFilter)
            );
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(cmd => cmd.status === statusFilter);
        }

        // Also sort filtered commands from newest to oldest
        const sortedFiltered = filtered.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setFilteredCommands(sortedFiltered);
    }, [commands, pilotFilter, planeFilter, statusFilter]);

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

    const clearFilters = () => {
        setPilotFilter('');
        setPlaneFilter('');
        setStatusFilter('all');
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: '#f8fafc',
                color: '#64748b',
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}>
                <div style={{textAlign: 'center'}}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '3px solid #e2e8f0',
                        borderTop: '3px solid #3b82f6',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px'
                    }}></div>
                    <p style={{fontSize: '16px', margin: 0}}>Loading commands...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#f8fafc',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            color: '#1e293b',
            position: 'relative',
            overflow:'scroll',
            width: '100%'
        }}>
            
            {/* Header */}
            <div style={{
                backgroundColor: 'white',
                borderBottom: '1px solid #e2e8f0',
                padding: '40px 0',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    padding: '0 20px'
                }}>
                    <h1 style={{
                        fontSize: '28px',
                        fontWeight: '700',
                        color: '#1e293b',
                        margin: 0
                    }}>
                        Command History
                    </h1>
                    <p style={{
                        color: '#64748b',
                        fontSize: '16px',
                        margin: '4px 0 0 0'
                    }}>
                        View and filter all sent commands
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div style={{
                backgroundColor: 'white',
                borderBottom: '1px solid #e2e8f0',
                padding: '20px 0'
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    padding: '0 20px'
                }}>
                    <div style={{
                        display: 'flex',
                        gap: '16px',
                        alignItems: 'flex-end',
                        flexWrap: 'wrap'
                    }}>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
                            <label style={{
                                fontSize: '14px', 
                                fontWeight: '600', 
                                color: '#374151'
                            }}>
                                Pilot ID
                            </label>
                            <input
                                type="text"
                                placeholder="Pilot ID..."
                                value={pilotFilter}
                                onChange={(e) => setPilotFilter(e.target.value)}
                                style={{
                                    padding: '10px 14px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    width: '160px',
                                    backgroundColor: 'white',
                                    color: '#1e293b'
                                }}
                            />
                        </div>

                        <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
                            <label style={{
                                fontSize: '14px', 
                                fontWeight: '600', 
                                color: '#374151'
                            }}>
                                Aircraft ID
                            </label>
                            <input
                                type="text"
                                placeholder="Aircraft ID..."
                                value={planeFilter}
                                onChange={(e) => setPlaneFilter(e.target.value)}
                                style={{
                                    padding: '10px 14px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    width: '160px',
                                    backgroundColor: 'white',
                                    color: '#1e293b'
                                }}
                            />
                        </div>

                        <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
                            <label style={{
                                fontSize: '14px', 
                                fontWeight: '600', 
                                color: '#374151'
                            }}>
                                Status
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                style={{
                                    padding: '10px 14px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    width: '150px',
                                    backgroundColor: 'white',
                                    color: '#1e293b',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="all">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="accepted">Accepted</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>

                        <button
                            onClick={clearFilters}
                            style={{
                                padding: '10px 16px',
                                backgroundColor: '#64748b',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#475569';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#64748b';
                            }}
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                padding: '20px'
            }}>
                {/* Stats */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    marginBottom: '24px'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                    }}>
                        <p style={{
                            fontSize: '14px', 
                            color: '#64748b', 
                            margin: '0 0 4px 0',
                            fontWeight: '600'
                        }}>
                            Total Commands
                        </p>
                        <p style={{
                            fontSize: '24px', 
                            fontWeight: '700', 
                            color: '#1e293b', 
                            margin: 0
                        }}>
                            {commands.length}
                        </p>
                    </div>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                    }}>
                        <p style={{
                            fontSize: '14px', 
                            color: '#64748b', 
                            margin: '0 0 4px 0',
                            fontWeight: '600'
                        }}>
                            Filtered Results
                        </p>
                        <p style={{
                            fontSize: '24px', 
                            fontWeight: '700', 
                            color: '#3b82f6', 
                            margin: 0
                        }}>
                            {filteredCommands.length}
                        </p>
                    </div>
                </div>

                {/* Commands Table */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}>
                    <div style={{
                        padding: '20px 24px',
                        borderBottom: '1px solid #e2e8f0',
                        backgroundColor: '#f8fafc'
                    }}>
                        <h3 style={{
                            fontSize: '18px',
                            fontWeight: '600',
                            color: '#1e293b',
                            margin: 0
                        }}>
                            Commands ({filteredCommands.length})
                        </h3>
                    </div>
                    
                    {filteredCommands.length === 0 ? (
                        <div style={{
                            padding: '48px 24px',
                            textAlign: 'center',
                            color: '#64748b'
                        }}>
                            <p style={{fontSize: '16px', margin: 0}}>
                                No command found matching the filtering criteria.
                            </p>
                        </div>
                    ) : (
                        <div style={{
                            overflowX: 'auto',
                            // maxHeight: 'calc(100vh - 400px)',
                            overflowY: 'auto'
                        }}>
                            <table style={{
                                width: '100%',
                                borderCollapse: 'collapse'
                            }}>
                                <thead style={{
                                    position: 'sticky',
                                    top: 0,
                                    backgroundColor: '#f8fafc',
                                    zIndex: 1
                                }}>
                                    <tr style={{
                                        borderBottom: '1px solid #e2e8f0'
                                    }}>
                                        <th style={{
                                            padding: '12px 16px',
                                            textAlign: 'left',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            color: '#374151',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            backgroundColor: '#f8fafc'
                                        }}>
                                            Command ID
                                        </th>
                                        <th style={{
                                            padding: '12px 16px',
                                            textAlign: 'left',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            color: '#374151',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            backgroundColor: '#f8fafc'
                                        }}>
                                            Aircraft ID
                                        </th>
                                        <th style={{
                                            padding: '12px 16px',
                                            textAlign: 'left',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            color: '#374151',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            backgroundColor: '#f8fafc'
                                        }}>
                                            Pilot ID
                                        </th>
                                        <th style={{
                                            padding: '12px 16px',
                                            textAlign: 'left',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            color: '#374151',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            backgroundColor: '#f8fafc'
                                        }}>
                                            Message
                                        </th>
                                        <th style={{
                                            padding: '12px 16px',
                                            textAlign: 'left',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            color: '#374151',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            backgroundColor: '#f8fafc'
                                        }}>
                                            Status
                                        </th>
                                        <th style={{
                                            padding: '12px 16px',
                                            textAlign: 'left',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            color: '#374151',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            backgroundColor: '#f8fafc'
                                        }}>
                                            Date
                                        </th>
                    </tr>
                </thead>
                <tbody>
                                    {filteredCommands.map((cmd, index) => (
                        <tr 
                            key={cmd.id} 
                                            style={{
                                                borderBottom: index < filteredCommands.length - 1 ? '1px solid #e2e8f0' : 'none',
                                                cursor: 'pointer',
                                                transition: 'background-color 0.2s'
                                            }}
                            onClick={() => setSelectedCommand(cmd)}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = '#f8fafc';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'white';
                                            }}
                                        >
                                            <td style={{
                                                padding: '16px',
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                color: '#3b82f6'
                                            }}>
                                                #{cmd.id}
                                            </td>
                                            <td style={{
                                                padding: '16px',
                                                fontSize: '14px',
                                                color: '#374151',
                                                fontWeight: '500'
                                            }}>
                                                {cmd.plane_id}
                                            </td>
                                            <td style={{
                                                padding: '16px',
                                                fontSize: '14px',
                                                color: '#374151',
                                                fontWeight: '500'
                                            }}>
                                                {cmd.pilot_id}
                                            </td>
                                            <td style={{
                                                padding: '16px',
                                                fontSize: '14px',
                                                color: '#1e293b',
                                                maxWidth: '300px',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                {cmd.message}
                                            </td>
                                            <td style={{
                                                padding: '16px'
                                            }}>
                                                {getStatusBadge(cmd.status)}
                                            </td>
                                            <td style={{
                                                padding: '16px',
                                                fontSize: '14px',
                                                color: '#64748b'
                                            }}>
                                                {new Date(cmd.created_at).toLocaleDateString('tr-TR', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
                        </div>
                    )}
                </div>
            </div>
            
            <CommandDetailModal 
                command={selectedCommand}
                onClose={() => setSelectedCommand(null)}
            />

            {/* CSS Animation */}
            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}
            </style>
        </div>
    );
};

export default HistoryPage; 