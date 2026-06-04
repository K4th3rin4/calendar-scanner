
import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, SectionList, TouchableOpacity, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { loadEvents, saveEvents } from "../utils/storage";
import { cancelEventNotifications } from "../utils/notifications";
import { expandRecurringEvent, RECURRENCE_LABELS } from "../utils/recurrence";
import { format, parseISO, isAfter, startOfDay, addMonths } from "date-fns";
import { pl } from "date-fns/locale";

const TYPE_COLOR = { task:"#4F6AF5", holiday:"#22C55E", work:"#F59E0B", reminder:"#EF4444", other:"#8B5CF6" };
const TYPE_ICON  = { task:"checkbox-outline", holiday:"sunny-outline", work:"briefcase-outline", reminder:"notifications-outline", other:"bookmark-outline" };
const TYPE_LABEL = { task:"Zadanie", holiday:"Urlop", work:"Praca", reminder:"Przypomnienie", other:"Inne" };

export default function AgendaScreen() {
  const [sections, setSections] = useState([]);
  const [filter, setFilter] = useState("all");
  const [rawEvents, setRawEvents] = useState([]);

  const reload = useCallback(async () => {
    const all = await loadEvents();
    setRawEvents(all);

    // Expand recurrences for next 12 months
    const today = startOfDay(new Date());
    const future = format(addMonths(today, 12), "yyyy-MM-dd");
    const todayStr = format(today, "yyyy-MM-dd");

    let expanded = all.flatMap(ev =>
      ev.recurrence ? expandRecurringEvent(ev, todayStr, future) : [ev]
    );

    // Filter
    if (filter === "upcoming") expanded = expanded.filter(e => { try { return !isAfter(today, parseISO(e.date)); } catch { return true; }});
    if (filter !== "all" && filter !== "upcoming") expanded = expanded.filter(e => e.type === filter);

    // Group by month
    const byMonth = {};
    for (const ev of expanded) {
      const key = (ev.date || "").substring(0, 7);
      if (!byMonth[key]) byMonth[key] = [];
      byMonth[key].push(ev);
    }

    const sorted = Object.keys(byMonth).sort().map(k => ({
      title: (() => { try { return format(parseISO(k + "-01"), "LLLL yyyy", { locale: pl }); } catch { return k; }})(),
      data: byMonth[k].sort((a, b) => (a.date || "").localeCompare(b.date || ""))
    }));
    setSections(sorted);
  }, [filter]);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const deleteEvent = (ev) => {
    const id = ev.originalId || ev.id;
    const original = rawEvents.find(e => e.id === id);
    const hasRecurrence = original?.recurrence;

    if (hasRecurrence) {
      Alert.alert("Usuń cykliczne", `"${ev.title}" powtarza się.`, [
        { text: "Anuluj" },
        { text: "Usuń tylko ten", onPress: () => deleteSingle(id) },
        { text: "Usuń wszystkie", style: "destructive", onPress: () => deleteSingle(id) },
      ]);
    } else {
      Alert.alert("Usuń", `Usunąć "${ev.title}"?`, [
        { text: "Anuluj" },
        { text: "Usuń", style: "destructive", onPress: () => deleteSingle(id) }
      ]);
    }
  };

  const deleteSingle = async (id) => {
    const all = await loadEvents();
    await cancelEventNotifications(id);
    await saveEvents(all.filter(e => e.id !== id));
    reload();
  };

  const FILTERS = [
    { key: "all", label: "Wszystko" },
    { key: "upcoming", label: "Nadchodzące" },
    { key: "task", label: "Zadania" },
    { key: "holiday", label: "Urlopy" },
    { key: "work", label: "Praca" },
    { key: "reminder", label: "Przypomnienia" },
  ];

  return (
    <View style={sty.container}>
      <View style={sty.filterBar}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f.key}
            style={[sty.chip, filter === f.key && sty.chipActive]}
            onPress={() => setFilter(f.key)}>
            <Text style={[sty.chipText, filter === f.key && sty.chipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={item => item.id || item.title + item.date}
        contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
        ListEmptyComponent={<Text style={sty.empty}>Brak wpisów</Text>}
        renderSectionHeader={({ section }) => (
          <Text style={sty.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <View style={[sty.card, { borderLeftColor: TYPE_COLOR[item.type] || "#888" }]}>
            <View style={[sty.iconBg, { backgroundColor: (TYPE_COLOR[item.type] || "#888") + "18" }]}>
              <Ionicons name={TYPE_ICON[item.type] || "calendar-outline"} size={20} color={TYPE_COLOR[item.type] || "#888"} />
            </View>
            <View style={sty.cardBody}>
              <Text style={sty.cardTitle}>{item.title}</Text>
              <Text style={sty.cardMeta}>
                {item.date}{item.time ? " · " + item.time : ""}
                {item.isOccurrence ? "  🔁" : ""}
              </Text>
              {item.recurrence && !item.isOccurrence && (
                <Text style={sty.cardRecur}>{RECURRENCE_LABELS[item.recurrence.type]}</Text>
              )}
              {item.notes ? <Text style={sty.cardNotes}>{item.notes}</Text> : null}
            </View>
            <TouchableOpacity onPress={() => deleteEvent(item)} style={sty.deleteBtn}>
              <Ionicons name="trash-outline" size={18} color="#ccc" />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const sty = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FF" },
  filterBar: { flexDirection: "row", padding: 10, gap: 8, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#eee", flexWrap: "wrap" },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "#ddd", backgroundColor: "#F8F9FF" },
  chipActive: { backgroundColor: "#4F6AF5", borderColor: "#4F6AF5" },
  chipText: { fontSize: 13, color: "#555", fontWeight: "500" },
  chipTextActive: { color: "#fff", fontWeight: "600" },
  sectionHeader: { fontSize: 13, fontWeight: "700", color: "#4F6AF5", textTransform: "capitalize", marginTop: 14, marginBottom: 6 },
  card: { backgroundColor: "#fff", borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: "row", alignItems: "center", borderLeftWidth: 3, elevation: 1 },
  iconBg: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center", marginRight: 10 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: "600", color: "#1a1a2e" },
  cardMeta: { fontSize: 12, color: "#888", marginTop: 2 },
  cardRecur: { fontSize: 12, color: "#4F6AF5", marginTop: 2 },
  cardNotes: { fontSize: 12, color: "#aaa", marginTop: 2 },
  deleteBtn: { padding: 8 },
  empty: { textAlign: "center", color: "#aaa", marginTop: 48, fontSize: 15 },
});
