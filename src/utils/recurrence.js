
import { addDays, addWeeks, addMonths, addYears, parseISO, format, isAfter, isBefore } from "date-fns";

/**
 * Generate all occurrences of a recurring event within a date range.
 * event.recurrence = { type: "daily"|"weekly"|"monthly"|"yearly", until: "YYYY-MM-DD"|null, count: number|null }
 */
export function expandRecurringEvent(event, rangeStart, rangeEnd) {
  if (!event.recurrence || !event.date) return [event];

  const results = [];
  let current = parseISO(event.date);
  const end = rangeEnd ? parseISO(rangeEnd) : addYears(new Date(), 2);
  const until = event.recurrence.until ? parseISO(event.recurrence.until) : end;
  const maxCount = event.recurrence.count || 500;
  let count = 0;

  while (!isAfter(current, until) && !isAfter(current, end) && count < maxCount) {
    const dateStr = format(current, "yyyy-MM-dd");
    const inRange = !rangeStart || !isBefore(current, parseISO(rangeStart));
    if (inRange) {
      results.push({
        ...event,
        date: dateStr,
        id: `${event.id}_${dateStr}`,
        isOccurrence: true,
        originalId: event.id,
      });
    }
    count++;
    switch (event.recurrence.type) {
      case "daily":   current = addDays(current, 1);    break;
      case "weekly":  current = addWeeks(current, 1);   break;
      case "monthly": current = addMonths(current, 1);  break;
      case "yearly":  current = addYears(current, 1);   break;
      default: return results;
    }
  }
  return results;
}

export const RECURRENCE_LABELS = {
  none:    "Nie powtarza się",
  daily:   "Codziennie",
  weekly:  "Co tydzień",
  monthly: "Co miesiąc",
  yearly:  "Co rok",
};
