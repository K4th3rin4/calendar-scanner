
import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { loadEvents, saveEvents } from "../utils/storage";
import { scheduleEventNotifications, cancelEventNotifications } from "../utils/notifications";
import { expandRecurringEvent } from "../utils/recurrence";
import { getPolishHolidays } from "../utils/polishHolidays";
import EventFormModal from "../components/EventFormModal";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, parseISO, addMonths, subMonths
} from "date-fns";
import { pl } from "date-fns/locale";

const TYPE_COLOR = { task:"#4F6AF5", holiday:"#22C55E", work:"#F59E0B", reminder:"#EF4444", other:"#8B5CF6", publicHoliday:"#22C55E" };

export default function CalendarScreen() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showHolidays, setShowHolidays] = useState(true);

  const reload = useCallback(async () => {
    const raw = await loadEvents();
    setEvents(raw);
  }, []);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const daysInMonth = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const firstDayOfWeek = (startOfMonth(currentMonth).getDay() + 6) % 7;

  // Expand recurring events for this month
  const monthStart = format(startOfMonth(currentMonth), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(currentMonth), "yyyy-MM-dd");
  const expandedEvents = events.flatMap(ev =>
    ev.recurrence ? expandRecurringEvent(ev, monthStart, monthEnd) : [ev]
  );

  // Polish holidays for this year
  const polishHolidays = showHolidays ? getPolishHolidays(currentMonth.getFullYear()) : [];

  const getEventsForDay = (day) => {
    const regular = expandedEvents.filter(e => {
      try { return isSameDay(parseISO(e.date), day); } catch { return false; }
    });
    const holidays = polishHolidays.filter(h => {
      try { return isSameDay(parseISO(h.date), day); } catch { return false; }
    }).map(h => ({ ...h, id: "ph_" + h.date, type: "publicHoliday" }));
    return [...holidays, ...regular];
  };

  const selectedEvents = getEventsForDay(selectedDay);

  const openAdd = () => {
    setEditingEvent({ date: format(selectedDay, "yyyy-MM-dd") });
    setModalVisible(true);
  };

  const openEdit = (ev) => {
    if (ev.type === "publicHoliday") return;
    const original = ev.isOccurrence ? events.find(e => e.id === ev.originalId) : ev;
    setEditingEvent(original || ev);
    setModalVisible(true);
  };

  const handleSave = async (updated) => {
    const isNew = !events.find(e => e.id === updated.id);
    let newEvents;
    if (isNew) {
      const ev = { ...updated, id: updated.id || Date.now().toString() };
      newEvents = [...events, ev];
      await scheduleEventNotifications(ev);
    } else {
      await cancelEventNotifications(updated.id);
      newEvents = events.map(e => e.id === updated.id ? updated : e);
      await scheduleEventNotifications(updated);
    }
    await saveEvents(newEvents);
    setEvents(newEvents);
    setModalVisible(false);
  };

  const deleteEvent = async (ev) => {
    if (ev.type === "publicHoliday") return;
    const id = ev.originalId || ev.id;
    Alert.alert("Usuń", `Usunąć "${ev.title}"?`, [
      { text: "Anuluj" },
      { text: "Usuń", style: "destructive", onPress: async () => {
        await cancelEventNotifications(id);
        const updated = events.filter(e => e.id !== id);
        await saveEvents(updated);
        setEvents(updated);
      }}
    ]);
  };

  const renderDot = (color, key) => (
    <View key={key} style={[sty.dot, { backgroundColor: color }]} />
  );

  return (
    <View style={sty.container}>
      {/* Month nav */}
      <View style={sty.monthNav}>
        <TouchableOpacity onPress={() => setCurrentMonth(m => subMonths(m, 1))}>
          <Ionicons name="chevron-back" size={24} color="#4F6AF5" />
        </TouchableOpacity>
        <Text style={sty.monthTitle}>{format(currentMonth, "LLLL yyyy", { locale: pl })}</Text>
        <TouchableOpacity onPress={() => setCurrentMonth(m => addMonths(m, 1))}>
          <Ionicons name="chevron-forward" size={24} color="#4F6AF5" />
        </TouchableOpacity>
      </View>

      {/* Holidays toggle */}
      <TouchableOpacity style={sty.holidayToggle} onPress={() => setShowHolidays(v => !v)}>
        <View style={[sty.holidayDot, { backgroundColor: "#22C55E" }]} />
        <Text style={sty.holidayToggleText}>Polskie święta</Text>
        <Ionicons name={showHolidays ? "eye" : "eye-off"} size={16} color="#888" style={{ marginLeft: 4 }} />
      </TouchableOpacity>

      {/* Weekday headers */}
      <View style={sty.weekRow}>
        {["Pn","Wt","Śr","Cz","Pt","So","Nd"].map((d, i) => (
          <Text key={d} style={[sty.weekDay, i >= 5 && { color: "#EF4444" }]}>{d}</Text>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={sty.grid}>
        {Array(firstDayOfWeek).fill(null).map((_, i) => <View key={"e"+i} style={sty.cell} />)}
        {daysInMonth.map(day => {
          const dayEvents = getEventsForDay(day);
          const isSelected = isSameDay(day, selectedDay);
          const isToday = isSameDay(day, new Date());
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
          const hasHoliday = dayEvents.some(e => e.type === "publicHoliday");

          return (
            <TouchableOpacity key={day.toISOString()}
              style={[sty.cell, isSelected && sty.cellSelected, isToday && !isSelected && sty.cellToday]}
              onPress={() => setSelectedDay(day)}>
              <Text style={[
                sty.cellText,
                isSelected && sty.cellTextSelected,
                isToday && !isSelected && sty.cellTextToday,
                (isWeekend || hasHoliday) && !isSelected && { color: "#EF4444" }
              ]}>
                {format(day, "d")}
              </Text>
              <View style={sty.dots}>
                {dayEvents.slice(0, 4).map((ev, i) => renderDot(TYPE_COLOR[ev.type] || "#888", i))}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected day events */}
      <View style={sty.dayHeader}>
        <Text style={sty.dayTitle}>{format(selectedDay, "EEEE, d MMMM", { locale: pl })}</Text>
        <TouchableOpacity style={sty.addBtn} onPress={openAdd}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={sty.addBtnText}>Dodaj</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={sty.eventsList}>
        {selectedEvents.length === 0 && (
          <Text style={sty.emptyText}>Brak wpisów</Text>
        )}
        {selectedEvents.map(ev => (
          <TouchableOpacity key={ev.id} activeOpacity={ev.type === "publicHoliday" ? 1 : 0.7}
            style={[sty.eventCard, { borderLeftColor: TYPE_COLOR[ev.type] || "#888" }]}
            onLongPress={() => deleteEvent(ev)}>
            <View style={{ flex: 1 }}>
              <Text style={sty.evTitle}>{ev.name || ev.title}</Text>
              {ev.time && <Text style={sty.evTime}>⏰ {ev.time}</Text>}
              {ev.recurrence && <Text style={sty.evRecur}>🔁 Cykliczne</Text>}
              {ev.notes && <Text style={sty.evNotes}>{ev.notes}</Text>}
            </View>
            {ev.type !== "publicHoliday" && (
              <TouchableOpacity onPress={() => openEdit(ev)} style={{ padding: 4 }}>
                <Ionicons name="pencil" size={18} color="#4F6AF5" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
        <Text style={sty.hint}>Przytrzymaj wpis aby go usunąć</Text>
      </ScrollView>

      <EventFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        initial={editingEvent}
      />
    </View>
  );
}

const sty = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FF" },
  monthNav: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#eee" },
  monthTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a2e", textTransform: "capitalize" },
  holidayToggle: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  holidayDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  holidayToggleText: { fontSize: 13, color: "#444", fontWeight: "500" },
  weekRow: { flexDirection: "row", backgroundColor: "#fff", paddingTop: 4, paddingBottom: 6 },
  weekDay: { flex: 1, textAlign: "center", fontSize: 12, fontWeight: "600", color: "#888" },
  grid: { flexDirection: "row", flexWrap: "wrap", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#eee", paddingBottom: 6 },
  cell: { width: "14.28%", aspectRatio: 0.85, alignItems: "center", justifyContent: "center", padding: 2 },
  cellSelected: { backgroundColor: "#4F6AF5", borderRadius: 10 },
  cellToday: { borderWidth: 2, borderColor: "#4F6AF5", borderRadius: 10 },
  cellText: { fontSize: 13, color: "#1a1a2e", fontWeight: "500" },
  cellTextSelected: { color: "#fff", fontWeight: "700" },
  cellTextToday: { color: "#4F6AF5", fontWeight: "700" },
  dots: { flexDirection: "row", gap: 2, marginTop: 1 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  dayHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14 },
  dayTitle: { fontSize: 14, fontWeight: "700", color: "#1a1a2e", textTransform: "capitalize", flex: 1 },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#4F6AF5", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  eventsList: { flex: 1, paddingHorizontal: 14 },
  emptyText: { color: "#aaa", textAlign: "center", marginTop: 20, fontSize: 14 },
  eventCard: { backgroundColor: "#fff", borderRadius: 10, padding: 12, marginBottom: 8, borderLeftWidth: 4, flexDirection: "row", alignItems: "center", elevation: 1 },
  evTitle: { fontSize: 14, fontWeight: "600", color: "#1a1a2e" },
  evTime: { fontSize: 12, color: "#666", marginTop: 2 },
  evRecur: { fontSize: 12, color: "#4F6AF5", marginTop: 2 },
  evNotes: { fontSize: 12, color: "#888", marginTop: 2 },
  hint: { fontSize: 11, color: "#ccc", textAlign: "center", paddingVertical: 8 },
});
