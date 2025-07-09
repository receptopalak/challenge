import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Plane } from '../types';

interface Props {
    visible: boolean;
    onClose: () => void;
    plane: Plane | null;
}

const PlaneDetailSheet: React.FC<Props> = ({ visible, onClose, plane }) => {
    if (!plane) {
        return null;
    }

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.sheetContainer}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>{plane.tailNumber} Details</Text>
                                                  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                              <Text style={styles.closeButtonText}>Close</Text>
                          </TouchableOpacity>
                    </View>
                    
                    <ScrollView contentContainerStyle={styles.content} style={styles.scrollView}>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Aircraft Information</Text>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Model:</Text>
                                <Text style={styles.infoValue}>{plane.model}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Tail Number:</Text>
                                <Text style={styles.infoValue}>{plane.tailNumber}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Status:</Text>
                                <Text style={styles.infoValue}>{plane.status}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Altitude:</Text>
                                <Text style={styles.infoValue}>{plane.altitude} ft</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Speed:</Text>
                                <Text style={styles.infoValue}>{plane.speed_kmh} km/s</Text>
                            </View>
                        </View>

                        <View style={styles.separator} />

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Pilot Information</Text>
                            {plane.pilot ? (
                                <>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Name:</Text>
                                        <Text style={styles.infoValue}>{plane.pilot.fullName}</Text>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Call Sign:</Text>
                                        <Text style={styles.infoValue}>{plane.pilot.callSign}</Text>
                                    </View>
                                </>
                            ) : (
                                <Text style={styles.infoValue}>No pilot assigned to this aircraft.</Text>
                            )}
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sheetContainer: {
        maxHeight: '60%',
        backgroundColor: '#1f2937',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 16,
        paddingBottom: 0, // Remove bottom padding to eliminate gap
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#374151',
        paddingBottom: 16,
    },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#f9fafb' },
    closeButton: { padding: 8 },
    closeButtonText: { fontSize: 16, color: '#60a5fa' },
    scrollView: {
        flexGrow: 1,
    },
    content: {
        paddingTop: 16,
        paddingBottom: 20, // Add bottom padding to content instead of container
    },
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#9ca3af',
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#374151',
    },
    infoLabel: {
        fontSize: 16,
        color: '#d1d5db',
    },
    infoValue: {
        fontSize: 16,
        color: '#f9fafb',
        fontWeight: '500',
    },
    separator: {
        height: 1,
        backgroundColor: '#4b5563',
        marginVertical: 16,
    },
});

export default PlaneDetailSheet; 