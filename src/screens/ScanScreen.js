import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ScrollView, ActivityIndicator, Alert, TextInput, Modal
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { saveEvents } from '../utils/storage';
import { scheduleNotification } from '../utils/notifications';

export default function ScanScreen({ navigation }) {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editText, setEditText] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editType, setEditType] = useState('task');
  const [modalVisible, setModalVisible] = useState(false);

  const pickImage = async (useCamera = false) => {
    let result;
    if (useCamera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) { Alert.alert('Brak uprawnień', 'Potrzebny jest dostęp do aparatu.'); return; }
      result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, base64: true });
    } else {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { Alert.alert('Brak uprawnień', 'Potrzebny jest dostęp do galerii.'); return; }
      result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, base64: true });
    }
    if (!result.canceled) {
      setImage(result.assets[0]);
      setResults([]);
    }
  };

  const analyzeImage = async () => {
    if (!image?.base64) return;
    setLoading(true);
    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'ANTHROPIC_API_KEY_PLACEHOLDER',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-opus-4-5',
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: 'image/jpeg', data: image.base64 }
              },
              {
                type: 'text',
                text: `Przeanalizuj ten kalendarz papierowy i wyodrębnij wszystkie wpisy. Dla każdego wpisu podaj:
- datę (format YYYY-MM-DD)
- tytuł/opis zadania
- typ: "task" (zadanie), "holiday" (urlop/wolne), "work" (praca/dyżur), "reminder" (przypomnienie), "other" (inne)

Odpowiedz TYLKO w formacie JSON jako tablica obiektów:
[{"date": "2025-06-15", "title": "Opis zadania", "type": "task"}, ...]

Jeśli data jest nieczytelna, użyj formatu "2025-XX-XX". Wyodrębnij WSZYSTKIE widoczne wpisy.`
              }
            ]
          }]
        })
      });
      const data = await resp.json();
      const text = data.content?.[0]?.text || '[]';
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setResults(parsed);
    } catch (e) {
      Alert.alert('Błąd', 'Nie udało się przeanalizować zdjęcia. Sprawdź połączenie z internetem.');
    }
    setLoading(false);
  };

  const openEdit = (index) => {
    setEditingIndex(index);
    setEditText(results[index].title);
    setEditDate(results[index].date);
    setEditType(results[index].type);
    setModalVisible(true);
  };

  const saveEdit = () => {
    const updated = [...results];
    updated[editingIndex] = { ...updated[editingIndex], title: editText, date: editDate, type: editType };
    setResults(updated);
    setModalVisible(false);
  };

  const removeItem = (index) => {
    setResults(results.filter((_, i) => i !== index));
  };

  const saveAll = async () => {
    await saveEvents(results);
    for (const ev of results) {
      if (ev.date && !ev.date.includes('X')) {
        await scheduleNotification(ev);
      }
    }
    Alert.alert('Zapisano!', `Dodano ${results.length} wpisów do kalendarza.`, [
      { text: 'OK', onPress: () => navigation.navigate('Kalendarz') }
    ]);
  };

  const typeLabel = { task: '✅ Zadanie', holiday: '🏖️ Urlop', work: '💼 Praca', reminder: '🔔 Przypomnienie', other: '📌 Inne' };
  const typeColor = { task: '#4F6AF5', holiday: '#22C55E', work: '#F59E0B', reminder: '#EF4444', other: '#8B5CF6' };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Ionicons name="scan-outline" size={40} color="#4F6AF5" />
        <Text style={styles.heroTitle}>Zeskanuj kalendarz</Text>
        <Text style={styles.heroSub}>Zrób zdjęcie papierowego kalendarza, a AI automatycznie odczyta wszystkie wpisy</Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.btnPrimary} onPress={() => pickImage(true)}>
          <Ionicons name="camera" size={22} color="#fff" />
          <Text style={styles.btnText}>Aparat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSecondary} onPress={() => pickImage(false)}>
          <Ionicons name="images" size={22} color="#4F6AF5" />
          <Text style={styles.btnTextSec}>Galeria</Text>
        </TouchableOpacity>
      </View>

      {image && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: image.uri }} style={styles.preview} resizeMode="contain" />
          <TouchableOpacity style={styles.analyzeBtn} onPress={analyzeImage} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <><Ionicons name="sparkles" size={20} color="#fff" /><Text style={styles.analyzeBtnText}>Analizuj z AI</Text></>}
          </TouchableOpacity>
        </View>
      )}

      {results.length > 0 && (
        <View style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>Znalezione wpisy ({results.length})</Text>
          {results.map((item, i) => (
            <View key={i} style={styles.resultCard}>
              <View style={[styles.typeBadge, { backgroundColor: typeColor[item.type] + '22' }]}>
                <Text style={[styles.typeText, { color: typeColor[item.type] }]}>{typeLabel[item.type]}</Text>
              </View>
              <Text style={styles.itemDate}>{item.date}</Text>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity onPress={() => openEdit(i)} style={styles.editBtn}>
                  <Ionicons name="pencil" size={16} color="#4F6AF5" />
                  <Text style={styles.editBtnText}>Edytuj</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeItem(i)} style={styles.deleteBtn}>
                  <Ionicons name="trash" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <TouchableOpacity style={styles.saveAllBtn} onPress={saveAll}>
            <Ionicons name="checkmark-circle" size={22} color="#fff" />
            <Text style={styles.saveAllText}>Zapisz wszystkie do kalendarza</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edytuj wpis</Text>
            <Text style={styles.label}>Data (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} value={editDate} onChangeText={setEditDate} placeholder="2025-06-15" />
            <Text style={styles.label}>Opis</Text>
            <TextInput style={[styles.input, {height: 80}]} value={editText} onChangeText={setEditText} multiline />
            <Text style={styles.label}>Typ</Text>
            <View style={styles.typeRow}>
              {Object.entries(typeLabel).map(([key, label]) => (
                <TouchableOpacity key={key} style={[styles.typeChip, editType === key && styles.typeChipActive]} onPress={() => setEditType(key)}>
                  <Text style={[styles.typeChipText, editType === key && styles.typeChipTextActive]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={saveEdit}>
                <Text style={styles.confirmText}>Zapisz</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FF' },
  content: { padding: 16, paddingBottom: 40 },
  heroCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20, shadowColor: '#4F6AF5', shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
  heroTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a2e', marginTop: 12 },
  heroSub: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  buttonRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  btnPrimary: { flex: 1, backgroundColor: '#4F6AF5', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnSecondary: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: '#4F6AF5' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  btnTextSec: { color: '#4F6AF5', fontWeight: '600', fontSize: 16 },
  imageContainer: { marginBottom: 20 },
  preview: { width: '100%', height: 240, borderRadius: 12, backgroundColor: '#eee' },
  analyzeBtn: { backgroundColor: '#4F6AF5', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 },
  analyzeBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  resultsSection: { marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 12 },
  resultCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 6 },
  typeText: { fontSize: 12, fontWeight: '600' },
  itemDate: { fontSize: 13, color: '#888', marginBottom: 4 },
  itemTitle: { fontSize: 15, color: '#1a1a2e', fontWeight: '500' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#4F6AF510', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  editBtnText: { color: '#4F6AF5', fontWeight: '500', fontSize: 13 },
  deleteBtn: { padding: 6, backgroundColor: '#EF444410', borderRadius: 8 },
  saveAllBtn: { backgroundColor: '#22C55E', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
  saveAllText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a2e', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 15, backgroundColor: '#F8F9FF' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#ddd' },
  typeChipActive: { backgroundColor: '#4F6AF5', borderColor: '#4F6AF5' },
  typeChipText: { fontSize: 12, color: '#666' },
  typeChipTextActive: { color: '#fff', fontWeight: '600' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  cancelText: { color: '#666', fontWeight: '600' },
  confirmBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#4F6AF5', alignItems: 'center' },
  confirmText: { color: '#fff', fontWeight: '700' },
});
