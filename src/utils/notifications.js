
import * as Notifications from "expo-notifications";
import { parseISO, subMinutes, subHours, subDays, subWeeks } from "date-fns";

export async function scheduleEventNotifications(event) {
  if (!event.date || event.date.includes("X")) return;
  try {
    const [h, m] = (event.time || "09:00").split(":").map(Number);
    const eventDate = parseISO(event.date);
    eventDate.setHours(h, m, 0, 0);

    const reminders = event.reminders || ["30min"];

    for (const reminder of reminders) {
      let triggerDate;
      switch (reminder) {
        case "10min":  triggerDate = subMinutes(eventDate, 10);  break;
        case "30min":  triggerDate = subMinutes(eventDate, 30);  break;
        case "1h":     triggerDate = subHours(eventDate, 1);     break;
        case "2h":     triggerDate = subHours(eventDate, 2);     break;
        case "1day":   triggerDate = subDays(eventDate, 1);      break;
        case "2days":  triggerDate = subDays(eventDate, 2);      break;
        case "1week":  triggerDate = subWeeks(eventDate, 1);     break;
        default:       triggerDate = subMinutes(eventDate, 30);
      }
      if (triggerDate <= new Date()) continue;

      const id = `${event.id}_${reminder}`;
      await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
      await Notifications.scheduleNotificationAsync({
        identifier: id,
        content: {
          title: "📅 " + event.title,
          body: reminderLabel(reminder) + (event.notes ? " · " + event.notes : ""),
          data: { eventId: event.id },
        },
        trigger: { date: triggerDate },
      });
    }
  } catch (e) {
    console.log("Notification error:", e);
  }
}

export function reminderLabel(key) {
  const map = {
    "10min": "Za 10 minut",
    "30min": "Za 30 minut",
    "1h":    "Za 1 godzinę",
    "2h":    "Za 2 godziny",
    "1day":  "Jutro",
    "2days": "Za 2 dni",
    "1week": "Za tydzień",
  };
  return map[key] || "";
}

export async function cancelEventNotifications(eventId) {
  const keys = ["10min","30min","1h","2h","1day","2days","1week"];
  for (const k of keys) {
    await Notifications.cancelScheduledNotificationAsync(`${eventId}_${k}`).catch(() => {});
  }
}

// Legacy single notification (for scanned events without explicit reminders)
export async function scheduleNotification(event) {
  return scheduleEventNotifications({ ...event, reminders: event.reminders || ["30min"] });
}

export async function cancelNotification(id) {
  return cancelEventNotifications(id);
}
