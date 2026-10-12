import React, { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { EventEditor } from '../components/EventEditor';
import { useStore } from '../store';
import { categoryColors, colors } from '../theme';
import { formatHHMM, newId } from '../time';
import { EventTemplate, Routine } from '../types';

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function RoutineScreen() {
  const { routines, updateRoutines } = useStore();
  const [selectedId, setSelectedId] = useState(routines[0]?.id);
  const [editing, setEditing] = useState<EventTemplate | null>(null);
  const [isNew, setIsNew] = useState(false);

  const routine = routines.find((r) => r.id === selectedId) ?? routines[0];

  const saveRoutine = (r: Routine) => updateRoutines(routines.map((x) => (x.id === r.id ? r : x)));

  const toggleDay = (day: number) => {
    if (!routine) return;
    const on = routine.days.includes(day);
    // Each weekday belongs to at most one routine.
    updateRoutines(
      routines.map((r) => {
        if (r.id === routine.id) {
          return { ...r, days: on ? r.days.filter((d) => d !== day) : [...r.days, day].sort() };
        }
        return on ? r : { ...r, days: r.days.filter((d) => d !== day) };
      }),
    );
  };

  const addRoutine = () => {
    const r: Routine = { id: newId(), name: 'New routine', days: [], events: [] };
    updateRoutines([...routines, r]);
    setSelectedId(r.id);
  };

  const deleteRoutine = () => {
    if (!routine || routines.length <= 1) return;
    const doDelete = () => {
      const rest = routines.filter((r) => r.id !== routine.id);
      updateRoutines(rest);
      setSelectedId(rest[0].id);
    };
    if (Platform.OS === 'web') return doDelete();
    Alert.alert('Delete routine?', `"${routine.name}" and its events will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: doDelete },
    ]);
  };

  const openNewEvent = () => {
    setIsNew(true);
    setEditing({
      id: newId(),
      title: '',
      icon: '🧸',
      category: 'activity',
      time: '09:00',
      durationMin: 15,
      remindBeforeMin: 10,
    });
  };

  const saveEvent = (e: EventTemplate) => {
    if (!routine) return;
    const exists = routine.events.some((x) => x.id === e.id);
    const events = exists ? routine.events.map((x) => (x.id === e.id ? e : x)) : [...routine.events, e];
    saveRoutine({ ...routine, events });
    setEditing(null);
  };

  const deleteEvent = (id: string) => {
    if (!routine) return;
    saveRoutine({ ...routine, events: routine.events.filter((x) => x.id !== id) });
    setEditing(null);
  };

  const uncovered = DAY_NAMES.filter((_, d) => !routines.some((r) => r.days.includes(d)));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Routines</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {routines.map((r) => (
            <Pressable
              key={r.id}
              onPress={() => setSelectedId(r.id)}
              style={[styles.tab, r.id === routine?.id && styles.tabSelected]}
            >
              <Text style={[styles.tabText, r.id === routine?.id && styles.tabTextSelected]}>{r.name}</Text>
            </Pressable>
          ))}
          <Pressable onPress={addRoutine} style={styles.tab}>
            <Text style={styles.tabText}>+ New</Text>
          </Pressable>
        </ScrollView>

        {routine && (
          <>
            <RoutineName key={routine.id} routine={routine} onSave={saveRoutine} />

            <Text style={styles.label}>Days</Text>
            <View style={styles.days}>
              {DAY_LETTERS.map((letter, d) => {
                const on = routine.days.includes(d);
                return (
                  <Pressable key={d} onPress={() => toggleDay(d)} style={[styles.day, on && styles.daySelected]}>
                    <Text style={[styles.dayText, on && { color: '#fff' }]}>{letter}</Text>
                  </Pressable>
                );
              })}
            </View>
            {uncovered.length > 0 && (
              <Text style={styles.hint}>No routine on: {uncovered.join(', ')}</Text>
            )}

            <Text style={styles.label}>Events</Text>
            {routine.events.length === 0 && <Text style={styles.hint}>No events yet.</Text>}
            {[...routine.events]
              .sort((a, b) => a.time.localeCompare(b.time))
              .map((e) => (
                <Pressable
                  key={e.id}
                  onPress={() => {
                    setIsNew(false);
                    setEditing(e);
                  }}
                  style={({ pressed }) => [
                    styles.eventRow,
                    { borderLeftColor: categoryColors[e.category] },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={styles.eventTime}>{formatHHMM(e.time)}</Text>
                  <Text style={{ fontSize: 22 }}>{e.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.eventTitle}>{e.title}</Text>
                    <Text style={styles.eventMeta}>
                      {e.durationMin > 0 ? `${e.durationMin} min · ` : ''}
                      {e.remindBeforeMin === 0 ? 'remind at start' : `remind ${e.remindBeforeMin} min before`}
                    </Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              ))}

            <Pressable onPress={openNewEvent} style={styles.addBtn}>
              <Text style={styles.addText}>+ Add event</Text>
            </Pressable>

            {routines.length > 1 && (
              <Pressable onPress={deleteRoutine} style={styles.deleteRoutine}>
                <Text style={styles.deleteText}>Delete this routine</Text>
              </Pressable>
            )}
          </>
        )}
      </ScrollView>

      <EventEditor
        event={editing}
        isNew={isNew}
        onSave={saveEvent}
        onDelete={deleteEvent}
        onClose={() => setEditing(null)}
      />
    </View>
  );
}

function RoutineName({ routine, onSave }: { routine: Routine; onSave: (r: Routine) => void }) {
  const [name, setName] = useState(routine.name);
  const commit = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== routine.name) onSave({ ...routine, name: trimmed });
    else setName(routine.name);
  };
  return (
    <>
      <Text style={styles.label}>Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} onBlur={commit} onSubmitEditing={commit} />
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  heading: { fontSize: 30, fontWeight: '800', color: colors.text, marginBottom: 12 },
  tabs: { gap: 8, paddingBottom: 4 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
  },
  tabSelected: { backgroundColor: colors.primary },
  tabText: { color: colors.primary, fontWeight: '700' },
  tabTextSelected: { color: '#fff' },
  label: { fontSize: 13, fontWeight: '700', color: colors.muted, marginTop: 18, marginBottom: 6, textTransform: 'uppercase' },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  days: { flexDirection: 'row', justifyContent: 'space-between' },
  day: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  daySelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayText: { fontWeight: '700', color: colors.text },
  hint: { fontSize: 13, color: colors.muted, marginTop: 6 },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 5,
  },
  eventTime: { width: 70, color: colors.muted, fontWeight: '600' },
  eventTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  eventMeta: { fontSize: 12, color: colors.muted, marginTop: 2 },
  chevron: { fontSize: 22, color: colors.muted },
  addBtn: {
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    alignItems: 'center',
  },
  addText: { color: colors.primary, fontWeight: '700', fontSize: 16 },
  deleteRoutine: { marginTop: 28, alignItems: 'center', padding: 10 },
  deleteText: { color: colors.danger, fontWeight: '600' },
});
