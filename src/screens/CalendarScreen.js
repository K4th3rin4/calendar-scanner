import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { loadEvents, saveEvents } from '../utils/storage';
import { scheduleNotification, cancelNotification } from '../utils/notifications';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, addMonths, subMonths } from 'date-fns';
import { pl } from 'date-fns/locale';

const TYPE_COLOR = { task: '#4F6AF5', holiday: '#22C55E', work: '#F59E0B', reminder: '#EF4444', other: '#8B5CF6' };
const TYPE_LABEL = { task: 'Zadanie', holiday: 'Urlop', work: 'Praca', reminder: 'Przypomnienie', other: 'Inne' };

export default function CalendarScreen() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [form, setForm] = useState({ title: '', date: '', type: 'task', time: '', notes: '' });

  useFocusEffect(useCallback(() => { loadEvents().then(setEvents); }, []));

  const daysInMonth = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const firstDayOfWeek = (startOfMonth(currentMonth).getDay() + 6) % 7;

  const getEventsForDay = (day) => events.filter(e => {
    try { return isSameDay(parseISO(e.date), day); } catch { return false; }
  });

  const selectedEvents = getEventsForDay(selectedDay);

  const openAdd = () => {
    setEditEvent(null);
    setForm({ title: '', date: format(selectedDay, 'yyyy-MM-dd'), type: 'task', time: '09:00', notes: '' });
    setModalVisible(true);
  };

  const openEdit = (ev) => {
    setEditEvent(ev);
    setForm({ title: ev.title, date: ev.date, type: ev.type, time: ev.time || '09:00', notes: ev.notes || '' });
    setModalVisible(true);
  };

  const saveForm = async () => {
    if (!form.title.trim()) { Alert.alert('Błąd', 'Wpisz tytuł.'); return; }
    let updated;
    if (editEvent) {
      await cancelNotification(editEvent.id);
      updated = events.map(e => e.id === editEvent.id ? { ...e, ...form } : e);
    } else {
      const newEv = { ...form, id: Date.now().toString() };
      updated = [...events, newEv];
      await scheduleNotification(newEv);
    }
    await saveEvents(updated);
    setEvents(updated);
    setModalVisible(false);
  };

  const deleteEvent = async (ev) => {
    Alert.alert('Usuń', `Usunąć "${ev.title}"?`, [
      { text: 'Anuluj' },
      { text: 'Usuń', style: 'destructive', onPress: async () => {
        await cancelNotification(ev.id);
        const updated = events.filter(e => e.id !== ev.id);
        await saveEvents(updated);
        setEvents(updated);
      }}
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentMonth(m => subMonths(m, 1))}>
          <Ionicons name="chevron-back" size={24} color="#4F6AF5" />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{format(currentMonth, 'LLLL yyyy', { locale: pl })}</Text>
        <TouchableOpacity onPress={() => setCurrentMonth(m => addMonths(m, 1))}>
          <Ionicons name="chevron-forward" size={24} color="#4F6AF5" />
        </TouchableOpacity>
      </View>

      <View style={styles.weekRow}>
        {['Pn','Wt','Śr','Cz','Pt','So','Nd'].map(d => (
          <Text key={d} style={styles.weekDay}>{d}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {Array(firstDayOfWeek).fill(null).map((_, i) => <View key={'e'+i} style={styles.cell} />)}
        {daysInMonth.map(day => {
          const dayEvents = getEventsForDay(day);
          const isSelected = isSameDay(day, selectedDay);
          const isToday = isSameDay(day, new Date());
          return (
            <TouchableOpacity key={day.toISOString()} style={[styles.cell, isSelected && styles.cellSelected, isToday && !isSelected && styles.cellToday]} onPress={() => setSelectedDay(day)}>
              <Text style={[styles.cellText, isSelected && styles.cellTextSelected, isToday && !isSelected && styles.cellTextToday]}>{format(day, 'd')}</Text>
              <View style={styles.dots}>
                {dayEvents.slice(0, 3).map((ev, i) => (
                  <View key={i} style={[styles.dot, { backgroundColor: TYPE_COLOR[ev.type] || '#4F6AF5' }]} />
                ))}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.dayHeader}>
        <Text style={styles.dayTitle}>{format(selectedDay, 'd MMMM', { locale: pl })}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Dodaj</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.eventsList}>
        {selectedEvents.length === 0 && (
          <Text style={styles.emptyText}>Brak wpisów na ten dzień</Text>
        )}
        {selectedEvents.map(ev => (
          <View key={ev.id} style={[styles.eventCard, { borderLeftColor: TYPE_COLOR[ev.type] }]}>
            <View style={styles.eventMain}>
              <Text style={styles.eventTitle}>{ev.title}</Text>
              {ev.time && <Text style={styles.eventTime}>⏰ {ev.time}</Text>}
              {ev.notes && <Text style={styles.eventNotes}>{ev.notes}</Text>}
              <View style={[styles.badge, { backgroundColor: TYPE_COLOR[ev.type] + '22' }]}>
                <Text style={[styles.badgeText, { color: TYPE_COLOR[ev.type] }]}>{TYPE_LABEL[ev.type]}</Text>
              </View>
            </View>
            <View style={styles.eventActions}>
              <TouchableOpacity onPress={() => openEdit(ev)}><Ionicons name="pencil" size={18} color="#4F6AF5" /></TouchableOpacity>
              <TouchableOpacity onPress={() => deleteEvent(ev)} style={{ marginTop: 8 }}><Ionicons name="trash" size={18} color="#EF4444" /></TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editEvent ? 'Edytuj wpis' : 'Nowy wpis'}</Text>
            <Text style={styles.label}>Tytuł *</Text>
            <TextInput style={styles.input} value={form.title} onChangeText={v => setForm(f => ({...f, title: v}))} placeholder="Nazwa zadania..." />
            <Text style={styles.label}>Data</Text>
            <TextInput style={styles.input} value={form.date} onChangeText={v => setForm(f => ({...f, date: v}))} placeholder="2025-06-15" />
            <Text style={styles.label}>Godzina powiadomienia</Text>
            <TextInput style={styles.input} value={form.time} onChangeText={v => setForm(f => ({...f, time: v}))} placeholder="09:00" />
            <Text style={styles.label}>Notatki</Text>
            <TextInput style={[styles.input, {height: 70}]} value={form.notes} onChangeText={v => setForm(f => ({...f, notes: v}))} multiline placeholder="Opcjonalne notatki..." />
            <Text style={styles.label}>Typ</Text>
            <View style={styles.typeRow}>
              {Object.entries(TYPE_LABEL).map(([key, label]) => (
                <TouchableOpacity key={key} style={[styles.typeChip, form.type === key && { backgroundColor: TYPE_COLOR[key], borderColor: TYPE_COLOR[key] }]} onPress={() => setForm(f => ({...f, type: key}))}>
                  <Text style={[styles.typeChipText, form.type === key && { color: '#fff' }]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={saveForm}>
                <Text style={styles.confirmText}>Zapisz</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  monthTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', textTransform: 'capitalize' },
  weekRow: { flexDirection: 'row', backgroundColor: '#fff', paddingBottom: 8 },
  weekDay: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', color: '#888' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 8 },
  cell: { width: '14.28%', aspectRatio: 0.9, alignItems: 'center', justifyContent: 'center', padding: 2 },
  cellSelected: { backgroundColor: '#4F6AF5', borderRadius: 10 },
  cellToday: { borderWidth: 2, borderColor: '#4F6AF5', borderRadius: 10 },
  cellText: { fontSize: 14, color: '#1a1a2e', fontWeight: '500' },
  cellTextSelected: { color: '#fff', fontWeight: '700' },
  cellTextToday: { color: '#4F6AF5', fontWeight: '700' },
  dots: { flexDirection: 'row', gap: 2, marginTop: 2 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  dayTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', textTransform: 'capitalize' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#4F6AF5', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  eventsList: { flex: 1, paddingHorizontal: 16 },
  emptyText: { color: '#aaa', textAlign: 'center', marginTop: 24, fontSize: 15 },
  eventCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderLeftWidth: 4, flexDirection: 'row', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  eventMain: { flex: 1 },
  eventTitle: { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
  eventTime: { fontSize: 13, color: '#666', marginTop: 4 },
  eventNotes: { fontSize: 13, color: '#888', marginTop: 4 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, marginTop: 6 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  eventActions: { justifyContent: 'center', paddingLeft: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 6, marginTop: 14 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 15, backgroundColor: '#F8F9FF' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: '#ddd' },
  typeChipText: { fontSize: 13, color: '#555', fontWeight: '500' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 20, marginBottom: 20 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  cancelText: { color: '#666', fontWeight: '600' },
  confirmBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#4F6AF5', alignItems: 'center' },
  confirmText: { color: '#fff', fontWeight: '700' },
});
