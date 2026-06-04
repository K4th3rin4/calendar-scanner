import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import ScanScreen from './src/screens/ScanScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import AgendaScreen from './src/screens/AgendaScreen';
import SettingsScreen from './src/screens/SettingsScreen';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const Tab = createBottomTabNavigator();

export default function App() {
  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="light" backgroundColor="#4F6AF5" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Skanuj') iconName = focused ? 'camera' : 'camera-outline';
            else if (route.name === 'Kalendarz') iconName = focused ? 'calendar' : 'calendar-outline';
            else if (route.name === 'Agenda') iconName = focused ? 'list' : 'list-outline';
            else if (route.name === 'Ustawienia') iconName = focused ? 'settings' : 'settings-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#4F6AF5',
          tabBarInactiveTintColor: '#999',
          headerStyle: { backgroundColor: '#4F6AF5' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        })}
      >
        <Tab.Screen name="Skanuj" component={ScanScreen} options={{ title: 'Skanuj Kalendarz' }} />
        <Tab.Screen name="Kalendarz" component={CalendarScreen} options={{ title: 'Mój Kalendarz' }} />
        <Tab.Screen name="Agenda" component={AgendaScreen} options={{ title: 'Agenda' }} />
        <Tab.Screen name="Ustawienia" component={SettingsScreen} options={{ title: 'Ustawienia' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Przypomnienia',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4F6AF5',
    });
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status;
}
