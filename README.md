# 🧸 Toddler Reminder

A small iPhone/Android app (Expo + React Native) that reminds you about your toddler's daily routine: meals, naps, bath, bedtime. You can log each event with one tap.

## Features (M1)
- **Routines:** weekday and weekend templates; assign each routine to weekdays; add, edit or delete events (icon, category, time, duration, how early to remind).
- **Reminders:** local notifications with **Done / Snooze 10 min / Skip** buttons. They work offline with no server. Reminders are scheduled on a rolling window (today and tomorrow, at most 60, which keeps under the iOS limit of 64).
- **Today view:** timeline with progress, a highlighted *Next*/*Now* event, *Late* tags, and Start / Done / Skip / Undo.
- **Local-first:** all data stays on the device (AsyncStorage).

## Run it
Requires **Node.js 20.19.4 or newer**.

```bash
npm install
npm start          # scan the QR code with Expo Go, or press i / a for a simulator
```

> Notification action buttons work most reliably in a development build (`npx expo run:ios` / `npx expo run:android`). Notifications are not available on web.

## Checks
```bash
npm run typecheck   # TypeScript
npm run test:logic  # day plan logic checks
```

## Project layout
```
App.tsx                      app shell + bottom tabs
src/types.ts                 data model
src/dayPlan.ts               template → day plan, actions, reminder times (pure logic)
src/notifications.ts         permissions, action buttons, scheduling
src/store.tsx                state, persistence, rescheduling, notification responses
src/storage.ts               AsyncStorage
src/screens/TodayScreen.tsx  today timeline
src/screens/RoutineScreen.tsx routine editor
src/components/EventEditor.tsx event edit modal
scripts/dayPlan.check.ts     logic checks
```

## Roadmap
- **M2:** relative timing ("nap 5h after wake-up") with automatic rescheduling of later events
- **M3:** toddler picture mode
- **M4:** caregiver sharing and sync
- **M5:** insights, widgets, watch
