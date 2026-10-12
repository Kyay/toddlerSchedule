import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { notificationsSupported } from '../notifications';
import { useStore } from '../store';
import { categoryColors, colors } from '../theme';
import { formatDateLong, formatTime } from '../time';
import { EventAction, EventInstance } from '../types';

export function TodayScreen() {
  const { plan, act, notificationsEnabled, retryNotificationPermission } = useStore();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  if (!plan) return null;

  const finished = plan.events.filter((e) => e.status === 'done' || e.status === 'skipped').length;
  const total = plan.events.length;
  const nextId =
    plan.events.find((e) => e.status === 'active')?.id ?? plan.events.find((e) => e.status === 'pending')?.id;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Today</Text>
      <Text style={styles.subheading}>{formatDateLong(plan.date)}</Text>

      {total > 0 && (
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(finished / total) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {finished} of {total} done
          </Text>
        </View>
      )}

      {notificationsSupported && !notificationsEnabled && (
        <Pressable style={styles.banner} onPress={retryNotificationPermission}>
          <Text style={styles.bannerText}>
            🔕 Reminders are off. Tap to allow notifications (or enable them in Settings).
          </Text>
        </Pressable>
      )}

      {total === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🧸</Text>
          <Text style={styles.emptyText}>No routine for today. Add one in the Routines tab.</Text>
        </View>
      ) : (
        plan.events.map((e) => (
          <EventCard key={e.id} event={e} isNext={e.id === nextId} now={now} onAction={(a) => act(e.id, a)} />
        ))
      )}
    </ScrollView>
  );
}

function EventCard({
  event: e,
  isNext,
  now,
  onAction,
}: {
  event: EventInstance;
  isNext: boolean;
  now: Date;
  onAction: (a: EventAction) => void;
}) {
  const planned = new Date(e.plannedStart);
  const closed = e.status === 'done' || e.status === 'skipped';
  const late = e.status === 'pending' && planned.getTime() < now.getTime();

  let statusLine = '';
  if (e.status === 'active' && e.actualStart) statusLine = `Started ${formatTime(e.actualStart)}`;
  if (e.status === 'done' && e.actualEnd) {
    statusLine =
      e.actualStart && e.actualStart !== e.actualEnd
        ? `${formatTime(e.actualStart)} – ${formatTime(e.actualEnd)}`
        : `Done at ${formatTime(e.actualEnd)}`;
  }
  if (e.status === 'skipped') statusLine = 'Skipped';
  if (e.status === 'pending' && e.snoozedUntil) statusLine = `Snoozed until ${formatTime(e.snoozedUntil)}`;

  return (
    <View
      style={[
        styles.card,
        { borderLeftColor: categoryColors[e.category] },
        isNext && styles.cardNext,
        closed && styles.cardClosed,
      ]}
    >
      <View style={styles.row}>
        <Text style={styles.time}>{formatTime(planned)}</Text>
        <Text style={styles.icon}>{e.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, closed && styles.titleClosed]}>{e.title}</Text>
          {!!statusLine && <Text style={styles.statusLine}>{statusLine}</Text>}
        </View>
        {isNext && !late && <Tag label={e.status === 'active' ? 'Now' : 'Next'} color={colors.primary} />}
        {late && <Tag label="Late" color={colors.warning} />}
        {e.status === 'done' && <Text style={styles.check}>✅</Text>}
      </View>

      <View style={styles.actions}>
        {e.status === 'pending' && (
          <>
            {e.durationMin > 0 && <ActionButton label="Start" onPress={() => onAction('start')} />}
            <ActionButton label="Done" primary onPress={() => onAction('done')} />
            <ActionButton label="Skip" onPress={() => onAction('skip')} />
          </>
        )}
        {e.status === 'active' && <ActionButton label="Done" primary onPress={() => onAction('done')} />}
        {closed && <ActionButton label="Undo" onPress={() => onAction('undo')} />}
      </View>
    </View>
  );
}

function Tag({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.tag, { backgroundColor: color }]}>
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );
}

function ActionButton({ label, onPress, primary }: { label: string; onPress: () => void; primary?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.btn, primary && styles.btnPrimary, pressed && { opacity: 0.7 }]}
    >
      <Text style={[styles.btnText, primary && styles.btnTextPrimary]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 32 },
  heading: { fontSize: 30, fontWeight: '800', color: colors.text },
  subheading: { fontSize: 15, color: colors.muted, marginBottom: 12 },
  progressWrap: { marginBottom: 16 },
  progressTrack: { height: 10, borderRadius: 5, backgroundColor: colors.border, overflow: 'hidden' },
  progressFill: { height: 10, backgroundColor: colors.success },
  progressText: { marginTop: 4, fontSize: 13, color: colors.muted },
  banner: { backgroundColor: colors.warningSoft, padding: 12, borderRadius: 12, marginBottom: 12 },
  bannerText: { color: colors.text, fontSize: 14 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { marginTop: 8, color: colors.muted, fontSize: 15, textAlign: 'center' },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardNext: { borderWidth: 2, borderColor: colors.primary, borderLeftWidth: 6 },
  cardClosed: { opacity: 0.6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  time: { width: 70, fontSize: 14, fontWeight: '600', color: colors.muted },
  icon: { fontSize: 26 },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  titleClosed: { textDecorationLine: 'line-through' },
  statusLine: { fontSize: 13, color: colors.muted, marginTop: 2 },
  check: { fontSize: 18 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  tagText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 10 },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
  },
  btnPrimary: { backgroundColor: colors.primary },
  btnText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  btnTextPrimary: { color: '#fff' },
});
