import * as Notifications from 'expo-notifications';
import { parseISO } from 'date-fns';

export async function scheduleNotification(event) {
  try {
    if (!event.date || event.date.includes('X')) return;
    const [h, m] = (event.time || '09:00').split(':').map(Number);
    const date = parseISO(event.date);
    date.setHours(h, m, 0, 0);
    if (date <= new Date()) return;
    await Notifications.scheduleNotificationAsync({
      identifier: event.id || event.title,
      content: {
        title: '📅 ' + event.title,
        body: event.notes || 'Masz zaplanowane wydarzenie',
        data: { eventId: event.id },
      },
      trigger: { date },
    });
  } catch (e) { console.log('Notification error:', e); }
}

export async function cancelNotification(id) {
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {}
}
