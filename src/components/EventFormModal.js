
import React, { useState, useEffect } from "react";
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Switch
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RECURRENCE_LABELS } from "../utils/recurrence";
import { reminderLabel } from "../utils/notifications";

const TYPE_COLOR = { task:"#4F6AF5", holiday:"#22C55E", work:"#F59E0B", reminder:"#EF4444", other:"#8B5CF6" };
const TYPE_LABEL = { task:"Zadanie", holiday:"Urlop", work:"Praca", reminder:"Przypomnienie", other:"Inne" };
const REMINDER_OPTIONS = ["10min","30min","1h","2h","1day","2days","1week"];
const RECURRENCE_OPTIONS = ["none","daily","weekly","monthly","yearly"];

export default function EventFormModal({ visible, onClose, onSave, initial }) {
  const [form, setForm] = useState({
    title: "", date: "", time: "09:00", type: "task",
    notes: "", recurrence: "none", recurrenceUntil: "",
    reminders: ["30min"]
  });

  useEffect(() => {
    if (initial) {
      setForm({
        title: initial.title || "",
        date: initial.date || "",
        time: initial.time || "09:00",
        type: initial.type || "task",
        notes: initial.notes || "",
        recurrence: initial.recurrence?.type || "none",
        recurrenceUntil: initial.recurrence?.until || "",
        reminders: initial.reminders || ["30min"],
      });
    } else {
      setForm({ title:"", date:"", time:"09:00", type:"task", notes:"", recurrence:"none", recurrenceUntil:"", reminders:["30min"] });
    }
  }, [initial, visible]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleReminder = (key) => {
    setForm(f => ({
      ...f,
      reminders: f.reminders.includes(key)
        ? f.reminders.filter(r => r !== key)
        : [...f.reminders, key]
    }));
  };

  const handleSave = () => {
    if (!form.title.trim()) return;
    const event = {
      ...(initial || {}),
      title: form.title.trim(),
      date: form.date,
      time: form.time,
      type: form.type,
      notes: form.notes,
      reminders: form.reminders,
      recurrence: form.recurrence !== "none" ? {
        type: form.recurrence,
        until: form.recurrenceUntil || null,
      } : null,
    };
    onSave(event);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <ScrollView style={s.card} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={s.header}>
            <Text style={s.title}>{initial ? "Edytuj wpis" : "Nowy wpis"}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#666" /></TouchableOpacity>
          </View>

          <Label>Tytuł *</Label>
          <TextInput style={s.input} value={form.title} onChangeText={v => set("title", v)} placeholder="Nazwa zadania..." />

          <View style={s.row2}>
            <View style={{ flex: 1 }}>
              <Label>Data</Label>
              <TextInput style={s.input} value={form.date} onChangeText={v => set("date", v)} placeholder="2025-06-15" />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ width: 90 }}>
              <Label>Godzina</Label>
              <TextInput style={s.input} value={form.time} onChangeText={v => set("time", v)} placeholder="09:00" />
            </View>
          </View>

          <Label>Typ</Label>
          <View style={s.chipRow}>
            {Object.entries(TYPE_LABEL).map(([k, v]) => (
              <TouchableOpacity key={k}
                style={[s.chip, form.type === k && { backgroundColor: TYPE_COLOR[k], borderColor: TYPE_COLOR[k] }]}
                onPress={() => set("type", k)}>
                <Text style={[s.chipText, form.type === k && { color: "#fff" }]}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Label>Powtarzanie</Label>
          <View style={s.chipRow}>
            {RECURRENCE_OPTIONS.map(k => (
              <TouchableOpacity key={k}
                style={[s.chip, form.recurrence === k && { backgroundColor: "#4F6AF5", borderColor: "#4F6AF5" }]}
                onPress={() => set("recurrence", k)}>
                <Text style={[s.chipText, form.recurrence === k && { color: "#fff" }]}>{RECURRENCE_LABELS[k]}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {form.recurrence !== "none" && (
            <>
              <Label>Powtarzaj do (opcjonalnie)</Label>
              <TextInput style={s.input} value={form.recurrenceUntil} onChangeText={v => set("recurrenceUntil", v)} placeholder="2026-12-31" />
            </>
          )}

          <Label>Powiadomienia</Label>
          <View style={s.chipRow}>
            {REMINDER_OPTIONS.map(k => (
              <TouchableOpacity key={k}
                style={[s.chip, form.reminders.includes(k) && { backgroundColor: "#EF4444", borderColor: "#EF4444" }]}
                onPress={() => toggleReminder(k)}>
                <Text style={[s.chipText, form.reminders.includes(k) && { color: "#fff" }]}>{reminderLabel(k)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Label>Notatki</Label>
          <TextInput style={[s.input, { height: 70 }]} value={form.notes} onChangeText={v => set("notes", v)} multiline placeholder="Opcjonalne notatki..." />

          <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
            <Ionicons name="checkmark-circle" size={22} color="#fff" />
            <Text style={s.saveBtnText}>Zapisz</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const Label = ({ children }) => <Text style={s.label}>{children}</Text>;

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  card: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: "92%" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { fontSize: 20, fontWeight: "700", color: "#1a1a2e" },
  label: { fontSize: 13, fontWeight: "600", color: "#666", marginBottom: 6, marginTop: 14 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, fontSize: 15, backgroundColor: "#F8F9FF" },
  row2: { flexDirection: "row", alignItems: "flex-end" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: "#ddd", backgroundColor: "#F8F9FF" },
  chipText: { fontSize: 13, color: "#555", fontWeight: "500" },
  saveBtn: { backgroundColor: "#4F6AF5", borderRadius: 12, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 20 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
