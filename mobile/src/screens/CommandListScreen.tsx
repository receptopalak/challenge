import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getCommandsForPilot } from '../services/api';
import { RootStackParamList } from './LoginScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'CommandList'>;

const CommandListScreen: React.FC<Props> = ({ route, navigation }) => {
  const { pilotId } = route.params;
  const [commands, setCommands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommands = async () => {
      try {
        const response = await getCommandsForPilot(pilotId);
        setCommands(response.data);
      } catch (error) {
        console.error("Commands could not be retrieved:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCommands();
  }, [pilotId]);
  
  if (loading) {
    return <ActivityIndicator size="large" style={styles.centered} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pilot {pilotId} - Missions</Text>
      <FlatList
        data={commands}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.itemContainer} 
            onPress={() => navigation.navigate('CommandDetail', { command: item })}
          >
            <Text style={styles.itemText}>{item.message}</Text>
            <Text style={styles.itemStatus}>{item.status}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text>No active missions assigned to you.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 10 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center'},
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  itemContainer: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#ccc', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemText: { fontSize: 16 },
  itemStatus: { fontStyle: 'italic', color: 'gray' },
});

export default CommandListScreen; 