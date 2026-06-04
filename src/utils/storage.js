import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'calendar_events';

export async function loadEvents() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function saveEvents(events) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(events));
  } catch {}
}
