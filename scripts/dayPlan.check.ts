/**
 * Logic checks for the day plan. Run with: npm run test:logic
 */
import assert from 'node:assert/strict';
import { applyAction, buildPlan, reminderTime, routineForDate } from '../src/dayPlan';
import { defaultRoutines } from '../src/defaultRoutines';
import { atTime, nextDateKey, normalizeHHMM } from '../src/time';

const MONDAY = '2026-10-12';
const SATURDAY = '2026-10-17';

// Routine selection by weekday
assert.equal(routineForDate(defaultRoutines, MONDAY)?.id, 'weekday');
assert.equal(routineForDate(defaultRoutines, SATURDAY)?.id, 'weekend');
assert.equal(nextDateKey('2026-12-31'), '2027-01-01');

// Plan generation
const plan = buildPlan(defaultRoutines, MONDAY);
assert.equal(plan.events.length, defaultRoutines[0].events.length);
assert.equal(plan.events[0].templateId, 'wake');
assert.equal(plan.events[0].id, `${MONDAY}-wake`);
for (let i = 1; i < plan.events.length; i++) {
  assert.ok(plan.events[i - 1].plannedStart <= plan.events[i].plannedStart, 'events sorted');
}

// Actions
const now = atTime(MONDAY, '12:50');
let p = applyAction(plan, `${MONDAY}-nap`, 'start', now);
let nap = p.events.find((e) => e.templateId === 'nap')!;
assert.equal(nap.status, 'active');
assert.equal(reminderTime(nap), null, 'no reminder for active events');

p = applyAction(p, nap.id, 'done', atTime(MONDAY, '14:40'));
nap = p.events.find((e) => e.templateId === 'nap')!;
assert.equal(nap.status, 'done');
assert.equal(nap.actualStart, now.toISOString(), 'done keeps start time');

p = applyAction(p, `${MONDAY}-dinner`, 'snooze', atTime(MONDAY, '17:20'));
const dinner = p.events.find((e) => e.templateId === 'dinner')!;
assert.equal(reminderTime(dinner)?.getTime(), atTime(MONDAY, '17:30').getTime(), 'snooze 10 min');

const lunchReminder = reminderTime(p.events.find((e) => e.templateId === 'lunch')!)!;
assert.equal(lunchReminder.getTime(), atTime(MONDAY, '11:50').getTime(), 'remind 10 min before');

// Editing the template keeps today's progress
const edited = defaultRoutines.map((r) =>
  r.id === 'weekday'
    ? {
        ...r,
        events: r.events
          .filter((e) => e.id !== 'nap')
          .map((e) => (e.id === 'dinner' ? { ...e, time: '18:00' } : e)),
      }
    : r,
);
const rebuilt = buildPlan(edited, MONDAY, p);
const keptNap = rebuilt.events.find((e) => e.templateId === 'nap');
assert.equal(keptNap?.status, 'done', 'logged event kept after template removal');
const movedDinner = rebuilt.events.find((e) => e.templateId === 'dinner')!;
assert.equal(movedDinner.plannedStart, atTime(MONDAY, '18:00').toISOString());
assert.ok(movedDinner.snoozedUntil, 'pending snooze carried over');

// Undo
const undone = applyAction(p, nap.id, 'undo', now).events.find((e) => e.id === nap.id)!;
assert.equal(undone.status, 'pending');
assert.equal(undone.actualStart, undefined);

// Time input normalization
assert.equal(normalizeHHMM('7:30'), '07:30');
assert.equal(normalizeHHMM('1845'), '18:45');
assert.equal(normalizeHHMM('24:00'), null);
assert.equal(normalizeHHMM('abc'), null);

console.log('All day plan checks passed ✅');
