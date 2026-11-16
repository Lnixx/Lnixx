export const TIMES = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

export const BOOKING_WINDOW_DAYS = 7;

/** The bookable dates (YYYY-MM-DD), starting today. */
export function upcomingDates(count = BOOKING_WINDOW_DAYS, now = new Date()): string[] {
  const dates: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

/** Slots on `date` that have not already started. */
export function slotsNotStarted(date: string, now = new Date()): string[] {
  if (date !== now.toISOString().slice(0, 10)) return TIMES;
  const current = now.toISOString().slice(11, 16);
  return TIMES.filter((t) => t > current);
}
