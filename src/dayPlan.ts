import { atTime, parseDateKey } from './time';
import { DayPlan, EventAction, EventInstance, Routine } from './types';

export const SNOOZE_MINUTES = 10;

export function routineForDate(routines: Routine[], key: string): Routine | undefined {
  const weekday = parseDateKey(key).getDay();
  return routines.find((r) => r.days.includes(weekday));
}

/**
 * Build the plan for a date from its routine template. If `previous` is a plan for the
 * same date, logged progress (and pending snoozes) is carried over so template edits
 * don't wipe out what already happened today.
 */
export function buildPlan(routines: Routine[], key: string, previous?: DayPlan | null): DayPlan {
  const routine = routineForDate(routines, key);
  const prevEvents = previous && previous.date === key ? previous.events : [];
  const prevById = new Map(prevEvents.map((e) => [e.id, e]));

  const events: EventInstance[] = (routine?.events ?? []).map((t) => {
    const id = `${key}-${t.id}`;
    const prev = prevById.get(id);
    const base: EventInstance = {
      id,
      templateId: t.id,
      title: t.title,
      icon: t.icon,
      category: t.category,
      plannedStart: atTime(key, t.time).toISOString(),
      durationMin: t.durationMin,
      remindBeforeMin: t.remindBeforeMin,
      status: 'pending',
    };
    if (!prev) return base;
    if (prev.status !== 'pending') {
      return { ...base, status: prev.status, actualStart: prev.actualStart, actualEnd: prev.actualEnd };
    }
    return prev.snoozedUntil ? { ...base, snoozedUntil: prev.snoozedUntil } : base;
  });

  // Keep logged events whose template was removed, so history isn't lost.
  const kept = new Set(events.map((e) => e.id));
  for (const e of prevEvents) {
    if (!kept.has(e.id) && e.status !== 'pending') events.push(e);
  }

  events.sort((a, b) => a.plannedStart.localeCompare(b.plannedStart));
  return { date: key, routineId: routine?.id, events };
}

export function applyAction(plan: DayPlan, eventId: string, action: EventAction, now: Date): DayPlan {
  const iso = now.toISOString();
  const events = plan.events.map((e): EventInstance => {
    if (e.id !== eventId) return e;
    switch (action) {
      case 'start':
        return { ...e, status: 'active', actualStart: iso, actualEnd: undefined, snoozedUntil: undefined };
      case 'done':
        return { ...e, status: 'done', actualStart: e.actualStart ?? iso, actualEnd: iso, snoozedUntil: undefined };
      case 'skip':
        return { ...e, status: 'skipped', actualStart: undefined, actualEnd: undefined, snoozedUntil: undefined };
      case 'snooze':
        return {
          ...e,
          status: 'pending',
          snoozedUntil: new Date(now.getTime() + SNOOZE_MINUTES * 60_000).toISOString(),
        };
      case 'undo':
        return { ...e, status: 'pending', actualStart: undefined, actualEnd: undefined, snoozedUntil: undefined };
    }
  });
  return { ...plan, events };
}

/** When the reminder for an event should fire, or null if it shouldn't. */
export function reminderTime(e: EventInstance): Date | null {
  if (e.status !== 'pending') return null;
  if (e.snoozedUntil) return new Date(e.snoozedUntil);
  return new Date(new Date(e.plannedStart).getTime() - e.remindBeforeMin * 60_000);
}
