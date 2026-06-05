import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { loadEvents, saveEvents } from '../utils/storage';
import { cancelNotification } from '../utils/notifications';
import { format, parseISO, isAfter, startOfDay } from 'date-fns';
import { pl } from 'date-fns/locale';

const TYPE_COLOR = { task: '#4F6AF5', holiday: '#22C55E', work: '#F59E0B', reminder: '#EF4444', other: '#8B5CF6' };
const TYPE_ICON = { task: 'checkbox-outline', holiday: 'sunny-outline', work: 'briefcase-outline', reminder: 'notifications-outline', other: 'bookmark-outline' };

export default function AgendaScreen() {
  const [sections, setSections] = useState([]);
  const [filter, setFilter] = useState('all');

  const reload = useCallback(async () => {
    const all = await loadEvents();
    const today = startOfDay(new Date());
    let filtered = all;
    if (filter === 'upcoming') filtered = all.filter(e => { try { return isAfter(parseISO(e.date), today); } catch { return true; }});
    if (filter !== 'all' && filter !== 'upcoming') filtered = all.filter(e => e.type === filter);
    const byDate = {};
    for (const ev of filtered) {
      const key = ev.date?.substring(0, 7) || 'Nieznana data';
      if (!byDate[key]) byDate[key] = [];
      byDate[key].push(ev);
    }
    const sorted = Object.keys(byDate).sort().map(k => ({
      title: (() => { try { return format(parseISO(k + '-01'), 'LLLL yyyy', { locale: pl }); } catch { return k; }})(),
      data: byDate[k].sort((a,b) => (a.date||'').localeCompare(b.date||''))
    }));
    setSections(sorted);
  }, [filter]);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const deleteEvent = async (ev) => {
    Alert.alert('Usuń', `Usunąć "${ev.title}"?`, [
      { text: 'Anuluj' },
      { text: 'Usuń', style: 'destructive', onPress: async () => {
        const all = await loadEvents();
        const updated = all.filter(e => e.id !== ev.id);
        await cancelNotification(ev.id);
        await saveEvents(updated);
        reload();
      }}
    ]);
  };

  const filters = [
    { key: 'all', label: 'Wszystko' },
    { key: 'upcoming', label: 'Nadchodzące' },
    { key: 'task', label: 'Zadania' },
    { key: 'holiday', label: 'Urlopy' },
    { key: 'work', label: 'Praca' },
    { key: 'reminder', label: 'Przypomnienia' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.filterBar}>
        {filters.map(f => (
          <TouchableOpacity key={f.key} style={[styles.filterChip, filter === f.key && styles.filterActive]} onPress={() => setFilter(f.key)}>
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <SectionList
        sections={sections}
        keyExtractor={item => item.id || item.title + item.date}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListEmptyComponent={<Text style={styles.empty}>Brak wpisów</Text>}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <View style={[styles.card, { borderLeftColor: TYPE_COLOR[item.type] }]}>
            <View style={[styles.iconBg, { backgroundColor: TYPE_COLOR[item.type] + '18' }]}>
              <Ionicons name={TYPE_ICON[item.type]} size={20} color={TYPE_COLOR[item.type]} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDate}>{item.date}{item.time ? ' · ' + item.time : ''}</Text>
              {item.notes ? <Text style={styles.cardNotes}>{item.notes}</Text> : null}
            </View>
            <TouchableOpacity onPress={() => deleteEvent(item)} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={18} color="#ccc" />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FF' },
  filterBar: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', flexWrap: 'wrap' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#F8F9FF' },
  filterActive: { backgroundColor: '#4F6AF5', borderColor: '#4F6AF5' },
  filterText: { fontSize: 13, color: '#555', fontWeight: '500' },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  sectionHeader: { fontSize: 14, fontWeight: '700', color: '#4F6AF5', textTransform: 'capitalize', marginTop: 16, marginBottom: 8 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 3, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  iconBg: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
  cardDate: { fontSize: 13, color: '#888', marginTop: 2 },
  cardNotes: { fontSize: 13, color: '#aaa', marginTop: 2 },
  deleteBtn: { padding: 8 },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 48, fontSize: 16 },
});
