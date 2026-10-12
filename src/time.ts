export const pad = (n: number) => String(n).padStart(2, '0');

/** Local date key, "YYYY-MM-DD". */
export function dateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function nextDateKey(key: string): string {
  return dateKey(addDays(parseDateKey(key), 1));
}

/** Combine a date key and "HH:MM" into a local Date. */
export function atTime(key: string, hhmm: string): Date {
  const d = parseDateKey(key);
  const [h, m] = hhmm.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d;
}

export function isValidHHMM(s: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
}

/** Accepts "7:5", "730", "07:30" etc. and returns "HH:MM" or null. */
export function normalizeHHMM(input: string): string | null {
  const s = input.trim();
  let h: number;
  let m: number;
  const colon = s.match(/^(\d{1,2}):(\d{1,2})$/);
  const digits = s.match(/^(\d{3,4})$/);
  if (colon) {
    h = Number(colon[1]);
    m = Number(colon[2]);
  } else if (digits) {
    h = Number(s.slice(0, -2));
    m = Number(s.slice(-2));
  } else {
    return null;
  }
  if (h > 23 || m > 59) return null;
  return `${pad(h)}:${pad(m)}`;
}

export function formatTime(d: Date | string): string {
  const x = typeof d === 'string' ? new Date(d) : d;
  const h = x.getHours();
  const suffix = h >= 12 ? 'pm' : 'am';
  return `${h % 12 || 12}:${pad(x.getMinutes())} ${suffix}`;
}

export function formatHHMM(hhmm: string): string {
  return formatTime(atTime('2000-01-01', hhmm));
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function formatDateLong(key: string): string {
  const d = parseDateKey(key);
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
