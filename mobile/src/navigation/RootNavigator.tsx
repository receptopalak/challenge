import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import MapScreen from '../screens/MapScreen';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
  const { token } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {token ? (
          <Stack.Screen name="Map" component={MapScreen} options={{ headerShown: false }} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Baykar Pilot Interface', headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default RootNavigator; 