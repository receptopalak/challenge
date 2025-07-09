import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Command } from '../types';

interface Props {
  command: Command | null;
  onAccept: () => void;
  onReject: () => void;
  onClose: () => void; // Add onClose prop
}

const CommandModal: React.FC<Props> = ({ command, onAccept, onReject, onClose }) => {
  if (!command) return null;

  return (
    <Modal
      transparent={true}
      animationType="slide"
      visible={!!command}
      onRequestClose={onClose} // Use onClose for Android back button
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Text style={styles.iconText}>📋</Text>
            </View>
                            <Text style={styles.modalTitle}>New Mission Order</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.content}>
            <View style={styles.messageContainer}>
                              <Text style={styles.messageLabel}>Mission Details:</Text>
              <Text style={styles.modalText}>{command.message}</Text>
            </View>
            
            {command.target_location && command.target_location.coordinates && (
              <View style={styles.mapContainer}>
                <Text style={styles.mapLabel}>Hedef Konum:</Text>
                <MapView
                  style={styles.miniMap}
                  mapType="satellite"
                  scrollEnabled={true}
                  zoomEnabled={true}
                  pitchEnabled={true}
                  rotateEnabled={true}
                  initialRegion={{
                    latitude: command.target_location.coordinates[1],
                    longitude: command.target_location.coordinates[0],
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                  }}
                >
                  <Marker
                    coordinate={{
                      latitude: command.target_location.coordinates[1],
                      longitude: command.target_location.coordinates[0],
                    }}
                    title="Mission Target"
                    description={command.message}
                    pinColor="red"
                  />
                </MapView>
                <Text style={styles.coordinatesText}>
                  Lat: {command.target_location.coordinates[1].toFixed(4)}, Lng: {command.target_location.coordinates[0].toFixed(4)}
                </Text>
              </View>
            )}
            
            <View style={styles.infoContainer}>
                              <Text style={styles.infoText}>Mission ID: {command.id}</Text>
                <Text style={styles.infoText}>
                  Date: {new Date(command.created_at).toLocaleString('en-US')}
                </Text>
            </View>
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={onReject} style={styles.rejectButton}>
              <Text style={styles.rejectButtonText}>❌ Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onAccept} style={styles.acceptButton}>
              <Text style={styles.acceptButtonText}>✅ Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 20,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#1A1A2E',
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#16213E',
    },
    headerIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#3282B8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconText: {
        fontSize: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        flex: 1,
        textAlign: 'center',
        marginLeft: -40, // Compensate for close button to center title
    },
    closeButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#16213E',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    content: {
        padding: 20,
    },
    messageContainer: {
        backgroundColor: '#16213E',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        borderLeftWidth: 4,
        borderLeftColor: '#3282B8',
    },
    messageLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#B0B0B0',
        marginBottom: 8,
    },
    modalText: {
        fontSize: 16,
        color: '#FFFFFF',
        lineHeight: 22,
    },
    infoContainer: {
        backgroundColor: '#0F3460',
        borderRadius: 12,
        padding: 12,
        marginBottom: 5,
    },
    infoText: {
        fontSize: 12,
        color: '#B0B0B0',
        marginBottom: 4,
    },
    buttonContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingBottom: 20,
        gap: 12,
    },
    rejectButton: {
        flex: 1,
        backgroundColor: '#E74C3C',
        borderRadius: 12,
        paddingVertical: 15,
        alignItems: 'center',
        shadowColor: '#E74C3C',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    acceptButton: {
        flex: 1,
        backgroundColor: '#27AE60',
        borderRadius: 12,
        paddingVertical: 15,
        alignItems: 'center',
        shadowColor: '#27AE60',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    rejectButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    acceptButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    mapContainer: {
      marginTop: 15,
      backgroundColor: '#0F3460',
      borderRadius: 12,
      padding: 15,
      alignItems: 'center',
    },
    mapLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: '#B0B0B0',
      marginBottom: 8,
    },
    miniMap: {
      width: '100%',
      height: 150,
      borderRadius: 8,
      marginBottom: 10,
    },
    coordinatesText: {
      fontSize: 12,
      color: '#B0B0B0',
      marginTop: 5,
    },
});

export default CommandModal; 