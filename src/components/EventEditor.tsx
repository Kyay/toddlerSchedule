import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { categoryColors, categoryLabels, colors } from '../theme';
import { normalizeHHMM } from '../time';
import { Category, EventTemplate } from '../types';

const ICONS = ['🌅', '🥣', '🥞', '🍎', '🥪', '🍽️', '🍼', '😴', '🌙', '🛁', '🪥', '🚽', '💊', '🧸', '🎨', '📚', '🏞️', '🚶'];
const CATEGORIES: Category[] = ['meal', 'sleep', 'hygiene', 'meds', 'activity'];
const REMIND_OPTIONS = [0, 5, 10, 15, 30];

interface Props {
  event: EventTemplate | null;
  isNew: boolean;
  onSave: (e: EventTemplate) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function EventEditor({ event, isNew, onSave, onDelete, onClose }: Props) {
  return (
    <Modal visible={!!event} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      {event && (
        <EditorBody key={event.id} event={event} isNew={isNew} onSave={onSave} onDelete={onDelete} onClose={onClose} />
      )}
    </Modal>
  );
}

function EditorBody({ event, isNew, onSave, onDelete, onClose }: Props & { event: EventTemplate }) {
  const [title, setTitle] = useState(event.title);
  const [icon, setIcon] = useState(event.icon);
  const [category, setCategory] = useState<Category>(event.category);
  const [time, setTime] = useState(event.time);
  const [duration, setDuration] = useState(String(event.durationMin));
  const [remind, setRemind] = useState(event.remindBeforeMin);

  const save = () => {
    const normalized = normalizeHHMM(time);
    if (!title.trim()) return Alert.alert('Please enter a name');
    if (!normalized) return Alert.alert('Please enter a time like 07:30 or 18:45');
    const durationMin = Math.max(0, parseInt(duration, 10) || 0);
    onSave({ ...event, title: title.trim(), icon, category, time: normalized, durationMin, remindBeforeMin: remind });
  };

  const confirmDelete = () => {
    if (Platform.OS === 'web') return onDelete(event.id);
    Alert.alert('Delete event?', `Remove "${event.title}" from this routine?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(event.id) },
    ]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={10}>
          <Text style={styles.headerBtn}>Cancel</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{isNew ? 'New event' : 'Edit event'}</Text>
        <Pressable onPress={save} hitSlop={10}>
          <Text style={[styles.headerBtn, styles.headerSave]}>Save</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. Lunch" />

        <Text style={styles.label}>Icon</Text>
        <View style={styles.wrap}>
          {ICONS.map((i) => (
            <Pressable key={i} onPress={() => setIcon(i)} style={[styles.iconChip, icon === i && styles.chipSelected]}>
              <Text style={{ fontSize: 24 }}>{i}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Category</Text>
        <View style={styles.wrap}>
          {CATEGORIES.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCategory(c)}
              style={[styles.chip, { borderColor: categoryColors[c] }, category === c && { backgroundColor: categoryColors[c] }]}
            >
              <Text style={[styles.chipText, category === c && { color: '#fff' }]}>{categoryLabels[c]}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.twoCol}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Time (24h)</Text>
            <TextInput
              style={styles.input}
              value={time}
              onChangeText={setTime}
              placeholder="07:30"
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Duration (min)</Text>
            <TextInput style={styles.input} value={duration} onChangeText={setDuration} keyboardType="number-pad" maxLength={3} />
          </View>
        </View>

        <Text style={styles.label}>Remind me</Text>
        <View style={styles.wrap}>
          {REMIND_OPTIONS.map((m) => (
            <Pressable key={m} onPress={() => setRemind(m)} style={[styles.chip, remind === m && styles.chipSelected]}>
              <Text style={[styles.chipText, remind === m && { color: '#fff' }]}>{m === 0 ? 'At start' : `${m} min before`}</Text>
            </Pressable>
          ))}
        </View>

        {!isNew && (
          <Pressable onPress={confirmDelete} style={styles.deleteBtn}>
            <Text style={styles.deleteText}>Delete event</Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  headerBtn: { fontSize: 16, color: colors.primary },
  headerSave: { fontWeight: '700' },
  body: { padding: 16, paddingBottom: 48 },
  label: { fontSize: 13, fontWeight: '700', color: colors.muted, marginTop: 16, marginBottom: 6, textTransform: 'uppercase' },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconChip: { padding: 6, borderRadius: 10, backgroundColor: colors.card, borderWidth: 2, borderColor: 'transparent' },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.card,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 14, color: colors.text, fontWeight: '600' },
  twoCol: { flexDirection: 'row', gap: 12 },
  deleteBtn: { marginTop: 32, padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#FDECEC' },
  deleteText: { color: colors.danger, fontWeight: '700', fontSize: 16 },
});
