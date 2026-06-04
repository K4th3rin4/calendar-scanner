import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadEvents, saveEvents } from '../utils/storage';
import * as Notifications from 'expo-notifications';

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [eventCount, setEventCount] = useState(0);

  useEffect(() => {
    loadEvents().then(e => setEventCount(e.length));
    AsyncStorage.getItem('notificationsEnabled').then(v => { if (v !== null) setNotificationsEnabled(v === 'true'); });
  }, []);

  const toggleNotifications = async (val) => {
    setNotificationsEnabled(val);
    await AsyncStorage.setItem('notificationsEnabled', String(val));
    if (!val) await Notifications.cancelAllScheduledNotificationsAsync();
  };

  const clearAll = () => {
    Alert.alert('Usuń wszystko', 'Czy na pewno chcesz usunąć wszystkie wpisy z kalendarza?', [
      { text: 'Anuluj' },
      { text: 'Usuń', style: 'destructive', onPress: async () => {
        await saveEvents([]);
        await Notifications.cancelAllScheduledNotificationsAsync();
        setEventCount(0);
        Alert.alert('Gotowe', 'Wszystkie wpisy zostały usunięte.');
      }}
    ]);
  };

  const Section = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );

  const Row = ({ icon, label, right, onPress, color = '#1a1a2e' }) => (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={20} color="#4F6AF5" style={styles.rowIcon} />
        <Text style={[styles.rowLabel, { color }]}>{label}</Text>
      </View>
      {right}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={styles.statsCard}>
        <Ionicons name="calendar" size={32} color="#4F6AF5" />
        <Text style={styles.statsNumber}>{eventCount}</Text>
        <Text style={styles.statsLabel}>wpisów w kalendarzu</Text>
      </View>

      <Section title="Powiadomienia">
        <Row icon="notifications" label="Włącz powiadomienia" right={
          <Switch value={notificationsEnabled} onValueChange={toggleNotifications} trackColor={{ true: '#4F6AF5' }} />
        } />
        <View style={styles.divider} />
        <Row icon="time" label="Domyślna godzina przypomnienia" right={
          <Text style={styles.rowValue}>{reminderTime}</Text>
        } />
      </Section>

      <Section title="Dane">
        <Row icon="cloud-download" label={`Masz ${eventCount} wpisów`} right={
          <Ionicons name="chevron-forward" size={16} color="#ccc" />
        } />
        <View style={styles.divider} />
        <Row icon="trash" label="Usuń wszystkie wpisy" onPress={clearAll} color="#EF4444" right={
          <Ionicons name="chevron-forward" size={16} color="#EF4444" />
        } />
      </Section>

      <Section title="Informacje">
        <Row icon="information-circle" label="Wersja aplikacji" right={<Text style={styles.rowValue}>1.0.0</Text>} />
        <View style={styles.divider} />
        <Row icon="heart" label="Stworzona z ❤️ przez AI" right={null} />
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FF' },
  statsCard: { backgroundColor: '#4F6AF5', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 24 },
  statsNumber: { fontSize: 48, fontWeight: '800', color: '#fff', marginTop: 8 },
  statsLabel: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, paddingHorizontal: 4 },
  sectionCard: { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rowIcon: { marginRight: 12 },
  rowLabel: { fontSize: 15, fontWeight: '500' },
  rowValue: { fontSize: 14, color: '#888' },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginHorizontal: 16 },
});
