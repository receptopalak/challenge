import React, { useState, useEffect, useRef } from 'react';
import type { PlaneInfo } from '../types';

interface PlaneSearchProps {
    planes: PlaneInfo[];
    onSelect: (planeId: number) => void;
    isSearchOpen: boolean;
    setIsSearchOpen: (isOpen: boolean) => void;
}

const PlaneSearch: React.FC<PlaneSearchProps> = ({ planes, onSelect, isSearchOpen, setIsSearchOpen }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredPlanes, setFilteredPlanes] = useState<PlaneInfo[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isSearchOpen) {
            setSearchTerm('');
            setSelectedIndex(-1);
        } else {
            // Focus input when modal opens
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                }
            }, 100);
        }
    }, [isSearchOpen]);

    useEffect(() => {
        if (!searchTerm || searchTerm.length < 3) {
            setFilteredPlanes([]);
            setSelectedIndex(-1);
            return;
        }

        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        const results = planes.filter(plane =>
            plane?.model?.toLowerCase().includes(lowerCaseSearchTerm) ||
            plane?.tailNumber?.toLowerCase().includes(lowerCaseSearchTerm) ||
            (plane.pilot && plane.pilot?.fullName && plane.pilot?.fullName.toLowerCase().includes(lowerCaseSearchTerm)) ||
            (plane.pilot && plane.pilot?.callSign && plane.pilot?.callSign.toLowerCase().includes(lowerCaseSearchTerm))
        );
        setFilteredPlanes(results);
        setSelectedIndex(-1);
    }, [searchTerm, planes]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!isSearchOpen) return;
            
            if (event.key === 'Escape') {
                setIsSearchOpen(false);
            } else if (event.key === 'ArrowDown') {
                event.preventDefault();
                setSelectedIndex(prev => 
                    prev < filteredPlanes.length - 1 ? prev + 1 : prev
                );
            } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
            } else if (event.key === 'Enter') {
                event.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < filteredPlanes.length) {
                    handleSelect(filteredPlanes[selectedIndex]);
                } else if (filteredPlanes.length === 1) {
                    handleSelect(filteredPlanes[0]);
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isSearchOpen, selectedIndex, filteredPlanes, setIsSearchOpen]);

    const handleSelect = (plane: PlaneInfo) => {
        onSelect(plane.id);
        setIsSearchOpen(false);
    };

    const handleBackdropClick = (event: React.MouseEvent) => {
        if (event.target === event.currentTarget) {
            setIsSearchOpen(false);
        }
    };

    if (!isSearchOpen) {
        return null;
    }

    return (
        <div 
            onClick={handleBackdropClick}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(8px)',
                zIndex: 10000,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                paddingTop: '15vh',
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
        >
            <div 
                ref={containerRef}
                style={{
                    backgroundColor: 'rgba(28, 28, 30, 0.95)',
                    borderRadius: '20px',
                    padding: '24px',
                    width: '600px',
                    maxWidth: '90vw',
                    maxHeight: '70vh',
                    overflow: 'hidden',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* Search Input */}
                <div style={{
                    marginBottom: '24px',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                       
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="🔍 Search aircraft, code, pilot..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '20px 24px',
                            fontSize: '20px',
                            fontWeight: '400',
                            boxSizing: 'border-box',
                            borderRadius: '16px',
                            border: '2px solid rgba(255, 255, 255, 0.1)',
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: '#FFFFFF',
                            outline: 'none',
                            fontFamily: 'inherit',
                            transition: 'all 0.2s ease',
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = '#3b82f6';
                            e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)';
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                            e.target.style.boxShadow = 'none';
                        }}
                    />
                
                    <div style={{
                        position: 'absolute',
                        right: '20px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '14px',
                        color: '#6b7280',
                        pointerEvents: 'none',
                    }}>
                        ESC
                    </div>
                </div>

                {/* Search Results */}
                {searchTerm && (
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        maxHeight: '400px',
                    }}>
                        {searchTerm.length < 3 ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '60px 20px',
                                color: '#6b7280',
                            }}>
                                <div style={{
                                    fontSize: '48px',
                                    marginBottom: '16px',
                                    opacity: 0.5,
                                }}>
                                    ⌨️
                                </div>
                                <div style={{
                                    fontSize: '18px',
                                    fontWeight: '500',
                                    marginBottom: '8px',
                                }}>
                                    Minimum 3 harf gerekli
                                </div>
                                <div style={{
                                    fontSize: '14px',
                                    opacity: 0.8,
                                }}>
                                    Arama yapmak için en az 3 karakter girin
                                </div>
                            </div>
                        ) : filteredPlanes.length > 0 ? (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px',
                            }}>
                                {filteredPlanes.map((plane, index) => (
                                    <div
                                        key={plane.id}
                                        onClick={() => handleSelect(plane)}
                                        style={{
                                            padding: '16px 20px',
                                            cursor: 'pointer',
                                            borderRadius: '12px',
                                            backgroundColor: index === selectedIndex ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                                            border: index === selectedIndex ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                                            transition: 'all 0.2s ease',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '16px',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (index !== selectedIndex) {
                                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (index !== selectedIndex) {
                                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                                            }
                                        }}
                                    >
                                        <div style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '8px',
                                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '20px',
                                            flexShrink: 0,
                                        }}>
                                            ✈️
                                        </div>
                                        <div style={{
                                            flex: 1,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '4px',
                                        }}>
                                            <div style={{
                                                fontSize: '16px',
                                                fontWeight: '600',
                                                color: '#FFFFFF',
                                                lineHeight: '1.3',
                                            }}>
                                                {plane.model} ({plane.tailNumber})
                                            </div>
                                            <div style={{
                                                fontSize: '14px',
                                                color: '#9ca3af',
                                                lineHeight: '1.3',
                                            }}>
                                                Pilot: {plane.pilot?.fullName} ({plane.pilot?.callSign})
                                            </div>
                                            <div style={{
                                                fontSize: '12px',
                                                color: '#6b7280',
                                                lineHeight: '1.3',
                                            }}>
                                                {plane.status} • {plane.speed_kmh} km/h • {plane.altitude.toFixed(0)} ft
                                            </div>
                                        </div>
                                        <div style={{
                                            fontSize: '12px',
                                            color: '#6b7280',
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                            flexShrink: 0,
                                        }}>
                                            ID: {plane.id}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{
                                textAlign: 'center',
                                padding: '60px 20px',
                                color: '#6b7280',
                            }}>
                                <div style={{
                                    fontSize: '48px',
                                    marginBottom: '16px',
                                    opacity: 0.5,
                                }}>
                                    🔍
                                </div>
                                <div style={{
                                    fontSize: '18px',
                                    fontWeight: '500',
                                    marginBottom: '8px',
                                }}>
                                    No results found
                                </div>
                                <div style={{
                                    fontSize: '14px',
                                    opacity: 0.8,
                                }}>
                                    No aircraft found for "{searchTerm}"
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* No Search Term */}
                {!searchTerm && (
                    <div style={{
                        textAlign: 'center',
                        padding: '60px 20px',
                        color: '#6b7280',
                    }}>
                        <div style={{
                            fontSize: '48px',
                            marginBottom: '16px',
                            opacity: 0.5,
                        }}>
                            ✈️
                        </div>
                        <div style={{
                            fontSize: '18px',
                            fontWeight: '500',
                            marginBottom: '8px',
                        }}>
                            Aircraft Search
                        </div>
                        <div style={{
                            fontSize: '14px',
                            opacity: 0.8,
                        }}>
                            Search by aircraft model, tail number or pilot name
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlaneSearch; 