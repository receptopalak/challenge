import React from 'react';
import { View, Text, StyleSheet, Modal, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { Command } from '../types';

type CommandStatus = 'pending' | 'accepted' | 'rejected';

interface Props {
    visible: boolean;
    onClose: () => void;
    commands: Command[];
    onCommandSelect: (command: Command, action: 'view' | 'complete') => void;
}

const FILTERS: { label: string; value: CommandStatus }[] = [
    { label: 'Pending', value: 'pending' },
    { label: 'Accepted', value: 'accepted' },
    { label: 'Rejected', value: 'rejected' },
];

const CommandHistorySheet: React.FC<Props> = ({ visible, onClose, commands, onCommandSelect }) => {
    const [activeFilter, setActiveFilter] = React.useState<CommandStatus>('pending');

    const filteredCommands = commands.filter(cmd => {
        if (activeFilter === 'rejected') {
            return cmd.status === 'rejected';
        }
        if (activeFilter === 'accepted') {
            // Include both accepted and completed for this tab
            return cmd.status === 'accepted' || cmd.status === 'completed';
        }
        return cmd.status === 'pending';
    });

    const renderCommandItem = ({ item }: { item: Command }) => {
        const isSelectable = item.status === 'pending';
        return (
            <TouchableOpacity 
                disabled={!isSelectable}
                onPress={() => onCommandSelect(item, 'view')}
            >
                <View style={[styles.itemContainer, styles[item.status]]}>
                    <View style={styles.itemHeader}>
                        <Text style={styles.itemTitle}>Mission ID: {item.id}</Text>
                        <Text style={[styles.statusBadge, styles[`${item.status}Badge`]]}>{item.status}</Text>
                    </View>
                    <Text style={styles.itemMessage}>{item.message}</Text>
                    <Text style={styles.itemDate}>{new Date(item.created_at).toLocaleString('tr-TR')}</Text>
                    
                    {item.status === 'accepted' && (
                        <TouchableOpacity 
                            style={styles.completeButton}
                            onPress={() => onCommandSelect(item, 'complete')}
                        >
                            <Text style={styles.completeButtonText}>Complete Mission</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

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
                        <Text style={styles.headerTitle}>Mission History</Text>
                                                  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                              <Text style={styles.closeButtonText}>Close</Text>
                          </TouchableOpacity>
                    </View>
                    
                    <View style={styles.filterContainer}>
                        {FILTERS.map(filter => (
                            <TouchableOpacity
                                key={filter.value}
                                style={[
                                    styles.filterButton,
                                    activeFilter === filter.value && styles.activeFilterButton
                                ]}
                                onPress={() => setActiveFilter(filter.value)}
                            >
                                <Text style={[
                                    styles.filterButtonText,
                                    activeFilter === filter.value && styles.activeFilterButtonText
                                ]}>
                                    {filter.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <FlatList
                        data={filteredCommands}
                        renderItem={renderCommandItem}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={<Text style={styles.emptyText}>No missions found in this category.</Text>}
                        style={styles.flatList}
                    />
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
        maxHeight: '85%',
        backgroundColor: '#1f2937', // Dark blue-gray
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
    closeButton: { padding: 8, },
    closeButtonText: { fontSize: 16, color: '#60a5fa' },
    filterContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginVertical: 16,
    },
    filterButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#374151',
    },
    activeFilterButton: { backgroundColor: '#3b82f6' },
    filterButtonText: { color: '#d1d5db', fontWeight: '600' },
    activeFilterButtonText: { color: '#ffffff' },
    flatList: {
        flexGrow: 0, // Prevent FlatList from growing and taking up extra space
    },
    listContent: { 
        paddingBottom: 20,
        paddingHorizontal: 0,
    },
    itemContainer: {
        backgroundColor: '#374151',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 5,
        // borderLeftColor is now set dynamically
    },
    selectableItem: {
        backgroundColor: '#4b5563', // A slightly lighter background to indicate it's tappable
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    itemTitle: { fontSize: 16, fontWeight: 'bold', color: '#f9fafb' },
    itemMessage: { fontSize: 14, color: '#d1d5db', marginBottom: 10, lineHeight: 20, },
    itemDate: { fontSize: 12, color: '#9ca3af', textAlign: 'right' },
    emptyText: { textAlign: 'center', color: '#9ca3af', marginTop: 40, fontSize: 16, },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 'bold',
        color: 'white',
        overflow: 'hidden', // for borderRadius to work on Text on Android
    },
    completeButton: {
        marginTop: 12,
        backgroundColor: '#10b981',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    completeButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    pending: { borderLeftColor: '#f59e0b' },
    accepted: { borderLeftColor: '#22c55e' },
    rejected: { borderLeftColor: '#ef4444' },
    completed: { borderLeftColor: '#6b7280' },

    pendingBadge: { backgroundColor: '#f59e0b' },
    acceptedBadge: { backgroundColor: '#22c55e' },
    rejectedBadge: { backgroundColor: '#ef4444' },
    completedBadge: { backgroundColor: '#6b7280' },
});

export default CommandHistorySheet; 