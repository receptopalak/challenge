import React from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { updateCommandStatus } from '../services/api';
import { RootStackParamList } from './LoginScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'CommandDetail'>;

const CommandDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { command } = route.params;

  const handleResponse = async (status: 'accepted' | 'rejected') => {
    try {
      await updateCommandStatus(command.id, status);
      Alert.alert('Success', `Mission ${status === 'accepted' ? 'accepted' : 'rejected'} successfully.`);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Mission response could not be sent.');
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mission Details (ID: {command.id})</Text>
      <View style={styles.detailBox}>
        <Text style={styles.message}>{command.message}</Text>
      </View>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: command.target_location.lat,
          longitude: command.target_location.lon,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        <Marker
          coordinate={{
            latitude: command.target_location.lat,
            longitude: command.target_location.lon,
          }}
          title="Hedef Nokta"
        />
      </MapView>
      <View style={styles.buttonContainer}>
        <Button title="Accept Mission" color="green" onPress={() => handleResponse('accepted')} />
        <Button title="Reject Mission" color="red" onPress={() => handleResponse('rejected')} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', margin: 10 },
  detailBox: { padding: 15, backgroundColor: '#f0f0f0' },
  message: { fontSize: 16 },
  map: { flex: 1 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-around', padding: 10 },
});

export default CommandDetailScreen; 