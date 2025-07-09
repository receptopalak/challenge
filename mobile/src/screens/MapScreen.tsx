import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Image, Button, ActivityIndicator, Alert, TouchableOpacity, Platform } from 'react-native';
import MapView, { Marker, Polyline, Callout } from 'react-native-maps';
import { useAuth } from '../context/AuthContext';
import { getPlanes, updateCommandStatus, getMyCommands } from '../services/api';
import { Plane, Command } from '../types';
import { useFleetSocket } from '../hooks/useFleetSocket';
import CommandModal from '../components/CommandModal';
import CommandHistorySheet from '../components/CommandHistorySheet';
        import PlaneDetailSheet from '../components/PlaneDetailSheet'; // Import new component

const MapScreen = () => {
  const { user, logout } = useAuth();
  const { planeLocations, incomingCommand, setIncomingCommand } = useFleetSocket();
  const [planes, setPlanes] = useState<Plane[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const [selectedPlane, setSelectedPlane] = useState<Plane | null>(null); // Hangi uçağın seçildiğini tutar
      const [isDetailSheetVisible, setIsDetailSheetVisible] = useState(false); // Detail panel visibility
  const [selectedCommand, setSelectedCommand] = useState<Command | null>(null);
  const mapRef = useRef<MapView>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isTracking, setIsTracking] = useState(true); // State to control map tracking
  const [showPlanePopup, setShowPlanePopup] = useState(false); // Custom popup state
  const [popupPlane, setPopupPlane] = useState<Plane | null>(null); // Popup plane data

  const [allCommands, setAllCommands] = useState<Command[]>([]);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);

  const fetchCommands = async () => {
    try {
      const commandsResponse = await getMyCommands();
      setAllCommands(commandsResponse.data);
      console.log('[MapScreen] Commands refreshed.');
    } catch (commandError) {
      console.error("Failed to fetch commands", commandError);
      // Don't show a blocking alert here, as it might interrupt user flow.
      // Maybe a toast notification in the future.
    }
  };

  // Fetch initial data (planes and commands)
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        // Step 1: Fetch and set planes first. This is critical for the map.
        const planesResponse = await getPlanes();
        const planeFeatures: Plane[] = planesResponse.data.features.map((feature: any) => {
          const props = feature.properties;
          return {
            id: feature.id,
            model: props.model,
            tailNumber: props.tail_number,
            status: props.status,
            altitude: props.altitude,
            speed_kmh: props.speed_kmh,
            bearing: props.bearing,
            pilot: props.pilot,
            coordinates: {
              latitude: feature.geometry.coordinates[1],
              longitude: feature.geometry.coordinates[0],
            },
          };
        });
        setPlanes(planeFeatures);

        // Step 2: Now fetch commands.
        await fetchCommands();

      } catch (error) {
        console.error("Failed to fetch initial planes", error);
        Alert.alert("Data Error", "An error occurred while fetching main flight data.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const handleCommandSelectFromHistory = (command: Command, action: 'view' | 'complete') => {
    setIsHistoryVisible(false); // Always close the sheet

    if (action === 'complete') {
      // Directly call the complete logic if the button is pressed
      // We need to pass the command to the complete handler
      handleCompleteCommand(command.id);
      return;
    }

    // --- This is the 'view' logic ---

            // Focus map on the command location
        if (mapRef.current && command.target_location && command.target_location.coordinates) {
            setIsTracking(false); // Disable tracking to focus on the command location
            mapRef.current.animateToRegion({
                latitude: command.target_location.coordinates[1],
                longitude: command.target_location.coordinates[0],
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
            }, 1000);
        }

    // If the command is pending, open the modal to accept/reject.
    // Otherwise, just display it on the map.
    if (command.status === 'pending') {
      // Use a short timeout to allow the bottom sheet to fully close
      // before the modal opens, preventing UI glitches.
      setTimeout(() => {
        setIncomingCommand(command);
      }, 300);
    } else {
      setSelectedCommand(command);
    }
  };

  // Update plane locations from WebSocket
  useEffect(() => {
    // Do not run if the initial plane list is not yet populated
    if (planes.length === 0 || planeLocations.length === 0) return;

    // console.log('[MapScreen] Updating', planeLocations.length, 'plane locations');

    setPlanes(prevPlanes => {
      const updatedPlanes = prevPlanes.map(plane => {
        const locationUpdate = planeLocations.find(loc => loc.id === plane.id);
        if (locationUpdate) {
          const newCoords = {
            latitude: locationUpdate.coordinates[1],
            longitude: locationUpdate.coordinates[0],
          };

          // Validate coordinates
          if (isNaN(newCoords.latitude) || isNaN(newCoords.longitude)) {
            console.error(`[MapScreen] Invalid coordinates for plane ${plane.id}:`, locationUpdate.coordinates);
            return plane; // Return original plane if coordinates are invalid
          }

          // If this plane is part of an active route, update the route's 'from'
          // This logic is now handled by selectedCommand
          // if (activeRoute && activeRoute.from.id === plane.id) {
          //     setActiveRoute(prev => ({ ...prev!, from: { ...prev!.from, coordinates: newCoords } }));
          // }

          return {
            ...plane,
            coordinates: newCoords,
            bearing: locationUpdate.bearing,
          };
        }
        return plane;
      });

      return updatedPlanes;
    });
  }, [planeLocations]);

  // Animate map to pilot's plane if tracking is enabled
  useEffect(() => {
    if (!user || planes.length === 0 || !isTracking) return;

    const myPlane = planes.find(p => p.pilot?.id === user.id);
    if (myPlane && mapRef.current) {
      // isInitialLoad, ilk yüklemede daha geniş bir görünüm sağlar.
      // Sonraki takiplerde daha makul bir yakınlaştırma seviyesi kullanılır.
      const zoomLevel = {
        // latitudeDelta: isInitialLoad ? 0.5 : 0.5,
        // longitudeDelta: isInitialLoad ? 0.5 : 0.5,
        latitudeDelta: 0.5,
        longitudeDelta: 0.1,
      };

      mapRef.current.animateToRegion({
        latitude: myPlane.coordinates.latitude,
        longitude: myPlane.coordinates.longitude,
        ...zoomLevel,
      }, 1000);
      if (isInitialLoad) setIsInitialLoad(false);
    }
  }, [planes, user, isTracking]);

  const handleAcceptCommand = async () => {
    if (!incomingCommand || !user) return;
    try {
      await updateCommandStatus(incomingCommand.id, 'accepted');
      
      // First, set the command on the map and stop tracking
      setSelectedCommand(incomingCommand);
      console.log('[MapScreen] Command accepted and set:', incomingCommand);
      setIsTracking(false); // Stop tracking to focus on new command
      
      // Focus map on target location first
      if (mapRef.current && incomingCommand.target_location && incomingCommand.target_location.coordinates) {
        console.log('[MapScreen] Focusing map on target coordinates:', incomingCommand.target_location.coordinates);
        
        const targetLat = incomingCommand.target_location.coordinates[1];
        const targetLng = incomingCommand.target_location.coordinates[0];
        
        // Focus directly on the target location first
        mapRef.current.animateToRegion({
          latitude: targetLat,
          longitude: targetLng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }, 1500);
      }
      
      // Close modal first
      setIncomingCommand(null);
      
      // Show alert after a short delay to allow map animation
      setTimeout(() => {
        Alert.alert('Mission Accepted', 'Target marked on map.');
      }, 800);
      
      await fetchCommands(); // Refresh command list
    } catch (error) {
      console.error("Failed to accept command:", error);
      Alert.alert('Error', 'Mission could not be accepted.');
    }
  };

  const handleRejectCommand = async () => {
    if (!incomingCommand) return;
    try {
      await updateCommandStatus(incomingCommand.id, 'rejected');
      setIncomingCommand(null); // Close modal
      Alert.alert('Mission Rejected');
      await fetchCommands(); // Refresh command list
    } catch (error) {
      console.error("Failed to reject command:", error);
      Alert.alert('Error', 'Mission could not be rejected.');
    }
  };

  const handleCompleteCommand = async (commandId: number) => {
    if (!commandId) return;
    try {
      await updateCommandStatus(commandId, 'completed');

      // If the completed command was the one selected on map, clear it
      if (selectedCommand && selectedCommand.id === commandId) {
        setSelectedCommand(null);
        setIsTracking(true); // Re-enable tracking
      }

      Alert.alert('Mission Completed', 'Mission successfully marked as completed.');
      await fetchCommands(); // Refresh command list
    } catch (error) {
      console.error("Failed to complete command:", error);
      Alert.alert('Error', 'Mission could not be completed.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3282B8" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        mapType="satellite"
        onPress={() => {
          setSelectedPlane(null);
          setShowPlanePopup(false);
          setPopupPlane(null);
        }} // When tapping on the map, clear the selection and close the popup
        initialRegion={{
          latitude: 39.9334,
          longitude: 32.8597,
          latitudeDelta: 15,
          longitudeDelta: 15,
        }}
      >
        {/* All Planes */}
        {planes.map((plane) => {
          const isMyPlane = plane.pilot?.id === user?.id;
          const isSelected = plane.id === selectedPlane?.id;

          let tintColor = 'transparent'; // Varsayılan olarak renksiz
          if (isMyPlane) {
            tintColor = '#FF0000'; // Red
          } else if (isSelected) {
            tintColor = '#00BFFF'; // Blue
          } else {
            tintColor = '#FFD700'; // Yellow for others
          }

          return (
            <Marker
              key={`plane-${plane.id}`}
              coordinate={plane.coordinates}
              onPress={(e) => {
                e.stopPropagation(); // Prevent map's onPress from being triggered
                setSelectedPlane(plane);
                setPopupPlane(plane);
                setShowPlanePopup(true);
              }}
              tracksViewChanges={true}
            >
              <View style={styles.planeIconContainer}>
                {/* Layer 2: Aircraft Details (Wings etc. - always same color) - always same color */}
                <Image
                  source={require('../../assets/plane.png')}
                  style={[
                    styles.planeIcon,
                    styles.planeIconOutline,
                    { transform: [{ rotate: `${plane.bearing || 0}deg` }] }
                  ]}
                />
                {/* Layer 1: Aircraft Body (Dynamically colored) - dynamically colored */}
                <Image
                  source={require('../../assets/plane.png')}
                  style={[
                    styles.planeIcon,
                    {
                      transform: [{ rotate: `${plane.bearing || 0}deg` }],
                      tintColor: tintColor,
                    }
                  ]}
                />
              </View>
            </Marker>
          );
        })}

        {/* Command Destination Pin */}
        {selectedCommand && selectedCommand.target_location && selectedCommand.target_location.coordinates && (
          console.log('[MapScreen] Rendering target pin for command:', selectedCommand.id, selectedCommand.target_location.coordinates),
          <Marker
            key="command-dest"
            coordinate={{
              latitude: selectedCommand.target_location.coordinates[1],
              longitude: selectedCommand.target_location.coordinates[0],
            }}
            title="Mission Target"
            description={selectedCommand.message}
          >
            <View style={styles.targetPinContainer}>
              <View style={styles.targetPin}>
                <Text style={styles.targetPinText}>🎯</Text>
              </View>
              <View style={styles.targetPinShadow} />
            </View>
          </Marker>
        )}

        {/* Flight Route Polyline */}
        {selectedCommand && selectedCommand.target_location && selectedCommand.target_location.coordinates && user && planes.find(p => p.pilot?.id === user.id) && (
          <Polyline
            key="flight-route"
            coordinates={[
              {
                latitude: planes.find(p => p.pilot?.id === user.id)!.coordinates.latitude,
                longitude: planes.find(p => p.pilot?.id === user.id)!.coordinates.longitude,
              },
              {
                latitude: selectedCommand.target_location.coordinates[1],
                longitude: selectedCommand.target_location.coordinates[0],
              }
            ]}
            strokeColor="#00BFFF"
            strokeWidth={3}
            lineDashPattern={[10, 5]}
          />
        )}

      </MapView>

      {/* Custom Plane Popup - Apple Maps style */}
      {showPlanePopup && popupPlane && (
        <View style={styles.customPopupContainer}>
          <View style={styles.customPopup}>
            <Text style={styles.customPopupTitle}>{popupPlane.tailNumber}</Text>
            <Text style={styles.customPopupDescription}>Click for details</Text>
            <TouchableOpacity 
              style={styles.customPopupButton}
              onPress={() => {
                setIsDetailSheetVisible(true);
                setShowPlanePopup(false);
              }}
            >
              <Text style={styles.customPopupButtonText}>View Details</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.customPopupArrow} />
        </View>
      )}

      <View style={styles.topBar}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/Baykar-Logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </View>

      <TouchableOpacity onPress={logout} style={styles.logoutButton}>
        <Text style={styles.logoutButtonText}>⏻ Logout</Text>
      </TouchableOpacity>

      <View style={styles.bottomButtonsContainer}>
        <TouchableOpacity onPress={() => setIsHistoryVisible(true)} style={styles.historyButton}>
          <Text style={styles.historyButtonText}>Mission History</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsTracking(!isTracking)} style={styles.trackingButton}>
          <Text style={styles.trackingButtonText}>{isTracking ? 'Stop Tracking' : 'Track Plane'}</Text>
        </TouchableOpacity>
      </View>

      <PlaneDetailSheet
        visible={isDetailSheetVisible}
        onClose={() => setIsDetailSheetVisible(false)}
        plane={selectedPlane}
      />

      <CommandModal
        command={incomingCommand}
        onAccept={handleAcceptCommand}
        onReject={handleRejectCommand}
        onClose={() => setIncomingCommand(null)}
      />

      <CommandHistorySheet
        visible={isHistoryVisible}
        onClose={() => setIsHistoryVisible(false)}
        commands={allCommands}
        onCommandSelect={handleCommandSelectFromHistory}
      />

      {selectedCommand && !incomingCommand && (
        <View style={styles.completeButtonContainer}>
          <TouchableOpacity onPress={() => handleCompleteCommand(selectedCommand.id)} style={styles.completeButton}>
            <Text style={styles.completeButtonText}>Complete Mission</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
  },
  loadingText: {
    marginTop: 10,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  map: { ...StyleSheet.absoluteFillObject },
  planeIconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planeIcon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
      position: 'absolute', // To stack icons on top of each other
  },
  planeIconOutline: {
    tintColor: 'rgba(0, 0, 0, 0.8)', // Wing and outline color
  },
  topBar: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 30,
  },
  buttonsContainer: {
    flexDirection: 'row',
    flex: 2,
    justifyContent: 'center',
    gap: 10,
  },
  historyButton: {
    backgroundColor: '#16213E',
    paddingHorizontal: 16,
    paddingVertical: 12,

    borderTopRightRadius:10,
    borderBottomRightRadius: 10,
    borderTopLeftRadius: 45,
    borderBottomLeftRadius: 45,
    borderWidth: 1,
    borderColor: '#0F4C75',
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  trackingButton: {
    backgroundColor: '#3282B8',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopRightRadius: 45,
    borderBottomRightRadius: 45,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  historyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  trackingButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  logoutButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#E74C3C',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  completeButtonContainer: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    right: 20,
  },
  completeButton: {
    backgroundColor: '#27AE60',
    borderRadius: 45,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#27AE60',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  bottomButtonsContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(26, 26, 46, 0.95)',

    borderRadius: 40,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  targetPinContainer: {
    alignItems: 'center',
  },
  targetPin: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFD700', // Yellow
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  targetPinText: {
    fontSize: 14,
    color: '#1A1A2E',
  },
  targetPinShadow: {
    position: 'absolute',
    bottom: 0,
    width: 10,
    height: 10,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 5,
  },
  customPopupContainer: {
    position: 'absolute',
    top: 100, // A bit above the map
    left: '50%',
    transform: [{ translateX: -150 }], // Center
    backgroundColor: '#16213E',
    borderRadius: 12,
    padding: 15,
    width: 300,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0F4C75',
        zIndex: 10, // On top of the map
  },
  customPopup: {
    alignItems: 'center',
  },
  customPopupTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  customPopupDescription: {
    fontSize: 14,
    color: '#B0B0B0',
    marginBottom: 15,
    textAlign: 'center',
  },
  customPopupButton: {
    backgroundColor: '#3282B8',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0F4C75',
  },
  customPopupButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  customPopupArrow: {
    position: 'absolute',
    bottom: -10,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderTopWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 0,
    borderLeftWidth: 10,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#16213E',
    borderLeftColor: 'transparent',
  },
});

export default MapScreen;
