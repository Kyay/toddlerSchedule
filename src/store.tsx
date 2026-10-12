import * as Notifications from 'expo-notifications';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { applyAction, buildPlan } from './dayPlan';
import { defaultRoutines } from './defaultRoutines';
import { notificationsSupported, rescheduleReminders, setupNotifications } from './notifications';
import * as storage from './storage';
import { dateKey, nextDateKey } from './time';
import { DayPlan, EventAction, Routine } from './types';

interface StoreValue {
  ready: boolean;
  routines: Routine[];
  plan: DayPlan | null;
  notificationsEnabled: boolean;
  updateRoutines: (routines: Routine[]) => void;
  act: (eventId: string, action: EventAction) => void;
  retryNotificationPermission: () => Promise<void>;
}

const StoreContext = createContext<StoreValue | null>(null);

export function useStore(): StoreValue {
  const v = useContext(StoreContext);
  if (!v) throw new Error('useStore must be used inside <StoreProvider>');
  return v;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [routines, setRoutines] = useState<Routine[] | null>(null);
  const [plan, setPlan] = useState<DayPlan | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const routinesRef = useRef<Routine[] | null>(null);
  routinesRef.current = routines;
  const ready = routines !== null && plan !== null;

  // Load saved state (or defaults) on startup.
  useEffect(() => {
    (async () => {
      const savedRoutines = (await storage.loadRoutines()) ?? defaultRoutines;
      const savedPlan = await storage.loadPlan();
      setRoutines(savedRoutines);
      setPlan(buildPlan(savedRoutines, dateKey(), savedPlan));
      setNotificationsEnabled(await setupNotifications());
    })();
  }, []);

  // Persist and reschedule reminders whenever state changes.
  useEffect(() => {
    if (!routines || !plan) return;
    storage.saveRoutines(routines);
    storage.savePlan(plan);
    if (notificationsEnabled) {
      rescheduleReminders([plan, buildPlan(routines, nextDateKey(plan.date))]);
    }
  }, [routines, plan, notificationsEnabled]);

  // Start a fresh plan when the app is opened on a new day.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active') return;
      setPlan((prev) => {
        const r = routinesRef.current;
        if (!prev || !r || prev.date === dateKey()) return prev;
        return buildPlan(r, dateKey());
      });
    });
    return () => sub.remove();
  }, []);

  const updateRoutines = useCallback((next: Routine[]) => {
    setRoutines(next);
    setPlan((prev) => buildPlan(next, dateKey(), prev));
  }, []);

  /** Apply an action to today's plan. `fromDate` guards against stale notification taps. */
  const applyToToday = useCallback(
    (eventId: string, action: EventAction, fromDate?: string, onlyIfOpen = false) => {
      setPlan((prev) => {
        const r = routinesRef.current;
        if (!prev || !r) return prev;
        const today = dateKey();
        const current = prev.date === today ? prev : buildPlan(r, today);
        if (fromDate && fromDate !== today) return current;
        const event = current.events.find((e) => e.id === eventId);
        if (!event) return current;
        if (onlyIfOpen && event.status !== 'pending' && event.status !== 'active') return current;
        return applyAction(current, eventId, action, new Date());
      });
    },
    [],
  );

  const act = useCallback((eventId: string, action: EventAction) => applyToToday(eventId, action), [applyToToday]);

  // Handle taps on notification action buttons (Done / Snooze / Skip).
  const handled = useRef(new Set<string>());
  useEffect(() => {
    if (!ready || !notificationsSupported) return;
    const handle = (resp: Notifications.NotificationResponse) => {
      const request = resp.notification.request;
      const key = `${request.identifier}:${resp.actionIdentifier}`;
      if (handled.current.has(key)) return;
      handled.current.add(key);
      const { date, eventId } = (request.content.data ?? {}) as { date?: string; eventId?: string };
      const a = resp.actionIdentifier;
      if (date && eventId && (a === 'done' || a === 'snooze' || a === 'skip')) {
        applyToToday(eventId, a, date, true);
      }
      Notifications.dismissNotificationAsync(request.identifier).catch(() => {});
    };
    const sub = Notifications.addNotificationResponseReceivedListener(handle);
    // A tap that launched the app from a closed state.
    Notifications.getLastNotificationResponseAsync()
      .then((resp) => {
        if (resp) handle(resp);
        return Notifications.clearLastNotificationResponseAsync?.();
      })
      .catch(() => {});
    return () => sub.remove();
  }, [ready, applyToToday]);

  const retryNotificationPermission = useCallback(async () => {
    setNotificationsEnabled(await setupNotifications());
  }, []);

  return (
    <StoreContext.Provider
      value={{
        ready,
        routines: routines ?? [],
        plan,
        notificationsEnabled,
        updateRoutines,
        act,
        retryNotificationPermission,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}
