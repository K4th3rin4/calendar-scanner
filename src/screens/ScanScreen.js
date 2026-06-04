
import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ScrollView, ActivityIndicator, Alert, Linking
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { saveEvents, loadEvents } from "../utils/storage";
import { scheduleEventNotifications } from "../utils/notifications";
import EventFormModal from "../components/EventFormModal";

const ANTHROPIC_API_KEY = "ANTHROPIC_API_KEY_PLACEHOLDER";

export default function ScanScreen({ navigation }) {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const pickImage = async (useCamera = false) => {
    let result;
    if (useCamera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) { Alert.alert("Brak uprawnień", "Potrzebny jest dostęp do aparatu."); return; }
      result = await ImagePicker.launchCameraAsync({ quality: 0.85, base64: true });
    } else {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { Alert.alert("Brak uprawnień", "Potrzebny jest dostęp do galerii."); return; }
      result = await ImagePicker.launchImageLibraryAsync({ quality: 0.85, base64: true });
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
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-opus-4-5",
          max_tokens: 2000,
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: "image/jpeg", data: image.base64 } },
              {
                type: "text",
                text: `Przeanalizuj ten kalendarz (papierowy lub zrzut ekranu z aplikacji kalendarza) i wyodrębnij WSZYSTKIE widoczne wpisy, wydarzenia i zadania.
Dla każdego podaj:
- date: "YYYY-MM-DD" (jeśli nieczytelna: "2025-XX-XX")
- title: opis/nazwa
- time: "HH:MM" jeśli widoczna, null jeśli nie
- type: "task"|"holiday"|"work"|"reminder"|"other"
- notes: dodatkowe info lub null

Odpowiedz WYŁĄCZNIE JSON, bez żadnego innego tekstu:
[{"date":"2025-06-15","title":"Spotkanie z lekarzem","time":"10:00","type":"reminder","notes":null}]`
              }
            ]
          }]
        })
      });
      const data = await resp.json();
      const text = data.content?.[0]?.text || "[]";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResults(parsed.map((e, i) => ({ ...e, id: `scan_${Date.now()}_${i}`, reminders: ["30min"] })));
    } catch (e) {
      Alert.alert("Błąd", "Nie udało się przeanalizować zdjęcia. Sprawdź klucz API i połączenie.");
      console.log(e);
    }
    setLoading(false);
  };

  const openEdit = (index) => {
    setEditingIndex(index);
    setModalVisible(true);
  };

  const handleSaveEdit = (updated) => {
    const newResults = [...results];
    newResults[editingIndex] = updated;
    setResults(newResults);
    setModalVisible(false);
  };

  const removeItem = (index) => {
    setResults(results.filter((_, i) => i !== index));
  };

  const saveAll = async () => {
    const existing = await loadEvents();
    const merged = [...existing, ...results];
    await saveEvents(merged);
    for (const ev of results) {
      if (ev.date && !ev.date.includes("X")) {
        await scheduleEventNotifications(ev);
      }
    }
    Alert.alert("Zapisano!", `Dodano ${results.length} wpisów do kalendarza.`, [
      { text: "OK", onPress: () => navigation.navigate("Kalendarz") }
    ]);
  };

  const openGoogleCalendarAuth = () => {
    Alert.alert(
      "Import z Google Calendar",
      "Aby zaimportować wydarzenia z Google Calendar:\n\n1. Otwórz Google Calendar na telefonie\n2. Zrób zrzut ekranu miesiąca\n3. Wróć tutaj i użyj \"Galeria\" aby wgrać ten zrzut\n\nLub użyj opcji \"Synchronizacja\" poniżej aby połączyć konto Google (wymaga skonfigurowania OAuth w app.json).",
      [
        { text: "Rozumiem", style: "cancel" },
        { text: "Otwórz Google Calendar", onPress: () => Linking.openURL("https://calendar.google.com") }
      ]
    );
  };

  const TYPE_COLOR = { task:"#4F6AF5", holiday:"#22C55E", work:"#F59E0B", reminder:"#EF4444", other:"#8B5CF6" };
  const TYPE_LABEL = { task:"✅ Zadanie", holiday:"🏖️ Urlop", work:"💼 Praca", reminder:"🔔 Przypomnienie", other:"📌 Inne" };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.heroCard}>
        <Ionicons name="scan-outline" size={40} color="#4F6AF5" />
        <Text style={s.heroTitle}>Skanuj kalendarz</Text>
        <Text style={s.heroSub}>Zrób zdjęcie papierowego kalendarza lub wgraj zrzut ekranu z dowolnej aplikacji kalendarza</Text>
      </View>

      <View style={s.buttonGrid}>
        <TouchableOpacity style={s.btnPrimary} onPress={() => pickImage(true)}>
          <Ionicons name="camera" size={22} color="#fff" />
          <Text style={s.btnTextW}>Aparat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.btnSecondary} onPress={() => pickImage(false)}>
          <Ionicons name="images" size={22} color="#4F6AF5" />
          <Text style={s.btnTextB}>Galeria / Plik</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.btnGoogle} onPress={openGoogleCalendarAuth}>
          <Ionicons name="logo-google" size={22} color="#EA4335" />
          <Text style={s.btnTextG}>Google Cal</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.btnOutlook} onPress={() => Linking.openURL("https://outlook.live.com/calendar")}>
          <Ionicons name="calendar" size={22} color="#0078D4" />
          <Text style={s.btnTextO}>Outlook</Text>
        </TouchableOpacity>
      </View>

      {image && (
        <View style={s.imageContainer}>
          <Image source={{ uri: image.uri }} style={s.preview} resizeMode="contain" />
          <TouchableOpacity style={s.analyzeBtn} onPress={analyzeImage} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <><Ionicons name="sparkles" size={20} color="#fff" /><Text style={s.analyzeBtnText}>Analizuj z AI</Text></>}
          </TouchableOpacity>
        </View>
      )}

      {results.length > 0 && (
        <View style={s.resultsSection}>
          <Text style={s.sectionTitle}>Znalezione wpisy ({results.length})</Text>
          {results.map((item, i) => (
            <View key={i} style={s.resultCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={[s.typeBadge, { backgroundColor: TYPE_COLOR[item.type] + "22" }]}>
                  <Text style={[s.typeText, { color: TYPE_COLOR[item.type] }]}>{TYPE_LABEL[item.type]}</Text>
                </View>
                <TouchableOpacity onPress={() => removeItem(i)} style={s.deleteBtn}>
                  <Ionicons name="trash" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
              <Text style={s.itemDate}>{item.date}{item.time ? " · " + item.time : ""}</Text>
              <Text style={s.itemTitle}>{item.title}</Text>
              {item.notes ? <Text style={s.itemNotes}>{item.notes}</Text> : null}
              <TouchableOpacity onPress={() => openEdit(i)} style={s.editBtn}>
                <Ionicons name="pencil" size={15} color="#4F6AF5" />
                <Text style={s.editBtnText}>Edytuj</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={s.saveAllBtn} onPress={saveAll}>
            <Ionicons name="checkmark-circle" size={22} color="#fff" />
            <Text style={s.saveAllText}>Zapisz wszystkie do kalendarza</Text>
          </TouchableOpacity>
        </View>
      )}

      <EventFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveEdit}
        initial={editingIndex !== null ? results[editingIndex] : null}
      />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FF" },
  content: { padding: 16, paddingBottom: 40 },
  heroCard: { backgroundColor: "#fff", borderRadius: 16, padding: 24, alignItems: "center", marginBottom: 20, elevation: 2 },
  heroTitle: { fontSize: 20, fontWeight: "700", color: "#1a1a2e", marginTop: 12 },
  heroSub: { fontSize: 14, color: "#666", textAlign: "center", marginTop: 8, lineHeight: 20 },
  buttonGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  btnPrimary: { flex: 1, minWidth: "45%", backgroundColor: "#4F6AF5", borderRadius: 12, padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  btnSecondary: { flex: 1, minWidth: "45%", backgroundColor: "#fff", borderRadius: 12, padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1.5, borderColor: "#4F6AF5" },
  btnGoogle: { flex: 1, minWidth: "45%", backgroundColor: "#fff", borderRadius: 12, padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1.5, borderColor: "#EA4335" },
  btnOutlook: { flex: 1, minWidth: "45%", backgroundColor: "#fff", borderRadius: 12, padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1.5, borderColor: "#0078D4" },
  btnTextW: { color: "#fff", fontWeight: "600", fontSize: 15 },
  btnTextB: { color: "#4F6AF5", fontWeight: "600", fontSize: 15 },
  btnTextG: { color: "#EA4335", fontWeight: "600", fontSize: 15 },
  btnTextO: { color: "#0078D4", fontWeight: "600", fontSize: 15 },
  imageContainer: { marginBottom: 20 },
  preview: { width: "100%", height: 240, borderRadius: 12, backgroundColor: "#eee" },
  analyzeBtn: { backgroundColor: "#4F6AF5", borderRadius: 12, padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12 },
  analyzeBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  resultsSection: { marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a2e", marginBottom: 12 },
  resultCard: { backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2 },
  typeBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 6 },
  typeText: { fontSize: 12, fontWeight: "600" },
  itemDate: { fontSize: 13, color: "#888", marginBottom: 4 },
  itemTitle: { fontSize: 15, color: "#1a1a2e", fontWeight: "500" },
  itemNotes: { fontSize: 13, color: "#999", marginTop: 2 },
  editBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#4F6AF510", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignSelf: "flex-start", marginTop: 10 },
  editBtnText: { color: "#4F6AF5", fontWeight: "500", fontSize: 13 },
  deleteBtn: { padding: 6, backgroundColor: "#EF444410", borderRadius: 8 },
  saveAllBtn: { backgroundColor: "#22C55E", borderRadius: 12, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 },
  saveAllText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
