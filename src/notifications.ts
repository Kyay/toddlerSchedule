import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { reminderTime } from './dayPlan';
import { formatTime } from './time';
import { DayPlan, EventInstance } from './types';

export const CATEGORY_ID = 'routine-event';
const CHANNEL_ID = 'reminders';
/** iOS keeps at most 64 pending local notifications; stay under it. */
const MAX_SCHEDULED = 60;

export const notificationsSupported = Platform.OS !== 'web';

if (notificationsSupported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** Sets up the channel and action buttons, and asks for permission. Returns true if granted. */
export async function setupNotifications(): Promise<boolean> {
  if (!notificationsSupported) return false;
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Routine reminders',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
    await Notifications.setNotificationCategoryAsync(CATEGORY_ID, [
      { identifier: 'done', buttonTitle: 'Done ✅', options: { opensAppToForeground: true } },
      { identifier: 'snooze', buttonTitle: 'Snooze 10 min', options: { opensAppToForeground: true } },
      { identifier: 'skip', buttonTitle: 'Skip', options: { opensAppToForeground: true, isDestructive: true } },
    ]);
    const current = await Notifications.getPermissionsAsync();
    if (current.status === 'granted') return true;
    if (!current.canAskAgain) return false;
    const requested = await Notifications.requestPermissionsAsync();
    return requested.status === 'granted';
  } catch (e) {
    console.warn('Notification setup failed', e);
    return false;
  }
}

function contentFor(e: EventInstance, snoozed: boolean) {
  const title =
    snoozed || e.remindBeforeMin === 0
      ? `${e.icon} Time for ${e.title.toLowerCase()}`
      : `${e.icon} ${e.title} in ${e.remindBeforeMin} min`;
  return { title, body: `Planned for ${formatTime(e.plannedStart)}` };
}

async function doReschedule(plans: DayPlan[]): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const now = Date.now();
  const items = plans
    .flatMap((plan) => plan.events.map((e) => ({ e, date: plan.date, fireAt: reminderTime(e) })))
    .filter((x): x is { e: EventInstance; date: string; fireAt: Date } => !!x.fireAt && x.fireAt.getTime() > now)
    .sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime())
    .slice(0, MAX_SCHEDULED);

  for (const { e, date, fireAt } of items) {
    await Notifications.scheduleNotificationAsync({
      content: {
        ...contentFor(e, !!e.snoozedUntil),
        sound: true,
        categoryIdentifier: CATEGORY_ID,
        data: { date, eventId: e.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireAt,
        channelId: CHANNEL_ID,
      },
    });
  }
}

let chain: Promise<void> = Promise.resolve();

/**
 * Replace all scheduled reminders with ones for the given plans (normally today and
 * tomorrow, a rolling window). Calls are serialized so they can't interleave.
 */
export function rescheduleReminders(plans: DayPlan[]): Promise<void> {
  if (!notificationsSupported) return Promise.resolve();
  chain = chain
    .then(() => doReschedule(plans))
    .catch((e) => console.warn('Failed to schedule reminders', e));
  return chain;
}
