import { EventTemplate, Routine } from './types';

const ev = (
  id: string,
  title: string,
  icon: string,
  category: EventTemplate['category'],
  time: string,
  durationMin: number,
  remindBeforeMin = 10,
): EventTemplate => ({ id, title, icon, category, time, durationMin, remindBeforeMin });

export const defaultRoutines: Routine[] = [
  {
    id: 'weekday',
    name: 'Weekday',
    days: [1, 2, 3, 4, 5],
    events: [
      ev('wake', 'Wake up', '🌅', 'sleep', '07:00', 0, 0),
      ev('breakfast', 'Breakfast', '🥣', 'meal', '07:30', 30),
      ev('am-snack', 'Morning snack', '🍎', 'meal', '10:00', 15),
      ev('lunch', 'Lunch', '🥪', 'meal', '12:00', 30),
      ev('nap', 'Nap', '😴', 'sleep', '12:45', 120, 15),
      ev('pm-snack', 'Afternoon snack', '🍎', 'meal', '15:30', 15),
      ev('dinner', 'Dinner', '🍽️', 'meal', '17:30', 30),
      ev('bath', 'Bath', '🛁', 'hygiene', '18:30', 20),
      ev('teeth', 'Brush teeth', '🪥', 'hygiene', '19:00', 5, 5),
      ev('bed', 'Bedtime', '🌙', 'sleep', '19:30', 0, 15),
    ],
  },
  {
    id: 'weekend',
    name: 'Weekend',
    days: [0, 6],
    events: [
      ev('wake', 'Wake up', '🌅', 'sleep', '07:30', 0, 0),
      ev('breakfast', 'Breakfast', '🥞', 'meal', '08:00', 30),
      ev('play', 'Outdoor play', '🏞️', 'activity', '09:30', 60),
      ev('lunch', 'Lunch', '🥪', 'meal', '12:15', 30),
      ev('nap', 'Nap', '😴', 'sleep', '13:00', 120, 15),
      ev('pm-snack', 'Afternoon snack', '🍎', 'meal', '15:45', 15),
      ev('dinner', 'Dinner', '🍽️', 'meal', '17:45', 30),
      ev('bath', 'Bath', '🛁', 'hygiene', '18:45', 20),
      ev('bed', 'Bedtime', '🌙', 'sleep', '19:45', 0, 15),
    ],
  },
];
