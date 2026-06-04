
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loadEvents, saveEvents } from "../utils/storage";
import * as Notifications from "expo-notifications";
import { reminderLabel } from "../utils/notifications";

const REMINDER_OPTIONS = ["10min","30min","1h","2h","1day","2days","1week"];

export default function SettingsScreen() {
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [defaultReminders, setDefaultReminders] = useState(["30min"]);
  const [eventCount, setEventCount] = useState(0);
  const [showHolidays, setShowHolidays] = useState(true);

  useEffect(() => {
    loadEvents().then(e => setEventCount(e.length));
    AsyncStorage.getItem("notifEnabled").then(v => { if (v !== null) setNotifEnabled(v === "true"); });
    AsyncStorage.getItem("defaultReminders").then(v => { if (v) setDefaultReminders(JSON.parse(v)); });
    AsyncStorage.getItem("showHolidays").then(v => { if (v !== null) setShowHolidays(v !== "false"); });
  }, []);

  const toggleNotif = async (val) => {
    setNotifEnabled(val);
    await AsyncStorage.setItem("notifEnabled", String(val));
    if (!val) await Notifications.cancelAllScheduledNotificationsAsync();
  };

  const toggleHolidays = async (val) => {
    setShowHolidays(val);
    await AsyncStorage.setItem("showHolidays", String(val));
  };

  const toggleReminder = async (key) => {
    const updated = defaultReminders.includes(key)
      ? defaultReminders.filter(r => r !== key)
      : [...defaultReminders, key];
    setDefaultReminders(updated);
    await AsyncStorage.setItem("defaultReminders", JSON.stringify(updated));
  };

  const clearAll = () => {
    Alert.alert("Usuń wszystko", "Czy na pewno chcesz usunąć wszystkie wpisy?", [
      { text: "Anuluj" },
      { text: "Usuń", style: "destructive", onPress: async () => {
        await saveEvents([]);
        await Notifications.cancelAllScheduledNotificationsAsync();
        setEventCount(0);
        Alert.alert("Gotowe", "Wszystkie wpisy zostały usunięte.");
      }}
    ]);
  };

  const Section = ({ title, children }) => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.card}>{children}</View>
    </View>
  );

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={s.statsCard}>
        <Ionicons name="calendar" size={32} color="#fff" />
        <Text style={s.statsNum}>{eventCount}</Text>
        <Text style={s.statsLabel}>wpisów w kalendarzu</Text>
      </View>

      <Section title="Wyświetlanie">
        <View style={s.row}>
          <View style={s.rowLeft}><Ionicons name="flag" size={20} color="#22C55E" style={{ marginRight: 10 }} /><Text style={s.rowLabel}>Polskie święta</Text></View>
          <Switch value={showHolidays} onValueChange={toggleHolidays} trackColor={{ true: "#22C55E" }} />
        </View>
      </Section>

      <Section title="Powiadomienia">
        <View style={s.row}>
          <View style={s.rowLeft}><Ionicons name="notifications" size={20} color="#4F6AF5" style={{ marginRight: 10 }} /><Text style={s.rowLabel}>Włącz powiadomienia</Text></View>
          <Switch value={notifEnabled} onValueChange={toggleNotif} trackColor={{ true: "#4F6AF5" }} />
        </View>
        <View style={s.divider} />
        <View style={{ padding: 14 }}>
          <Text style={s.subLabel}>Domyślne powiadomienia dla nowych wpisów</Text>
          <View style={s.chipRow}>
            {REMINDER_OPTIONS.map(k => (
              <TouchableOpacity key={k}
                style={[s.chip, defaultReminders.includes(k) && { backgroundColor: "#EF4444", borderColor: "#EF4444" }]}
                onPress={() => toggleReminder(k)}>
                <Text style={[s.chipText, defaultReminders.includes(k) && { color: "#fff" }]}>{reminderLabel(k)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Section>

      <Section title="Dane">
        <TouchableOpacity style={s.row} onPress={clearAll}>
          <View style={s.rowLeft}><Ionicons name="trash" size={20} color="#EF4444" style={{ marginRight: 10 }} /><Text style={[s.rowLabel, { color: "#EF4444" }]}>Usuń wszystkie wpisy</Text></View>
          <Ionicons name="chevron-forward" size={16} color="#EF4444" />
        </TouchableOpacity>
      </Section>

      <Section title="Informacje">
        <View style={s.row}>
          <View style={s.rowLeft}><Ionicons name="information-circle" size={20} color="#4F6AF5" style={{ marginRight: 10 }} /><Text style={s.rowLabel}>Wersja aplikacji</Text></View>
          <Text style={s.rowVal}>2.0.0</Text>
        </View>
      </Section>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FF" },
  statsCard: { backgroundColor: "#4F6AF5", borderRadius: 16, padding: 24, alignItems: "center", marginBottom: 24 },
  statsNum: { fontSize: 48, fontWeight: "800", color: "#fff", marginTop: 8 },
  statsLabel: { fontSize: 16, color: "rgba(255,255,255,0.8)", marginTop: 4 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: "700", color: "#888", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, paddingHorizontal: 4 },
  card: { backgroundColor: "#fff", borderRadius: 14, overflow: "hidden", elevation: 1 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14 },
  rowLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: "500", color: "#1a1a2e" },
  rowVal: { fontSize: 14, color: "#888" },
  divider: { height: 1, backgroundColor: "#f0f0f0", marginHorizontal: 14 },
  subLabel: { fontSize: 13, color: "#666", fontWeight: "500", marginBottom: 10 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "#ddd" },
  chipText: { fontSize: 13, color: "#555" },
});
