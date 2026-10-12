export type Category = 'meal' | 'sleep' | 'hygiene' | 'meds' | 'activity';

/** A recurring event in a routine template, e.g. "Lunch at 12:00". */
export interface EventTemplate {
  id: string;
  title: string;
  icon: string;
  category: Category;
  /** Local time of day, "HH:MM" (24h). */
  time: string;
  durationMin: number;
  /** Minutes before the start time to send a reminder (0 = at start). */
  remindBeforeMin: number;
}

/** A named routine that applies on certain weekdays (0 = Sunday ... 6 = Saturday). */
export interface Routine {
  id: string;
  name: string;
  days: number[];
  events: EventTemplate[];
}

export type EventStatus = 'pending' | 'active' | 'done' | 'skipped';

/** A concrete event for a specific day, generated from a template. */
export interface EventInstance {
  /** Deterministic: `${date}-${templateId}` */
  id: string;
  templateId: string;
  title: string;
  icon: string;
  category: Category;
  /** ISO timestamp */
  plannedStart: string;
  durationMin: number;
  remindBeforeMin: number;
  status: EventStatus;
  actualStart?: string;
  actualEnd?: string;
  /** ISO timestamp of a snoozed reminder */
  snoozedUntil?: string;
}

export interface DayPlan {
  /** "YYYY-MM-DD" local date */
  date: string;
  routineId?: string;
  events: EventInstance[];
}

export type EventAction = 'start' | 'done' | 'skip' | 'snooze' | 'undo';
